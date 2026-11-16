import { sql } from 'drizzle-orm';
import type { Transaction } from '../transaction';
import { rows, required } from '../transaction';
import type { SelfCancelTokenPayload } from '../../../core/validation/self-service';
import type { ParticipantTicket } from '../../../core/validation/participant';
import type { BookingCredential } from '../../../core/ports/participant-access.port';
import { participantCode } from '../../participant/code';
import { QrCodeAdapter } from '../../share/qr-code.adapter';
import { TIME, PARTICIPANT } from '../../../config/constants';
import { SOCIAL_NETWORKS } from '../../../config/service';
interface TicketRow extends BookingCredential, Record<string, unknown> {
  participantName: string;
  endsAt: string;
  startsAt: string;
  sessionCancelled: boolean;
  unitPriceCents: number;
  amountPaidCents: number;
  voucherDiscountCents: number;
  currency: string;
  address: string;
  addressVisibility: string;
  practicalInfo: string;
  socialLinks: Record<string, string>;
}
export async function readParticipantTicket(
  tx: Transaction,
  payload: SelfCancelTokenPayload,
  secret: string,
  appUrl: string,
  test: boolean,
  now: Date,
): Promise<ParticipantTicket | null> {
  const row = await readTicketRow(tx, payload);
  if (!row) return null;
  const code = participantCode(row, secret, test);
  const path = test ? PARTICIPANT.TEST_PATH : '/manage';
  const qr = required(
    await new QrCodeAdapter().encode(`${appUrl}${path}#code=${encodeURIComponent(code)}`),
  );
  const vouchers = await rows<ParticipantTicket['vouchers'][number] & Record<string, unknown>>(
    tx,
    sql`
    SELECT id,code,initial_value_cents AS "valueCents",currency,
      to_char(expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "expiresAtIso",
      CASE WHEN status='ACTIVE' AND expires_at<=${now} THEN 'EXPIRED' ELSE status END AS status
    FROM reschedule_vouchers WHERE origin_booking_id=${payload.bookingId} AND organization_id=${payload.organizationId} ORDER BY created_at`,
  );
  return buildTicket(row, code, qr, test, vouchers, now);
}
async function readTicketRow(tx: Transaction, payload: SelfCancelTokenPayload) {
  const [row] = await rows<TicketRow>(
    tx,
    sql`SELECT c.id,c.organization_id AS "organizationId",
    c.booking_id AS "bookingId",c.version,b.first_name||' '||b.last_name AS "participantName",
    s.starts_at AS "startsAt",s.ends_at AS "endsAt",s.is_cancelled AS "sessionCancelled",
    b.unit_price_cents AS "unitPriceCents",b.amount_paid_cents AS "amountPaidCents",b.voucher_discount_cents AS "voucherDiscountCents",b.currency,
    a.address,a.address_visibility AS "addressVisibility",a.practical_info AS "practicalInfo",o.social_links AS "socialLinks"
    FROM booking_access_credentials c
    JOIN bookings b ON b.id=c.booking_id AND b.organization_id=c.organization_id
    JOIN sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
    JOIN activities a ON a.id=b.activity_id AND a.organization_id=b.organization_id
    JOIN organizations o ON o.id=b.organization_id
    WHERE c.booking_id=${payload.bookingId} AND c.organization_id=${payload.organizationId}`,
  );
  return row;
}
function buildTicket(
  row: TicketRow,
  code: string,
  qr: Uint8Array,
  test: boolean,
  vouchers: readonly ParticipantTicket['vouchers'][number][],
  now: Date,
): ParticipantTicket {
  return {
    code,
    qrDataUrl: `data:image/png;base64,${Buffer.from(qr).toString('base64')}`,
    isSimulation: test,
    participantName: row.participantName,
    endsAtIso: new Date(row.endsAt).toISOString(),
    sessionCancelled: row.sessionCancelled,
    unitPriceCents: row.unitPriceCents,
    amountPaidCents: row.amountPaidCents,
    voucherDiscountCents: row.voucherDiscountCents,
    currency: row.currency,
    address:
      row.addressVisibility === 'PUBLIC' ||
      now.getTime() >= new Date(row.startsAt).getTime() - TIME.DAY_MS
        ? row.address
        : null,
    practicalInfo: row.practicalInfo,
    phone: row.socialLinks['phone'] ?? null,
    socialLinks: publicSocialLinks(row.socialLinks),
    vouchers: [...vouchers],
  };
}
function publicSocialLinks(links: Record<string, string>) {
  return Object.entries(SOCIAL_NETWORKS).flatMap(([key, label]) => {
    try {
      const url = new URL(links[key] ?? '');
      return url.protocol === 'https:' && !url.username && !url.password
        ? [{ label, url: url.href }]
        : [];
    } catch {
      return [];
    }
  });
}
