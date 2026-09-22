/** Local voice preferences only. Reference recordings never enter personal chat state. */
export const NEURAL_VOICES=Object.freeze([
  {id:'af_heart',name:'Heart · female · warm American',language:'en-US'},
  {id:'af_bella',name:'Bella · female · bright American',language:'en-US'},
  {id:'af_nicole',name:'Nicole · female · soft American',language:'en-US'},
  {id:'am_fenrir',name:'Fenrir · male · warm American',language:'en-US'},
  {id:'am_puck',name:'Puck · male · lively American',language:'en-US'},
  {id:'bm_george',name:'George · male · measured British',language:'en-GB'},
]);
// Perceived age is a delivery style, not verified speaker-age metadata.
export const MALE_VOICE_PRESETS=Object.freeze([
  Object.freeze({id:'young',name:'Young adult',description:'Lively, light American male voice · Puck',neuralVoice:'am_puck',rate:1.04,pitch:.5,depth:0,expression:.45}),
  Object.freeze({id:'adult',name:'Adult',description:'Warm, steady American male voice · Fenrir',neuralVoice:'am_fenrir',rate:1,pitch:0,depth:1,expression:.35}),
  Object.freeze({id:'older',name:'Older-sounding',description:'Calm, measured British male voice · George',neuralVoice:'bm_george',rate:.92,pitch:-.5,depth:1.5,expression:.3}),
]);
export const VOICE_DEFAULTS=Object.freeze({voiceRevision:1,recognitionMode:'local',engine:'neural',neuralVoice:'am_fenrir',pitch:0,depth:1,expression:0.35,cloneId:''});
const number=(n,min,max,fallback)=>typeof n==='number'&&Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
export function normalizeVoice(value={}){value=value&&typeof value==='object'?value:{};
const engine=['neural','system','clone'].includes(value.engine)?value.engine:'neural';
const migrated=Number.isInteger(value.voiceRevision)&&value.voiceRevision>=1;
// Michael requested a male default. Apply once to legacy neural female choices;
// retain recorded-voice/system settings and any later deliberate selection.
const legacyFemale=engine==='neural'&&!migrated&&/^af_/.test(value.neuralVoice||'');
return {
  voiceRevision:1,recognitionMode:value.recognitionMode==='browser'?'browser':'local',engine,
  neuralVoice:!legacyFemale&&NEURAL_VOICES.some(v=>v.id===value.neuralVoice)?value.neuralVoice:VOICE_DEFAULTS.neuralVoice,
  pitch:number(value.pitch,-4,4,0),depth:number(value.depth,-6,6,VOICE_DEFAULTS.depth),expression:number(value.expression,0,1,.35),
  cloneId:typeof value.cloneId==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value.cloneId)?value.cloneId:'',
};}
export function applyMaleVoicePreset(settings,presetId){
  const preset=MALE_VOICE_PRESETS.find(item=>item.id===presetId);
  if(!preset)throw new Error('Choose Young adult, Adult, or Older-sounding.');
  return {...settings,rate:preset.rate,voice:normalizeVoice({...normalizeVoice(settings?.voice),voiceRevision:1,engine:'neural',neuralVoice:preset.neuralVoice,pitch:preset.pitch,depth:preset.depth,expression:preset.expression})};
}
export function sentenceChunks(text,limit=220,{firstLimit=limit}={}){
  limit=Math.round(number(limit,80,280,220));firstLimit=Math.round(number(firstLimit,80,limit,limit));
  const clean=String(text).trim().slice(0,32000).replace(/[\uD800-\uDBFF]$/u,''),chunks=[];
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
  if(chunks.length>32){
    const packed=[chunks[0]];
    for(const chunk of chunks.slice(1)){const last=packed.length-1;if(last>0&&packed[last].length+chunk.length+1<=limit)packed[last]+=' '+chunk;else packed.push(chunk);}
    return packed;
  }
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


const quietMoods=new Set(['sad','concerned','thoughtful','sleepy','frustrated','supportive','calm']);
const tenderText=/\b(?:sorry (?:for|about|to hear)|that sounds (?:hard|painful|overwhelming)|take (?:your time|a breath)|one step at a time|here to listen|griev(?:e|ing)|bereave\w*|suicid\w*|self[- ]harm|passed away|died|funeral|cancer)\b/i;
const celebratoryText=/\b(?:congratulations|congrats|well done|you did it|that's wonderful|that is wonderful|great news|happy birthday|let's celebrate)\b/i;
const cheerfulMoods=new Set(['happy','joyful','excited','playful','proud','surprised']);
/** A delivery plan changes speech style, never the answer's words (except an
 * explicitly requested optional spoken "Ha!"). It does not simulate feelings
 * or promise nonverbal human laughter from a text-to-speech model. */
export function speechPlan(text,{limit=220,firstLimit=120,emotion='neutral',expression=.35,laughter=true,chuckle=false,...options}={}){
  const express=number(expression,0,1,.35),original=String(text).trim();
  const sensitive=quietMoods.has(emotion)||tenderText.test(original);
  const useChuckle=chuckle===true&&laughter===true&&express>0&&cheerfulMoods.has(emotion)&&!sensitive&&!/^\s*(?:ha(?:ha)*|heh(?:e)?)\b/i.test(original);
  // Leave room for the tiny spoken cue while retaining synthesis size bounds.
  const chunks=sentenceChunks(original,limit,{firstLimit:useChuckle?Math.max(80,firstLimit-4):firstLimit});
  if(useChuckle&&chunks[0]&&chunks[0].length+4>Math.max(80,Math.min(limit,firstLimit)))chunks.unshift('');
  return chunks.map((chunk,index)=>{
    let mood=emotion,beat=false;
    if(sensitive)mood=quietMoods.has(emotion)?emotion:'concerned';
    else if(tenderText.test(chunk))mood='concerned';
    else if(celebratoryText.test(chunk))mood='joyful';
    else if(/[?？]["'”’)]*$/.test(chunk)&&['neutral','happy','joyful','excited','proud'].includes(emotion))mood='curious';
    if(mood==='supportive'||mood==='calm')mood='affectionate';
    // A small pause and settling cadence lets a question-and-answer joke land.
    // Ordinary questions receive no extra delay; the model/root must select playfulness.
    if(!sensitive&&emotion==='playful'&&index>0&&/[?？]["'”’)]*$/.test(chunks[index-1]))beat=true;
    const spoken=index===0&&useChuckle?'Ha! '+chunk:chunk;
    const controls=deliveryControls({...options,emotion:mood,expression:express,text:spoken});
    if(beat&&express>0){controls.speed=number(controls.speed*(1-.035*express),.65,1.5,1);controls.pitch=number(controls.pitch-.12*express,-4,4,0);}
    return {text:spoken,emotion:mood,controls,pauseBeforeMs:beat&&express>0?Math.round(90+90*express):0,chuckle:index===0&&useChuckle};
  });
}
/** Deliberate delivery beats are owned by the speaker and cancel immediately
 * when Stop is pressed, including when no native audio callback is pending. */
export function deliveryPause(milliseconds,{signal,cancellations}={}){
  if(signal?.aborted)return Promise.reject(new DOMException('Voice stopped.','AbortError'));
  const delay=number(milliseconds,0,250,0);if(!delay)return Promise.resolve();
  return new Promise((resolve,reject)=>{
    let finished=false,timer;
    const finish=error=>{if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);cancellations?.delete(cancel);error?reject(error):resolve();};
    const cancel=()=>finish(new DOMException('Voice stopped.','AbortError'));
    cancellations?.add(cancel);signal?.addEventListener('abort',cancel,{once:true});
    timer=setTimeout(()=>finish(),delay);
    if(signal?.aborted)cancel();
  });
}
