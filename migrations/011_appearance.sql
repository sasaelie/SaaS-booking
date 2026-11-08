ALTER TABLE organization_branding
 ADD COLUMN organizer_hue integer CHECK (organizer_hue BETWEEN 0 AND 359),
 ADD COLUMN participant_hue integer CHECK (participant_hue BETWEEN 0 AND 359);
