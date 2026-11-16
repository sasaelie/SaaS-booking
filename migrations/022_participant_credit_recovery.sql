-- A genuinely new credit must never be stranded behind a previously closed dossier.
-- Rotate explicitly; an event date change alone cannot revive an old code.
CREATE FUNCTION recover_booking_access_for_credit() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $recover$
DECLARE credential record; qualifies boolean;
BEGIN
 IF NEW.status<>'ACTIVE' OR NEW.expires_at<=now() THEN RETURN NEW; END IF;
 EXECUTE format('SELECT c.id,c.closed_at,c.revoked_at,b.anonymized_at,b.self_service_version,
   s.ends_at FROM %I.booking_access_credentials c
   JOIN %I.bookings b ON b.id=c.booking_id AND b.organization_id=c.organization_id
   JOIN %I.sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
   WHERE c.organization_id=$1 AND c.booking_id=$2 FOR UPDATE OF c',
   TG_TABLE_SCHEMA,TG_TABLE_SCHEMA,TG_TABLE_SCHEMA)
  INTO credential USING NEW.organization_id,NEW.origin_booking_id;
 IF credential.id IS NULL OR credential.revoked_at IS NOT NULL OR credential.anonymized_at IS NOT NULL THEN RETURN NEW; END IF;
 qualifies := credential.closed_at IS NOT NULL;
 IF NOT qualifies AND credential.ends_at<=now() THEN
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I.reschedule_vouchers WHERE organization_id=$1 AND origin_booking_id=$2 AND status IN (''USED_FOR_BOOKING'',''USED_FOR_EXTERNAL_BENEFIT''))
    AND NOT EXISTS(SELECT 1 FROM %I.reschedule_vouchers WHERE organization_id=$1 AND origin_booking_id=$2 AND status IN (''ACTIVE'',''LOCKED_PENDING_PAYMENT'') AND expires_at>now())',TG_TABLE_SCHEMA,TG_TABLE_SCHEMA)
   INTO qualifies USING NEW.organization_id,NEW.origin_booking_id;
 END IF;
 IF NOT qualifies THEN RETURN NEW; END IF;
 EXECUTE format('DELETE FROM %I.participant_booking_sessions WHERE organization_id=$1 AND booking_id=$2',TG_TABLE_SCHEMA)
  USING NEW.organization_id,NEW.origin_booking_id;
 EXECUTE format('UPDATE %I.bookings SET self_service_version=self_service_version+1 WHERE organization_id=$1 AND id=$2',TG_TABLE_SCHEMA)
  USING NEW.organization_id,NEW.origin_booking_id;
 EXECUTE format('UPDATE %I.booking_access_credentials SET id=gen_random_uuid(),version=$3,closed_at=NULL,created_at=now() WHERE organization_id=$1 AND booking_id=$2',TG_TABLE_SCHEMA)
  USING NEW.organization_id,NEW.origin_booking_id,credential.self_service_version+1;
 EXECUTE format('INSERT INTO %I.booking_access_events(organization_id,booking_id,action) VALUES($1,$2,''NEW_CREDIT_ACCESS_ROTATED'')',TG_TABLE_SCHEMA)
  USING NEW.organization_id,NEW.origin_booking_id;
 RETURN NEW;
END $recover$;
REVOKE ALL ON FUNCTION recover_booking_access_for_credit() FROM PUBLIC;
CREATE TRIGGER recover_booking_access_for_credit BEFORE INSERT ON reschedule_vouchers
 FOR EACH ROW EXECUTE FUNCTION recover_booking_access_for_credit();
DO $isolated$
DECLARE source_name text := current_schema(); target_name text := current_schema() || '_simulation'; role_name text;
BEGIN
 EXECUTE format('CREATE TRIGGER recover_booking_access_for_credit BEFORE INSERT ON %I.reschedule_vouchers FOR EACH ROW EXECUTE FUNCTION %I.recover_booking_access_for_credit()',target_name,source_name);
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON FUNCTION %I.recover_booking_access_for_credit() FROM %I',source_name,role_name);
  END IF;
 END LOOP;
END $isolated$;
