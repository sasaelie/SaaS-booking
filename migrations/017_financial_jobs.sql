ALTER TABLE outbox_jobs DROP CONSTRAINT outbox_jobs_type_check;
ALTER TABLE outbox_jobs ADD CONSTRAINT outbox_jobs_type_check CHECK(type IN (
  'CONFIRMATION','REMINDER','EVENT_UPDATE','VOUCHER','CANCELLATION','REFUND','PURGE','MEDIA_PURGE',
  'FINANCIAL_RECONCILE','FINANCIAL_PAYOUT'
));
CREATE INDEX booking_retention_pending ON bookings(created_at) WHERE anonymized_at IS NULL AND NOT legal_hold;
CREATE INDEX voucher_origin_operations ON reschedule_vouchers(organization_id,origin_booking_id,expires_at);
