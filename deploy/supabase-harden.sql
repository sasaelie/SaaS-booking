-- Run after migrations. No browser/client roles can read application tables.
REVOKE ALL ON SCHEMA booking FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA booking FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA booking FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA booking
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA booking
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
DO $$
DECLARE relation record;
BEGIN
  FOR relation IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'booking'
  LOOP
    EXECUTE format('ALTER TABLE booking.%I ENABLE ROW LEVEL SECURITY', relation.tablename);
  END LOOP;
END $$;
