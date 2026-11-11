ALTER TABLE bookings ADD COLUMN dispute_open boolean NOT NULL DEFAULT false;
INSERT INTO financial_payments(organization_id,booking_id,commercial_plan,pricing_version,currency,
 public_amount_cents,commission_cents,status,payment_reference,merchant_account_id,charge_account_id,paid_at)
SELECT organization_id,id,'LEGACY',pricing_version,currency,
 CASE WHEN payment_mode='NONE' THEN 0 ELSE unit_price_cents-voucher_discount_cents END,0,'HISTORICAL',
 payment_reference,merchant_account_id,merchant_account_id,paid_at FROM bookings WHERE commercial_plan='LEGACY'
ON CONFLICT(booking_id,organization_id) DO NOTHING;
