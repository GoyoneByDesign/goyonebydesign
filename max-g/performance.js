/** Original device-local music. Each play owns its audio context and worker. */
import {composePerformance,renderComposition} from './music-composer.js';
export const PERFORMANCE_INFO=composePerformance({kind:'sing',seed:1});
export const supported=()=>Boolean((globalThis.AudioContext||globalThis.webkitAudioContext)&&globalThis.Worker);
const aborted=()=>new DOMException('MAX-G’s music was stopped.','AbortError');
const safely=(callback,...args)=>{try{callback?.(...args);}catch{/* UI callbacks cannot prevent audio cleanup. */}};
let sequence=0;
export function renderSong(sampleRate=24000,{kind='sing',seed=1}={}){
  const composition=composePerformance({kind,seed});
  return {...composition,samples:renderComposition(composition,sampleRate),sampleRate};
}

/** Each performance owns and closes its audio context; nothing remains idle. */
export class SongPerformance {
  constructor({createContext=()=>{
    const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Context)throw new Error('This browser cannot play MAX-G’s local tune.');
    return new Context({latencyHint:'interactive'});
  },createWorker=()=>new Worker(new URL('./performance-worker.js',import.meta.url),{type:'module'}),document=globalThis.document,page=globalThis,
  canStart=()=>globalThis.navigator?.userActivation?.isActive!==false,
  setInterval:interval=(callback,ms)=>globalThis.setInterval(callback,ms),clearInterval:clear=timer=>globalThis.clearInterval(timer),
  setTimeout:timeout=(callback,ms)=>globalThis.setTimeout(callback,ms),clearTimeout:clearTimeoutFn=timer=>globalThis.clearTimeout(timer)}={}) {
    Object.assign(this,{createContext,createWorker,document,page,canStart,interval,clear,timeout,clearTimeoutFn});
    this.active=null;
  }

  performSong({kind='sing',seed=(++sequence)>>>0,onStart,onEnd,onLevel,onStatus,signal}={}) {
    let composition;try{composition=composePerformance({kind,seed});}catch(error){return Promise.reject(error);}
    const {events,...info}=composition;
    if(signal?.aborted)return Promise.reject(aborted());
    if(this.document?.hidden)return Promise.reject(new Error('Open MAX-G’s window before playing the tune.'));
    if(!this.canStart())return Promise.reject(new Error('Tap Sing or Dance, or press Enter in MAX-G, to start the music.'));
    this.stop('replaced');
    let resolve,reject;
    const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
    const run={done:false,context:null,worker:null,nodes:[],source:null,meter:null,deadline:null,session:null,previousSession:null,close:Promise.resolve()};
    this.active=run;
    const finish=(reason,error)=>{
      if(run.done)return run.close;
      run.done=true;this.clear(run.meter);this.clearTimeoutFn(run.deadline);
      signal?.removeEventListener('abort',abort);
      this.document?.removeEventListener?.('visibilitychange',visibility);
      this.page?.removeEventListener?.('pagehide',pagehide);
      if(run.worker){run.worker.terminate();run.worker=null;}
      if(run.source){run.source.onended=null;try{run.source.stop();}catch{}}
      for(const node of run.nodes){try{node.disconnect();}catch{}}
      run.nodes.length=0;run.source=null;
      if(this.active===run)this.active=null;
      safely(onLevel,0);safely(onEnd,{reason,...info});
      safely(onStatus,reason==='ended'?`Finished: ${info.title}.`:reason==='error'?'Music could not play. Open Sound help to test this device.':'Music stopped.');
      try{if(run.session&&run.session.type==='playback')run.session.type=run.previousSession;}catch{}
      const context=run.context;run.context=null;
      // Nodes are already stopped/disconnected. A browser's stalled close promise
      // must not hold Stop or the next performance hostage.
      try{if(context&&context.state!=='closed')Promise.resolve(context.close()).catch(()=>{});}catch{}
      run.close=Promise.resolve();
      error?reject(error):resolve({completed:reason==='ended',...info});
      return run.close;
    };
    const abort=()=>finish('aborted',aborted());
    const visibility=()=>{if(this.document?.hidden)finish('hidden',aborted());};
    const pagehide=()=>finish('hidden',aborted());
    run.finish=finish;
    signal?.addEventListener('abort',abort,{once:true});
    this.document?.addEventListener?.('visibilitychange',visibility);
    this.page?.addEventListener?.('pagehide',pagehide);
    try {
      // iOS playback sessions help music use media volume, including Silent Mode.
      try{const session=this.page.navigator?.audioSession;if(session&&typeof session.type==='string'&&session.type!=='playback'){run.previousSession=session.type;session.type='playback';if(session.type==='playback')run.session=session;}}catch{}
      run.context=this.createContext();
      // Resume is invoked synchronously inside the caller's user gesture.
      const context=run.context,unlocked=context.state==='running'?Promise.resolve():context.resume();
      run.deadline=this.timeout(()=>finish('error',new Error('Audio did not start or finish. Tap Sing or Dance to try again.')),(info.duration+15)*1000);
      safely(onStatus,kind==='dance'?'Making a hip-hop beat on this device…':'Composing a new song on this device…');
      Promise.resolve(unlocked).then(()=>{
        if(run.done)return;
        if(signal?.aborted){abort();return;}
        if(context.state!=='running')throw new Error('Tap Sing or Dance again to allow audio playback.');
        return new Promise((ready,failed)=>{
          const worker=this.createWorker();run.worker=worker;
          worker.onerror=()=>failed(new Error('MAX-G’s local tune renderer could not start. Reload the app and try again.'));
          worker.onmessage=({data})=>{
            if(run.done)return;
            if(typeof data?.error==='string'){failed(new Error('Music renderer: '+data.error.slice(0,250)));return;}
            if(!(data?.samples instanceof Float32Array)||data.sampleRate!==24000||data.id!==info.id||data.samples.length!==Math.ceil(info.duration*24000)||data.samples.some(value=>!Number.isFinite(value)||Math.abs(value)>.701)){
              failed(new Error('The local tune renderer returned invalid audio.'));return;
            }
            worker.terminate();run.worker=null;ready(data);
          };
          worker.postMessage({type:'render',kind,seed});
        });
      }).then(data=>{
        if(run.done)return;
        const {samples,sampleRate}=data;
        const buffer=context.createBuffer(1,samples.length,sampleRate);buffer.copyToChannel(samples,0);
        const source=context.createBufferSource();run.source=source;run.nodes.push(source);source.buffer=buffer;
        const volume=context.createGain();run.nodes.push(volume);volume.gain.value=.65;
        const analyser=context.createAnalyser();run.nodes.push(analyser);analyser.fftSize=256;
        source.connect(volume).connect(analyser).connect(context.destination);
        source.onended=()=>finish('ended');
        const wave=new Float32Array(analyser.fftSize);
        run.meter=this.interval(()=>{
          if(run.done)return;
          try{analyser.getFloatTimeDomainData(wave);let sum=0;for(const value of wave)sum+=value*value;safely(onLevel,Math.min(1,Math.sqrt(sum/wave.length)*5));}
          catch{finish('error',new Error('The audio device stopped responding.'));}
        },60);
        source.start();
        safely(onStatus,`${kind==='dance'?'Hip-hop dance':'Singing'} · ${info.title}`);
        safely(onStart,{...info,startTime:context.currentTime});
      }).catch(error=>finish('error',error));
    }catch(error){finish('error',error);}
    return promise;
  }

  stop(reason='stopped') {return this.active?.finish(reason,aborted())||Promise.resolve();}
}

const performance=new SongPerformance();
export const performSong=options=>performance.performSong(options);
export const performDance=options=>performance.performSong({...options,kind:'dance'});
export const stop=()=>performance.stop();
