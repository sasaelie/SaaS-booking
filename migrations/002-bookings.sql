CREATE TABLE reschedule_vouchers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, origin_activity_id uuid NOT NULL,
 origin_booking_id uuid NOT NULL UNIQUE, code text NOT NULL UNIQUE,
 initial_value_cents integer NOT NULL CHECK(initial_value_cents BETWEEN 1 AND 100000000), currency text NOT NULL CHECK(currency='EUR'),
 status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','LOCKED_PENDING_PAYMENT','USED_FOR_BOOKING','USED_FOR_EXTERNAL_BENEFIT','EXPIRED')),
 locked_until timestamptz, locked_booking_id uuid, expires_at timestamptz NOT NULL,
 used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT voucher_tenant UNIQUE(id,organization_id),
 FOREIGN KEY(origin_activity_id,organization_id) REFERENCES activities(id,organization_id),
 CHECK((status='LOCKED_PENDING_PAYMENT') = (locked_until IS NOT NULL AND locked_booking_id IS NOT NULL))
);
CREATE TABLE bookings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, activity_id uuid NOT NULL, session_id uuid NOT NULL,
 idempotency_key text NOT NULL, request_hash text NOT NULL, status text NOT NULL DEFAULT 'PENDING_PAYMENT'
 CHECK(status IN ('PENDING_PAYMENT','PROOF_SUBMITTED','CONFIRMED','CANCELLED_BY_ATTENDEE','CANCELLED_BY_ORGANIZER','EXPIRED')),
 first_name text NOT NULL, last_name text NOT NULL, email text NOT NULL, phone text, marketing_opt_in boolean NOT NULL DEFAULT false,
 unit_price_cents integer NOT NULL CHECK(unit_price_cents BETWEEN 0 AND 100000000),
 voucher_discount_cents integer NOT NULL DEFAULT 0 CHECK(voucher_discount_cents BETWEEN 0 AND unit_price_cents),
 amount_paid_cents integer NOT NULL DEFAULT 0 CHECK(amount_paid_cents BETWEEN 0 AND unit_price_cents-voucher_discount_cents),
 currency text NOT NULL CHECK(currency='EUR'), payment_mode text NOT NULL CHECK(payment_mode IN ('STRIPE','BANK_TRANSFER','NONE')),
 applied_voucher_id uuid, payment_reference text UNIQUE, checkout_reference text UNIQUE, checkout_url text,
 proof_storage_key text, locked_until timestamptz, terms_accepted_at timestamptz NOT NULL,
 terms_version_hash text NOT NULL CHECK(length(terms_version_hash)=64), terms_text text NOT NULL, age_attestation_label text NOT NULL,
 self_service_version integer NOT NULL DEFAULT 0, confirmed_at timestamptz, paid_at timestamptz,
 cancelled_at timestamptz, refund_status text CHECK(refund_status IN ('PENDING','REFUNDED','MANUAL_PENDING','MANUAL_DONE')),
 refund_id text, refund_deadline timestamptz, anonymized_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT booking_tenant UNIQUE(id,organization_id), CONSTRAINT booking_idempotency UNIQUE(organization_id,idempotency_key),
 FOREIGN KEY(session_id,activity_id,organization_id) REFERENCES sessions(id,activity_id,organization_id),
 FOREIGN KEY(applied_voucher_id,organization_id) REFERENCES reschedule_vouchers(id,organization_id),
 CHECK(status NOT IN ('PENDING_PAYMENT','PROOF_SUBMITTED') OR locked_until IS NOT NULL)
);
ALTER TABLE reschedule_vouchers ADD FOREIGN KEY(origin_booking_id,organization_id) REFERENCES bookings(id,organization_id);
ALTER TABLE reschedule_vouchers ADD FOREIGN KEY(locked_booking_id,organization_id) REFERENCES bookings(id,organization_id) DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX idx_booking_session_status ON bookings(session_id,status);
CREATE INDEX idx_booking_retention ON bookings(created_at) WHERE amount_paid_cents=0;
