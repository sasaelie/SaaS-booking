import { expect, it } from 'vitest';
import { isSessionEntryPath, isSessionNavigationPath } from '../../src/lib/session-navigation';
it('refreshes account entries and private navigation when returning through history', () => {
  for (const path of [
    '/',
    '/connexion',
    '/inscription',
    '/app',
    '/app/space/activites',
    '/plateforme/operations',
  ])
    expect(isSessionNavigationPath(path)).toBe(true);
  expect(isSessionEntryPath('/')).toBe(true);
  expect(isSessionEntryPath('/app')).toBe(false);
});
it('leaves public participant forms and unrelated paths outside session refreshes', () => {
  for (const path of [
    '/atelier',
    '/atelier/activity',
    '/embed/atelier',
    '/manage',
    '/app-other',
    '/api/auth/get-session',
  ])
    expect(isSessionNavigationPath(path)).toBe(false);
});
