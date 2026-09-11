import {NEURAL_VOICES,normalizeVoice} from './voice-config.js';
export const RECORDING_PHRASES=Object.freeze([
  'Hello, I’m recording my own voice for MAX-G. I like a warm, clear conversation, with a natural rhythm and a little personality. Let’s make something useful together.',
  'Good morning! What shall we work on today? That sounds interesting. Give me a moment to think. I understand, and I’m here to help you take the next step.',
  'The sky is cloudy, so bring an umbrella. We can check the weather, write a message, or explore a new idea. Thank you for listening. Let’s try that again, a little more slowly.',
]);
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text)x.textContent=text;if(cls)x.className=cls;return x;};
export function encodeWav(samples,rate=24000){if(!(samples instanceof Float32Array)||!samples.length||samples.length>30.1*24000||!samples.every(Number.isFinite)||!Number.isInteger(rate)||rate<8000||rate>96000)throw new Error('The recording contains invalid audio samples.');const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer);const put=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};put(0,'RIFF');v.setUint32(4,36+samples.length*2,true);put(8,'WAVE');put(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);put(36,'data');v.setUint32(40,samples.length*2,true);for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);return buffer;}
export async function prepareRecording(blob,{signal}={}){
  if(!blob||blob.size>15*1024*1024||blob.size<44)throw new Error('Choose an audio recording under 15 MB, lasting 3–30 seconds.');
  const verify=()=>{if(signal?.aborted)throw new DOMException('Recording stopped.','AbortError');};verify();
  const Context=globalThis.AudioContext||globalThis.webkitAudioContext,Offline=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;
  if(!Context||!Offline)throw new Error('Audio decoding is unavailable in this browser.');
  const ctx=new Context();let decoded;
  try{const bytes=await blob.arrayBuffer();verify();decoded=await ctx.decodeAudioData(bytes);}finally{await ctx.close();}verify();
  if(!Number.isFinite(decoded.duration)||decoded.duration<3||decoded.duration>30.05)throw new Error('Use 3–30 seconds of clear speech. About 15–25 seconds usually works well.');
  const offline=new Offline(1,Math.ceil(decoded.duration*24000),24000),source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();let rendered;try{rendered=await offline.startRendering();}finally{source.disconnect();}verify();const samples=rendered.getChannelData(0),rms=Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length),peak=Math.max(...Array.from({length:Math.ceil(samples.length/8192)},(_,i)=>Math.max(...samples.subarray(i*8192,(i+1)*8192).map(Math.abs))));
  if(!Number.isFinite(rms)||!Number.isFinite(peak))throw new Error('The recording contains invalid audio samples.');
  if(rms<.003)throw new Error('This recording is too quiet. Move closer to the microphone and record again.');
  const bytes=new Uint8Array(encodeWav(samples));let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return {base64:btoa(binary),duration:decoded.duration,rms,warning:peak>.995?'Some audio may be clipped. A quieter recording could sound better.':''};
}
export function renderVoiceStudio({settings,voice,ownerName='GoyoneByDesign',languages,profiles,helper,permission,onSave,onNotice=()=>{},signal}){
  const root=el('section','','voice-studio'),draft=normalizeVoice(settings.voice),status=el('p','Choose a natural voice, or make MAX-G sound like you.','voice-status');status.setAttribute('role','status');root.append(el('h3','Voice Studio'),status);
  const bindings={},field=(key,label,value,options)=>{const wrap=el('label',label,'field'),input=el(options?'select':'input');if(options)for(const o of options){const option=el('option',typeof o==='string'?o:o.label);option.value=typeof o==='string'?o:o.value;input.append(option);}input.value=value;input.dataset.voiceField=key;input.setAttribute('aria-label',label);wrap.append(input);root.append(wrap);bindings[key]=input;return input;};
  const assertOpen=()=>{if(signal?.aborted)throw new DOMException('Settings closed.','AbortError');};
  const action=(label,fn,cls='button')=>{const b=el('button',label,cls);b.type='button';b.onclick=async()=>{if(b.disabled)return;b.disabled=true;try{assertOpen();await fn();}catch(error){if(error.name!=='AbortError'&&!signal?.aborted)status.textContent=error.message;}finally{b.disabled=false;}};return b;};
  field('engine','Voice engine',draft.engine,[{value:'neural',label:'Natural neural voice · on this device'},{value:'clone',label:'My cloned voice · paired Mac companion'},{value:'system',label:'Installed system voice · other languages'}]);
  field('neuralVoice','Natural voice',draft.neuralVoice,NEURAL_VOICES.map(v=>({value:v.id,label:v.name})));
  field('language','Conversation language',settings.language,Object.keys(languages));field('voiceProfile','System voice delivery profile',settings.voiceProfile,Object.keys(profiles));
  field('voiceURI','Installed local voice',settings.voiceURI,[{value:'',label:'Automatic for selected language'},...voice.voices().map(v=>({value:v.voiceURI,label:`${v.name} · ${v.lang}`}))]);
  const slider=(key,label,value,min,max,step,suffix)=>{const input=field(key,label,value);input.type='range';input.min=min;input.max=max;input.step=step;input.value=value;const output=el('output');const update=()=>output.textContent=Number(input.value).toFixed(key==='rate'?2:1)+suffix;input.addEventListener('input',update);input.parentElement.append(output);update();};
  slider('rate','Speaking speed',settings.rate,.65,1.5,.05,'×');slider('pitch','Pitch',draft.pitch,-4,4,.5,' semitones');slider('depth','Depth / warmth',draft.depth,-6,6,.5,' dB');slider('expression','Expressive delivery',draft.expression,0,1,.1,'');
  root.append(el('p','Natural browser voices currently speak English. Other selected languages use the installed-system option; available voices vary by device. Expression adds gentle timing and pitch changes. Depth adjusts vocal warmth; pitch can also change playback length. This is not a copy of ChatGPT’s proprietary voices.','muted'));
  const values=()=>({...settings,language:bindings.language.value,voiceProfile:bindings.voiceProfile.value,voiceURI:bindings.voiceURI.value,rate:Number(bindings.rate.value),voice:normalizeVoice({...draft,engine:bindings.engine.value,neuralVoice:bindings.neuralVoice.value,pitch:Number(bindings.pitch.value),depth:Number(bindings.depth.value),expression:Number(bindings.expression.value),cloneId:bindings.cloneId?.value||draft.cloneId})});
  let voiceEpoch=0;
  const preview=field('preview','Preview words',`Hello ${ownerName}. I’m MAX-G. Let’s take this one step at a time. I’m listening.`);preview.maxLength=400;
  root.append(action('Hear this voice',async()=>{
    const epoch=++voiceEpoch;status.textContent='Preparing voice…';await voice.preview(preview.value,values(),{signal});
    if(!signal?.aborted&&epoch===voiceEpoch)status.textContent='Preview complete. Adjust the voice and try again.';
  }),action('Stop voice',()=>{voiceEpoch++;voice.stop();status.textContent='Voice stopped.';}),action('Load natural voice',async()=>{
    const epoch=++voiceEpoch;await permission('internet');assertOpen();if(epoch!==voiceEpoch)return;
    status.textContent='Downloading and preparing local speech…';await voice.load({signal});
    if(!signal?.aborted&&epoch===voiceEpoch)status.textContent='Natural speech is ready. You can hear a preview now.';
  }),action('Unload voice model',()=>{voiceEpoch++;voice.unload();status.textContent='Voice model unloaded from memory. Downloaded voice files remain cached.';}));
  root.append(el('h3','Clone my own voice'),el('p','Record one phrase naturally in a quiet room, or upload your own clean audio. Use 3–30 seconds with one speaker and no music. You can keep several takes and choose the one that sounds best. Recordings go only to your paired Mac, and are not included in chat, website publishing or personal backups.','muted'));
  const setup=el('a','Local voice setup guide');setup.href='./VOICE-SETUP.md';setup.target='_blank';setup.rel='noopener';root.append(setup);
  const phrase=el('blockquote',RECORDING_PHRASES[0],'recording-phrase');let phraseIndex=0;root.append(phrase,action('Another practice phrase',()=>{phrase.textContent=RECORDING_PHRASES[++phraseIndex%RECORDING_PHRASES.length];}));
  const recordingName=field('recordingName','Name this recording','My voice');recordingName.maxLength=80;
  const consentLabel=el('label','','toggle-row'),consent=el('input');consent.type='checkbox';consentLabel.append(consent,el('span','This is my own voice, and I want MAX-G to use it for generated speech.'));root.append(consentLabel);
  let capture=null,preparation=null,audioURL=null,pending=null,recordEpoch=0,saving=false;
  const audio=el('audio');audio.controls=true;audio.preload='metadata';root.append(audio);
  const stopCapture=()=>{
    const old=capture;capture=null;if(!old)return;
    clearTimeout(old.timer);old.recorder.onstop=old.recorder.ondataavailable=old.recorder.onerror=null;
    try{if(old.recorder.state!=='inactive')old.recorder.stop();}catch{}
    finally{old.stream.getTracks().forEach(track=>track.stop());old.chunks.length=0;}
  };
  const cleanup=()=>{
    recordEpoch++;stopCapture();preparation?.abort();preparation=null;pending=null;
    audio.pause();if(audioURL)URL.revokeObjectURL(audioURL);audioURL=null;audio.removeAttribute('src');audio.load();
  };
  signal?.addEventListener('abort',()=>{cleanup();voice.stop();},{once:true});
  const recordingAvailable=()=>{assertOpen();if(saving)throw new Error('Your recording is being saved. Wait for it to finish before changing takes.');};
  async function stage(blob){
    assertOpen();cleanup();const epoch=recordEpoch,controller=new AbortController();preparation=controller;
    status.textContent='Checking your recording on this device…';
    try{
      const prepared=await prepareRecording(blob,{signal:controller.signal});
      if(signal?.aborted||epoch!==recordEpoch)return;
      audioURL=URL.createObjectURL(blob);audio.src=audioURL;pending=prepared;
      status.textContent=`${prepared.duration.toFixed(1)} seconds ready to preview. ${prepared.warning}`;
    }catch(error){if(signal?.aborted||epoch!==recordEpoch)return;throw error;}
    finally{if(preparation===controller)preparation=null;}
  }
  const record=action('Record my voice',async()=>{
    recordingAvailable();if(capture)throw new Error('Stop the current recording first.');cleanup();const epoch=recordEpoch;
    await permission('microphone');if(signal?.aborted||epoch!==recordEpoch)return;
    if(!navigator.mediaDevices?.getUserMedia||!globalThis.MediaRecorder)throw new Error('Recording needs HTTPS or localhost and a browser that supports microphone recording.');
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:true},video:false});
    if(signal?.aborted||epoch!==recordEpoch){stream.getTracks().forEach(track=>track.stop());return;}
    let recorder;try{recorder=new MediaRecorder(stream);}catch(error){stream.getTracks().forEach(track=>track.stop());throw error;}
    const session={stream,recorder,epoch,chunks:[],timer:null};capture=session;
    recorder.ondataavailable=event=>{if(capture===session&&event.data.size)session.chunks.push(event.data);};
    recorder.onstop=()=>{
      stream.getTracks().forEach(track=>track.stop());clearTimeout(session.timer);
      if(capture!==session||signal?.aborted||epoch!==recordEpoch)return;
      const blob=new Blob(session.chunks,{type:recorder.mimeType});session.chunks.length=0;
      capture=null;recorder.onstop=recorder.ondataavailable=recorder.onerror=null;
      stage(blob).catch(error=>{if(error.name!=='AbortError'&&!signal?.aborted)status.textContent=error.message;});
    };
    recorder.onerror=()=>{if(capture!==session)return;cleanup();if(!signal?.aborted)status.textContent='Recording failed. Check microphone access and try again.';};
    try{recorder.start();}catch(error){cleanup();throw error;}
    status.textContent='Recording now · read the phrase, then press Stop recording. Auto-stops at 29 seconds.';
    session.timer=setTimeout(()=>{if(capture===session&&recorder.state==='recording')recorder.stop();},29000);
  });
  root.append(record,action('Stop recording',()=>{if(capture?.recorder.state==='recording')capture.recorder.stop();else if(!capture){cleanup();status.textContent='Recording stopped.';}}));
  const upload=el('input');upload.type='file';upload.accept='audio/*';upload.setAttribute('aria-label','Upload my voice recording');
  upload.onchange=async()=>{
    const file=upload.files[0];upload.value='';if(!file)return;
    try{recordingAvailable();cleanup();const epoch=recordEpoch;await permission('files',{picked:true});if(signal?.aborted||epoch!==recordEpoch)return;await stage(file);}
    catch(error){if(error.name!=='AbortError'&&!signal?.aborted)status.textContent=error.message;}
  };root.append(upload);
  const select=field('cloneId','Saved voice recording',draft.cloneId,[{value:'',label:'Choose a saved recording'}]);
  async function refresh(){const result=await helper('samples',{}, {signal});if(signal?.aborted)return;const selected=select.value||draft.cloneId;select.replaceChildren(new Option('Choose a saved recording',''));for(const sample of result.samples||[])select.append(new Option(`${sample.name} · ${Number(sample.duration).toFixed(1)}s`,sample.id));select.value=selected;return result;}
  root.append(action('Check voice setup & recordings',async()=>{const capability=await helper('status',{}, {signal});if(signal?.aborted)return;status.textContent=capability.message||JSON.stringify(capability);await refresh();}),action('Save my voice recording',async()=>{if(!consent.checked)throw new Error('Confirm that this is your own voice before saving it.');if(!pending)throw new Error('Record or upload and preview a sample first.');const sample=pending;saving=true;try{const result=await helper('sample/add',{name:recordingName.value,base64:sample.base64,consent:true},{signal});if(signal?.aborted)return;await refresh();assertOpen();cleanup();select.value=result.id||result.sample?.id||'';draft.cloneId=select.value;status.textContent='Your recording is saved on this Mac. Select My cloned voice, then hear a preview.';}finally{saving=false;}}),action('Delete selected recording',async()=>{if(!select.value)throw new Error('Choose a recording to delete.');await helper('sample/delete',{id:select.value},{signal});if(signal?.aborted)return;select.value='';draft.cloneId='';await refresh();status.textContent='Recording and its derived voice data deleted from this Mac.';}),action('Discard unsaved recording',()=>{recordingAvailable();cleanup();status.textContent='Unsaved recording discarded.';}));
  root.append(el('p','A cloned voice needs the optional local voice runtime on the Mac you are paired with. It will not follow you to another device automatically. Small changes work best; strong pitch changes can sound less natural.','muted'));
  root.append(action('Install local dictation language',async()=>{await permission('internet');assertOpen();await voice.installLanguage(languages[bindings.language.value]);assertOpen();status.textContent='On-device dictation language is ready.';}),action('Save voice settings',async()=>{const candidate=values();cleanup();if(candidate.voice.engine==='clone'&&!candidate.voice.cloneId)throw new Error('Choose a saved voice recording first.');if(await onSave(candidate)===false)throw new Error('Voice settings could not be saved. Keep this window open.');assertOpen();status.textContent='Voice settings saved on this device.';onNotice(status.textContent);}));
  return root;
}
