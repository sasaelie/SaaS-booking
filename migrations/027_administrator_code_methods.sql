CREATE TABLE administrator_code_factors (
 user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
 totp_ciphertext text CHECK(totp_ciphertext IS NULL OR length(totp_ciphertext) BETWEEN 32 AND 4096),
 last_step bigint NOT NULL DEFAULT -1 CHECK(last_step>=-1),
 email_address text CHECK(email_address IS NULL OR length(email_address)<=320),
 email_sent_at timestamptz,
 failures integer NOT NULL DEFAULT 0 CHECK(failures>=0 AND failures<=6),
 locked_until timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE administrator_code_challenges (
 session_id text NOT NULL, user_id text NOT NULL,
 purpose text NOT NULL CHECK(purpose IN ('totp-enroll','email-enroll','email-verify')),
 payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object' AND octet_length(payload::text)<=4096),
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(session_id,purpose),
 FOREIGN KEY(session_id,user_id) REFERENCES "session"(id,"userId") ON DELETE CASCADE
);
CREATE INDEX administrator_code_challenges_owner ON administrator_code_challenges(user_id);
DO $$ DECLARE name text; role_name text; BEGIN
 FOREACH name IN ARRAY ARRAY['administrator_code_factors','administrator_code_challenges'] LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',name);
  EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC',name);
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN EXECUTE format('REVOKE ALL ON TABLE %I FROM %I',name,role_name); END IF;
  END LOOP;
 END LOOP;
END $$;
