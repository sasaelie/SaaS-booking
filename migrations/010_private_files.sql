-- Small private storage backend for staging only. Production keeps its external storage adapter.
CREATE TABLE private_files (
 storage_key text PRIMARY KEY,
 organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
 bytes bytea NOT NULL CHECK(octet_length(bytes) BETWEEN 1 AND 5242880),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX private_files_org ON private_files(organization_id);
ALTER TABLE private_files ENABLE ROW LEVEL SECURITY;
