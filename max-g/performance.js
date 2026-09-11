/** An original, wordless synthetic hum. No recordings, TTS, models or network. */
const TEMPO=108,BEAT=60/TEMPO,LEAD=.12,TAIL=.42;
// Original two-phrase melody, written for MAX-G. MIDI note and beat length.
const NOTES=Object.freeze([[60,1],[64,.5],[67,1],[69,.5],[67,1],[64,1],[62,.75],[64,.25],[60,2],
  [55,1],[60,.5],[62,.5],[64,1],[67,1],[64,1],[62,1],[60,2]].map(Object.freeze));
const BEATS=NOTES.reduce((sum,note)=>sum+note[1],0);
export const PERFORMANCE_INFO=Object.freeze({title:'Orbit hello',kind:'original wordless tune',
  description:'An original wordless tune with a soft synthesized hum, made on this device.',
  tempo:TEMPO,beats:BEATS,duration:LEAD+BEATS*BEAT+TAIL,lyrics:null});
export const supported=()=>Boolean((globalThis.AudioContext||globalThis.webkitAudioContext)&&globalThis.Worker);
const aborted=()=>new DOMException('MAX-G’s tune was stopped.','AbortError');
const safely=(callback,...args)=>{try{callback?.(...args);}catch{/* A display callback must never leave audio running. */}};
const frequency=midi=>440*2**((midi-69)/12);

/** Deterministic, bounded PCM synthesis, also usable with OfflineAudioContext. */
export function renderSong(sampleRate=24000) {
  if(!Number.isInteger(sampleRate)||sampleRate<16000||sampleRate>48000)throw new RangeError('Use a sample rate between 16 and 48 kHz.');
  const samples=new Float32Array(Math.ceil(PERFORMANCE_INFO.duration*sampleRate));
  let beat=0,random=0x4d415847,breath=0;
  for(const [midi,beats] of NOTES) {
    const start=LEAD+beat*BEAT,length=beats*BEAT-.04,base=frequency(midi);
    const harmonics=Array.from({length:12},(_,index)=>{
      const n=index+1,hz=base*n;
      // A soft source/filter approximation of closed-mouth vocal resonance.
      return (.75*Math.exp(-.5*((hz-340)/280)**2)+.3*Math.exp(-.5*((hz-1100)/230)**2)
        +.13*Math.exp(-.5*((hz-2400)/500)**2)+.2/n)/n;
    });
    const normalization=harmonics.reduce((sum,value)=>sum+value,0);
    let phase=0;
    for(let frame=0;frame<Math.floor(length*sampleRate);frame++) {
      const time=frame/sampleRate,position=Math.floor(start*sampleRate)+frame;
      const attack=Math.sin(Math.PI/2*Math.min(1,time/.035))**2;
      const release=Math.sin(Math.PI/2*Math.min(1,(length-time)/.085))**2;
      const vibrato=2**((9*Math.min(1,time/.24)*Math.sin(2*Math.PI*5.2*time))/1200);
      phase+=2*Math.PI*base*vibrato/sampleRate;
      let tone=0;
      for(let n=1;n<=harmonics.length;n++)tone+=Math.sin(n*phase)*harmonics[n-1];
      random=(Math.imul(random,1664525)+1013904223)>>>0;
      breath=.87*breath+.13*(random/2147483648-1);
      samples[position]+=attack*release*(tone/normalization*.48+breath*.018)*(1-.045*Math.cos(2*Math.PI*2.3*time));
    }
    beat+=beats;
  }
  // Very quiet fixed echoes soften the room; they never feed back or grow.
  const dry=samples.slice();
  for(const [delay,amount] of [[.105,.11],[.213,.065],[.331,.025]]) {
    const offset=Math.round(delay*sampleRate);
    for(let frame=offset;frame<samples.length;frame++)samples[frame]+=dry[frame-offset]*amount;
  }
  let peak=0;
  for(const value of samples)peak=Math.max(peak,Math.abs(value));
  const gain=peak>.42?.42/peak:1;
  for(let frame=0;frame<samples.length;frame++)samples[frame]*=gain;
  return {samples,sampleRate,...PERFORMANCE_INFO};
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

  performSong({onStart,onEnd,onLevel,onStatus,signal}={}) {
    if(signal?.aborted)return Promise.reject(aborted());
    if(this.document?.hidden)return Promise.reject(new Error('Open MAX-G’s window before playing the tune.'));
    if(!this.canStart())return Promise.reject(new Error('Tap Sing or press Enter in MAX-G to start the tune.'));
    this.stop('replaced');
    let resolve,reject;
    const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
    const run={done:false,context:null,worker:null,nodes:[],source:null,meter:null,deadline:null,close:Promise.resolve()};
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
      safely(onLevel,0);safely(onEnd,{reason,...PERFORMANCE_INFO});
      safely(onStatus,reason==='ended'?'Original wordless tune finished.':reason==='error'?'The tune could not play.':'Tune stopped.');
      const context=run.context;run.context=null;
      try{run.close=context&&context.state!=='closed'?Promise.resolve(context.close()).catch(()=>{}):Promise.resolve();}catch{run.close=Promise.resolve();}
      run.close.then(()=>error?reject(error):resolve({completed:true,...PERFORMANCE_INFO}));
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
      run.context=this.createContext();
      // Resume is invoked synchronously inside the caller's user gesture.
      const context=run.context,unlocked=context.state==='running'?Promise.resolve():context.resume();
      run.deadline=this.timeout(()=>finish('error',new Error('Audio did not start or finish. Tap Sing to try again.')),(PERFORMANCE_INFO.duration+5)*1000);
      safely(onStatus,'Preparing an original wordless tune · no downloads needed.');
      Promise.resolve(unlocked).then(()=>{
        if(run.done)return;
        if(signal?.aborted){abort();return;}
        if(context.state!=='running')throw new Error('Tap Sing again to allow audio playback.');
        return new Promise((ready,failed)=>{
          const worker=this.createWorker();run.worker=worker;
          worker.onerror=()=>failed(new Error('MAX-G’s local tune renderer could not start. Reload the app and try Sing again.'));
          worker.onmessage=({data})=>{
            if(run.done)return;
            if(!(data?.samples instanceof Float32Array)||data.sampleRate!==24000||data.samples.length!==Math.ceil(PERFORMANCE_INFO.duration*24000)){
              failed(new Error('The local tune renderer returned invalid audio.'));return;
            }
            worker.terminate();run.worker=null;ready(data);
          };
          worker.postMessage({type:'render'});
        });
      }).then(data=>{
        if(run.done)return;
        const {samples,sampleRate}=data;
        const buffer=context.createBuffer(1,samples.length,sampleRate);buffer.copyToChannel(samples,0);
        const source=context.createBufferSource();run.source=source;run.nodes.push(source);source.buffer=buffer;
        const volume=context.createGain();run.nodes.push(volume);volume.gain.value=.7;
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
        safely(onStatus,'Playing an original wordless tune · synthesized hum on this device.');
        safely(onStart,{...PERFORMANCE_INFO,startTime:context.currentTime});
      }).catch(error=>finish('error',error));
    }catch(error){finish('error',error);}
    return promise;
  }

  stop(reason='stopped') {return this.active?.finish(reason,aborted())||Promise.resolve();}
}

const performance=new SongPerformance();
export const performSong=options=>performance.performSong(options);
export const stop=()=>performance.stop();
