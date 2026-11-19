import { SESSION_NAVIGATION as UI } from '../config/session-navigation';
import { isWebsitePreviewFrame } from '../config/website-preview';
export function isSessionEntryPath(path: string) {
  return UI.ENTRY_PATHS.some((entry) => entry === path);
}
export function isSessionNavigationPath(path: string) {
  return (
    isSessionEntryPath(path) ||
    UI.PRIVATE_ROOTS.some((root) => path === root || path.startsWith(`${root}/`)) ||
    isWebsitePreviewFrame(path)
  );
}
