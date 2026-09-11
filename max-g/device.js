/** Read-only capability inspection. Never captures hardware or contacts a service. */
import {checkWebGPU} from './engine.js';

export const DEVICE_MODES=Object.freeze({auto:'Automatic',compact:'Use less memory',ready:'Keep model ready'});
export const normalizeDeviceMode=value=>Object.hasOwn(DEVICE_MODES,value)?value:'auto';
const attempt=(fn,fallback=null)=>{try{return fn()??fallback;}catch{return fallback;}};
const abort=()=>new DOMException('Device check stopped.','AbortError');
export function deviceHints(nav=globalThis.navigator,scope=globalThis){
  const cores=attempt(()=>nav.hardwareConcurrency),memory=attempt(()=>nav.deviceMemory);
  return {cores:Number.isInteger(cores)&&cores>0?Math.min(cores,256):null,
    memoryGB:Number.isFinite(memory)&&memory>0?memory:null,
    coarse:attempt(()=>scope.matchMedia('(pointer: coarse)').matches,false),
    saveData:attempt(()=>nav.connection.saveData,false),
    online:attempt(()=>nav.onLine)};
}
export function devicePolicy(mode='auto',hints=deviceHints()){
  mode=normalizeDeviceMode(mode);
  const compact=mode==='compact'||mode==='auto'&&(hints.coarse||hints.memoryGB!==null&&hints.memoryGB<=4||hints.cores!==null&&hints.cores<=4);
  return {mode,compact,idleMs:mode==='ready'?0:compact?90000:300000,
    detail:mode==='ready'?'Keep the loaded AI model ready while this page remains open.':`Release the AI model after ${compact?'90 seconds':'5 minutes'} without a task. Cached downloads stay on this device.`};
}
/** Small state machine; callers own the timer and never interrupt active work. */
export class IdleModelPolicy{
  constructor({now=()=>Date.now()}={}){this.now=now;this.touchedAt=now();}
  touch(){this.touchedAt=this.now();}
  due({ready,busy,mode='auto',hints=deviceHints()}={}){if(!ready||busy){this.touch();return false;}const {idleMs}=devicePolicy(mode,hints);return idleMs>0&&this.now()-this.touchedAt>=idleMs;}
}
function bounded(fn,{signal,timeoutMs=5000,fallback=null}={}){
  if(signal?.aborted)return Promise.reject(abort());
  return new Promise((resolve,reject)=>{
    let done=false;const finish=(value,error)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);error?reject(error):resolve(value);};
    const cancel=()=>finish(null,abort()),timer=setTimeout(()=>finish(fallback),timeoutMs);
    signal?.addEventListener('abort',cancel,{once:true});
    Promise.resolve().then(()=>{if(done||signal?.aborted)throw abort();return fn();}).then(value=>finish(value),()=>finish(fallback));
  });
}
export async function inspectDevice({nav=globalThis.navigator,scope=globalThis,secure=globalThis.isSecureContext,
  settings={},runtime={},signal,timeoutMs=5000}={}){
  const hints=deviceHints(nav,scope),policy=devicePolicy(settings.deviceMode,hints),permissions=settings.permissions||{};
  const language=runtime.language||'en-US',Recognition=attempt(()=>scope.SpeechRecognition||scope.webkitSpeechRecognition);
  const localDictation=Boolean(Recognition&&attempt(()=>('processLocally' in Recognition.prototype)&&typeof Recognition.available==='function',false));
  const query=name=>bounded(()=>nav.permissions?.query({name}).then(value=>value.state),{signal,timeoutMs,fallback:'unknown'});
  const [gpu,micAccess,locationAccess,dictation]=await Promise.all([
    bounded(()=>checkWebGPU(nav,secure),{signal,timeoutMs,fallback:{supported:false,unknown:true,reason:'The graphics check did not finish. Try Refresh device check.'}}),
    query('microphone'),query('geolocation'),
    localDictation&&permissions.microphone!=='deny'?bounded(()=>Recognition.available({langs:[language],processLocally:true}),{signal,timeoutMs,fallback:'unknown'}):Promise.resolve('unsupported'),
  ]);
  if(signal?.aborted)throw abort();
  const rows=[],row=(id,label,state,detail,action)=>rows.push({id,label,state,detail,action});
  const gpuDetail=gpu.supported?(gpu.shaderF16?'This device can try the fast 1B GPU model.':'The 1B GPU compatibility model is selected automatically when needed.')+' Actual loading depends on available memory.':gpu.reason;
  row('local-ai','Local AI',runtime.modelReady?'ready':gpu.supported?'available':gpu.unknown?'unknown':'unavailable',runtime.modelReady?`Loaded on this device: ${runtime.modelId}.`:gpuDetail+(!gpu.supported?' Local AI chat needs a supported GPU; calculations and file tools still work.':''),'general');
  const audio=Boolean(attempt(()=>scope.AudioContext||scope.webkitAudioContext)),worker=typeof scope.Worker==='function',wasm=Boolean(scope.WebAssembly);
  row('natural-voice','Natural speaking voice',audio&&worker&&wasm?(runtime.voiceReady?'ready':'setup'):'unavailable',audio&&worker&&wasm?'English neural speech runs on this device’s CPU. First use downloads its voice model; use Sound help to test playback.':'Local neural speech needs Web Audio, WebAssembly and browser workers. Check installed voices as an alternative.','voice');
  const voices=attempt(()=>scope.speechSynthesis.getVoices().filter(v=>v.localService),[]),matching=voices.filter(v=>String(v.lang).toLowerCase().split('-')[0]===language.toLowerCase().split('-')[0]);
  row('installed-voice','Installed speaking voices',matching.length?'available':'setup',matching.length?`${matching.length} local voice${matching.length===1?'':'s'} currently exposed for ${language}. Choose and preview one in Voice Studio.`:'No local voice for the selected language is currently exposed. Your device may load its voice list later; refresh or open Voice Studio.','voice');
  const micBlocked=permissions.microphone==='deny'||micAccess==='denied';
  row('dictation','Voice input',micBlocked?'blocked':dictation==='available'?'available':['downloadable','downloading'].includes(dictation)?'setup':dictation==='unknown'?'unknown':'unavailable',micBlocked?'Microphone access is denied in MAX-G or browser settings.':dictation==='available'?`On-device dictation is available for ${language}. Recording starts only when you tap the microphone.`:['downloadable','downloading'].includes(dictation)?'The on-device language pack needs installation or is downloading. Open Voice Studio.':'This browser does not currently provide verified local dictation for this language. You can type or use your device keyboard’s dictation under its own privacy settings.','voice');
  const recording=secure&&typeof nav.mediaDevices?.getUserMedia==='function'&&typeof scope.MediaRecorder==='function';
  row('microphone','Microphone recording',micBlocked?'blocked':recording?'available':'unavailable',micBlocked?'Microphone access is denied.':recording?'Recording APIs are present; browser permission is requested only when you choose Record. This does not mean local dictation is available.':'Recording APIs are unavailable here. File upload remains an alternative. Voice cloning still requires the Mac companion.','voice');
  const geoBlocked=permissions.location==='deny'||locationAccess==='denied';
  row('location','Places, GPS & directions',geoBlocked?'blocked':secure&&Boolean(nav.geolocation)?'available':'setup',geoBlocked?'Current-location access is denied. Typed places and postal codes remain available.':secure&&nav.geolocation?'Use current location requests this device’s position once, with permission. Typed places and map-app directions are also available.':'Type a place or postal code. Current location needs HTTPS and a supported location API.','locations');
  row('files','Files & app projects',permissions.files==='deny'?'blocked':'available',permissions.files==='deny'?'File access is denied in MAX-G Settings.':typeof scope.showDirectoryPicker==='function'?'Import and download files locally. Writing to a folder requires Full access and a folder you select.':'Import files and download generated projects on this device. Folder writing is unavailable here; use ZIP downloads.','permissions');
  row('internet','This device’s internet',permissions.internet==='deny'?'blocked':hints.online===false?'offline':hints.online===true?'available':'unknown',permissions.internet==='deny'?'MAX-G internet access is denied.':hints.online===false?'The browser reports offline. Cached local features may still work.':'Requests use this device’s connection. The browser’s online report is not a connectivity or speed test.','connection');
  const helper=runtime.companion||{},searchConfigured=Boolean(settings.proxyURL||helper.paired);
  row('web-search','Live web information',permissions.internet==='deny'?'blocked':hints.online===false?'offline':searchConfigured?'setup':'setup',searchConfigured?'A search route is configured; use Test web search to verify it. Weather and places use their own online services.':'Weather and places have direct online tools. General web search needs a search Worker URL or the paired companion on this device.','connection');
  row('offline','Saved data & offline app',runtime.storageOK===false?'blocked':nav.serviceWorker?.controller?'available':'setup',runtime.storageOK===false?'This browser could not save recent changes. Keep this window open and export your notes.':nav.serviceWorker?.controller?'The offline app shell is active. AI and voice need separate cached downloads. Browser storage may be cleared or evicted.':'Offline setup is not confirmed. Visit online and reopen after setup. Private data and downloads stay in this browser.','memory');
  row('companion','Account & desktop automation',helper.connected?'setup':helper.paired?'setup':'unavailable',helper.connected?'The local companion responded. Account authorizations and action permissions still apply; native controls are implemented for Mac.':helper.paired?'A pairing is stored in this tab, but connection is not verified. Refresh Connections on this device.':'Email/cloud account automation, cloned voice and full desktop controls currently require the Mac companion on the same Mac. A website on a phone cannot use another computer’s localhost.','connectors');
  row('device-apps','Calls, messages & music','setup','Open supported calling, messaging, email and music apps through links on this device. You complete the action in that app; availability depends on installed apps.','connectors');
  return {hints,policy,gpu,rows,checkedAt:Date.now()};
}
