-- Upgrade existing isolated TEST policies. No private or participant data is copied.
DO $policies$
DECLARE t record; tenant_column text; definition text;
BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='booking_public_test' LOOP
  SELECT column_name INTO tenant_column FROM information_schema.columns
   WHERE table_schema='booking_public_test' AND table_name=t.tablename AND column_name='organization_id';
  IF t.tablename='organizations' THEN tenant_column:='id'; END IF;
  IF t.tablename='publication' OR tenant_column IS NULL THEN definition:='true';
  ELSE definition:=format('%I IN (SELECT organization_id FROM booking_public_test.publication WHERE enabled)',tenant_column); END IF;
  EXECUTE format('ALTER POLICY public_test_service ON booking_public_test.%I USING (%s) WITH CHECK (%s)',t.tablename,definition,definition);
 END LOOP;
END $policies$;
