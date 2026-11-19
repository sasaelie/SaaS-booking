import { EMBED } from '../../config/constants';
export function websitePreviewBootstrap() {
  return `(()=>{
 const frame=document.getElementById('studio-booking-preview'),header=document.querySelector('body>header');
 const trigger=document.querySelector('button[aria-controls="mobile-menu"]'),dialog=document.getElementById('mobile-menu');
 function headerHeight(){if(header)document.documentElement.style.setProperty('--site-header-height',header.getBoundingClientRect().height+'px');}
 if(header){new ResizeObserver(headerHeight).observe(header);headerHeight();}
 window.addEventListener('message',event=>{
  if(!frame||event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!==${JSON.stringify(EMBED.RESIZE_TYPE)})return;
  const height=event.data.height;if(typeof height==='number'&&Number.isFinite(height)&&height>=${EMBED.MIN_HEIGHT}&&height<=${EMBED.MAX_HEIGHT})frame.style.height=Math.ceil(height)+'px';
 });
 if(trigger&&dialog){
  trigger.addEventListener('click',()=>{dialog.showModal();trigger.setAttribute('aria-expanded','true');});
  dialog.addEventListener('close',()=>{trigger.setAttribute('aria-expanded','false');trigger.focus();});
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.closest('a'))dialog.close();});
  const desktop=matchMedia('(min-width:1024px)');desktop.addEventListener('change',()=>{if(desktop.matches)dialog.close();});
 }
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
})();`;
}
