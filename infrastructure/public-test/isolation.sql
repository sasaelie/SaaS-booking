-- Infrastructure only. Replace __SOURCE_SCHEMA__ with a validated identifier.
-- Empty structures only: never clone users, credentials, participants or financial rows.
CREATE ROLE booking_public_test_service LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE SCHEMA booking_public_test;
REVOKE ALL ON SCHEMA booking_public_test FROM PUBLIC, anon, authenticated;
CREATE TABLE booking_public_test.publication (
 organization_id uuid PRIMARY KEY, slug text NOT NULL UNIQUE,
 enabled boolean NOT NULL DEFAULT true
);
ALTER TABLE booking_public_test.publication ENABLE ROW LEVEL SECURITY;
DO $isolation$
DECLARE table_row record; fk record; definition text; function_name text; trigger_row record; tenant_column text;
 names text[];
BEGIN
 SELECT array_agg(tablename) INTO names FROM pg_tables WHERE schemaname='__SOURCE_SCHEMA___simulation';
 FOREACH function_name IN ARRAY names LOOP
  EXECUTE format('CREATE TABLE booking_public_test.%I (LIKE %I.%I INCLUDING ALL)',function_name,'__SOURCE_SCHEMA___simulation',function_name);
 END LOOP;
 CREATE TABLE booking_public_test.request_limits (LIKE __SOURCE_SCHEMA__.request_limits INCLUDING ALL);
 PERFORM set_config('search_path','pg_catalog',true);
 FOR fk IN SELECT c.conname,cl.relname,pg_get_constraintdef(c.oid) AS def
 FROM pg_constraint c JOIN pg_class cl ON cl.oid=c.conrelid JOIN pg_namespace n ON n.oid=cl.relnamespace
 WHERE n.nspname='__SOURCE_SCHEMA___simulation' AND c.contype='f' LOOP
  definition := replace(fk.def,'REFERENCES __SOURCE_SCHEMA___simulation.','REFERENCES booking_public_test.');
  EXECUTE format('ALTER TABLE booking_public_test.%I ADD CONSTRAINT %I %s',fk.relname,fk.conname,definition);
 END LOOP;
 FOREACH function_name IN ARRAY ARRAY['issue_booking_access','close_booking_access','recover_booking_access_for_credit'] LOOP
  SELECT pg_get_functiondef(p.oid) INTO definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='__SOURCE_SCHEMA__' AND p.proname=function_name;
  IF definition IS NULL THEN RAISE EXCEPTION 'Required participant trigger missing'; END IF;
  definition := replace(definition,format('FUNCTION %I.', '__SOURCE_SCHEMA__'),'FUNCTION booking_public_test.');
  EXECUTE definition;
  EXECUTE format('REVOKE ALL ON FUNCTION booking_public_test.%I() FROM PUBLIC,anon,authenticated',function_name);
 END LOOP;
 FOR trigger_row IN SELECT pg_get_triggerdef(t.oid) AS def FROM pg_trigger t
  JOIN pg_class cl ON cl.oid=t.tgrelid JOIN pg_namespace n ON n.oid=cl.relnamespace
  WHERE n.nspname='__SOURCE_SCHEMA___simulation' AND NOT t.tgisinternal LOOP
  definition := replace(trigger_row.def,'__SOURCE_SCHEMA___simulation.','booking_public_test.');
  definition := replace(definition,'__SOURCE_SCHEMA__.','booking_public_test.');
  EXECUTE definition;
 END LOOP;
 FOR table_row IN SELECT tablename FROM pg_tables WHERE schemaname='booking_public_test' LOOP
  EXECUTE format('ALTER TABLE booking_public_test.%I ENABLE ROW LEVEL SECURITY',table_row.tablename);
  EXECUTE format('REVOKE ALL ON booking_public_test.%I FROM PUBLIC,anon,authenticated',table_row.tablename);
  -- Only explicitly published tenants. The service cannot change the publication allowlist.
  SELECT column_name INTO tenant_column FROM information_schema.columns
   WHERE table_schema='booking_public_test' AND table_name=table_row.tablename AND column_name='organization_id';
  IF table_row.tablename='organizations' THEN tenant_column:='id'; END IF;
  IF table_row.tablename='publication' OR tenant_column IS NULL THEN definition:='true';
  ELSE definition:=format('%I IN (SELECT organization_id FROM booking_public_test.publication WHERE enabled)',tenant_column); END IF;
  EXECUTE format('CREATE POLICY public_test_service ON booking_public_test.%I TO booking_public_test_service USING (%s) WITH CHECK (%s)',table_row.tablename,definition,definition);
 END LOOP;
END $isolation$;
CREATE SEQUENCE booking_public_test.bank_reference_sequence MINVALUE 1 MAXVALUE 9999999999 NO CYCLE;
GRANT USAGE ON SCHEMA booking_public_test TO booking_public_test_service;
GRANT SELECT ON ALL TABLES IN SCHEMA booking_public_test TO booking_public_test_service;
-- PostgreSQL row locks require UPDATE on at least one column; configuration values stay immutable.
GRANT UPDATE(id) ON booking_public_test.activities TO booking_public_test_service;
GRANT UPDATE(updated_at) ON booking_public_test.organization_access TO booking_public_test_service;
GRANT INSERT,UPDATE,DELETE ON booking_public_test.sessions,booking_public_test.bookings,
 booking_public_test.booking_access_credentials,booking_public_test.booking_access_events,
 booking_public_test.participant_booking_sessions,booking_public_test.reschedule_vouchers,
 booking_public_test.financial_payments,booking_public_test.financial_entries,
 booking_public_test.outbox_jobs,booking_public_test.request_limits TO booking_public_test_service;
GRANT USAGE ON SEQUENCE booking_public_test.bank_reference_sequence TO booking_public_test_service;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA booking_public_test FROM PUBLIC,anon,authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA booking_public_test REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER ROLE booking_public_test_service SET search_path=booking_public_test,pg_catalog;
ALTER ROLE booking_public_test_service SET statement_timeout='15s';
-- Several independent serverless route bundles each keep a small pool (3 connections).
ALTER ROLE booking_public_test_service CONNECTION LIMIT 24;
