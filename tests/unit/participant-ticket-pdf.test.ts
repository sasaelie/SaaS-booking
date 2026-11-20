import { expect, it, vi } from 'vitest';
import { ParticipantTicketPdfUseCase } from '../../src/core/use-cases/participant-ticket-pdf.use-case';
import { ok } from '../../src/lib/result';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { TicketPdfAdapter } from '../../src/adapters/participant/ticket-pdf.adapter';
import { ticketDocument } from './participant-ticket-fixtures';
import {
  participantTicketAmounts,
  participantTicketStatus,
} from '../../src/core/domain/participant-ticket';
import { PARTICIPANT_UI } from '../../src/config/constants';
it('keeps the configured tariff in TEST tickets without presenting simulated amounts as real payment', async () => {
  const booking = await ticketDocument();
  const amounts = participantTicketAmounts(booking);
  expect(amounts).toContainEqual({ label: PARTICIPANT_UI.PRICE, value: 2500 });
  expect(amounts).toContainEqual({ label: PARTICIPANT_UI.PAID_TEST, value: 1000 });
  expect(amounts).toContainEqual({ label: PARTICIPANT_UI.DUE_TEST, value: 1000 });
  booking.ticket.isSimulation = false;
  expect(participantTicketAmounts(booking)).toContainEqual({
    label: PARTICIPANT_UI.DUE,
    value: 1000,
  });
});
it('does not render pending or missing ticket data', async () => {
  const render = vi.fn(async () => ok(new Uint8Array()));
  const useCase = new ParticipantTicketPdfUseCase({ render });
  for (const raw of [null, {}, { ticket: null }, { ticket: { code: 'invented' } }])
    expect((await useCase.execute(raw)).ok).toBe(false);
  expect(render).not.toHaveBeenCalled();
});
it('creates a real, readable A4 PDF with an embedded Unicode font and ticket QR', async () => {
  const adapter = new TicketPdfAdapter(
    async () => new Uint8Array(await readFile('public/fonts/DejaVuSans.ttf')),
  );
  const result = await new ParticipantTicketPdfUseCase(adapter).execute(await ticketDocument());
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(new TextDecoder().decode(result.value.subarray(0, 5))).toBe('%PDF-');
  const doc = await PDFDocument.load(result.value);
  expect(doc.getTitle()).toBe('Votre billet');
  expect(doc.getPageCount()).toBe(1);
  expect(doc.getPage(0).getSize()).toEqual({ width: 595.28, height: 841.89 });
  expect(result.value.length).toBeGreaterThan(1000);
});
it('keeps PDF status and financial balances consistent with the on-screen ticket', async () => {
  const booking = await ticketDocument();
  expect(participantTicketStatus(booking, new Date('2030-06-01')).valid).toBe(true);
  expect(participantTicketAmounts(booking).map((amount) => amount.value)).toEqual([
    2500, 1000, 500, 1000,
  ]);
  booking.status = 'CANCELLED_BY_ATTENDEE';
  expect(participantTicketStatus(booking).label).toContain('Réservation annulée');
  expect(participantTicketAmounts(booking).map((amount) => amount.value)).toEqual([
    2500, 1000, 500,
  ]);
  booking.status = 'CONFIRMED';
  expect(participantTicketStatus(booking, new Date('2030-07-01')).label).toContain('Séance passée');
});
it('returns a recoverable failure if PDF preparation cannot load its font', async () => {
  const adapter = new TicketPdfAdapter(async () => {
    throw Error('Font unavailable');
  });
  expect((await new ParticipantTicketPdfUseCase(adapter).execute(await ticketDocument())).ok).toBe(
    false,
  );
});
