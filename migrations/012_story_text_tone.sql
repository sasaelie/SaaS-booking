ALTER TABLE organization_branding
 ADD COLUMN story_text_tone text NOT NULL DEFAULT 'WHITE'
 CHECK (story_text_tone IN ('WHITE','BLACK','FOREST'));
