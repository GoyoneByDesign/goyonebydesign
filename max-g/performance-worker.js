import {renderSong} from './performance.js';

// Only the fixed original tune can be requested; no text, microphone or network.
self.onmessage=({data})=>{
  if(data?.type!=='render'){self.postMessage({error:'Unknown performance request.'});return;}
  try {
    const started=performance.now(),audio=renderSong();
    self.postMessage({samples:audio.samples,sampleRate:audio.sampleRate,renderMs:performance.now()-started},[audio.samples.buffer]);
  }catch{self.postMessage({error:'The original tune could not be prepared.'});}
};
