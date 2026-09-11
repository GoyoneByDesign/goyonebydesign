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
export function sentenceChunks(text,limit=220){
  const clean=String(text).trim().slice(0,1800),chunks=[];
  for(const sentence of clean.match(/[^.!?\n]+[.!?\n]*|[.!?]+/g)||[]){
    const words=sentence.trim().split(/\s+/);let chunk='';
    for(const word of words){if(chunk&&chunk.length+word.length+1>limit){chunks.push(chunk);chunk='';}if(word.length>limit){if(chunk)chunks.push(chunk);chunk='';for(let i=0;i<word.length;i+=limit)chunks.push(word.slice(i,i+limit));}else chunk+=(chunk?' ':'')+word;}
    if(chunk)chunks.push(chunk);
  }
  return chunks.slice(0,32);
}
export function deliveryControls({rate=1,pitch=0,depth=0,expression=.35,emotion='neutral'}={}){
  const express=number(expression,0,1,.35),mood={happy:[.035,.3],excited:[.055,.45],playful:[.04,.5],sad:[-.045,-.35],concerned:[-.025,-.15],thoughtful:[-.02,0]}[emotion]||[0,0];
  return {speed:number(rate,.65,1.5,1)*(1+mood[0]*express),pitch:number(pitch,-4,4,0)+mood[1]*express,depth:number(depth,-6,6,0)};
}
