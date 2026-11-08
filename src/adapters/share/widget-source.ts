import { EMBED, SHARE_UI, EMBED_COLORS } from '../../config/constants';
export function widgetSource() {
  return `(()=>{
 const script=document.currentScript;if(!script)return;
 const organization=script.dataset.organization,activity=script.dataset.activity;
 if(!organization||!activity||!/^[a-z0-9-]+$/.test(organization)||!/^[a-f0-9-]{36}$/.test(activity))return;
 const origin=new URL(script.src).origin;
 const frame=document.createElement('iframe');frame.src=origin+'/embed/'+organization+'/'+activity;
 frame.title=${JSON.stringify(SHARE_UI.IFRAME_TITLE)};frame.referrerPolicy='no-referrer';frame.loading='lazy';
 frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
 frame.style.cssText='display:block;width:100%;border:0;height:${EMBED.INITIAL_HEIGHT}px;';
 function resize(event){if(event.origin!==origin||event.source!==frame.contentWindow||event.data?.type!==${JSON.stringify(EMBED.RESIZE_TYPE)})return;
 const height=event.data.height;if(typeof height==='number'&&Number.isFinite(height)&&height>=${EMBED.MIN_HEIGHT}&&height<=${EMBED.MAX_HEIGHT})frame.style.height=Math.ceil(height)+'px';}
 window.addEventListener('message',resize);
 if(script.dataset.mode!=='floating'){script.insertAdjacentElement('afterend',frame);return;}
 const open=document.createElement('button');open.type='button';open.textContent=${JSON.stringify(SHARE_UI.BUTTON)};
 open.style.cssText='position:fixed;bottom:24px;right:24px;z-index:2147483000;border:1px solid ${EMBED_COLORS.LIGHT};border-radius:999px;padding:16px 24px;background:${EMBED_COLORS.PAPER};color:${EMBED_COLORS.INK};box-shadow:inset 0 3px 5px ${EMBED_COLORS.LIGHT},0 8px 24px ${EMBED_COLORS.SHADOW};font:600 15px system-ui;cursor:pointer';
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label',${JSON.stringify(SHARE_UI.IFRAME_TITLE)});
 dialog.style.cssText='border:1px solid ${EMBED_COLORS.LIGHT};border-radius:24px;padding:12px;width:min(1120px,calc(100vw - 32px));max-height:90vh;overflow:auto;background:${EMBED_COLORS.SCENE}';
 const close=document.createElement('button');close.type='button';close.textContent=${JSON.stringify(SHARE_UI.CLOSE)};
 close.style.cssText='display:block;margin:0 0 8px auto;border:0;background:transparent;padding:10px;font:14px system-ui;cursor:pointer';
 close.onclick=()=>dialog.close();dialog.append(close,frame);document.body.append(open,dialog);
 open.onclick=()=>{dialog.showModal();frame.loading='eager';};
})();`;
}
