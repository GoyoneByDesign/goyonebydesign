/** Local voice preferences only. Reference recordings never enter personal chat state. */
export const NEURAL_VOICES=Object.freeze([
  {id:'af_heart',name:'Heart · warm American',language:'en-US'},
  {id:'af_bella',name:'Bella · bright American',language:'en-US'},
  {id:'af_nicole',name:'Nicole · soft American',language:'en-US'},
  {id:'am_fenrir',name:'Fenrir · rich American',language:'en-US'},
  {id:'am_puck',name:'Puck · lively American',language:'en-US'},
  {id:'bm_george',name:'George · British',language:'en-GB'},
]);
export const VOICE_DEFAULTS=Object.freeze({engine:'neural',neuralVoice:'af_heart',pitch:0,depth:0,expression:0.35,cloneId:''});
const number=(n,min,max,fallback)=>typeof n==='number'&&Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
export function normalizeVoice(value={}){value=value&&typeof value==='object'?value:{};return {
  engine:['neural','system','clone'].includes(value.engine)?value.engine:'neural',
  neuralVoice:NEURAL_VOICES.some(v=>v.id===value.neuralVoice)?value.neuralVoice:'af_heart',
  pitch:number(value.pitch,-4,4,0),depth:number(value.depth,-6,6,0),expression:number(value.expression,0,1,.35),
  cloneId:typeof value.cloneId==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value.cloneId)?value.cloneId:'',
};}
export function sentenceChunks(text,limit=220,{firstLimit=limit}={}){
  limit=Math.round(number(limit,80,280,220));firstLimit=Math.round(number(firstLimit,80,limit,limit));
  const clean=String(text).trim().slice(0,1800).replace(/[\uD800-\uDBFF]$/u,''),chunks=[];
  // Native sentence segmentation preserves decimals, abbreviations and CJK
  // punctuation. The fallback keeps full stops together rather than saying 3.14
  // as two sentences on a browser without Intl.Segmenter.
  const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'sentence'}):null;
  for(const paragraph of clean.split(/\n+/)){
    const sentences=segmenter?[...segmenter.segment(paragraph)].map(s=>s.segment):paragraph.match(/[^!?。！？]+[!?。！？]*|[!?。！？]+/gu)||[];
    for(const sentence of sentences){
      let chunk='';const bound=()=>chunks.length?limit:firstLimit;
      for(const word of sentence.trim().split(/\s+/).filter(Boolean)){
        if(chunk&&chunk.length+word.length+1>bound()){chunks.push(chunk);chunk='';}
        if(word.length>bound()){
          for(const char of word){if(chunk.length+char.length>bound()){chunks.push(chunk);chunk='';}chunk+=char;}
        }else chunk+=(chunk?' ':'')+word;
      }
      if(chunk)chunks.push(chunk);
    }
  }
  // Avoid many tiny synthesis calls without silently dropping the reply's tail.
  while(chunks.length>32){let best=-1,size=Infinity;for(let i=1;i<chunks.length-1;i++){const n=chunks[i].length+chunks[i+1].length+1;if(n<=limit&&n<size){best=i;size=n;}}if(best<0)break;chunks.splice(best,2,chunks[best]+' '+chunks[best+1]);}
  return chunks;
}
export function deliveryControls({rate=1,pitch=0,depth=0,expression=.35,emotion='neutral',text=''}={}){
  const express=number(expression,0,1,.35),mood={
    happy:[.035,.3],joyful:[.04,.35],excited:[.05,.4],playful:[.035,.4],proud:[.015,.15],
    affectionate:[-.02,.1],sad:[-.045,-.3],concerned:[-.025,-.15],thoughtful:[-.02,0],
    curious:[-.01,.15],confused:[-.02,.1],surprised:[.015,.25],embarrassed:[-.025,-.1],sleepy:[-.05,-.25],frustrated:[-.02,-.15],
  }[emotion]||[0,0];
  const ending=String(text).trim(),subdued=['sad','concerned','thoughtful','sleepy','frustrated'].includes(emotion);
  const punctuation=/[?？]["'”’)]*$/.test(ending)?[-.01,.12]:/[!！]["'”’)]*$/.test(ending)&&!subdued?[.012,.08]:/(?:…|\.\.\.)["'”’)]*$/.test(ending)?[-.02,-.08]:[0,0];
  return {speed:number(number(rate,.65,1.5,1)*(1+(mood[0]+punctuation[0])*express),.65,1.5,1),pitch:number(number(pitch,-4,4,0)+(mood[1]+punctuation[1])*express,-4,4,0),depth:number(depth,-6,6,0)};
}
