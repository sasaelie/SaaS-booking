CREATE TABLE platform_settings (
  id smallint PRIMARY KEY CHECK (id = 1),
  draft jsonb NOT NULL CHECK (jsonb_typeof(draft) = 'object' AND octet_length(draft::text) <= 65536),
  published jsonb CHECK (published IS NULL OR (jsonb_typeof(published) = 'object' AND octet_length(published::text) <= 65536)),
  connection jsonb NOT NULL CHECK (jsonb_typeof(connection) = 'object' AND octet_length(connection::text) <= 4096),
  revision integer NOT NULL CHECK (revision > 0),
  published_revision integer CHECK (published_revision > 0 AND published_revision <= revision),
  mode text NOT NULL DEFAULT 'ENVIRONMENT' CHECK (mode IN ('ENVIRONMENT', 'PUBLISHED', 'HIDDEN')),
  updated_by text NOT NULL REFERENCES "user"(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_by text REFERENCES "user"(id),
  published_at timestamptz,
  CHECK (mode <> 'PUBLISHED' OR (published IS NOT NULL AND published_revision IS NOT NULL AND published_by IS NOT NULL AND published_at IS NOT NULL))
);
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON platform_settings FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON platform_settings FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON platform_settings FROM authenticated; END IF;
END $$;
