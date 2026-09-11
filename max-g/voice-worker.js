/** Dedicated CPU/WASM voice worker. Text and audio never leave this device. */
import {NEURAL_VOICES} from './voice-config.js';
const LIBRARY='https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js';
let engine=null,loading=null,generating=false;
async function load(id){
  if(engine)return;
  if(!loading)loading=(async()=>{
    const {KokoroTTS}=await import(LIBRARY);
    engine=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{
      dtype:'q8',device:'wasm',progress_callback:p=>self.postMessage({id,type:'progress',text:String(p.status||'Loading')+(p.progress!=null?` · ${Math.round(p.progress)}%`:''),file:String(p.file||'').slice(0,160)})
    });
  })().finally(()=>{loading=null;});
  await loading;
}
self.onmessage=async({data})=>{
  const {id,type}=data;
  let ownsGeneration=false;
  try{
    if(type==='load'){await load(id);self.postMessage({id,type:'ready'});return;}
    if(type!=='generate')throw new Error('Unknown voice operation.');
    if(!engine)throw new Error('Load the neural voice first.');
    if(typeof data.text!=='string'||!data.text.trim()||data.text.length>280)throw new Error('Voice sentence is empty or too long.');
    if(!NEURAL_VOICES.some(v=>v.id===data.voice)||!Number.isFinite(data.speed)||data.speed<.65||data.speed>1.5)throw new Error('Invalid voice delivery settings.');
    if(generating)throw new Error('A voice sentence is already being generated.');
    generating=true;ownsGeneration=true;
    const audio=await engine.generate(data.text,{voice:data.voice,speed:data.speed});
    // Transfer owned PCM directly; copying it would double the live audio buffer.
    const samples=audio.audio instanceof Float32Array?audio.audio:new Float32Array(audio.audio),sampleRate=audio.sampling_rate??24000;
    if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000||!samples.length||samples.length>sampleRate*45||!samples.every(Number.isFinite))throw new Error('The voice returned invalid audio.');
    const transferable=samples.byteOffset===0&&samples.byteLength===samples.buffer.byteLength?samples:samples.slice();
    self.postMessage({id,type:'audio',sampleRate,samples:transferable.buffer},[transferable.buffer]);
  }catch(error){self.postMessage({id,type:'error',message:String(error?.message||error).slice(0,400)});}
  finally{if(ownsGeneration)generating=false;}
};
