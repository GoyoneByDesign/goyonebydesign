/** Dedicated CPU/WASM voice worker. Text and audio never leave this device. */
const LIBRARY='https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js';
let engine=null,loading=null;
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
  try{
    if(type==='load'){await load(id);self.postMessage({id,type:'ready'});return;}
    if(type!=='generate')throw new Error('Unknown voice operation.');
    if(!engine)throw new Error('Load the neural voice first.');
    if(typeof data.text!=='string'||data.text.length>300)throw new Error('Voice sentence is too long.');
    const audio=await engine.generate(data.text,{voice:data.voice,speed:data.speed});
    const samples=new Float32Array(audio.audio);
    if(!samples.length||samples.length>24000*90||!samples.every(Number.isFinite))throw new Error('The voice returned invalid audio.');
    self.postMessage({id,type:'audio',sampleRate:audio.sampling_rate||24000,samples:samples.buffer},[samples.buffer]);
  }catch(error){self.postMessage({id,type:'error',message:String(error?.message||error).slice(0,400)});}
};
