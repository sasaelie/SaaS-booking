-- Private platform-administrator passkeys. No existing account is enrolled automatically.
ALTER TABLE "session" ADD CONSTRAINT administrator_session_owner UNIQUE(id,"userId");
CREATE TABLE administrator_security (
 user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 enabled boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE administrator_passkeys (
 credential_id text PRIMARY KEY CHECK(length(credential_id) BETWEEN 1 AND 4096),
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 public_key text NOT NULL CHECK(length(public_key) BETWEEN 1 AND 16384),
 counter bigint NOT NULL CHECK(counter>=0 AND counter<=9007199254740991),
 transports jsonb NOT NULL CHECK(jsonb_typeof(transports)='array' AND octet_length(transports::text)<=1024),
 label text NOT NULL CHECK(length(label) BETWEEN 1 AND 64),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX administrator_passkeys_owner ON administrator_passkeys(user_id);
CREATE TABLE administrator_challenges (
 session_id text NOT NULL, user_id text NOT NULL,
 purpose text NOT NULL CHECK(purpose IN ('register','authenticate')),
 challenge text NOT NULL CHECK(length(challenge) BETWEEN 32 AND 512),
 label text NOT NULL DEFAULT '' CHECK(length(label)<=64), expires_at timestamptz NOT NULL,
 PRIMARY KEY(session_id,purpose),
 FOREIGN KEY(session_id,user_id) REFERENCES "session"(id,"userId") ON DELETE CASCADE
);
CREATE INDEX administrator_challenges_owner ON administrator_challenges(user_id);
CREATE TABLE administrator_verified_sessions (
 session_id text PRIMARY KEY, user_id text NOT NULL, verified_at timestamptz NOT NULL,
 FOREIGN KEY(session_id,user_id) REFERENCES "session"(id,"userId") ON DELETE CASCADE
);
CREATE INDEX administrator_verified_owner ON administrator_verified_sessions(user_id);
CREATE TABLE administrator_recovery_codes (
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 code_hash text NOT NULL CHECK(code_hash ~ '^[a-f0-9]{64}$'),
 PRIMARY KEY(user_id,code_hash)
);
DO $$ DECLARE table_name text; role_name text; BEGIN
 FOREACH table_name IN ARRAY ARRAY['administrator_security','administrator_passkeys','administrator_challenges','administrator_verified_sessions','administrator_recovery_codes'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',table_name);
  EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC',table_name);
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN EXECUTE format('REVOKE ALL ON TABLE %I FROM %I',table_name,role_name); END IF;
  END LOOP;
 END LOOP;
END $$;
