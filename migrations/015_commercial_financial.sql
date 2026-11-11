ALTER TABLE organization_access ADD COLUMN grace_until timestamptz;
ALTER TABLE organization_access ADD COLUMN billing_interval text CHECK (billing_interval IN ('month','year'));
ALTER TABLE organization_access ADD COLUMN liberty_activity_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE organization_access ADD COLUMN liberty_selection_at timestamptz;
ALTER TABLE organization_access ADD CONSTRAINT liberty_selection_limit CHECK (cardinality(liberty_activity_ids)<=2);
ALTER TABLE bookings ADD COLUMN commercial_plan text NOT NULL DEFAULT 'LEGACY' CHECK(commercial_plan IN ('LEGACY','LIBERTE','PRO'));
ALTER TABLE bookings ADD COLUMN pricing_version text NOT NULL DEFAULT 'legacy-1999';
ALTER TABLE bookings ADD COLUMN commission_cents integer NOT NULL DEFAULT 0 CHECK(commission_cents>=0);
ALTER TABLE bookings ADD COLUMN charge_model text NOT NULL DEFAULT 'DIRECT' CHECK(charge_model IN ('DIRECT','DESTINATION'));
ALTER TABLE bookings ADD COLUMN legal_hold boolean NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN proof_is_accounting boolean NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN operations_closed_at timestamptz;
ALTER TABLE bookings ADD COLUMN refund_updated_at timestamptz;
CREATE TABLE financial_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  booking_id uuid NOT NULL,
  commercial_plan text NOT NULL CHECK(commercial_plan IN ('LEGACY','LIBERTE','PRO')),
  pricing_version text NOT NULL,
  currency text NOT NULL CHECK(currency='EUR'),
  public_amount_cents integer NOT NULL CHECK(public_amount_cents>=0),
  commission_cents integer NOT NULL CHECK(commission_cents>=0),
  commission_tax_cents integer CHECK(commission_tax_cents>=0),
  stripe_fee_cents integer CHECK(stripe_fee_cents>=0),
  organization_net_cents integer,
  refunded_cents integer NOT NULL DEFAULT 0 CHECK(refunded_cents>=0),
  commission_refunded_cents integer NOT NULL DEFAULT 0 CHECK(commission_refunded_cents>=0),
  status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','RECONCILED','HISTORICAL')),
  payment_reference text,
  merchant_account_id text,
  charge_account_id text,
  charge_id text,
  balance_transaction_id text,
  transfer_id text,
  payout_id text,
  paid_at timestamptz,
  reconciled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id,organization_id),
  FOREIGN KEY(booking_id,organization_id) REFERENCES bookings(id,organization_id),
  CHECK(commission_cents<=public_amount_cents),
  CHECK(refunded_cents<=public_amount_cents),
  CHECK(status<>'RECONCILED' OR (stripe_fee_cents IS NOT NULL AND organization_net_cents IS NOT NULL))
);
CREATE UNIQUE INDEX financial_balance_unique ON financial_payments(COALESCE(charge_account_id,''),balance_transaction_id) WHERE balance_transaction_id IS NOT NULL;
CREATE INDEX financial_tenant_period ON financial_payments(organization_id,paid_at);
CREATE TABLE financial_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  booking_id uuid,
  source_key text NOT NULL,
  kind text NOT NULL CHECK(kind IN ('PAYMENT','REFUND','VOUCHER_ISSUED','VOUCHER_USED','SUBSCRIPTION','ADJUSTMENT')),
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EUR' CHECK(currency='EUR'),
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id,source_key),
  FOREIGN KEY(booking_id,organization_id) REFERENCES bookings(id,organization_id)
);
CREATE INDEX financial_entry_tenant_period ON financial_entries(organization_id,created_at);
CREATE TABLE accounting_archives (
  booking_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  required_identity jsonb NOT NULL,
  archive_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(booking_id,organization_id) REFERENCES bookings(id,organization_id)
);
ALTER TABLE financial_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_archives ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON financial_payments,financial_entries,accounting_archives FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON financial_payments,financial_entries,accounting_archives FROM anon;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON financial_payments,financial_entries,accounting_archives FROM authenticated;
  END IF;
END $$;
