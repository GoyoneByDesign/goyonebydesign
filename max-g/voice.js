/** Local speech output; dictation uses local recognition unless browser processing is explicitly selected. */
import {NeuralVoice} from './neural-voice.js';
import {normalizeVoice,speechPlan,deliveryPause,NEURAL_VOICES} from './voice-config.js';
import {normalizePronunciation} from './speech-text.js';
export const PROFILES={Warm:{pitch:1,rate:.98},Bright:{pitch:1.06,rate:1.03},Calm:{pitch:.95,rate:.94},Storyteller:{pitch:1.02,rate:.96},Focused:{pitch:.98,rate:1.02},Playful:{pitch:1.08,rate:1.04}};
export function spokenText(text,options={}){const clean=String(text).replace(/\n\s*Sources?:[\s\S]*$/i,'').replace(/```[\s\S]*?```/g,' Code is available in the message. ').replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g,'$1').replace(/https?:\/\/\S+/g,'').replace(/\[\d+\]/g,'').replace(/^#{1,6}\s*/gm,'').slice(0,16000);return normalizePronunciation(clean,options).slice(0,32000);}
export class LocalVoice{
  constructor({onState=()=>{},onProgress=()=>{},onLevel=()=>{},helper=null,permission=async()=>{},preferCompanionNeural=false,nativeSpeech=null}={}){this.deliveryWaits=new Set();this.nativeSpeech=nativeSpeech;this.listeningController=null;this.recognitionCleanup=null;this.onState=onState;this.recognition=null;this.utterance=null;this.generation=0;this.helper=helper;this.permission=permission;this.preferCompanionNeural=preferCompanionNeural;this.neural=new NeuralVoice({onState,onProgress,onLevel});this.cloning=false;}
  async load(options){
    const generation=this.generation;this.onState('thinking');
    try{if(this.preferCompanionNeural&&this.helper){const result=await this.helper('status',{},options);if(!result.preset_ready)throw new Error('The installed MAX-G voice runtime needs repair. Open Voice Studio for status.');return result;}return await this.neural.load(options);}
    finally{if(generation===this.generation)this.onState('idle');}
  }
  enableAudio(options){return this.neural.unlock(options);}
  testSound(options){this.stop();return this.neural.testSound(options);}
  unload(){this.stop();this.neural.unload();if(this.helper)this.helper('unload').catch(()=>{});}
  async preview(text,settings,{signal}={}){const config=normalizeVoice(settings.voice);return this.speak(text,{...config,language:({English:'en-US','Auto-detect':'en-US',Tagalog:'fil-PH',Spanish:'es-ES','Chinese (Mandarin)':'zh-CN',Japanese:'ja-JP',Italian:'it-IT',Russian:'ru-RU',Korean:'ko-KR'})[settings.language]||'en-US',profile:settings.voiceProfile,voiceURI:settings.voiceURI,rate:settings.rate,signal});}
  voices(){return globalThis.speechSynthesis?.getVoices().filter(v=>v.localService) || [];}
  async readyVoices(){if(this.voices().length)return this.voices();await new Promise(resolve=>{const timer=setTimeout(done,1500);const synth=globalThis.speechSynthesis;function done(){clearTimeout(timer);synth?.removeEventListener('voiceschanged',done);resolve();}synth?.addEventListener('voiceschanged',done,{once:true});});return this.voices();}
  stop(){this.generation++;for(const cancel of [...this.deliveryWaits])cancel();this.listeningController?.abort();this.recognitionCleanup?.();this.neural.stop();if(this.cloning){this.cloning=false;this.helper?.('unload').catch(()=>{});}this.finishSpeech?.();this.finishSpeech=null;const recognition=this.recognition;this.recognition=null;try{recognition?.abort();}catch{}globalThis.speechSynthesis?.cancel();this.utterance=null;this.onState('idle');}
  async speak(text,{engine='system',neuralVoice='am_fenrir',cloneId='',pitch=0,depth=0,expression=.35,language='en-US',profile='Warm',voiceURI='',rate=1,emotion='neutral',laughter=true,chuckle=false,signal,speechContext={}}={}){
    if(signal?.aborted)throw new DOMException('Voice stopped.','AbortError');
    const clean=spokenText(text,{...speechContext,language}).trim();if(!clean){this.stop();return;}
    if(engine!=='system'){
      this.stop();const generation=this.generation;
      if(!language.startsWith('en'))throw new Error('These natural voices currently speak English. Select Installed system voice for this language in Voice Studio.');
      if(engine==='neural'&&!this.preferCompanionNeural){
        // Start audio resume in the original click/tap before an asynchronous
        // permission dialog or first model download can consume that gesture.
        const unlocked=this.neural.unlock({signal});unlocked.catch(()=>{});
        try{if(!this.neural.ready)await this.permission('internet');if(generation!==this.generation||signal?.aborted)return;await unlocked;if(generation!==this.generation||signal?.aborted)return;return await this.neural.speak(clean,{neuralVoice,pitch,depth,expression,rate,emotion,laughter,chuckle,signal});}
        catch(error){if(generation===this.generation)this.neural.stop();throw error;}
      }
      const localPreset=engine==='neural'&&this.preferCompanionNeural;
      if(!this.helper||(!localPreset&&(engine!=='clone'||!cloneId)))throw new Error('Choose a saved recording in Voice Studio and pair with the Mac companion.');
      this.cloning=true;const abort=()=>{if(generation===this.generation)this.stop();};signal?.addEventListener('abort',abort,{once:true});
      try{await this.neural.unlock({signal});for(const segment of speechPlan(clean,{limit:260,firstLimit:120,rate,pitch,depth,emotion,expression,laughter,chuckle})){const chunk=segment.text;if(signal?.aborted||generation!==this.generation)throw new DOMException('Voice stopped.','AbortError');this.onState('thinking');const controls=segment.controls;const audio=await this.helper('synthesize',{text:chunk,mode:localPreset?'preset':'clone',voice:neuralVoice,language:NEURAL_VOICES.find(v=>v.id===neuralVoice)?.language||language,...(localPreset?{}:{sample_id:cloneId}),rate:controls.speed,pitch:controls.pitch,depth:controls.depth/6},{signal});if(signal?.aborted||generation!==this.generation)throw new DOMException('Voice stopped.','AbortError');if(audio.mime!=='audio/wav'||typeof audio.base64!=='string'||audio.base64.length>12000000)throw new Error('The companion returned invalid voice audio.');const bytes=Uint8Array.from(atob(audio.base64),c=>c.charCodeAt(0)),buffer=await this.neural.context.decodeAudioData(bytes.buffer);if(signal?.aborted||generation!==this.generation)throw new DOMException('Voice stopped.','AbortError');await deliveryPause(segment.pauseBeforeMs,{signal,cancellations:this.deliveryWaits});if(signal?.aborted||generation!==this.generation)throw new DOMException('Voice stopped.','AbortError');await this.neural.play(buffer.getChannelData(0),buffer.sampleRate,{pitch:0,depth:0},{signal});}}finally{signal?.removeEventListener('abort',abort);if(generation===this.generation){this.cloning=false;this.onState('idle');this.neural.scheduleIdle();}}return;
    }
    this.stop();this.finishSpeech?.();const generation=++this.generation;globalThis.speechSynthesis?.cancel();const voices=await this.readyVoices();if(signal?.aborted||generation!==this.generation)return;
    if(!voices.length)throw new Error('No installed local browser voice is available. Add a system voice or use the desktop edition.');
    const matching=voices.filter(v=>v.lang.toLowerCase().startsWith(language.split('-')[0].toLowerCase()));const index=Object.keys(PROFILES).indexOf(profile);const voice=voices.find(v=>v.voiceURI===voiceURI&&matching.includes(v))||matching[Math.max(0,index)%Math.max(1,matching.length)];
    if(!voice)throw new Error('No local voice is installed for this language. Choose an installed voice or language in Settings.');
    const delivery=PROFILES[profile]||PROFILES.Warm;
    try{for(const segment of speechPlan(clean,{limit:220,firstLimit:120,rate,pitch,depth,emotion,expression,laughter,chuckle})){const chunk=segment.text;
      if(signal?.aborted||generation!==this.generation)return;
      await deliveryPause(segment.pauseBeforeMs,{signal,cancellations:this.deliveryWaits});if(signal?.aborted||generation!==this.generation)return;
      let interrupted=false;const controls=segment.controls,utterance=new SpeechSynthesisUtterance(chunk);
      utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=Math.max(.65,Math.min(1.5,controls.speed*delivery.rate));utterance.pitch=Math.max(.5,Math.min(1.6,delivery.pitch*2**(controls.pitch/12)));this.utterance=utterance;
      await new Promise((resolve,reject)=>{let finished=false;const abort=()=>{if(generation===this.generation)globalThis.speechSynthesis?.cancel();done();};function done(error){if(finished)return;finished=true;signal?.removeEventListener('abort',abort);error?reject(error):resolve();}this.finishSpeech=()=>done();signal?.addEventListener('abort',abort,{once:true});utterance.onstart=()=>{if(!finished&&generation===this.generation&&!signal?.aborted)this.onState('speaking');};utterance.onend=()=>done();utterance.onerror=event=>{interrupted=['canceled','interrupted'].includes(event.error);done(interrupted?null:new Error(`Voice playback failed: ${event.error}.`));};if(signal?.aborted){abort();return;}try{if(globalThis.speechSynthesis.paused)globalThis.speechSynthesis.resume?.();globalThis.speechSynthesis.speak(utterance);}catch(error){done(error);}});if(interrupted)return;
    }}finally{if(generation===this.generation){this.utterance=null;this.finishSpeech=null;this.onState('idle');}}
  }
  recognitionClass(){return globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition;}
  nativeRecognizer(){try{return typeof this.nativeSpeech==='function'?this.nativeSpeech():this.nativeSpeech;}catch{return null;}}
  async speechAvailability(language='en-US',{recognitionMode='local'}={}){
    const Recognition=this.recognitionClass();
    if(recognitionMode==='browser')return Recognition?'available':'unsupported';
    const native=this.nativeRecognizer();
    if(native?.status)try{if((await recognitionWait(native.status({language}),{})).available)return 'available';}catch{}
    if(!Recognition||!('processLocally' in Recognition.prototype)||typeof Recognition.available!=='function')return 'unsupported';
    try{return await recognitionWait(Recognition.available({langs:[language],processLocally:true}),{});}catch{return 'unsupported';}
  }
  async installLanguage(language='en-US'){const Recognition=this.recognitionClass();if(!Recognition||typeof Recognition.install!=='function')throw new Error('This browser cannot install on-device dictation.');const ok=await Recognition.install({langs:[language],processLocally:true});if(!ok)throw new Error('The on-device language pack could not be installed.');return true;}
  async listen({language='en-US',recognitionMode='local',signal,onText=()=>{},onEnd=()=>{},onError=()=>{}}={}){
    if(signal?.aborted)throw new DOMException('Dictation stopped.','AbortError');
    this.stop();const generation=this.generation,controller=new AbortController();this.listeningController=controller;
    const abort=()=>{if(generation===this.generation)this.stop();};signal?.addEventListener('abort',abort,{once:true});
    let rec=null,closed=false,hadSpeech=false,errorCode=null,fatal=false,previousAudioType,audioSession,microphoneMode=false,nativeCancel=null;
    const current=()=>!closed&&generation===this.generation&&!controller.signal.aborted;
    const cleanup=()=>{
      if(closed)return;closed=true;signal?.removeEventListener('abort',abort);
      if(this.listeningController===controller)this.listeningController=null;
      if(this.recognitionCleanup===cleanup)this.recognitionCleanup=null;
      if(this.recognition===rec)this.recognition=null;
      try{rec?.abort?.();}catch{}
      try{if(microphoneMode&&globalThis.navigator?.audioSession===audioSession&&audioSession.type==='play-and-record')audioSession.type=previousAudioType;}catch{}
    };
    this.recognitionCleanup=cleanup;
    const finish=()=>{const notify=current();cleanup();if(notify){this.onState('idle');onEnd({hadSpeech,error:errorCode,fatal});}};
    const report=code=>{if(!current()||errorCode)return;errorCode=code;fatal=!['no-speech','nomatch'].includes(code);onError(dictationErrorMessage(code),{code,fatal});finish();};
    const microphoneSession=()=>{try{audioSession=globalThis.navigator?.audioSession;if(audioSession&&typeof audioSession.type==='string'){previousAudioType=audioSession.type;audioSession.type='play-and-record';microphoneMode=audioSession.type==='play-and-record';}}catch{}};
    const deliver=text=>{if(!current()||hadSpeech)return;const value=typeof text==='string'?text.trim():'';if(value){hadSpeech=true;onText(value);}};
    try{
      const native=recognitionMode==='browser'?null:this.nativeRecognizer();let nativeReady=false;
      if(native?.status&&native?.listen)try{nativeReady=(await recognitionWait(native.status({language}),{signal:controller.signal})).available===true;}catch(error){if(controller.signal.aborted)throw error;}
      if(!current())throw new DOMException('Dictation stopped.','AbortError');
      if(nativeReady){
        let cancelled=false;nativeCancel=()=>{if(cancelled)return;cancelled=true;Promise.resolve().then(()=>native.cancel?.()).catch(()=>{});};
        rec={abort:nativeCancel,stop:()=>native.finish?.()};this.recognition=rec;microphoneSession();
        const state=event=>{if(!current())return;const value=event?.detail?.state;if(value==='listening')this.onState('listening');else if(value==='transcribing')this.onState('thinking');};
        globalThis.addEventListener?.('maxg-speech-state',state);this.onState('listening');
        try{
          const result=await recognitionWait(native.listen({language}),{signal:controller.signal,timeoutMs:180000});
          if(!current())return;cancelled=true;
          if(result?.reason==='cancelled'){errorCode='aborted';fatal=true;finish();return;}
          deliver(result?.transcript);
          if(!hadSpeech)report('no-speech');else finish();
        }catch(error){if(controller.signal.aborted||!current())throw error;report(['MICROPHONE_DENIED','permission-denied'].includes(error?.code)||error?.name==='NotAllowedError'?'not-allowed':error?.code==='NO_SPEECH'?'no-speech':'native-unavailable');}
        finally{globalThis.removeEventListener?.('maxg-speech-state',state);}
        return;
      }
      const Recognition=this.recognitionClass();
      if(recognitionMode!=='browser'){
        const availability=await recognitionWait(this.speechAvailability(language),{signal:controller.signal});
        if(!current())throw new DOMException('Dictation stopped.','AbortError');
        if(availability!=='available'){
          const error=new Error(availability==='downloadable'?'Install the on-device dictation language pack in Settings → Voice.':'On-device dictation is unavailable in this browser/language. Choose Browser dictation in Settings → Voice to allow your browser’s speech service, or use keyboard dictation.');
          error.code='LOCAL_DICTATION_UNAVAILABLE';error.browserAvailable=Boolean(Recognition);throw error;
        }
      }
      if(!Recognition)throw Object.assign(new Error('This browser has no speech recognition. Use your keyboard’s microphone to dictate into the message box.'),{code:'DICTATION_UNSUPPORTED'});
      rec=new Recognition();if(recognitionMode!=='browser')rec.processLocally=true;else if('processLocally' in rec)rec.processLocally=false;
      rec.lang=language;rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;this.recognition=rec;
      rec.onstart=()=>{if(current())this.onState('listening');};
      rec.onresult=event=>{if(!current()||hadSpeech)return;const parts=[];for(let i=Number(event.resultIndex)||0;i<(event.results?.length||0);i++){const result=event.results[i];if(result?.isFinal!==false&&typeof result?.[0]?.transcript==='string')parts.push(result[0].transcript);}deliver(parts.join(' '));};
      rec.onnomatch=()=>report('nomatch');rec.onerror=event=>report(String(event.error||'unknown'));rec.onend=finish;
      microphoneSession();rec.start();
    }catch(error){cleanup();if(generation===this.generation)this.onState('idle');throw error;}
  }
}

function dictationErrorMessage(code){
  if(['no-speech','nomatch'].includes(code))return 'Sorry, can you say that again?';
  if(['not-allowed','service-not-allowed'].includes(code))return 'Microphone or speech recognition access was denied. Allow access in this browser and your device’s privacy settings, then tap the microphone again.';
  if(code==='audio-capture')return 'No working microphone was found. Check the selected microphone, then try again.';
  if(code==='network')return 'The browser’s speech service could not connect. Check your internet connection or choose local dictation. No other speech service was used.';
  if(code==='language-not-supported')return 'This speech service does not support the selected language. Change the conversation language in Voice Studio.';
  if(code==='native-unavailable')return 'Local Mac dictation could not finish. Check the microphone and installed speech runtime, then try again.';
  if(code==='aborted')return 'Dictation was stopped. Tap the microphone to start again.';
  return 'Speech recognition could not finish. Tap the microphone to try again, or use keyboard dictation.';
}
function recognitionWait(promise,{signal,timeoutMs=8000}={}){
  return new Promise((resolve,reject)=>{let settled=false;const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);fn(value);};const abort=()=>finish(reject,new DOMException('Dictation stopped.','AbortError'));const timer=setTimeout(()=>finish(reject,Object.assign(new Error('Speech recognition did not respond. Please try again.'),{code:'DICTATION_TIMEOUT'})),timeoutMs);timer.unref?.();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});Promise.resolve(promise).then(value=>finish(resolve,value),error=>finish(reject,error));});
}
