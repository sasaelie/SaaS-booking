import { EMBED, SHARE_UI } from '../../config/constants';
import { EMBED_HEALTH } from '../../config/embed-health';
import { EMBED_MATERIAL } from '../../config/embed-material';
import { widgetSetup } from './widget-setup';
import { widgetHealth } from './widget-health';
import { widgetPresentation } from './widget-presentation';
export function widgetSource() {
  const labels = {
    BUTTON: SHARE_UI.BUTTON,
    CLOSE: SHARE_UI.CLOSE,
    IFRAME_TITLE: SHARE_UI.IFRAME_TITLE,
  };
  return `(()=>{const T=${JSON.stringify(EMBED_HEALTH)},E=${JSON.stringify(EMBED)},S=${JSON.stringify(EMBED_MATERIAL)},U=${JSON.stringify(labels)};${widgetSetup}${widgetHealth}${widgetPresentation}})();`;
}
