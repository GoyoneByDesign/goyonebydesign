import {NEURAL_VOICES,MALE_VOICE_PRESETS,applyMaleVoicePreset,normalizeVoice} from './voice-config.js';
export const RECORDING_PHRASES=Object.freeze([
  'Hello, I’m recording my own voice for MAX-G. I like a warm, clear conversation, with a natural rhythm and a little personality. Let’s make something useful together.',
  'Good morning! What shall we work on today? That sounds interesting. Give me a moment to think. I understand, and I’m here to help you take the next step.',
  'The sky is cloudy, so bring an umbrella. We can check the weather, write a message, or explore a new idea. Thank you for listening. Let’s try that again, a little more slowly.',
]);
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text)x.textContent=text;if(cls)x.className=cls;return x;};
const abortError=message=>new DOMException(message||'Recording cancelled.','AbortError');
function boundedAudioWait(promise,{signal,timeoutMs=20000,message='The microphone did not respond in time.'}={}){
  return new Promise((resolve,reject)=>{let settled=false;const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);fn(value);};const abort=()=>finish(reject,signal.reason||abortError());const timer=setTimeout(()=>finish(reject,new Error(message)),timeoutMs);if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});Promise.resolve(promise).then(value=>finish(resolve,value),error=>finish(reject,error));});
}
export function microphoneErrorMessage(error){
  if(['NotAllowedError','PermissionDeniedError','SecurityError'].includes(error?.name))return 'Microphone access was not allowed. Allow the microphone for MAX-G in this app or browser, then check macOS System Settings → Privacy & Security → Microphone and try again.';
  if(['NotFoundError','DevicesNotFoundError'].includes(error?.name))return 'No microphone was found. Connect or select a microphone in your device’s sound settings, then try again.';
  if(['NotReadableError','TrackStartError'].includes(error?.name))return 'The microphone could not open. Close other recording apps, check your selected sound input, then try again.';
  if(error?.name==='AbortError')return 'Microphone access was cancelled. Press Record my voice and approve the microphone request to try again.';
  if(error?.name==='NotSupportedError')return 'This browser could not record that audio format. Try an updated Safari or Chrome, or upload a 3–30 second voice recording.';
  return error?.message||'The recording could not start. Check microphone access and try again.';
}
export function recordingMimeType(Recorder=globalThis.MediaRecorder){
  if(typeof Recorder?.isTypeSupported!=='function')return '';
  return ['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'].find(type=>Recorder.isTypeSupported(type))||'';
}
/** One bounded capture session; injectable devices let tests exercise real async
 * cancellation and late permission results without opening a physical mic. */
export function createVoiceRecorder({permission=async()=>{},mediaDevices=globalThis.navigator?.mediaDevices,Recorder=globalThis.MediaRecorder,Context=globalThis.AudioContext||globalThis.webkitAudioContext,audioSession=globalThis.navigator?.audioSession,onState=()=>{},onLevel=()=>{},onBlob=()=>{},signal,requestTimeoutMs=25000,stopTimeoutMs=4000,maxDurationMs=29000,now=()=>performance.now()}={}){
  let active=null,phase='idle',disposed=false,epoch=0;
  const emit=(next,message)=>{phase=next;if(!disposed)onState({phase:next,message});};
  const stopTracks=stream=>{for(const track of stream?.getTracks?.()||[])try{track.stop();}catch{}};
  function release(session){clearTimeout(session.limit);clearTimeout(session.stopTimer);clearInterval(session.tick);session.controller.abort();if(session.recorder){session.recorder.onstop=session.recorder.ondataavailable=session.recorder.onerror=null;try{if(session.recorder.state!=='inactive')session.recorder.stop();}catch{}}stopTracks(session.stream);try{session.source?.disconnect();session.analyser?.disconnect();}catch{}try{session.context?.close()?.catch(()=>{});}catch{}try{if(session.audioMode&&audioSession?.type===session.audioMode)audioSession.type=session.previousAudioMode;}catch{}session.audioMode=null;session.chunks.length=0;}
  function fail(session,error){if(active!==session)return;active=null;release(session);emit('error',microphoneErrorMessage(error));onLevel({elapsed:0,level:0,available:false});}
  function cancel(message='Recording cancelled. The microphone is off.'){
    epoch++;const old=active;active=null;if(old)release(old);if(!disposed)emit('idle',message);onLevel({elapsed:0,level:0,available:false});
  }
  function stop(){const session=active;if(!session)return;if(!session.recorder||phase==='requesting'){cancel();return;}if(phase!=='recording')return;emit('stopping','Finishing this take…');clearTimeout(session.limit);session.stopTimer=setTimeout(()=>fail(session,new Error('The browser did not finish recording. The microphone is off. Please record again or upload a short audio file.')),stopTimeoutMs);try{session.recorder.stop();}catch(error){fail(session,error);}}
  async function start(){
    if(disposed||signal?.aborted)throw abortError('Voice Studio is closed.');if(active)return;
    const session={controller:new AbortController(),epoch:++epoch,chunks:[],size:0};active=session;
    emit('requesting','Waiting for microphone permission… Choose Allow in the app or browser prompt. You can cancel below.');
    try{
      if(!mediaDevices?.getUserMedia||!Recorder)throw new Error('Recording requires HTTPS or the installed MAX-G app and a supported browser. Open MAX-G securely, or upload a short recording.');
      const request=Promise.resolve().then(()=>permission('microphone')).then(()=>{if(active!==session||disposed)throw abortError();
        // Safari/WebKit rejects microphone capture in a playback-only session.
        // Neural speech can leave that mode active after its last utterance.
        if(audioSession)try{session.previousAudioMode=audioSession.type||'auto';audioSession.type='play-and-record';session.audioMode='play-and-record';}catch{try{audioSession.type='auto';session.audioMode='auto';}catch{}}
        return mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});}).then(stream=>{if(active!==session||disposed){stopTracks(stream);throw abortError();}return stream;});
      session.stream=await boundedAudioWait(request,{signal:session.controller.signal,timeoutMs:requestTimeoutMs,message:'The microphone request timed out. Check for an Allow prompt, verify MAX-G has microphone access in your device settings, then try again.'});
      if(active!==session||disposed){stopTracks(session.stream);return;}
      const mimeType=recordingMimeType(Recorder);session.recorder=mimeType?new Recorder(session.stream,{mimeType}):new Recorder(session.stream);const recorder=session.recorder;
      recorder.ondataavailable=event=>{if(active!==session||!event.data?.size)return;session.size+=event.data.size;if(session.size>15*1024*1024){fail(session,new Error('The recording became too large. Try a shorter take under 30 seconds.'));return;}session.chunks.push(event.data);};
      recorder.onerror=event=>fail(session,event.error||new Error('Recording failed. Check the microphone and try again.'));
      recorder.onstop=()=>{
        if(active!==session)return;const blob=new Blob(session.chunks,{type:recorder.mimeType||mimeType||session.chunks[0]?.type||'audio/webm'});active=null;release(session);emit('processing','Checking your recording on this device…');onLevel({elapsed:Math.min(maxDurationMs,now()-session.started)/1000,level:0,available:false});
        if(!blob.size){emit('error','No audio was captured. Check the selected microphone and try again.');return;}
        const completedEpoch=epoch;Promise.resolve().then(()=>{if(!disposed&&epoch===completedEpoch)return onBlob(blob);}).catch(error=>{if(!disposed&&epoch===completedEpoch)emit('error',microphoneErrorMessage(error));});
      };
      recorder.start(250);session.started=now();emit('recording','Recording now. Read the phrase naturally, then press Stop recording.');
      if(Context)try{session.context=new Context();session.source=session.context.createMediaStreamSource(session.stream);session.analyser=session.context.createAnalyser();session.analyser.fftSize=256;session.source.connect(session.analyser);session.context.resume()?.catch(()=>{});session.samples=new Float32Array(session.analyser.fftSize);}catch{try{session.context?.close()?.catch(()=>{});}catch{}session.analyser=null;}
      session.tick=setInterval(()=>{if(active!==session)return;let level=0,available=Boolean(session.analyser&&session.context?.state==='running');if(available)try{session.analyser.getFloatTimeDomainData(session.samples);level=Math.min(1,Math.sqrt(session.samples.reduce((sum,x)=>sum+x*x,0)/session.samples.length)*5);}catch{available=false;}onLevel({elapsed:Math.max(0,(now()-session.started)/1000),level,available});},100);
      session.limit=setTimeout(stop,maxDurationMs);
    }catch(error){if(active===session)fail(session,error);}
  }
  const dispose=()=>{if(disposed)return;cancel();disposed=true;signal?.removeEventListener('abort',dispose);};signal?.addEventListener('abort',dispose,{once:true});
  return {start,stop,cancel,dispose,get phase(){return phase;}};
}
export function encodeWav(samples,rate=24000){if(!(samples instanceof Float32Array)||!samples.length||samples.length>30.1*24000||!samples.every(Number.isFinite)||!Number.isInteger(rate)||rate<8000||rate>96000)throw new Error('The recording contains invalid audio samples.');const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer);const put=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};put(0,'RIFF');v.setUint32(4,36+samples.length*2,true);put(8,'WAVE');put(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);put(36,'data');v.setUint32(40,samples.length*2,true);for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);return buffer;}
export async function prepareRecording(blob,{signal,timeoutMs=15000}={}){
  if(!blob||blob.size>15*1024*1024||blob.size<44)throw new Error('Choose an audio recording under 15 MB, lasting 3–30 seconds.');
  const verify=()=>{if(signal?.aborted)throw new DOMException('Recording stopped.','AbortError');};verify();
  const Context=globalThis.AudioContext||globalThis.webkitAudioContext,Offline=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;
  if(!Context||!Offline)throw new Error('Audio decoding is unavailable in this browser.');
  const ctx=new Context();let decoded;
  const wait=promise=>boundedAudioWait(promise,{signal,timeoutMs,message:'Audio processing timed out. Try a shorter 3–30 second recording or upload a WAV, MP3 or M4A file.'});
  try{const bytes=await wait(blob.arrayBuffer());verify();decoded=await wait(ctx.decodeAudioData(bytes));}finally{try{ctx.close()?.catch(()=>{});}catch{}}verify();
  if(!Number.isFinite(decoded.duration)||decoded.duration<3||decoded.duration>30.05)throw new Error('Use 3–30 seconds of clear speech. About 15–25 seconds usually works well.');
  const offline=new Offline(1,Math.ceil(decoded.duration*24000),24000),source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();let rendered;try{rendered=await wait(offline.startRendering());}finally{source.disconnect();}verify();const samples=rendered.getChannelData(0),rms=Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length),peak=Math.max(...Array.from({length:Math.ceil(samples.length/8192)},(_,i)=>Math.max(...samples.subarray(i*8192,(i+1)*8192).map(Math.abs))));
  if(!Number.isFinite(rms)||!Number.isFinite(peak))throw new Error('The recording contains invalid audio samples.');
  if(rms<.003)throw new Error('This recording is too quiet. Move closer to the microphone and record again.');
  const bytes=new Uint8Array(encodeWav(samples));let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return {base64:btoa(binary),duration:decoded.duration,rms,warning:peak>.995?'Some audio may be clipped. A quieter recording could sound better.':''};
}
export function renderVoiceStudio({settings,voice,ownerName='Michael',languages,profiles,helper,permission,onSave,onNotice=()=>{},signal}){
  const root=el('section','','voice-studio'),draft=normalizeVoice(settings.voice),status=el('p','Choose a natural voice, or make MAX-G sound like you.','voice-status');status.setAttribute('role','status');root.append(el('h3','Voice Studio'),status);
  const bindings={},field=(key,label,value,options)=>{const wrap=el('label',label,'field'),input=el(options?'select':'input');if(options)for(const o of options){const option=el('option',typeof o==='string'?o:o.label);option.value=typeof o==='string'?o:o.value;input.append(option);}input.value=value;input.dataset.voiceField=key;input.setAttribute('aria-label',label);wrap.append(input);root.append(wrap);bindings[key]=input;return input;};
  const assertOpen=()=>{if(signal?.aborted)throw new DOMException('Settings closed.','AbortError');};
  const action=(label,fn,cls='button')=>{const b=el('button',label,cls);b.type='button';b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{assertOpen();await fn();}catch(error){if(error.name!=='AbortError'&&!signal?.aborted)status.textContent=error.message;}finally{b.disabled=false;}};return b;};
  const presetSection=el('section','','male-voice-presets');presetSection.setAttribute('aria-label','Male voice styles');
  presetSection.append(el('h4','A man’s voice, your way'),el('p','Choose the age style you like, then fine-tune its sound below. Preview each voice before saving.','male-voice-note'));
  const presetCards=el('div','','male-voice-grid');presetSection.append(presetCards);root.append(presetSection);
  field('engine','Voice engine',draft.engine,[{value:'neural',label:'Natural neural voice · on this device'},{value:'clone',label:'My cloned voice · paired Mac companion'},{value:'system',label:'Installed system voice · other languages'}]);
  field('neuralVoice','Natural voice',draft.neuralVoice,NEURAL_VOICES.map(v=>({value:v.id,label:v.name})));
  field('language','Conversation language',settings.language,Object.keys(languages));field('voiceProfile','System voice delivery profile',settings.voiceProfile,Object.keys(profiles));
  field('voiceURI','Installed local voice',settings.voiceURI,[{value:'',label:'Automatic for selected language'},...voice.voices().map(v=>({value:v.voiceURI,label:`${v.name} · ${v.lang}`}))]);
  const slider=(key,label,value,min,max,step,suffix)=>{const input=field(key,label,value);input.type='range';input.min=min;input.max=max;input.step=step;input.value=value;const output=el('output');const update=()=>output.textContent=Number(input.value).toFixed(['rate','expression'].includes(key)?2:1)+suffix;input.addEventListener('input',update);input.parentElement.append(output);update();};
  slider('rate','Speaking speed',settings.rate,.65,1.5,.01,'×');slider('pitch','Pitch',draft.pitch,-4,4,.5,' semitones');slider('depth','Depth / warmth',draft.depth,-6,6,.5,' dB');slider('expression','Expressive delivery',draft.expression,0,1,.01,'');
  root.append(el('p','Natural browser voices currently speak English. Other selected languages use the installed-system option; available voices vary by device. Expression adds gentle timing and pitch changes. Depth adjusts vocal warmth; pitch can also change playback length.','muted'));
  const values=()=>({...settings,language:bindings.language.value,voiceProfile:bindings.voiceProfile.value,voiceURI:bindings.voiceURI.value,rate:Number(bindings.rate.value),voice:normalizeVoice({...draft,engine:bindings.engine.value,neuralVoice:bindings.neuralVoice.value,pitch:Number(bindings.pitch.value),depth:Number(bindings.depth.value),expression:Number(bindings.expression.value),cloneId:bindings.cloneId?.value||draft.cloneId})});
  let voiceEpoch=0,ensurePlaybackAllowed=()=>{};
  const stopPreview=()=>{voiceEpoch++;voice.stop();};
  const preview=field('preview','Preview words',`Hello ${ownerName}. I’m MAX-G. Let’s take this one step at a time. I’m listening.`);preview.maxLength=400;
  async function hear(candidate,label='this voice'){
    ensurePlaybackAllowed();
    stopPreview();const epoch=voiceEpoch;status.textContent=`Preparing ${label}…`;
    try{await voice.preview(preview.value,candidate,{signal});if(!signal?.aborted&&epoch===voiceEpoch){status.textContent='Preview complete. Adjust the voice and try again.';return true;}return false;}
    catch(error){if(!signal?.aborted&&epoch===voiceEpoch)throw error;return false;}
  }
  const presetButtons=[];
  const markPreset=()=>{const value=values();for(const {preset,card,choose}of presetButtons){const selected=value.voice.engine==='neural'&&value.voice.neuralVoice===preset.neuralVoice&&['pitch','depth','expression'].every(key=>Math.abs(value.voice[key]-preset[key])<.001)&&Math.abs(value.rate-preset.rate)<.001;card.dataset.selected=String(selected);choose.setAttribute('aria-pressed',String(selected));}};
  for(const preset of MALE_VOICE_PRESETS){
    const card=el('article','','male-voice-card');card.dataset.maleVoice=preset.id;
    const icon=el('span','','male-voice-mark');icon.setAttribute('aria-hidden','true');for(let i=0;i<4;i++)icon.append(el('i'));
    card.append(icon,el('h5',preset.name),el('p',preset.description,'male-voice-description'));
    const choose=action('Choose',()=>{stopPreview();const next=applyMaleVoicePreset(values(),preset.id);for(const [key,value]of Object.entries({engine:next.voice.engine,neuralVoice:next.voice.neuralVoice,rate:next.rate,pitch:next.voice.pitch,depth:next.voice.depth,expression:next.voice.expression})){bindings[key].value=String(value);if(bindings[key].type==='range')bindings[key].dispatchEvent(new Event('input'));}markPreset();status.textContent=`${preset.name} staged. Save voice settings to keep this choice.`;},'button button-small');
    choose.setAttribute('aria-label',`Choose ${preset.name}`);
    const hearButton=action('Hear',()=>hear(applyMaleVoicePreset(values(),preset.id),preset.name.toLowerCase()),'button button-small');hearButton.setAttribute('aria-label',`Hear ${preset.name}`);
    const actions=el('div','','male-voice-actions');actions.append(choose,hearButton);card.append(actions);presetCards.append(card);presetButtons.push({preset,card,choose});
  }
  for(const key of ['engine','neuralVoice','language','voiceProfile','voiceURI','rate','pitch','depth','expression'])bindings[key].addEventListener(bindings[key].type==='range'?'input':'change',()=>{stopPreview();markPreset();});
  markPreset();
  root.append(action('Hear this voice',()=>hear(values())),action('Stop voice',()=>{stopPreview();status.textContent='Voice stopped.';}),action('Load natural voice',async()=>{
    ensurePlaybackAllowed();stopPreview();const epoch=voiceEpoch;
    try{await permission('internet');assertOpen();if(epoch!==voiceEpoch)return;
      status.textContent='Downloading and preparing local speech…';await voice.load({signal});
      if(!signal?.aborted&&epoch===voiceEpoch)status.textContent='Natural speech is ready. You can hear a preview now.';
    }catch(error){if(!signal?.aborted&&epoch===voiceEpoch)throw error;}
  }),action('Unload voice model',()=>{ensurePlaybackAllowed();voiceEpoch++;voice.unload();status.textContent='Voice model unloaded from memory. Downloaded voice files remain cached.';}));
  root.append(el('h3','Clone my own voice'),el('p','Record one phrase naturally in a quiet room, or upload your own clean audio. Use 3–30 seconds with one speaker and no music. You can keep several takes and choose the one that sounds best. Recordings go only to your paired Mac, and are not included in chat, website publishing or personal backups.','muted'));
  const setup=el('a','Local voice setup guide');setup.href='./VOICE-SETUP.md';setup.target='_blank';setup.rel='noopener';root.append(setup);
  const phrase=el('blockquote',RECORDING_PHRASES[0],'recording-phrase');let phraseIndex=0;root.append(phrase,action('Another practice phrase',()=>{phrase.textContent=RECORDING_PHRASES[++phraseIndex%RECORDING_PHRASES.length];}));
  const recordingName=field('recordingName','Name this recording','My voice');recordingName.maxLength=80;
  const consentLabel=el('label','','toggle-row'),consent=el('input');consent.type='checkbox';consentLabel.append(consent,el('span','This is my own voice, and I want MAX-G to use it for generated speech.'));root.append(consentLabel);
  let preparation=null,audioURL=null,pending=null,recordEpoch=0,saving=false;
  const capturePanel=el('section','','voice-recorder-panel');capturePanel.setAttribute('aria-label','Record your own voice');
  const recordingStatus=el('p','Ready. Press Record my voice and allow microphone access.','voice-recording-status');recordingStatus.setAttribute('role','status');recordingStatus.setAttribute('aria-live','polite');recordingStatus.setAttribute('aria-atomic','true');
  const guidance=el('p','Use a quiet room and your normal speaking voice. Allow microphone access, read for 15–25 seconds, then stop and listen to your take. Recording stops automatically at 29 seconds.','voice-recording-guidance');
  const meterRow=el('div','','voice-recording-meter-row'),elapsed=el('output','0:00 / 0:29','voice-recording-time'),meter=el('meter'),meterLabel=el('span','Microphone off','voice-recording-level-label');elapsed.setAttribute('aria-label','Recording elapsed time');elapsed.setAttribute('aria-live','off');meter.min=0;meter.max=1;meter.value=0;meter.setAttribute('aria-label','Microphone input level');meterRow.append(elapsed,meter,meterLabel);
  const controls=el('div','','voice-recording-actions'),record=el('button','Record my voice','button button-primary'),stopRecord=el('button','Stop recording','button'),cancelRecord=el('button','Cancel','button');for(const b of [record,stopRecord,cancelRecord])b.type='button';stopRecord.disabled=true;cancelRecord.hidden=true;controls.append(record,stopRecord,cancelRecord);
  const audio=el('audio');audio.controls=true;audio.preload='metadata';audio.hidden=true;audio.setAttribute('aria-label','Preview your voice recording');
  const reportRecording=(message,kind='info')=>{if(signal?.aborted)return;recordingStatus.textContent=message;recordingStatus.dataset.kind=kind;status.textContent=message;};
  ensurePlaybackAllowed=()=>{if(['requesting','recording','stopping','processing'].includes(capturePanel.dataset.phase)){const message='Stop or cancel your recording before playing or changing the voice. This keeps MAX-G’s speech out of your recording.';reportRecording(message,'error');throw new Error(message);}};
  const captureState=phase=>{const busy=['requesting','recording','stopping','processing'].includes(phase);capturePanel.dataset.phase=phase;record.disabled=busy||saving;stopRecord.disabled=phase!=='recording';cancelRecord.hidden=!busy;cancelRecord.disabled=saving;};
  const recorder=createVoiceRecorder({permission,signal,onState:({phase,message})=>{captureState(phase);reportRecording(message,phase==='error'?'error':'info');},onLevel:({elapsed:seconds,level,available})=>{elapsed.textContent=`0:${String(Math.min(29,Math.floor(seconds))).padStart(2,'0')} / 0:29`;meter.value=level;meterLabel.textContent=available?(level>.035?'Hearing sound':'Speak near the microphone'):recorder.phase==='recording'?'Recording · meter unavailable':'Microphone off';},onBlob:blob=>stage(blob,{cancelCapture:false})});
  const cleanup=({cancelCapture=true}={})=>{
    recordEpoch++;if(cancelCapture)recorder.cancel();preparation?.abort();preparation=null;pending=null;
    audio.pause();if(audioURL)URL.revokeObjectURL(audioURL);audioURL=null;audio.removeAttribute('src');audio.load();audio.hidden=true;
  };
  signal?.addEventListener('abort',()=>{cleanup();recorder.dispose();stopPreview();},{once:true});
  const recordingAvailable=()=>{assertOpen();if(saving)throw new Error('Your recording is being saved. Wait for it to finish before changing takes.');};
  async function stage(blob,{cancelCapture=true}={}){
    assertOpen();cleanup({cancelCapture});const epoch=recordEpoch,controller=new AbortController();preparation=controller;
    captureState('processing');reportRecording('Checking your recording on this device…');
    try{
      const prepared=await prepareRecording(blob,{signal:controller.signal});
      if(signal?.aborted||epoch!==recordEpoch)return;
      audioURL=URL.createObjectURL(blob);audio.src=audioURL;audio.hidden=false;pending=prepared;
      captureState('ready');reportRecording(`${prepared.duration.toFixed(1)} seconds ready. Play the preview below, then Save my voice recording. ${prepared.warning}`);
    }catch(error){if(signal?.aborted||epoch!==recordEpoch)return;captureState('error');reportRecording(error.message,'error');}
    finally{if(preparation===controller)preparation=null;}
  }
  record.onclick=async()=>{try{recordingAvailable();stopPreview();cleanup();await recorder.start();}catch(error){if(!signal?.aborted){captureState('error');reportRecording(microphoneErrorMessage(error),'error');}}};
  stopRecord.onclick=()=>recorder.stop();cancelRecord.onclick=()=>{if(saving)return;cleanup();captureState('idle');reportRecording('Recording cancelled. The microphone is off.');};
  capturePanel.append(guidance,recordingStatus,meterRow,controls,audio);
  const uploadLabel=el('label','Or upload your own recording','voice-upload-label'),upload=el('input');upload.type='file';upload.accept='audio/*,.wav,.mp3,.m4a,.mp4,.webm,.ogg';upload.setAttribute('aria-label','Upload my voice recording');uploadLabel.append(upload);
  upload.onchange=async()=>{
    const file=upload.files[0];upload.value='';if(!file)return;
    let uploadEpoch;try{recordingAvailable();stopPreview();cleanup();const epoch=uploadEpoch=recordEpoch;captureState('requesting');reportRecording('Waiting for permission to read your selected recording…');await boundedAudioWait(permission('files',{picked:true}),{signal,timeoutMs:25000,message:'File permission timed out. Choose your recording again.'});if(signal?.aborted||epoch!==recordEpoch)return;await stage(file);}
    catch(error){if(!signal?.aborted&&uploadEpoch===recordEpoch){captureState('error');reportRecording(error.name==='AbortError'?'Reading the recording was cancelled. Choose a file to try again.':error.message,'error');}}
  };capturePanel.append(uploadLabel,el('p','3–30 seconds · up to 15 MB · WAV, MP3, M4A and other formats supported by your browser. This preview stays on this device until you save to your paired Mac.','voice-recording-guidance'));root.append(capturePanel);
  const select=field('cloneId','Saved voice recording',draft.cloneId,[{value:'',label:'Choose a saved recording'}]);
  const cloneStatus=el('p','Save a take, then select it for a cloned-voice preview.','voice-recording-status');cloneStatus.setAttribute('role','status');root.append(cloneStatus);
  const reportClone=(message,kind='info')=>{if(signal?.aborted)return;cloneStatus.textContent=message;cloneStatus.dataset.kind=kind;status.textContent=message;};
  const recordingAction=(label,fn)=>action(label,async()=>{try{await fn();}catch(error){if(!signal?.aborted)reportClone(error.name==='AbortError'?'The action was cancelled. You can try again.':error.message,'error');throw error;}});
  async function refresh(){const result=await helper('samples',{}, {signal});if(signal?.aborted)return;const selected=select.value||draft.cloneId;select.replaceChildren(new Option('Choose a saved recording',''));for(const sample of result.samples||[])select.append(new Option(`${sample.name} · ${Number(sample.duration).toFixed(1)}s`,sample.id));select.value=selected;return result;}
  root.append(recordingAction('Check voice setup & recordings',async()=>{reportClone('Checking the voice runtime on your paired Mac…');const capability=await helper('status',{}, {signal});if(signal?.aborted)return;reportClone(capability.message||JSON.stringify(capability));await refresh();}),recordingAction('Save my voice recording',async()=>{
    if(!consent.checked)throw new Error('Confirm that this is your own voice before saving it.');if(!pending)throw new Error('Record or upload and preview a sample first.');const sample=pending;saving=true;captureState('saving');reportClone('Saving your recording to the paired Mac…');
    try{const result=await helper('sample/add',{name:recordingName.value,base64:sample.base64,consent:true},{signal});if(signal?.aborted)return;await refresh();assertOpen();cleanup();select.value=result.id||result.sample?.id||'';draft.cloneId=select.value;reportClone('Your recording is saved on this Mac. Choose Hear my cloned voice to test it.');reportRecording('Saved. Your temporary preview has been cleared. You can make another take.');}
    finally{saving=false;captureState(pending?'ready':'idle');}
  }),recordingAction('Hear my cloned voice',async()=>{if(!select.value)throw new Error('Choose a saved recording first.');reportClone('Preparing your cloned voice on the paired Mac. An Intel CPU can take a while; Stop voice cancels the preview.');const completed=await hear({...values(),voice:normalizeVoice({...values().voice,engine:'clone',cloneId:select.value})},'your cloned voice');assertOpen();if(completed)reportClone('Cloned-voice preview complete. Adjust the tone or choose another take.');}),recordingAction('Stop cloned-voice preview',()=>{stopPreview();reportClone('Cloned-voice preview stopped.');}),recordingAction('Use this cloned voice',async()=>{if(!select.value)throw new Error('Choose a saved recording first.');stopPreview();cleanup();bindings.engine.value='clone';bindings.engine.dispatchEvent(new Event('change'));const candidate=values();reportClone('Saving this cloned voice as MAX-G’s speaking voice…');if(await onSave(candidate)===false)throw new Error('Voice settings could not be saved. Keep this window open and try again.');assertOpen();reportClone('MAX-G will now use this cloned voice on this device through your paired Mac.');onNotice('Cloned voice selected.');}),recordingAction('Delete selected recording',async()=>{if(!select.value)throw new Error('Choose a recording to delete.');await helper('sample/delete',{id:select.value},{signal});if(signal?.aborted)return;select.value='';draft.cloneId='';await refresh();reportClone('Recording and its derived voice data deleted from this Mac.');}),recordingAction('Discard unsaved recording',()=>{recordingAvailable();cleanup();reportRecording('Unsaved recording discarded.');reportClone('Unsaved recording discarded. Saved voices are kept.');}));
  const neutral=recordingAction('Use natural recording tone',()=>{for(const [key,value]of Object.entries({rate:1,pitch:0,depth:0,expression:0})){bindings[key].value=String(value);bindings[key].dispatchEvent(new Event('input'));}reportClone('Natural tone staged: speed 1×, pitch 0, depth 0, expression 0. Preview it, then Save voice settings.');});
  neutral.hidden=bindings.engine.value!=='clone';bindings.engine.addEventListener('change',()=>{neutral.hidden=bindings.engine.value!=='clone';});root.append(neutral);
  root.append(el('p','A cloned voice needs the optional local voice runtime on the Mac you are paired with. It will not follow you to another device automatically. Small changes work best; strong pitch changes can sound less natural.','muted'));
  root.append(action('Install local dictation language',async()=>{await permission('internet');assertOpen();await voice.installLanguage(languages[bindings.language.value]);assertOpen();status.textContent='On-device dictation language is ready.';}),action('Save voice settings',async()=>{const candidate=values();stopPreview();cleanup();if(candidate.voice.engine==='clone'&&!candidate.voice.cloneId)throw new Error('Choose a saved voice recording first.');if(await onSave(candidate)===false)throw new Error('Voice settings could not be saved. Keep this window open.');assertOpen();status.textContent='Voice settings saved on this device.';onNotice(status.textContent);}));
  return root;
}
