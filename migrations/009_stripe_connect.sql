ALTER TABLE organizations ADD COLUMN stripe_ready boolean NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN uses_platform_payments boolean NOT NULL DEFAULT false;
CREATE TABLE stripe_connect_states (
 token_hash text PRIMARY KEY, organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stripe_connect_expiry ON stripe_connect_states(expires_at);
