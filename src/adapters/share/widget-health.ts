export const widgetHealth = `
 function show(element,value,display){element.hidden=!value;element.style.display=value?display:'none';}
 function stop(){clearTimeout(timer);clearTimeout(slowTimer);}
 function fail(unavailable=false){
 if(disposed||connected)return;stop();root.dataset.bookingState=unavailable?'unavailable':'failed';
 panel.setAttribute('aria-busy','false');description.textContent=unavailable?T.UNAVAILABLE:T.FAILED;
 show(retry,true,'inline-flex');show(fallback,true,'inline-flex');show(status,true,'grid');}
 function ready(){
 if(disposed||connected)return;connected=true;stop();intersection?.disconnect();
 root.dataset.bookingState='ready';panel.setAttribute('aria-busy','false');panel.style.minHeight='0';
 frame.style.position='static';frame.style.opacity='1';frame.style.pointerEvents='auto';frame.removeAttribute('aria-hidden');frame.removeAttribute('tabindex');frame.inert=false;
 show(retry,false,'inline-flex');show(fallback,false,'inline-flex');description.textContent=T.READY_NOTE;show(status,diagnostic,'grid');}
 function begin(){
 if(disposed||started||connected)return;started=true;root.dataset.bookingState='loading';
 panel.setAttribute('aria-busy','true');description.textContent=T.LOADING;show(retry,false,'inline-flex');show(fallback,false,'inline-flex');show(status,true,'grid');
 frame.loading='eager';frame.src=source;
 slowTimer=setTimeout(()=>{if(!connected&&!disposed){description.textContent=T.SLOW;show(fallback,true,'inline-flex');}},T.SLOW_MS);
 timer=setTimeout(()=>fail(),T.TIMEOUT_MS);}
 function receive(event){
 if(disposed||!frame.contentWindow||event.origin!==origin||event.source!==frame.contentWindow||!event.data||typeof event.data!=='object')return;
 const data=event.data;
 if(data.type===T.READY&&data.version===T.VERSION){
 if(Object.keys(data).some(key=>!['type','version','status'].includes(key)))return;
 if(data.status==='ready')ready();else if(data.status==='unavailable')fail(true);return;}
 if(data.type===E.RETURN_TYPE&&connected){finish();return;}
 if(data.type!==E.RESIZE_TYPE)return;
 const height=data.height;if(typeof height!=='number'||!Number.isFinite(height)||height<E.MIN_HEIGHT||height>E.MAX_HEIGHT)return;
 if(!floating)frame.style.height=Math.ceil(height)+'px';
 if(!connected)frame.contentWindow.postMessage({type:T.PING,version:T.VERSION},origin);}
 retry.onclick=()=>{if(connected||root.dataset.bookingState==='loading')return;stop();started=false;begin();};
 frame.addEventListener('error',()=>fail());window.addEventListener('message',receive);
`;
