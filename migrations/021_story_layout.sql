ALTER TABLE organization_branding ADD COLUMN story_layout jsonb;
ALTER TABLE organization_branding ADD CONSTRAINT story_layout_object
 CHECK(story_layout IS NULL OR jsonb_typeof(story_layout)='object');
DO $layout$
DECLARE target_name text := current_schema() || '_simulation';
BEGIN
 EXECUTE format('ALTER TABLE %I.organization_branding ADD COLUMN story_layout jsonb',target_name);
 EXECUTE format('ALTER TABLE %I.organization_branding ADD CONSTRAINT story_layout_object CHECK(story_layout IS NULL OR jsonb_typeof(story_layout)=''object'')',target_name);
END $layout$;
