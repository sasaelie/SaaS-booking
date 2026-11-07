CREATE TABLE organizations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE,
 timezone text NOT NULL DEFAULT 'Europe/Brussels', primary_text_color text NOT NULL DEFAULT '#143D2B',
 merchant_account_id text, bank_iban text, bank_account_name text, auto_delete_bank_proof boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
 name text NOT NULL, description text, price_cents integer NOT NULL CHECK(price_cents BETWEEN 0 AND 100000000),
 currency text NOT NULL DEFAULT 'EUR' CHECK(currency='EUR'),
 audience_policy text NOT NULL DEFAULT 'ALL_PUBLIC' CHECK(audience_policy IN ('ADULTS_ONLY','ALL_PUBLIC','MINORS_ONLY')),
 require_phone boolean NOT NULL DEFAULT false, payment_mode text NOT NULL DEFAULT 'STRIPE' CHECK(payment_mode IN ('STRIPE','BANK_TRANSFER','NONE')),
 booking_window_weeks integer NOT NULL DEFAULT 4 CHECK(booking_window_weeks BETWEEN 1 AND 52),
 notice_hours_for_voucher integer NOT NULL DEFAULT 72 CHECK(notice_hours_for_voucher >= 0),
 voucher_validity_months integer NOT NULL DEFAULT 3 CHECK(voucher_validity_months BETWEEN 1 AND 120),
 allow_external_benefit_exchange boolean NOT NULL DEFAULT false, is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT activity_tenant UNIQUE(id,organization_id)
);
CREATE TABLE time_slots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, activity_id uuid NOT NULL,
 day_of_week integer NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
 start_time_local text NOT NULL CHECK(start_time_local ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 end_time_local text NOT NULL CHECK(end_time_local ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 capacity integer NOT NULL CHECK(capacity BETWEEN 1 AND 10000), CHECK(end_time_local > start_time_local),
 FOREIGN KEY(activity_id,organization_id) REFERENCES activities(id,organization_id) ON DELETE RESTRICT,
 UNIQUE(activity_id, day_of_week, start_time_local)
);
CREATE TABLE pause_periods (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, activity_id uuid NOT NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at > starts_at), reason text,
 FOREIGN KEY(activity_id,organization_id) REFERENCES activities(id,organization_id) ON DELETE RESTRICT
);
CREATE TABLE sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, activity_id uuid NOT NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at > starts_at),
 capacity integer NOT NULL CHECK(capacity BETWEEN 1 AND 10000), is_manual boolean NOT NULL DEFAULT false,
 is_cancelled boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT uq_session_activity_start UNIQUE(activity_id, starts_at), CONSTRAINT session_tenant_activity UNIQUE(id,activity_id,organization_id),
 FOREIGN KEY(activity_id,organization_id) REFERENCES activities(id,organization_id) ON DELETE RESTRICT
);
CREATE INDEX idx_session_org_starts ON sessions(organization_id,starts_at);
CREATE INDEX idx_pause_activity_dates ON pause_periods(organization_id,activity_id,starts_at,ends_at);
