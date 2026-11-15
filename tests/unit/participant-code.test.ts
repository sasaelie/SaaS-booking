import { describe, expect, it } from 'vitest';
import {
  participantCode,
  matchesParticipantCode,
  participantCredentialId,
} from '../../src/adapters/participant/code';
describe('client code cryptographic domain isolation', () => {
  const row = {
    id: crypto.randomUUID(),
    organizationId: crypto.randomUUID(),
    bookingId: crypto.randomUUID(),
    version: 0,
  };
  const secret = 'test-secret-for-participant-code-32-characters';
  it('reconstructs the same code without storing a bearer secret in the database', () => {
    const code = participantCode(row, secret);
    expect(participantCredentialId(code)).toBe(row.id);
    expect(matchesParticipantCode(code, row, secret)).toBe(true);
    expect(
      matchesParticipantCode(code, { ...row, organizationId: crypto.randomUUID() }, secret),
    ).toBe(false);
    expect(matchesParticipantCode(code, { ...row, version: 1 }, secret)).toBe(false);
  });
  it('rejects real/test crossings and a different signing key', () => {
    const code = participantCode(row, secret, true);
    expect(matchesParticipantCode(code, row, secret, true)).toBe(true);
    expect(matchesParticipantCode(code, row, secret)).toBe(false);
    expect(matchesParticipantCode(code, row, secret + '-other', true)).toBe(false);
  });
});
