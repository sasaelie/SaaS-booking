CREATE TABLE processed_webhooks (
 event_id text PRIMARY KEY, organization_id uuid NOT NULL REFERENCES organizations(id), provider text NOT NULL, processed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE outbox_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 type text NOT NULL CHECK(type IN ('CONFIRMATION','VOUCHER','CANCELLATION','REFUND','PURGE')),
 deduplication_key text NOT NULL UNIQUE, payload jsonb NOT NULL, attempts integer NOT NULL DEFAULT 0,
 available_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, last_error text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_outbox_pending ON outbox_jobs(available_at) WHERE completed_at IS NULL;
CREATE TABLE request_limits (key_hash text PRIMARY KEY, window_start timestamptz NOT NULL, requests integer NOT NULL);
