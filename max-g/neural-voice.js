import {sentenceChunks,deliveryControls} from './voice-config.js';
const abortError=()=>new DOMException('Voice stopped.','AbortError');
/** Bounded sentence synthesis and playback, with one sentence of lookahead. */
export class NeuralVoice {
  constructor({onState=()=>{},onProgress=()=>{},onLevel=()=>{}}={}) {
    Object.assign(this,{onState,onProgress,onLevel});
    this.worker=null;this.ready=false;this.pending=new Map();this.counter=0;this.epoch=0;
    this.context=null;this.current=null;this.playback=null;this.timer=null;
  }
  create() {
    if(this.worker)return;
    const worker=new Worker(new URL('./voice-worker.js',import.meta.url),{type:'module'});this.worker=worker;
    worker.onmessage=({data})=>{
      if(this.worker!==worker)return;
      const request=this.pending.get(data.id);if(!request)return;
      if(data.type==='progress'){this.onProgress(data.text);return;}
      clearTimeout(request.timer);this.pending.delete(data.id);
      if(data.type==='error')request.reject(new Error('Neural voice: '+data.message));else request.resolve(data);
    };
    worker.onerror=()=>{if(this.worker===worker)this.unload(new Error('The neural voice runtime could not start. Check the connection for its first download, then retry.'));};
  }
  request(type,body={}) {
    this.create();const id=++this.counter;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>this.unload(new Error('Neural voice took too long on this device. Retry a shorter sentence.')),type==='load'?240000:120000);
      this.pending.set(id,{resolve,reject,timer});
      try{this.worker.postMessage({id,type,...body});}catch(error){clearTimeout(timer);this.pending.delete(id);reject(error);}
    });
  }
  async load({signal}={}) {
    if(signal?.aborted)throw abortError();if(this.ready)return;
    const epoch=this.epoch,abort=()=>{if(epoch===this.epoch)this.unload();};
    signal?.addEventListener('abort',abort,{once:true});
    try {
      this.onProgress('Preparing natural voice · first download may take a few minutes');
      if(signal?.aborted||epoch!==this.epoch)throw abortError();
      await this.request('load');
      if(signal?.aborted||epoch!==this.epoch)throw abortError();
      this.ready=true;this.onProgress('Natural voice ready on this device');
    } finally {signal?.removeEventListener('abort',abort);}
  }
  async unlock() {
    if(!this.context||this.context.state==='closed') {
      const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!Context)throw new Error('This browser cannot play local neural audio.');this.context=new Context();
    }
    if(this.context.state==='suspended')await this.context.resume();
  }
  retireWorker(error) {
    this.worker?.terminate();this.worker=null;this.ready=false;
    for(const task of this.pending.values()){clearTimeout(task.timer);task.reject(error);}this.pending.clear();
  }
  stop() {
    this.epoch++;this.playback?.cancel();
    if(this.pending.size)this.retireWorker(abortError());
    this.onLevel(0);this.onState('idle');
  }
  unload(error=abortError()) {
    this.epoch++;this.playback?.cancel();this.retireWorker(error);
    const context=this.context;this.context=null;
    if(context&&context.state!=='closed'){try{Promise.resolve(context.close()).catch(()=>{});}catch{}}
    this.onLevel(0);this.onState('idle');
  }
  async play(samples,sampleRate,controls,{signal,epoch=this.epoch}={}) {
    const verify=()=>{if(signal?.aborted||epoch!==this.epoch)throw abortError();};
    verify();await this.unlock();verify();
    // Each playback owns its nodes and meter. A late native `ended` event cannot
    // settle or clear the meter of the next sentence (including after Stop).
    this.playback?.cancel();
    const ctx=this.context,nodes=[];
    await new Promise((resolve,reject)=>{
      let done=false,timer=null,source=null;
      const playback={cancel:()=>finish(abortError(),true)};
      const finish=(error,stopSource=false)=>{
        if(done)return;done=true;signal?.removeEventListener('abort',abort);clearInterval(timer);
        if(source){source.onended=null;if(stopSource){try{source.stop();}catch{}}}
        for(const node of nodes){try{node.disconnect();}catch{}}
        if(this.playback===playback){this.playback=null;this.current=null;this.timer=null;this.onLevel(0);}
        error?reject(error):resolve();
      };
      const abort=()=>finish(abortError(),true);
      try {
        const buffer=ctx.createBuffer(1,samples.length,sampleRate);buffer.copyToChannel(samples,0);
        source=ctx.createBufferSource();nodes.push(source);
        const tone=ctx.createBiquadFilter();nodes.push(tone);
        const gain=ctx.createGain();nodes.push(gain);
        const analyser=ctx.createAnalyser();nodes.push(analyser);
        source.buffer=buffer;source.detune.value=controls.pitch*100;
        tone.type='lowshelf';tone.frequency.value=220;tone.gain.value=controls.depth;gain.gain.value=.84;analyser.fftSize=256;
        source.connect(tone).connect(gain).connect(analyser).connect(ctx.destination);
        this.playback=playback;this.current=source;
        source.onended=()=>finish(signal?.aborted||epoch!==this.epoch?abortError():null);
        signal?.addEventListener('abort',abort,{once:true});verify();
        const wave=new Float32Array(analyser.fftSize);
        timer=setInterval(()=>{
          if(this.playback!==playback)return;
          analyser.getFloatTimeDomainData(wave);
          this.onLevel(Math.min(1,Math.sqrt(wave.reduce((n,x)=>n+x*x,0)/wave.length)*5));
        },80);this.timer=timer;
        source.start();this.onState('speaking');
      } catch(error) {finish(error,true);}
    });
  }
  async speak(text,{signal,neuralVoice='af_heart',...options}={}) {
    this.stop();const epoch=this.epoch;
    const verify=()=>{if(signal?.aborted||epoch!==this.epoch)throw abortError();};
    verify();await this.unlock();verify();await this.load({signal});verify();
    const controls=deliveryControls(options),chunks=sentenceChunks(text);
    const generate=chunk=>this.request('generate',{text:chunk,voice:neuralVoice,speed:controls.speed});
    const abort=()=>{if(epoch===this.epoch)this.stop();};signal?.addEventListener('abort',abort,{once:true});
    try {
      verify();let next=chunks.length?generate(chunks[0]):null;
      for(let i=0;i<chunks.length;i++) {
        this.onState('thinking');const audio=await next;verify();
        next=i+1<chunks.length?generate(chunks[i+1]):null;next?.catch(()=>{});
        await this.play(new Float32Array(audio.samples),audio.sampleRate,controls,{signal,epoch});
      }
    } catch(error) {if(epoch===this.epoch)this.stop();throw error;}
    finally {signal?.removeEventListener('abort',abort);if(epoch===this.epoch)this.onState('idle');}
  }
}
