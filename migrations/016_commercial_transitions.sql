ALTER TABLE organization_access ADD COLUMN liberty_selection_manual boolean NOT NULL DEFAULT false;
ALTER TABLE financial_payments ADD COLUMN transferred_cents integer CHECK(transferred_cents>=0);
ALTER TABLE financial_payments ADD COLUMN payout_status text;
CREATE TABLE platform_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  category text NOT NULL CHECK(category IN ('CONNECT','DISPUTE','CONVERSION','OTHER')),
  amount_cents integer NOT NULL CHECK(amount_cents>0),
  source_reference text NOT NULL UNIQUE,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX platform_cost_tenant_date ON platform_costs(organization_id,occurred_at);
ALTER TABLE platform_costs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON platform_costs FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON platform_costs FROM anon; END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON platform_costs FROM authenticated; END IF;
END $$;
