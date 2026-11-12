-- Empty private namespace. No participant or authentication data is copied.
DO $simulation$
DECLARE source_name text := current_schema(); target_name text := current_schema() || '_simulation';
 table_name text; constraint_row record; definition text;
 table_names text[] := ARRAY['organizations','activities','time_slots','pause_periods','sessions',
 'reschedule_vouchers','bookings','organization_access','organization_branding','outbox_jobs',
 'processed_webhooks','financial_payments','financial_entries','accounting_archives','private_files'];
BEGIN
 IF length(target_name)>63 THEN RAISE EXCEPTION 'Simulation schema name too long'; END IF;
 EXECUTE format('CREATE SCHEMA %I', target_name);
 EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC', target_name);
 FOREACH table_name IN ARRAY table_names LOOP
  EXECUTE format('CREATE TABLE %I.%I (LIKE %I.%I INCLUDING ALL)',target_name,table_name,source_name,table_name);
  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',target_name,table_name);
  EXECUTE format('REVOKE ALL ON %I.%I FROM PUBLIC',target_name,table_name);
 END LOOP;
 -- Fully qualify references before redirecting every foreign key to the isolated namespace.
 PERFORM set_config('search_path','pg_catalog',true);
 FOR constraint_row IN SELECT c.conname,c.conrelid,cl.relname,pg_get_constraintdef(c.oid) AS def
 FROM pg_constraint c JOIN pg_class cl ON cl.oid=c.conrelid JOIN pg_namespace n ON n.oid=cl.relnamespace
 WHERE n.nspname=source_name AND cl.relname=ANY(table_names) AND c.contype='f' LOOP
  definition := replace(constraint_row.def,format('REFERENCES %I.',source_name),format('REFERENCES %I.',target_name));
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I %s',target_name,constraint_row.relname,constraint_row.conname,definition);
 END LOOP;
 EXECUTE format('CREATE SEQUENCE %I.bank_reference_sequence MINVALUE 1 MAXVALUE 9999999999 NO CYCLE',target_name);
 EXECUTE format('CREATE TABLE %I.simulation_attempts (booking_id uuid PRIMARY KEY,organization_id uuid NOT NULL,failure boolean NOT NULL DEFAULT false,deleted_at timestamptz,FOREIGN KEY(booking_id,organization_id) REFERENCES %I.bookings(id,organization_id))',target_name,target_name);
 EXECUTE format('CREATE INDEX ON %I.simulation_attempts(organization_id)',target_name);
 EXECUTE format('ALTER TABLE %I.simulation_attempts ENABLE ROW LEVEL SECURITY',target_name);
 EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA %I FROM PUBLIC',target_name);
 EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA %I FROM PUBLIC',target_name);
 FOREACH table_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=table_name) THEN
   EXECUTE format('REVOKE ALL ON SCHEMA %I FROM %I',target_name,table_name);
   EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA %I FROM %I',target_name,table_name);
   EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA %I FROM %I',target_name,table_name);
  END IF;
 END LOOP;
 PERFORM set_config('search_path',format('%I,pg_catalog',source_name),true);
END $simulation$;
