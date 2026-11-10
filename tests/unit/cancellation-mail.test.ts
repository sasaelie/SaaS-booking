import { expect, it } from 'vitest';
import { cancellationMessage } from '../../src/core/domain/cancellation-message';
const input = {
  organizationName: 'L’atelier',
  activityName: 'Cours de couture',
  reason: 'Indisponibilité du professeur.\nMerci de votre compréhension.',
  startsAt: new Date('2027-01-01T13:00:00Z'),
  endsAt: new Date('2027-01-01T15:00:00Z'),
  timezone: 'Europe/Brussels',
  refundPending: false,
};
it('includes the exact organizer reason, event and local hours in the cancellation email', () => {
  const text = cancellationMessage(input);
  expect(text).toContain(input.reason);
  expect(text).toContain('Cours de couture');
  expect(text).toContain('14:00');
  expect(text).toContain('16:00');
  expect(text).toContain('Europe/Brussels');
  expect(text).not.toContain('remboursement');
});
it('mentions a refund only when one is actually queued', () => {
  expect(cancellationMessage({ ...input, refundPending: true })).toContain('remboursement');
});
it('keeps legacy cancellations readable when the reason was not recorded', () => {
  expect(cancellationMessage({ ...input, reason: '' })).toContain('Aucun motif complémentaire');
});
