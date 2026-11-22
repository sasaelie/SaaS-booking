-- Approved policy: 30 days after full closure; preserve unresolved rights and explicit revocation.
-- Versioned independently of the runtime constant to keep past migration checksums immutable.
CREATE OR REPLACE FUNCTION close_booking_access() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $close$
DECLARE booking_id uuid; organization_id uuid; session_id uuid;
BEGIN
 IF TG_TABLE_NAME='sessions' THEN
  IF OLD.ends_at>now()-interval '30 days' THEN RETURN NEW; END IF;
  session_id := OLD.id; organization_id := OLD.organization_id;
 ELSE
  booking_id := NEW.origin_booking_id; organization_id := NEW.organization_id;
 END IF;
 EXECUTE format('UPDATE %I.booking_access_credentials c SET closed_at=COALESCE(c.closed_at,now())
  FROM %I.bookings b JOIN %I.sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
  WHERE c.booking_id=b.id AND c.organization_id=b.organization_id AND b.organization_id=$1
   AND (($2::uuid IS NOT NULL AND b.id=$2 AND s.ends_at<=now()) OR ($3::uuid IS NOT NULL AND s.id=$3))
   AND NOT b.legal_hold AND NOT b.dispute_open AND b.status<>''PROOF_SUBMITTED''
   AND (b.locked_until IS NULL OR b.locked_until<=now())
   AND COALESCE(b.refund_status,'''') NOT IN (''PENDING'',''MANUAL_PENDING'',''FAILED'')
   AND (b.status<>''CONFIRMED'' OR b.payment_mode<>''NONE'' OR b.amount_paid_cents+b.voucher_discount_cents>=b.unit_price_cents)
   AND GREATEST(s.ends_at,b.cancelled_at,b.paid_at,b.refund_updated_at,
     (SELECT max(COALESCE(v.used_at,v.expires_at)) FROM %I.reschedule_vouchers v WHERE v.organization_id=b.organization_id AND v.origin_booking_id=b.id),
     (SELECT max(e.created_at) FROM %I.financial_entries e WHERE e.organization_id=b.organization_id AND e.booking_id=b.id))<=now()-interval ''30 days''
   AND NOT EXISTS(SELECT 1 FROM %I.outbox_jobs j WHERE j.organization_id=b.organization_id AND j.payload->>''bookingId''=b.id::text AND j.completed_at IS NULL AND j.type IN (''REFUND'',''FINANCIAL_RECONCILE''))
   AND NOT EXISTS(SELECT 1 FROM %I.reschedule_vouchers v WHERE v.organization_id=b.organization_id AND v.origin_booking_id=b.id AND v.status IN (''ACTIVE'',''LOCKED_PENDING_PAYMENT'') AND v.expires_at>now())',
   TG_TABLE_SCHEMA,TG_TABLE_SCHEMA,TG_TABLE_SCHEMA,TG_TABLE_SCHEMA,TG_TABLE_SCHEMA,TG_TABLE_SCHEMA,TG_TABLE_SCHEMA)
  USING organization_id,booking_id,session_id;
 RETURN NEW;
END $close$;
REVOKE ALL ON FUNCTION close_booking_access() FROM PUBLIC;

-- A genuinely new credit must never be stranded behind a previously closed dossier.
-- Rotate explicitly; an event date change alone cannot revive an old code.
CREATE OR REPLACE FUNCTION recover_booking_access_for_credit() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $recover$
DECLARE credential record; qualifies boolean;
BEGIN
 IF NEW.status<>'ACTIVE' OR NEW.expires_at<=now() THEN RETURN NEW; END IF;
 EXECUTE format('SELECT c.id,c.closed_at,c.revoked_at,b.anonymized_at,b.self_service_version,
   s.ends_at FROM %I.booking_access_credentials c
   JOIN %I.bookings b ON b.id=c.booking_id AND b.organization_id=c.organization_id
   JOIN %I.sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
   WHERE c.organization_id=$1 AND c.booking_id=$2 FOR UPDATE OF c',
   TG_TABLE_SCHEMA,TG_TABLE_SCHEMA,TG_TABLE_SCHEMA)
  INTO credential USING NEW.organization_id,NEW.origin_booking_id;
 IF credential.id IS NULL OR credential.revoked_at IS NOT NULL OR credential.anonymized_at IS NOT NULL THEN RETURN NEW; END IF;
 qualifies := credential.closed_at IS NOT NULL;
 IF NOT qualifies THEN RETURN NEW; END IF;
 EXECUTE format('DELETE FROM %I.participant_booking_sessions WHERE organization_id=$1 AND booking_id=$2',TG_TABLE_SCHEMA)
  USING NEW.organization_id,NEW.origin_booking_id;
 EXECUTE format('UPDATE %I.bookings SET self_service_version=self_service_version+1 WHERE organization_id=$1 AND id=$2',TG_TABLE_SCHEMA)
  USING NEW.organization_id,NEW.origin_booking_id;
 EXECUTE format('UPDATE %I.booking_access_credentials SET id=gen_random_uuid(),version=$3,closed_at=NULL,created_at=now() WHERE organization_id=$1 AND booking_id=$2',TG_TABLE_SCHEMA)
  USING NEW.organization_id,NEW.origin_booking_id,credential.self_service_version+1;
 EXECUTE format('INSERT INTO %I.booking_access_events(organization_id,booking_id,action) VALUES($1,$2,''NEW_CREDIT_ACCESS_ROTATED'')',TG_TABLE_SCHEMA)
  USING NEW.organization_id,NEW.origin_booking_id;
 RETURN NEW;
END $recover$;
REVOKE ALL ON FUNCTION recover_booking_access_for_credit() FROM PUBLIC;

-- Materialize any old closure before a genuinely new credit can rotate and reopen its access.
CREATE TRIGGER a_close_before_new_credit BEFORE INSERT ON reschedule_vouchers
 FOR EACH ROW EXECUTE FUNCTION close_booking_access();
DO $$ DECLARE source_name text := current_schema(); target_name text := current_schema() || '_simulation'; BEGIN
 EXECUTE format('CREATE TRIGGER a_close_before_new_credit BEFORE INSERT ON %I.reschedule_vouchers FOR EACH ROW EXECUTE FUNCTION %I.close_booking_access()',target_name,source_name);
END $$;
