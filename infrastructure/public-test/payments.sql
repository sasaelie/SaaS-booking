-- TEST infrastructure only: reuse confirmation, accounting and replay rules without external jobs.
GRANT INSERT,UPDATE ON booking_public_test.simulation_attempts,
 booking_public_test.processed_webhooks TO booking_public_test_service;
CREATE OR REPLACE FUNCTION booking_public_test.block_external_jobs() RETURNS trigger
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $jobs$
BEGIN
 RETURN NULL;
END $jobs$;
REVOKE ALL ON FUNCTION booking_public_test.block_external_jobs() FROM PUBLIC,anon,authenticated,booking_public_test_service;
CREATE OR REPLACE TRIGGER block_external_jobs BEFORE INSERT ON booking_public_test.outbox_jobs
 FOR EACH ROW EXECUTE FUNCTION booking_public_test.block_external_jobs();
