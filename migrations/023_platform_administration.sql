CREATE TABLE platform_billing_settings (
  id smallint PRIMARY KEY CHECK(id=1),
  profile jsonb NOT NULL CHECK(jsonb_typeof(profile)='object'),
  updated_by text NOT NULL REFERENCES "user"(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE financial_payments ADD CONSTRAINT financial_payment_document_tenant UNIQUE(id,organization_id);
ALTER TABLE financial_entries ADD CONSTRAINT financial_entry_document_tenant UNIQUE(id,organization_id);
CREATE TABLE platform_documents (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  kind text NOT NULL CHECK(kind IN ('INVOICE','CREDIT')),
  source_id uuid NOT NULL,
  source_payment_id uuid,
  source_entry_id uuid,
  original_document_id uuid,
  document_number text NOT NULL UNIQUE,
  document_year integer NOT NULL CHECK(document_year BETWEEN 2000 AND 9999),
  sequence integer NOT NULL CHECK(sequence>0),
  gross_cents integer NOT NULL CHECK(gross_cents>0),
  net_cents integer NOT NULL CHECK(net_cents>=0),
  tax_cents integer NOT NULL CHECK(tax_cents>=0),
  currency text NOT NULL DEFAULT 'EUR' CHECK(currency='EUR'),
  snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object'),
  pdf bytea NOT NULL CHECK(octet_length(pdf)>0 AND octet_length(pdf)<=5242880),
  issued_at timestamptz NOT NULL,
  issued_by text NOT NULL REFERENCES "user"(id),
  UNIQUE(kind,source_id), UNIQUE(kind,document_year,sequence), UNIQUE(id,organization_id),
  CHECK(gross_cents=net_cents+tax_cents),
  CHECK((kind='INVOICE' AND source_payment_id IS NOT NULL AND source_payment_id=source_id AND source_entry_id IS NULL AND original_document_id IS NULL)
    OR (kind='CREDIT' AND source_entry_id IS NOT NULL AND source_entry_id=source_id AND source_payment_id IS NULL AND original_document_id IS NOT NULL)),
  FOREIGN KEY(source_payment_id,organization_id) REFERENCES financial_payments(id,organization_id),
  FOREIGN KEY(source_entry_id,organization_id) REFERENCES financial_entries(id,organization_id),
  FOREIGN KEY(original_document_id,organization_id) REFERENCES platform_documents(id,organization_id)
);
CREATE INDEX platform_document_tenant_date ON platform_documents(organization_id,issued_at);
CREATE INDEX platform_document_date ON platform_documents(issued_at,id);
CREATE INDEX platform_document_credits ON platform_documents(original_document_id) WHERE original_document_id IS NOT NULL;
CREATE FUNCTION protect_platform_document() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Issued platform documents are immutable'; END;
$$;
REVOKE ALL ON FUNCTION protect_platform_document() FROM PUBLIC;
CREATE TRIGGER platform_document_immutable BEFORE UPDATE OR DELETE ON platform_documents FOR EACH ROW EXECUTE FUNCTION protect_platform_document();
ALTER TABLE platform_billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON platform_billing_settings,platform_documents FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON platform_billing_settings,platform_documents FROM anon; END IF;
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON platform_billing_settings,platform_documents FROM authenticated; END IF;
END $$;
CREATE INDEX IF NOT EXISTS platform_financial_entry_date ON financial_entries(created_at,id);
CREATE INDEX IF NOT EXISTS platform_financial_payment_date ON financial_payments(paid_at,id) WHERE paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS platform_cost_date ON platform_costs(occurred_at,id);
CREATE INDEX IF NOT EXISTS platform_booking_confirmed_date ON bookings(confirmed_at) WHERE confirmed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS platform_booking_cancelled_date ON bookings(cancelled_at) WHERE cancelled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS platform_activity_created ON activities(organization_id,created_at);
