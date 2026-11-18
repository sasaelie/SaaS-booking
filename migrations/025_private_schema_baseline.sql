-- Reproduce the private-table protections on fresh installations too.
-- Only application-owned table names are touched, including their simulation copies.
DO $$
DECLARE
  source_name text := current_schema();
  target_name text;
  table_name text;
  role_name text;
BEGIN
  FOREACH target_name IN ARRAY ARRAY[source_name, source_name || '_simulation'] LOOP
    FOREACH table_name IN ARRAY ARRAY[
      'organizations','activities','time_slots','pause_periods','sessions',
      'bookings','reschedule_vouchers','outbox_jobs','processed_webhooks','request_limits',
      'user','session','account','verification','rateLimit',
      'organization_members','organization_access','organization_branding',
      'platform_operators','platform_audit','saas_billing_events','stripe_connect_states',
      'private_files','financial_payments','financial_entries','accounting_archives','platform_costs',
      'booking_access_credentials','participant_booking_sessions','booking_access_events',
      'schema_migrations','platform_billing_settings','platform_documents','platform_settings'
    ] LOOP
      IF to_regclass(format('%I.%I', target_name, table_name)) IS NULL THEN CONTINUE; END IF;
      EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', target_name, table_name);
      EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC', target_name, table_name);
      FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
          EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM %I', target_name, table_name, role_name);
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
