ALTER TABLE bookings ADD COLUMN merchant_account_id text;
ALTER TABLE bookings ADD COLUMN bank_iban text;
ALTER TABLE bookings ADD COLUMN bank_account_name text;
CREATE SEQUENCE bank_reference_sequence MINVALUE 1 MAXVALUE 9999999999 NO CYCLE;
