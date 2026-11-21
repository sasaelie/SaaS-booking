import { EMBED, EMBED_COLORS as C } from './share-labels';
export const EMBED_MATERIAL = {
  ROOT: 'position:relative;display:block;min-width:0;',
  PANEL: 'position:relative;min-width:0;min-height:320px;',
  STATUS: `display:grid;gap:16px;padding:24px;border:1px solid ${C.LIGHT};border-radius:22px;background:${C.PAPER};color:${C.INK};font:14px/1.6 system-ui;`,
  TEXT: 'margin:0;',
  ACTIONS: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;',
  RETRY: `border:1px solid ${C.LIGHT};border-radius:${EMBED.BUTTON_RADIUS};background:${C.PAPER};color:${C.INK};padding:10px 16px;min-height:44px;font:600 14px system-ui;cursor:pointer;box-shadow:0 4px 12px -8px ${C.SHADOW};`,
  LINK: 'display:inline-flex;align-items:center;min-height:44px;color:inherit;font:14px/1.5 system-ui;text-underline-offset:3px;',
  FRAME: `display:block;position:absolute;inset:0 auto auto 0;width:100%;border:0;height:${EMBED.INITIAL_HEIGHT}px;opacity:0;pointer-events:none;`,
  OPEN: `position:fixed;bottom:24px;right:24px;z-index:2147483000;border:1px solid ${C.LIGHT};border-radius:${EMBED.BUTTON_RADIUS};padding:16px 24px;background:${C.PAPER};color:${C.INK};box-shadow:inset 0 1px 0 ${C.LIGHT},0 8px 24px -12px ${C.SHADOW};-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);font:600 15px system-ui;cursor:pointer;`,
  DIALOG: `border:1px solid ${C.LIGHT};border-radius:22px;padding:12px;width:min(1120px,calc(100vw - 32px));max-height:90vh;overflow:hidden;background:${C.SCENE};color:${C.INK};box-shadow:inset 0 1px 0 ${C.LIGHT},0 30px 60px -30px ${C.SHADOW};`,
  CLOSE: `display:block;margin:0 0 8px auto;border:0;border-radius:${EMBED.BUTTON_RADIUS};background:transparent;color:${C.INK};padding:10px;min-height:44px;font:14px system-ui;cursor:pointer;`,
} as const;
