import { browserSpace, browserDatabase } from './portal-fixtures';
import { bankSpace } from './bank-fixtures';
export const issuer = {
  legalName: 'Studio Test SRL',
  address: 'Rue de l’Exemple 12, 1000 Bruxelles',
  country: 'BE',
  registrationNumber: 'TEST-0123456789',
  vatNumber: 'BE-TEST-0123456789',
  email: 'billing@example.invalid',
  taxRateBps: 2100,
  taxNote: '',
  prefix: 'TESTFRAIS',
};
export const recipient = {
  legalName: 'Atelier Test ASBL',
  address: 'Rue Fictive 4, 5000 Namur',
  country: 'BE',
  vatNumber: '',
  email: 'atelier@example.invalid',
};
export async function administrationVolume() {
  const space = await browserSpace();
  const prefix = `adm-${crypto.randomUUID()}`;
  await browserDatabase().query(
    `WITH inserted AS (
    INSERT INTO organizations(name,slug,kind,timezone,created_at)
    SELECT 'Organisation '||lpad(g::text,3,'0'),$1||'-'||g,'NONPROFIT','Europe/Brussels',now()-g*interval '1 hour' FROM generate_series(1,126) g RETURNING id,slug
  ), accesses AS (
    INSERT INTO organization_access(organization_id,complimentary,status,current_period_end)
    SELECT id,(split_part(slug,'-',7)::int%4=0),CASE WHEN split_part(slug,'-',7)::int%4=1 THEN 'ACTIVE' ELSE 'INACTIVE' END,
      CASE WHEN split_part(slug,'-',7)::int%4=1 THEN now()+interval '30 days' ELSE NULL END FROM inserted
  ) INSERT INTO organization_members(organization_id,user_id,role) SELECT id,$2,'OWNER' FROM inserted`,
    [prefix, space.actor.id],
  );
  return { ...space, prefix };
}
export async function operationVolume(organizationId: string) {
  await browserDatabase().query(
    `INSERT INTO outbox_jobs(organization_id,type,deduplication_key,payload,attempts,last_error,created_at)
    SELECT $1,CASE WHEN g%2=0 THEN 'FINANCIAL_RECONCILE' ELSE 'CONFIRMATION' END,$2||g,jsonb_build_object('secret','never-render-secret'),g%4,CASE WHEN g%4>0 THEN 'CONFIGURATION_ERROR' ELSE NULL END,now()-g*interval '1 minute' FROM generate_series(1,120) g`,
    [organizationId, crypto.randomUUID()],
  );
}
export async function administrationFinance() {
  const space = await bankSpace();
  const pool = browserDatabase();
  await pool.query(
    "UPDATE bookings SET status='CONFIRMED',confirmed_at=now(),paid_at=now(),locked_until=NULL,payment_mode='STRIPE',commercial_plan='LIBERTE',unit_price_cents=3000,amount_paid_cents=3000,commission_cents=150 WHERE id=$1",
    [space.bookingId],
  );
  const payment = await pool.query<{ id: string }>(
    "UPDATE financial_payments SET commercial_plan='LIBERTE',public_amount_cents=3000,commission_cents=150,stripe_fee_cents=70,organization_net_cents=2850,status='RECONCILED',paid_at=now(),reconciled_at=now(),payment_reference='pi_administration_test' WHERE booking_id=$1 RETURNING id",
    [space.bookingId],
  );
  const commission = payment.rows[0]?.id;
  if (!commission) throw Error('Financial test payment required');
  await pool.query(
    'UPDATE organization_access SET stripe_customer_id=$2 WHERE organization_id=$1',
    [space.organizationId, `cus_${crypto.randomUUID()}`],
  );
  await pool.query(
    "INSERT INTO financial_entries(organization_id,booking_id,source_key,kind,amount_cents,reference) VALUES($1,$2,$3,'PAYMENT',3000,'pi_administration_test'),($1,$2,$4,'ADJUSTMENT',-70,'txn_administration_test'),($1,NULL,$5,'SUBSCRIPTION',2900,'in_administration_test')",
    [
      space.organizationId,
      space.bookingId,
      `paid:${crypto.randomUUID()}`,
      `stripe-fee:${crypto.randomUUID()}`,
      `subscription:${crypto.randomUUID()}`,
    ],
  );
  const credit = await pool.query<{ id: string }>(
    "INSERT INTO financial_entries(organization_id,booking_id,source_key,kind,amount_cents,reference) VALUES($1,$2,$3,'ADJUSTMENT',40,'re_commission_test') RETURNING id",
    [space.organizationId, space.bookingId, `commission-refund:${crypto.randomUUID()}`],
  );
  return { ...space, commission, credit: credit.rows[0]?.id };
}
