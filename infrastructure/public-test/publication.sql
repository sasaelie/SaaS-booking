-- SECURITY INVOKER: the public service cannot read the source or execute publication.
CREATE FUNCTION booking_public_test.publish_configuration() RETURNS void
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $publish$
DECLARE tenant uuid; public_slug text; active boolean;
BEGIN
 SELECT organization_id,slug,enabled INTO tenant,public_slug,active FROM booking_public_test.publication;
 IF tenant IS NULL THEN RETURN; END IF;
 INSERT INTO booking_public_test.organizations(id,name,slug,timezone,primary_text_color,kind)
  SELECT id,name,public_slug,timezone,primary_text_color,kind FROM __SOURCE_SCHEMA__.organizations WHERE id=tenant
  ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,timezone=excluded.timezone,
   primary_text_color=excluded.primary_text_color,kind=excluded.kind;
 INSERT INTO booking_public_test.organization_access(organization_id,complimentary,status,suspended_at)
  VALUES(tenant,true,'ACTIVE',CASE WHEN active THEN NULL ELSE now() END)
  ON CONFLICT(organization_id) DO UPDATE SET suspended_at=excluded.suspended_at;
 INSERT INTO booking_public_test.activities(id,organization_id,name,description,price_cents,currency,
   audience_policy,require_phone,payment_mode,booking_window_weeks,notice_hours_for_voucher,
   voucher_validity_months,is_active,address,practical_info,participation_terms)
  SELECT id,organization_id,name,description,price_cents,currency,audience_policy,require_phone,'NONE',
   booking_window_weeks,notice_hours_for_voucher,voucher_validity_months,is_active,
   'Lieu fictif — démonstration TEST','Aucune participation réelle.','Réservation fictive de TEST.'
  FROM __SOURCE_SCHEMA__.activities WHERE organization_id=tenant AND is_active
  ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,price_cents=excluded.price_cents,
   currency=excluded.currency,audience_policy=excluded.audience_policy,require_phone=excluded.require_phone,
   booking_window_weeks=excluded.booking_window_weeks,notice_hours_for_voucher=excluded.notice_hours_for_voucher,
   voucher_validity_months=excluded.voucher_validity_months,is_active=true;
 UPDATE booking_public_test.activities a SET is_active=false WHERE organization_id=tenant AND NOT EXISTS
  (SELECT FROM __SOURCE_SCHEMA__.activities s WHERE s.id=a.id AND s.organization_id=tenant AND s.is_active);
 DELETE FROM booking_public_test.time_slots WHERE organization_id=tenant;
 INSERT INTO booking_public_test.time_slots(id,organization_id,activity_id,day_of_week,start_time_local,end_time_local,capacity)
  SELECT t.id,t.organization_id,t.activity_id,t.day_of_week,t.start_time_local,t.end_time_local,t.capacity
  FROM __SOURCE_SCHEMA__.time_slots t JOIN booking_public_test.activities a ON a.id=t.activity_id
  WHERE t.organization_id=tenant AND a.is_active;
 DELETE FROM booking_public_test.pause_periods WHERE organization_id=tenant;
 INSERT INTO booking_public_test.pause_periods(id,organization_id,activity_id,starts_at,ends_at)
  SELECT p.id,p.organization_id,p.activity_id,p.starts_at,p.ends_at
  FROM __SOURCE_SCHEMA__.pause_periods p JOIN booking_public_test.activities a ON a.id=p.activity_id
  WHERE p.organization_id=tenant AND a.is_active;
 INSERT INTO booking_public_test.sessions(organization_id,activity_id,starts_at,ends_at,capacity,is_manual,is_cancelled)
  SELECT s.organization_id,s.activity_id,s.starts_at,s.ends_at,s.capacity,s.is_manual,s.is_cancelled
  FROM __SOURCE_SCHEMA__.sessions s JOIN booking_public_test.activities a ON a.id=s.activity_id
  WHERE s.organization_id=tenant AND a.is_active AND (s.is_manual OR s.is_cancelled)
  ON CONFLICT(activity_id,starts_at) DO UPDATE SET ends_at=excluded.ends_at,capacity=excluded.capacity,
   is_manual=excluded.is_manual,is_cancelled=excluded.is_cancelled;
 UPDATE booking_public_test.sessions s SET is_cancelled=true WHERE organization_id=tenant AND is_manual
  AND NOT EXISTS(SELECT FROM __SOURCE_SCHEMA__.sessions p WHERE p.organization_id=tenant AND p.activity_id=s.activity_id AND p.starts_at=s.starts_at AND p.is_manual);
 INSERT INTO booking_public_test.private_files(storage_key,organization_id,bytes)
  SELECT f.storage_key,f.organization_id,f.bytes FROM __SOURCE_SCHEMA__.private_files f
  JOIN __SOURCE_SCHEMA__.organization_branding b ON b.organization_id=f.organization_id
  WHERE f.organization_id=tenant AND f.storage_key IN (b.logo_storage_key,b.background_storage_key)
  ON CONFLICT(storage_key) DO UPDATE SET bytes=excluded.bytes;
 INSERT INTO booking_public_test.organization_branding(organization_id,theme,logo_storage_key,background_storage_key,
   organizer_hue,participant_hue,story_text_tone,story_layout)
  SELECT b.organization_id,b.theme,
   CASE WHEN EXISTS(SELECT FROM booking_public_test.private_files f WHERE f.storage_key=b.logo_storage_key) THEN b.logo_storage_key END,
   CASE WHEN EXISTS(SELECT FROM booking_public_test.private_files f WHERE f.storage_key=b.background_storage_key) THEN b.background_storage_key END,
   b.organizer_hue,b.participant_hue,b.story_text_tone,b.story_layout
  FROM __SOURCE_SCHEMA__.organization_branding b WHERE organization_id=tenant
  ON CONFLICT(organization_id) DO UPDATE SET theme=excluded.theme,logo_storage_key=excluded.logo_storage_key,
   background_storage_key=excluded.background_storage_key,participant_hue=excluded.participant_hue,
   organizer_hue=excluded.organizer_hue,story_text_tone=excluded.story_text_tone,story_layout=excluded.story_layout;
 DELETE FROM booking_public_test.organization_branding b WHERE NOT EXISTS
  (SELECT FROM __SOURCE_SCHEMA__.organization_branding source WHERE source.organization_id=b.organization_id);
 DELETE FROM booking_public_test.private_files f WHERE NOT EXISTS
  (SELECT FROM booking_public_test.organization_branding b WHERE f.storage_key IN (b.logo_storage_key,b.background_storage_key));
END $publish$;
REVOKE ALL ON FUNCTION booking_public_test.publish_configuration() FROM PUBLIC,anon,authenticated,booking_public_test_service;
CREATE FUNCTION booking_public_test.configuration_changed() RETURNS trigger
 LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $changed$
DECLARE changed_tenant uuid;
BEGIN
 IF TG_TABLE_NAME='organizations' THEN
  IF TG_OP='DELETE' THEN changed_tenant:=OLD.id; ELSE changed_tenant:=NEW.id; END IF;
 ELSE
  IF TG_OP='DELETE' THEN changed_tenant:=OLD.organization_id; ELSE changed_tenant:=NEW.organization_id; END IF;
 END IF;
 IF NOT EXISTS(SELECT FROM booking_public_test.publication WHERE organization_id=changed_tenant) THEN RETURN NULL; END IF;
 IF TG_TABLE_NAME='sessions' THEN
  IF TG_OP<>'DELETE' AND NOT NEW.is_manual AND NOT NEW.is_cancelled THEN RETURN NULL; END IF;
 END IF;
 PERFORM booking_public_test.publish_configuration();
 RETURN NULL;
END $changed$;
REVOKE ALL ON FUNCTION booking_public_test.configuration_changed() FROM PUBLIC,anon,authenticated,booking_public_test_service;
DO $triggers$
DECLARE table_name text;
BEGIN
 FOREACH table_name IN ARRAY ARRAY['organizations','activities','time_slots','pause_periods','sessions','organization_branding'] LOOP
  EXECUTE format('CREATE TRIGGER publish_public_test AFTER INSERT OR UPDATE OR DELETE ON __SOURCE_SCHEMA__.%I FOR EACH ROW EXECUTE FUNCTION booking_public_test.configuration_changed()',table_name);
 END LOOP;
END $triggers$;
