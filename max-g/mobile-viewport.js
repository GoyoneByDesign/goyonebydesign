/** Keep the composer inside Safari's visible viewport while its keyboard is open.
 * Pinch zoom retains the browser's normal layout; no focus or scroll is forced.
 */
export function keyboardViewport({height,offsetTop=0,scale=1,layoutHeight,editable=false}={}){
 const valid=Number.isFinite(height)&&height>0&&Number.isFinite(layoutHeight)&&layoutHeight>0;
 const active=Boolean(valid&&editable&&Math.abs(scale-1)<.06&&layoutHeight-height>100);
 return {active,height:active?Math.round(height):null,top:active?Math.max(0,Math.round(Number(offsetTop)||0)):0};
}
export function isTextEntry(element){
 if(!element)return false;
 if(element.isContentEditable)return true;
 if(element.tagName==='TEXTAREA')return !element.disabled&&!element.readOnly;
 return element.tagName==='INPUT'&&!element.disabled&&!element.readOnly&&!['button','submit','reset','checkbox','radio','range','file','color','hidden'].includes(element.type);
}
/** iPad can identify as a desktop Mac; touch capability disambiguates it.
 * The fallback is only for installed Apple web apps, never ordinary desktops.
 */
export function appleInstalledDevice(nav={},match=()=>({matches:false})){
 let installed=Boolean(nav.standalone);try{installed ||= Boolean(match('(display-mode: standalone)').matches);}catch{}
 if(!installed)return '';
 const agent=String(nav.userAgent||'');
 if(/iPhone|iPod/.test(agent))return 'phone';
 if(/iPad/.test(agent)||nav.platform==='MacIntel'&&Number(nav.maxTouchPoints)>1)return 'tablet';
 return '';
}
export function installMobileViewport({scope=globalThis,document=globalThis.document}={}){
 const viewport=scope.visualViewport,root=document?.documentElement;
 if(!root)return()=>{};
 const display=scope.matchMedia?.('(display-mode: standalone)');
 const identify=()=>{const device=appleInstalledDevice(scope.navigator,scope.matchMedia?.bind(scope));if(device)root.dataset.maxgIosApp=device;else delete root.dataset.maxgIosApp;};
 identify();display?.addEventListener?.('change',identify);
 const forget=()=>{display?.removeEventListener?.('change',identify);delete root.dataset.maxgIosApp;};
 if(!viewport||!scope.requestAnimationFrame)return forget;
 let frame=null,closed=false;
 const clear=()=>{delete root.dataset.maxgKeyboard;root.style.removeProperty('--maxg-visible-height');root.style.removeProperty('--maxg-visible-top');};
 const update=()=>{
  frame=null;if(closed)return;
  const state=keyboardViewport({height:viewport.height,offsetTop:viewport.offsetTop,scale:viewport.scale,layoutHeight:scope.innerHeight,editable:isTextEntry(document.activeElement)});
  if(!state.active){clear();return;}
  root.dataset.maxgKeyboard='open';root.style.setProperty('--maxg-visible-height',`${state.height}px`);root.style.setProperty('--maxg-visible-top',`${state.top}px`);
 };
 const schedule=()=>{if(!closed&&frame===null)frame=scope.requestAnimationFrame(update);};
 viewport.addEventListener('resize',schedule);viewport.addEventListener('scroll',schedule);
 scope.addEventListener('resize',schedule);document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);
 schedule();
 return()=>{closed=true;if(frame!==null)scope.cancelAnimationFrame(frame);viewport.removeEventListener('resize',schedule);viewport.removeEventListener('scroll',schedule);scope.removeEventListener('resize',schedule);document.removeEventListener('focusin',schedule);document.removeEventListener('focusout',schedule);clear();forget();};
}
