/** Independent work sources keep the frame moving until the last operation ends. */
export class ActivityState {
  constructor(onChange=()=>{}, {reducedMotion=false}={}) {
    this.sources=new Set();this.onChange=onChange;this.reducedMotion=reducedMotion===true;this.previous='';
    this.publish();
  }
  get snapshot(){return {processing:this.sources.size>0,reducedMotion:this.reducedMotion};}
  publish(){const value=this.snapshot,key=JSON.stringify(value);if(key!==this.previous){this.previous=key;this.onChange(value);}}
  set(source,busy){if(busy===true)this.sources.add(source);else this.sources.delete(source);this.publish();}
  model(status){this.set('model',['checking','loading','generating'].includes(status));}
  voice(status){this.set('voice',status==='thinking');}
  reduce(value){this.reducedMotion=value===true;this.publish();}
  clear(){this.sources.clear();this.publish();}
}

/** The SVG uses CSS stroke motion, with no per-frame JavaScript or layout polling. */
export function createActivityFrame({document:doc=globalThis.document,window:win=globalThis.window,native=false}={}) {
  const root=doc.documentElement,media=win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let motion=true;
  const activity=new ActivityState(value=>{
    root.dataset.maxgProcessing=String(value.processing);
    root.dataset.maxgReducedMotion=String(value.reducedMotion);
    // Native validates the top frame and local app origin independently. Other
    // web pages and hosted-browser editions never send native activity messages.
    if(native&&root.dataset.maxgNative==='true')try{win.webkit?.messageHandlers?.maxgActivity?.postMessage(value);}catch{}
  },{reducedMotion:media?.matches===true});
  const updateMotion=()=>activity.reduce(!motion||media?.matches===true);
  media?.addEventListener?.('change',updateMotion);
  let frame=null,observer=null;
  if(root.dataset.maxgNative!=='true'){
    const ns='http://www.w3.org/2000/svg';
    frame=doc.createElementNS(ns,'svg');frame.classList.add('maxg-activity-frame');
    frame.setAttribute('aria-hidden','true');frame.setAttribute('focusable','false');
    const rails=['rail','highlight'].map(name=>{
      const rect=doc.createElementNS(ns,'rect');rect.classList.add(`maxg-frame-${name}`);
      for(const [key,value]of Object.entries({x:'3',y:'3',rx:'22',ry:'22',pathLength:'100'}))rect.setAttribute(key,value);
      frame.append(rect);return rect;
    });
    const resize=()=>{
      const bounds=frame.getBoundingClientRect();
      for(const rect of rails){rect.setAttribute('width',String(Math.max(0,bounds.width-6)));rect.setAttribute('height',String(Math.max(0,bounds.height-6)));}
    };
    doc.body.append(frame);resize();
    if(win.ResizeObserver){observer=new win.ResizeObserver(resize);observer.observe(frame);}
    else win.addEventListener('resize',resize);
    frame.cleanup=()=>win.removeEventListener('resize',resize);
  }
  const pagehide=()=>activity.clear();
  win.addEventListener('pagehide',pagehide);
  return {
    set:(source,busy)=>activity.set(source,busy),model:status=>activity.model(status),voice:status=>activity.voice(status),
    setMotion:enabled=>{motion=enabled!==false;updateMotion();},
    clear:()=>activity.clear(),get snapshot(){return activity.snapshot;},
    dispose(){activity.clear();media?.removeEventListener?.('change',updateMotion);win.removeEventListener('pagehide',pagehide);observer?.disconnect();frame?.cleanup();frame?.remove();}
  };
}
