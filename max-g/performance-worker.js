import {composePerformance,renderComposition} from './music-composer.js';
import {decodeVocalBank,renderSongVocals} from './song-vocals.js';

async function vocalBank(){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  const limit=1500000;let reader;
  try{
    const response=await fetch(new URL('./assets/song/male-syllables-v1.json',import.meta.url),{signal:controller.signal});
    if(!response.ok||Number(response.headers.get('content-length'))>limit||!response.body)throw new Error('Singing audio is missing. Reopen MAX-G online to finish its update.');
    reader=response.body.getReader();let length=0;const chunks=[];
    while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit)throw new Error('Singing audio exceeds its size limit.');chunks.push(value);}
    const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    return decodeVocalBank(JSON.parse(new TextDecoder().decode(bytes)));
  }finally{clearTimeout(timer);controller.abort();try{await reader?.cancel();}catch{}}
}

// Only bounded original compositions. No user audio, models, or remote URLs.
self.onmessage=async({data})=>{
  if(data?.type!=='render'){self.postMessage({error:'Unknown performance request.'});return;}
  try {
    const started=performance.now(),composition=composePerformance({kind:data.kind,seed:data.seed});
    const sampleRate=24000,samples=renderComposition(composition,sampleRate,{vocal:false});
    if(composition.kind==='sing'){
      const bank=await vocalBank();
      const vocals=renderSongVocals(composition,bank,{sampleRate});
      if(!(vocals instanceof Float32Array)||vocals.length!==samples.length)throw new Error('Invalid singing audio.');
      for(let i=0;i<samples.length;i++)samples[i]+=vocals[i];
    }
    let peak=0;for(const value of samples){if(!Number.isFinite(value))throw new Error('Invalid audio sample.');peak=Math.max(peak,Math.abs(value));}
    const gain=peak>.7?.7/peak:1;for(let i=0;i<samples.length;i++)samples[i]*=gain;
    self.postMessage({id:composition.id,samples,sampleRate,renderMs:performance.now()-started},[samples.buffer]);
  }catch(error){self.postMessage({error:error?.message||'The original music could not be prepared.'});}
};
