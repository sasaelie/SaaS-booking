-- Backend-only access. No raw client code or browser session token is stored.
CREATE TABLE booking_access_credentials (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 booking_id uuid NOT NULL, version integer NOT NULL CHECK(version>=0),
 created_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz, closed_at timestamptz,
 UNIQUE(booking_id,organization_id), UNIQUE(id,booking_id,organization_id),
 FOREIGN KEY(booking_id,organization_id) REFERENCES bookings(id,organization_id) ON DELETE CASCADE
);
CREATE TABLE participant_booking_sessions (
 token_hash text NOT NULL, organization_id uuid NOT NULL, booking_id uuid NOT NULL,
 credential_id uuid NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(token_hash,booking_id,organization_id),
 FOREIGN KEY(credential_id,booking_id,organization_id)
  REFERENCES booking_access_credentials(id,booking_id,organization_id) ON DELETE CASCADE
);
CREATE INDEX participant_session_expiry ON participant_booking_sessions(expires_at);
CREATE TABLE booking_access_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 booking_id uuid NOT NULL, action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(booking_id,organization_id) REFERENCES bookings(id,organization_id) ON DELETE CASCADE
);
CREATE INDEX booking_access_event_history ON booking_access_events(organization_id,booking_id,created_at);
CREATE INDEX voucher_booking_access ON reschedule_vouchers(organization_id,origin_booking_id,status);

-- Replicate only empty structures; qualify tenant FKs inside each namespace.
DO $access$
DECLARE source_name text := current_schema(); target_name text := current_schema() || '_simulation';
 table_name text; role_name text; namespace text; constraint_row record; definition text;
 table_names text[] := ARRAY['booking_access_credentials','participant_booking_sessions','booking_access_events'];
BEGIN
 FOREACH table_name IN ARRAY table_names LOOP
  EXECUTE format('CREATE TABLE %I.%I (LIKE %I.%I INCLUDING ALL)',target_name,table_name,source_name,table_name);
 END LOOP;
 PERFORM set_config('search_path','pg_catalog',true);
 FOR constraint_row IN SELECT c.conname,cl.relname,pg_get_constraintdef(c.oid) AS def
 FROM pg_constraint c JOIN pg_class cl ON cl.oid=c.conrelid JOIN pg_namespace n ON n.oid=cl.relnamespace
 WHERE n.nspname=source_name AND cl.relname=ANY(table_names) AND c.contype='f' LOOP
  definition := replace(constraint_row.def,format('REFERENCES %I.',source_name),format('REFERENCES %I.',target_name));
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I %s',target_name,constraint_row.relname,constraint_row.conname,definition);
 END LOOP;
 FOREACH namespace IN ARRAY ARRAY[source_name,target_name] LOOP
  FOREACH table_name IN ARRAY table_names LOOP
   EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',namespace,table_name);
   EXECUTE format('REVOKE ALL ON %I.%I FROM PUBLIC',namespace,table_name);
   FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS(SELECT FROM pg_roles WHERE rolname=role_name) THEN
     EXECUTE format('REVOKE ALL ON %I.%I FROM %I',namespace,table_name,role_name);
    END IF;
   END LOOP;
  END LOOP;
  EXECUTE format('INSERT INTO %I.booking_access_credentials(organization_id,booking_id,version)
    SELECT organization_id,id,self_service_version FROM %I.bookings
    WHERE anonymized_at IS NULL AND (confirmed_at IS NOT NULL OR status=''CONFIRMED'')
    ON CONFLICT DO NOTHING',namespace,namespace);
 END LOOP;
 PERFORM set_config('search_path',format('%I,pg_catalog',source_name),true);
END $access$;

-- Invoker trigger: runs inside the original confirmation transaction, including simulation,
-- bank validation and free bookings. Repeated provider callbacks reuse the same credential.
CREATE FUNCTION issue_booking_access() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $issue$
BEGIN
 IF NEW.status='CONFIRMED' AND NEW.anonymized_at IS NULL THEN
  EXECUTE format('INSERT INTO %I.booking_access_credentials(organization_id,booking_id,version)
    VALUES($1,$2,$3) ON CONFLICT(booking_id,organization_id) DO NOTHING',TG_TABLE_SCHEMA)
   USING NEW.organization_id,NEW.id,NEW.self_service_version;
 END IF;
 RETURN NEW;
END $issue$;
REVOKE ALL ON FUNCTION issue_booking_access() FROM PUBLIC;
CREATE TRIGGER issue_booking_access AFTER INSERT OR UPDATE OF status ON bookings
 FOR EACH ROW EXECUTE FUNCTION issue_booking_access();

-- Materialize closure on use and before changing a past session's dates.
CREATE FUNCTION close_booking_access() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $close$
DECLARE booking_id uuid; organization_id uuid; session_id uuid;
BEGIN
 IF TG_TABLE_NAME='sessions' THEN
  IF OLD.ends_at>now() THEN RETURN NEW; END IF;
  session_id := OLD.id; organization_id := OLD.organization_id;
 ELSE
  booking_id := NEW.origin_booking_id; organization_id := NEW.organization_id;
 END IF;
 EXECUTE format('UPDATE %I.booking_access_credentials c SET closed_at=COALESCE(c.closed_at,now())
  FROM %I.bookings b JOIN %I.sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
  WHERE c.booking_id=b.id AND c.organization_id=b.organization_id AND b.organization_id=$1
   AND (($2::uuid IS NOT NULL AND b.id=$2 AND s.ends_at<=now()) OR ($3::uuid IS NOT NULL AND s.id=$3))
   AND EXISTS(SELECT 1 FROM %I.reschedule_vouchers v WHERE v.organization_id=b.organization_id AND v.origin_booking_id=b.id AND v.status IN (''USED_FOR_BOOKING'',''USED_FOR_EXTERNAL_BENEFIT''))
   AND NOT EXISTS(SELECT 1 FROM %I.reschedule_vouchers v WHERE v.organization_id=b.organization_id AND v.origin_booking_id=b.id AND v.status IN (''ACTIVE'',''LOCKED_PENDING_PAYMENT'') AND v.expires_at>now())',
   TG_TABLE_SCHEMA,TG_TABLE_SCHEMA,TG_TABLE_SCHEMA,TG_TABLE_SCHEMA,TG_TABLE_SCHEMA)
  USING organization_id,booking_id,session_id;
 RETURN NEW;
END $close$;
REVOKE ALL ON FUNCTION close_booking_access() FROM PUBLIC;
CREATE TRIGGER close_booking_access AFTER UPDATE OF status ON reschedule_vouchers
 FOR EACH ROW EXECUTE FUNCTION close_booking_access();
CREATE TRIGGER close_booking_access BEFORE UPDATE OF starts_at,ends_at ON sessions
 FOR EACH ROW EXECUTE FUNCTION close_booking_access();

DO $triggers$
DECLARE source_name text := current_schema(); target_name text := current_schema() || '_simulation'; role_name text;
BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON FUNCTION %I.issue_booking_access() FROM %I',source_name,role_name);
   EXECUTE format('REVOKE ALL ON FUNCTION %I.close_booking_access() FROM %I',source_name,role_name);
  END IF;
 END LOOP;
 EXECUTE format('CREATE INDEX voucher_booking_access ON %I.reschedule_vouchers(organization_id,origin_booking_id,status)',target_name);
 EXECUTE format('CREATE TRIGGER issue_booking_access AFTER INSERT OR UPDATE OF status ON %I.bookings FOR EACH ROW EXECUTE FUNCTION %I.issue_booking_access()',target_name,source_name);
 EXECUTE format('CREATE TRIGGER close_booking_access AFTER UPDATE OF status ON %I.reschedule_vouchers FOR EACH ROW EXECUTE FUNCTION %I.close_booking_access()',target_name,source_name);
 EXECUTE format('CREATE TRIGGER close_booking_access BEFORE UPDATE OF starts_at,ends_at ON %I.sessions FOR EACH ROW EXECUTE FUNCTION %I.close_booking_access()',target_name,source_name);
END $triggers$;
