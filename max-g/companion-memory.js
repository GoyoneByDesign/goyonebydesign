/** Explicit personal notes, stored by the caller on this device. No passive profiling. */
export const MAX_PERSONAL_MEMORIES=24;
export const MAX_PERSONAL_MEMORY_CHARS=280;
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const compact=value=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/gu,' ').replace(/\s+/gu,' ').trim():'';
const clock=value=>Number.isFinite(value)&&value>=0?Math.floor(value):Date.now();
const timestamp=(value,now)=>Number.isFinite(value)&&value>0?Math.min(Math.floor(value),now):0;
const personal=/^(?:i(?:\b|['’](?:m|ve|d|ll)\b)|my\b|we(?:\b|['’](?:re|ve|d|ll)\b)|our\b)/iu;

/** Credentials belong in a credential store, never in conversational reference notes. */
function safeText(value){
  const text=compact(value);
  if(!text||text.length>MAX_PERSONAL_MEMORY_CHARS)return '';
  if(/-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{16,})\b/iu.test(text))return '';
  if(/\b(?:password|passphrase|passcode|api[ -]?key|access[ -]?token|auth(?:entication)?[ -]?token|secret[ -]?key|private[ -]?key|recovery[ -]?(?:code|phrase)|seed[ -]?phrase|social[ -]?security[ -]?(?:number|no)|ssn|credit[ -]?card[ -]?(?:number|no)|bank[ -]?account[ -]?(?:number|no))\s*(?:is\b|are\b|=|:)/iu.test(text))return '';
  if(/\b\d{3}-\d{2}-\d{4}\b/u.test(text))return '';
  return text;
}

/** A bounded, serializable schema; unknown fields and invalid records are discarded. */
export function normalizeCompanionMemory(value,{now=Date.now()}={}){
  now=clock(now);
  const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const result={enabled:source.enabled!==false,checkIns:source.checkIns!==false,cloudMemory:source.cloudMemory===true,lastCheckIn:timestamp(source.lastCheckIn,now),historyBoundaries:{},memories:[]};
  // Counts exclude older visible turns from future model context after a privacy change.
  // They hold no conversation text and survive edits, deletion, and reloading this device.
  if(source.historyBoundaries&&typeof source.historyBoundaries==='object'&&!Array.isArray(source.historyBoundaries)){
    for(const [id,count] of Object.entries(source.historyBoundaries).slice(0,100)){
      if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/iu.test(id)||!Number.isInteger(count)||count<0||count>40)continue;
      result.historyBoundaries[id]=count;
      if(Object.keys(result.historyBoundaries).length===13)break;
    }
  }
  const ids=new Set(),texts=new Set();
  for(const [index,item] of (Array.isArray(source.memories)?source.memories:[]).slice(0,100).entries()){
    if(!item||typeof item!=='object'||Array.isArray(item))continue;
    const text=safeText(item.text),key=text.toLocaleLowerCase();
    if(!text||texts.has(key))continue;
    let id=typeof item.id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/u.test(item.id)?item.id:`memory-${index+1}`;
    const base=id;
    for(let suffix=2;ids.has(id);suffix++)id=`${base.slice(0,56)}-${suffix}`;
    ids.add(id);texts.add(key);
    result.memories.push({id,text,enabled:item.enabled!==false,createdAt:timestamp(item.createdAt,now)||now,checkIn:item.checkIn===true,lastCheckIn:timestamp(item.lastCheckIn,now)});
    if(result.memories.length===MAX_PERSONAL_MEMORIES)break;
  }
  result.lastCheckIn=Math.max(result.lastCheckIn,...result.memories.map(item=>item.lastCheckIn));
  return result;
}

/** Only direct personal-memory requests; general "remember" notes retain their old route. */
export function memoryCommand(value){
  const input=compact(value).replace(/[‘’]/gu,"'");
  if(!input||input.length>MAX_PERSONAL_MEMORY_CHARS+100)return null;
  const text=input.replace(/^max[- ]?g[, :]\s*/iu,'').replace(/^please\s+/iu,'').replace(/^(?:can|could|would|will) you\s+/iu,'').replace(/^please\s+/iu,'');
  if(/^(?:(?:what|which (?:things|details)) do you (?:remember|know) about me|(?:show|list|tell)(?: me)? (?:what you remember about me|my (?:personal |saved )?memories))(?:[.!?]*)$/iu.test(text))return {kind:'recall',type:'recall'};
  const match=/^remember(?: (?:this )?about me)?(?:\s*:\s*|\s+)(?:that\s+)?(.+?)\s*[.!]?$/iu.exec(text);
  if(!match||!personal.test(match[1]))return null;
  return {kind:'save',type:'remember',text:match[1].trim(),checkIn:false};
}

/** The caller supplies UI text or the exact, explicit command payload, never model output. */
export function addMemory(value,text,{now=Date.now(),id,checkIn=false}={}){
  now=clock(now);
  const state=normalizeCompanionMemory(value,{now}),clean=safeText(text);
  if(!state.enabled)return {state,status:'disabled'};
  if(!clean)return {state,status:'invalid'};
  const duplicate=state.memories.find(item=>item.text.toLocaleLowerCase()===clean.toLocaleLowerCase());
  if(duplicate)return {state,status:'duplicate',memory:duplicate};
  if(state.memories.length>=MAX_PERSONAL_MEMORIES)return {state,status:'full'};
  let nextId=typeof id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/u.test(id)?id:`memory-${now.toString(36)}`;
  const base=nextId;
  for(let suffix=2;state.memories.some(item=>item.id===nextId);suffix++)nextId=`${base.slice(0,56)}-${suffix}`;
  const memory={id:nextId,text:clean,enabled:true,createdAt:now,checkIn:checkIn===true,lastCheckIn:0};
  state.memories.push(memory);
  return {state,status:'saved',memory};
}

/** Callers must clear any model context containing previous notes after privacy changes. */
export function removeMemory(value,id){
  const state=normalizeCompanionMemory(value);
  state.memories=state.memories.filter(item=>item.id!==id);
  return state;
}

/** Editing never changes the record identity or resets the daily check-in limit. */
export function updateMemory(value,id,patch={}){
  const state=normalizeCompanionMemory(value);
  const record=state.memories.find(item=>item.id===id);
  if(!record||!patch||typeof patch!=='object')return state;
  if(own(patch,'text')){
    const text=safeText(patch.text);
    if(text&&!state.memories.some(item=>item.id!==id&&item.text.toLocaleLowerCase()===text.toLocaleLowerCase()))record.text=text;
  }
  if(typeof patch.enabled==='boolean')record.enabled=patch.enabled;
  if(typeof patch.checkIn==='boolean')record.checkIn=patch.checkIn;
  return state;
}

const STOP_WORDS=new Set('a an and are as at be been but by can do for from had has have how i if in is it its me my of on or our that the their them then there these they this to was we were what when which who why will with you your'.split(' '));
const words=value=>new Set((compact(value).toLocaleLowerCase().match(/[\p{L}\p{N}]{2,}/gu)||[]).filter(word=>!STOP_WORDS.has(word)));

/** JSON reference data only. Put this in a labeled untrusted context block, never in system instructions. */
export function memoryReference(value,query,{cloud=false,maxChars=600}={}){
  const state=normalizeCompanionMemory(value);
  if(!state.enabled||(cloud===true&&!state.cloudMemory))return '';
  const limit=Math.min(cloud===true?1000:600,Math.max(100,Number.isFinite(maxChars)?Math.floor(maxChars):600));
  const terms=words(query);
  const candidates=state.memories.filter(item=>item.enabled).map(item=>({item,score:[...words(item.text)].reduce((total,term)=>total+(terms.has(term)?1:0),0)})).sort((a,b)=>b.score-a.score||b.item.createdAt-a.item.createdAt);
  const picked=[];
  for(const {item} of candidates){
    const candidate=[...picked,item.text];
    if(JSON.stringify({personalMemory:candidate}).length<=limit)picked.push(item.text);
    if(picked.length===3)break;
  }
  return picked.length?JSON.stringify({personalMemory:picked}):'';
}

const day=value=>{const date=new Date(value);return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;};
const isGreeting=value=>/^(?:hi|hello|hey|good (?:morning|afternoon|evening))(?:[,! .]*max[- ]?g)?[.!?\s]*$/iu.test(compact(value));

/** A local response to a user's greeting, never a background reminder or an emotion inference. */
export function greetingCheckIn(value,text,{now=Date.now()}={}){
  now=clock(now);
  const state=normalizeCompanionMemory(value,{now}),result={state,reply:null};
  if(!state.enabled||!state.checkIns||!isGreeting(text))return result;
  if(state.lastCheckIn>0&&day(state.lastCheckIn)===day(now))return result;
  const topic=state.memories.filter(item=>item.enabled&&item.checkIn).sort((a,b)=>a.lastCheckIn-b.lastCheckIn||a.createdAt-b.createdAt)[0];
  if(!topic)return result;
  topic.lastCheckIn=now;state.lastCheckIn=now;
  result.reply={text:`You asked me to check in about “${topic.text}”. How are you feeling about that today?`,emotion:'thoughtful'};
  return result;
}
