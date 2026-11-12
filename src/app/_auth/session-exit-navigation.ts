import { SESSION_EXIT } from '../../config/session-exit';
export function rememberExitSource(path: string) {
  try {
    if (path === '/app') sessionStorage.setItem(SESSION_EXIT.SOURCE_KEY, 'true');
    else sessionStorage.removeItem(SESSION_EXIT.SOURCE_KEY);
  } catch {
    /* La confirmation du lien Retour reste disponible sans stockage navigateur. */
  }
}
export function shouldConfirmHistoryExit(previous: string) {
  if (window.location.pathname !== '/') return false;
  let fromSpaces = previous === '/app';
  try {
    fromSpaces ||= sessionStorage.getItem(SESSION_EXIT.SOURCE_KEY) === 'true';
    sessionStorage.removeItem(SESSION_EXIT.SOURCE_KEY);
  } catch {
    /* L’historique dans le même document utilise aussi le chemin précédent. */
  }
  return fromSpaces;
}
export function wasHistoryNavigation() {
  const entry = performance.getEntriesByType('navigation')[0];
  return Boolean(entry && 'type' in entry && entry.type === 'back_forward');
}
