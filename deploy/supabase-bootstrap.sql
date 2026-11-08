-- Run only on the intended Supabase staging project, before application migrations.
-- Keep application data outside the schemas exposed by the Supabase Data API.
CREATE SCHEMA booking;
REVOKE ALL ON SCHEMA booking FROM PUBLIC, anon, authenticated;
CREATE TABLE booking.schema_migrations (
  name text PRIMARY KEY,
  hash text NOT NULL
);
