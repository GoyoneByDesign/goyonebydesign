/** Bounded local personal data. No network calls; model weights use a separate WebLLM store. */
import {freshImprovement,validateImprovement} from './improvement.js';
import {normalizeProfile,normalizeDisplay} from './profile.js';
import {normalizeVoice} from './voice-config.js';
import {normalizeOrbitSettings} from './orbit.js';
export const DB_NAME='maxg-personal-v1';
export const LANGUAGES={'Auto-detect':'en-US',English:'en-US',Tagalog:'fil-PH',Spanish:'es-ES','Chinese (Mandarin)':'zh-CN',Japanese:'ja-JP',Italian:'it-IT',Russian:'ru-RU',Korean:'ko-KR'};
export const DEFAULTS=Object.freeze({model:'Llama-3.2-1B-Instruct-q4f16_1-MLC',language:'Auto-detect',style:'Friendly',replyLength:'Brief',instructions:'',onlineFirst:true,proxyURL:'',weatherCity:'',speak:true,voiceProfile:'Warm',voiceURI:'',rate:1,motion:true,theme:'Dark',saveChats:false,useMemory:true,accessMode:'Limited',permissions:{internet:'allow',files:'ask',microphone:'ask'},hourlyLearning:false,voice:normalizeVoice(),orbit:normalizeOrbitSettings()});
const validTime=(value,fallback)=>Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<8640000000000000?Number(value):fallback;
export function freshState(){return {version:1,profile:normalizeProfile(),display:normalizeDisplay(),settings:structuredClone(DEFAULTS),chats:[],notes:[],skills:[],jobs:[],improvement:freshImprovement(),study:{nextRun:Date.now()+3600000,cursor:0,history:[]}};}
export function validateState(raw){
  const clean=freshState(); if(!raw||typeof raw!=='object')return clean;
  clean.improvement=validateImprovement(raw.improvement);clean.profile=normalizeProfile(raw.profile);clean.display=normalizeDisplay(raw.display);
  const s=raw.settings||{};
  for(const [key,base]of Object.entries(DEFAULTS))if(key!=='permissions'&&typeof s[key]===typeof base)clean.settings[key]=s[key];
  clean.settings.voice=normalizeVoice(s.voice);clean.settings.orbit=normalizeOrbitSettings(s.orbit);
  for(const key of ['internet','files','microphone'])if(['ask','allow','deny'].includes(s.permissions?.[key]))clean.settings.permissions[key]=s.permissions[key];
  if(!Object.hasOwn(LANGUAGES,clean.settings.language))clean.settings.language='Auto-detect';
  for(const [key,values]of Object.entries({style:['Friendly','Professional','Casual','Playful'],replyLength:['Brief','Detailed'],accessMode:['Limited','Full'],voiceProfile:['Warm','Bright','Calm','Storyteller','Focused','Playful'],theme:['Dark','Light']}))if(!values.includes(clean.settings[key]))clean.settings[key]=DEFAULTS[key];
  for(const key of ['instructions','proxyURL','weatherCity','voiceURI'])clean.settings[key]=clean.settings[key].slice(0,key==='instructions'?1200:300);
  clean.settings.rate=Math.min(1.5,Math.max(.65,Number.isFinite(clean.settings.rate)?clean.settings.rate:1));
  clean.notes=(Array.isArray(raw.notes)?raw.notes:[]).filter(n=>n&&typeof n.id==='string'&&typeof n.text==='string').slice(-60).map(n=>({id:n.id.slice(0,80),title:String(n.title||'Note').slice(0,150),text:n.text.slice(0,2000),source:String(n.source||'Michael · direct note').slice(0,2000),enabled:n.enabled!==false,kind:n.kind==='study'?'study':'manual',time:validTime(n.time,Date.now())}));
  clean.skills=(Array.isArray(raw.skills)?raw.skills:[]).filter(n=>n&&typeof n.text==='string').slice(-20).map(n=>({id:String(n.id||crypto.randomUUID()),name:String(n.name||'Skill').slice(0,80),text:n.text.slice(0,1500),enabled:n.enabled!==false}));
  clean.jobs=(Array.isArray(raw.jobs)?raw.jobs:[]).filter(n=>n&&typeof n.query==='string').slice(-10).map(n=>({id:String(n.id||crypto.randomUUID()),query:n.query.slice(0,500),minutes:Math.max(15,Math.min(10080,Number(n.minutes)||60)),nextRun:validTime(n.nextRun,Date.now()+3600000),enabled:n.enabled===true,last:String(n.last||'Not run').slice(0,500)}));
  clean.chats=(Array.isArray(raw.chats)?raw.chats:[]).slice(0,12).filter(c=>c&&Array.isArray(c.messages)).map(c=>({id:String(c.id||crypto.randomUUID()),title:String(c.title||'Conversation').slice(0,80),messages:c.messages.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').slice(-40).map(m=>({id:typeof m.id==='string'?m.id.slice(0,80):crypto.randomUUID(),model:typeof m.model==='string'?m.model.slice(0,160):'Unrecorded older reply',role:m.role,content:m.content.slice(0,16000),sources:Array.isArray(m.sources)?m.sources.slice(0,4).filter(x=>x&&typeof x.url==='string').map(x=>({title:String(x.title||'Source').slice(0,200),url:x.url.slice(0,2000)})):[]}))}));
  if(raw.study&&typeof raw.study==='object')clean.study={nextRun:validTime(raw.study.nextRun,Date.now()+3600000),cursor:Number.isFinite(Number(raw.study.cursor))?Math.max(0,Math.floor(Number(raw.study.cursor)))%100000:0,history:Array.isArray(raw.study.history)?raw.study.history.filter(x=>x&&typeof x==='object').slice(-24).map(x=>({time:validTime(x.time,Date.now()),text:String(x.text||'').slice(0,500)})):[]};
  return clean;
}
function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>request.result.createObjectStore('state');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function loadState(){const db=await database();try{return await new Promise((resolve,reject)=>{const request=db.transaction('state').objectStore('state').get('personal');request.onsuccess=()=>resolve(validateState(request.result));request.onerror=()=>reject(request.error);});}finally{db.close();}}
export async function saveState(state){const db=await database();try{const value=validateState(state);if(!value.settings.saveChats)value.chats=[];await new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(value,'personal');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Storage transaction aborted.'));});}finally{db.close();}}
export function memoryContext(notes,query,budget=900){const terms=new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]);return notes.filter(n=>n.enabled).map(n=>({n,score:[...terms].filter(t=>(n.title+' '+n.text).toLowerCase().includes(t)).length})).filter(x=>x.score).sort((a,b)=>b.score-a.score).slice(0,3).map(x=>`${x.n.title}: ${x.n.text}`).join('\n').slice(0,budget);}
export function isResetCode(text){const value=String(text).trim().toLowerCase().replace(/[.,!?]$/,'');if(value==='1435254')return true;return value==='1 4 3 5 2 5 4'||value==='one four three five two five four';}
