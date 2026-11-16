import QRCode from 'qrcode';
import type { ParticipantTicketDocument } from '../../src/core/validation/participant-ticket-pdf';
export async function ticketDocument(): Promise<ParticipantTicketDocument> {
  const code = `TEST-${'A'.repeat(32)}-${'B'.repeat(32)}`;
  return {
    organizationSlug: 'atelier-test',
    organizationName: 'Atelier Écume',
    activityId: crypto.randomUUID(),
    activityName: 'Céramique — découverte',
    startsAtIso: '2030-06-18T12:00:00.000Z',
    timezone: 'Europe/Brussels',
    status: 'CONFIRMED',
    hasProof: false,
    canUploadProof: false,
    canCancel: true,
    ticket: {
      code,
      qrDataUrl: await QRCode.toDataURL(`https://example.invalid/manage#code=${code}`),
      isSimulation: true,
      participantName: 'Élodie D’Haÿ — Анна',
      endsAtIso: '2030-06-18T14:00:00.000Z',
      sessionCancelled: false,
      unitPriceCents: 2500,
      amountPaidCents: 1000,
      voucherDiscountCents: 500,
      currency: 'EUR',
      address: 'Rue de l’Été 12\n1000 Bruxelles',
      practicalInfo: '',
      phone: null,
      socialLinks: [],
      vouchers: [],
    },
  };
}
