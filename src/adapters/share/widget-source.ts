import { EMBED, SHARE_UI, EMBED_COLORS } from '../../config/constants';
export function widgetSource() {
  return `(()=>{
 const script=document.currentScript;if(!script)return;
 const organization=script.dataset.organization,activity=script.dataset.activity;
 if(!organization||!/^[a-z0-9-]+$/.test(organization)||(activity!==undefined&&!/^[a-f0-9-]{36}$/.test(activity)))return;
 const origin=new URL(script.src).origin;
 const floating=script.dataset.mode==='floating';
 const frame=document.createElement('iframe');frame.src=origin+'/embed/'+organization+(activity?'/'+activity:'');
 frame.title=${JSON.stringify(SHARE_UI.IFRAME_TITLE)};frame.referrerPolicy='no-referrer';frame.loading='lazy';
 frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox');
 frame.style.cssText='display:block;width:100%;border:0;height:${EMBED.INITIAL_HEIGHT}px;';
 let finish=()=>{window.scrollTo(0,0);document.querySelector('header a,header button')?.focus({preventScroll:true});};
 function resize(event){if(event.origin!==origin||event.source!==frame.contentWindow)return;
 if(event.data?.type===${JSON.stringify(EMBED.RETURN_TYPE)}){finish();return;}
 if(floating)return;
 if(event.data?.type!==${JSON.stringify(EMBED.RESIZE_TYPE)})return;
 const height=event.data.height;if(typeof height==='number'&&Number.isFinite(height)&&height>=${EMBED.MIN_HEIGHT}&&height<=${EMBED.MAX_HEIGHT})frame.style.height=Math.ceil(height)+'px';}
 window.addEventListener('message',resize);
 if(!floating){script.insertAdjacentElement('afterend',frame);return;}
 frame.style.height=${JSON.stringify(EMBED.FLOATING_HEIGHT)};
 const open=document.createElement('button');open.type='button';open.textContent=${JSON.stringify(SHARE_UI.BUTTON)};
 open.style.cssText='position:fixed;bottom:24px;right:24px;z-index:2147483000;border:1px solid ${EMBED_COLORS.LIGHT};border-radius:${EMBED.BUTTON_RADIUS};padding:16px 24px;background:${EMBED_COLORS.PAPER};color:${EMBED_COLORS.INK};box-shadow:inset 0 1px 0 ${EMBED_COLORS.LIGHT},0 8px 24px -12px ${EMBED_COLORS.SHADOW};-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);font:600 15px system-ui;cursor:pointer';
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label',${JSON.stringify(SHARE_UI.IFRAME_TITLE)});
 dialog.style.cssText='border:1px solid ${EMBED_COLORS.LIGHT};border-radius:22px;padding:12px;width:min(1120px,calc(100vw - 32px));max-height:90vh;overflow:hidden;background:${EMBED_COLORS.SCENE};color:${EMBED_COLORS.INK};box-shadow:inset 0 1px 0 ${EMBED_COLORS.LIGHT},0 30px 60px -30px ${EMBED_COLORS.SHADOW}';
 const close=document.createElement('button');close.type='button';close.textContent=${JSON.stringify(SHARE_UI.CLOSE)};
 close.style.cssText='display:block;margin:0 0 8px auto;border:0;border-radius:${EMBED.BUTTON_RADIUS};background:transparent;color:${EMBED_COLORS.INK};padding:10px;min-height:44px;font:14px system-ui;cursor:pointer';
 close.onclick=()=>dialog.close();dialog.append(close,frame);document.body.append(open,dialog);
 finish=()=>{dialog.close();open.focus();};
 open.onclick=()=>{dialog.showModal();frame.loading='eager';};
})();`;
}
