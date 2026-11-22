export const widgetPresentation = `
 let dialog;
 if(!floating){root.append(panel);description.textContent=T.LOADING;show(retry,false,'inline-flex');show(fallback,false,'inline-flex');
 if('IntersectionObserver'in window){intersection=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){intersection.disconnect();begin();}},{rootMargin:'200px'});intersection.observe(root);}else begin();
 }else{
 frame.style.height=E.FLOATING_HEIGHT;
 const open=document.createElement('button');open.type='button';open.textContent=U.BUTTON;open.style.cssText=S.OPEN;
 dialog=document.createElement('dialog');dialog.setAttribute('aria-label',U.IFRAME_TITLE);dialog.style.cssText=S.DIALOG;
 const close=document.createElement('button');close.type='button';close.textContent=U.CLOSE;close.style.cssText=S.CLOSE;
 close.onclick=()=>dialog.close();
 if(typeof dialog.showModal!=='function'){fallback.textContent=U.BUTTON;fallback.style.cssText=S.OPEN;fallback.style.textDecoration='none';root.append(fallback);}
 else{dialog.append(close,panel);root.append(open,dialog);
 finish=()=>{dialog.close();open.focus();};
 open.onclick=()=>{dialog.showModal();begin();};}}
 const removal=new MutationObserver(()=>{if(root.isConnected||disposed)return;disposed=true;stop();intersection?.disconnect();window.removeEventListener('message',receive);removal.disconnect();if(dialog?.open)dialog.close();});
 removal.observe(document.body,{childList:true,subtree:true});
`;
