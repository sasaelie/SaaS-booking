import { expect, it } from 'vitest';
import {
  readPlanIntent,
  planPath,
  planEntryDestination,
  afterOrganizationCreation,
} from '../../src/lib/plan-selection';
it('accepts only the two plan preferences and never treats a URL as a destination', () => {
  expect(readPlanIntent('pro')).toBe('pro');
  expect(readPlanIntent('liberte')).toBe('liberte');
  for (const value of [undefined, null, ['pro'], 'https://evil.example', '//evil.example', 'PRO'])
    expect(readPlanIntent(value)).toBeNull();
  expect(planPath('/connexion', readPlanIntent('https://evil.example'))).toBe('/connexion');
});
it('routes through account and space creation without granting a paid plan', () => {
  expect(planPath('/app', 'pro')).toBe('/app?formule=pro');
  expect(afterOrganizationCreation('space', 'pro')).toBe('/app/space/abonnement?formule=pro');
  expect(afterOrganizationCreation('space', 'liberte')).toBe('/app/space');
  expect(afterOrganizationCreation('space', null)).toBe('/app/space');
});
it('chooses only owned spaces and asks when several owned spaces exist', () => {
  const owner = { id: 'owned', role: 'OWNER' };
  const member = { id: 'foreign-member', role: 'MEMBER' };
  expect(planEntryDestination([], 'pro')).toBe('/app/nouveau?formule=pro');
  expect(planEntryDestination([member], 'pro')).toBe('/app/nouveau?formule=pro');
  expect(planEntryDestination([member, owner], 'pro')).toBe('/app/owned/abonnement?formule=pro');
  expect(planEntryDestination([owner, { ...owner, id: 'second' }], 'pro')).toBeNull();
});
