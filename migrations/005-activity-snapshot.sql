ALTER TABLE bookings ADD COLUMN activity_name text;
UPDATE bookings b SET activity_name=a.name FROM activities a WHERE a.id=b.activity_id AND a.organization_id=b.organization_id;
ALTER TABLE bookings ALTER COLUMN activity_name SET NOT NULL;
