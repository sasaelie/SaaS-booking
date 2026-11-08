ALTER TABLE outbox_jobs DROP CONSTRAINT outbox_jobs_type_check;
ALTER TABLE outbox_jobs ADD CONSTRAINT outbox_jobs_type_check
 CHECK(type IN ('CONFIRMATION','VOUCHER','CANCELLATION','REFUND','PURGE','MEDIA_PURGE'));
