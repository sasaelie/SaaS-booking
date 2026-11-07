// src/lib/__tests__/milestone0.test.ts
import { describe, expect, it } from 'vitest';
import { ERROR_CODES } from '../../config/constants';
import { formatStructuredLog } from '../logger';
import { generateStructuredCommunication } from '../modulo97';
import { ok } from '../result';
describe('Jalon 0 — Vérification des fondations', () => {
  it('formate les logs strictement selon [Module :: fonction] cause | reçu | attendu', () => {
    const log = formatStructuredLog({
      module: 'BookingService',
      fn: 'reserveSeat',
      cause: 'Séance complète',
      received: 0,
      expected: 'au moins 1 place disponible',
    });
    expect(log).toBe(
      '[BookingService :: reserveSeat] Séance complète | reçu: 0 | attendu: au moins 1 place disponible',
    );
  });
  it('génère une communication structurée belge Modulo 97 valide', () => {
    expect(generateStructuredCommunication(1234567890)).toEqual(
      ok('+++123/4567/89002+++'),
    );
  });
  it('remplace le reste 0 par 97 selon la norme bancaire belge', () => {
    expect(generateStructuredCommunication(97)).toEqual(
      ok('+++000/0000/09797+++'),
    );
  });
  it('rejette un numéro invalide avec un Result typé sans lever d’exception', () => {
    const res = generateStructuredCommunication(-5);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
  });
});
