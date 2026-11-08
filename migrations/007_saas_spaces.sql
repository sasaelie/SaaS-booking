ALTER TABLE organizations ADD COLUMN kind text NOT NULL DEFAULT 'OTHER'
 CHECK (kind IN ('NONPROFIT','CLUB','BUSINESS','INDIVIDUAL','OTHER'));
CREATE TABLE organization_members (
 organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
 role text NOT NULL CHECK(role IN ('OWNER','MANAGER')),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(organization_id,user_id)
);
CREATE UNIQUE INDEX organization_one_owner ON organization_members(organization_id) WHERE role='OWNER';
CREATE INDEX member_user ON organization_members(user_id);
CREATE TABLE organization_access (
 organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE RESTRICT,
 complimentary boolean NOT NULL DEFAULT false, suspended_at timestamptz,
 status text NOT NULL DEFAULT 'INACTIVE' CHECK(status IN ('INACTIVE','ACTIVE','PAST_DUE','CANCELED')),
 current_period_end timestamptz, cancel_at_period_end boolean NOT NULL DEFAULT false,
 stripe_customer_id text UNIQUE, stripe_subscription_id text UNIQUE,
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- Existing spaces retain their previous access. New spaces start without paid access.
INSERT INTO organization_access(organization_id,complimentary) SELECT id,true FROM organizations;
CREATE TABLE organization_branding (
 organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE RESTRICT,
 theme text NOT NULL DEFAULT 'SAGE' CHECK(theme IN ('SAGE','CHALK','IVORY')),
 logo_storage_key text, background_storage_key text
);
CREATE TABLE platform_operators (
 user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE platform_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
 actor_user_id text NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
 action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX platform_audit_org ON platform_audit(organization_id,created_at);
CREATE TABLE saas_billing_events (
 event_id text PRIMARY KEY, organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now()
);
