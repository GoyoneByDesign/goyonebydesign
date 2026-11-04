/** Local, additive personal-data recovery. Never imports runtime access/settings. */
import {safePublicURL} from './tools.js';
import {freshState,validateState} from './state.js';
export const BACKUP_LIMIT=12*1024*1024;
const clone=value=>structuredClone(value);
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const stable=value=>JSON.stringify(value,(_,item)=>object(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
export const backupSnapshot=stable;
function inspect(value,depth=0,counter={n:0}){
 if(depth>32||++counter.n>100000)throw Error('Backup structure is too large or deeply nested. Nothing was imported.');
 if(value&&typeof value==='object')for(const [key,item]of Object.entries(value)){
  if(['__proto__','constructor','prototype'].includes(key))throw Error('Unsafe backup field. Nothing was imported.');
  inspect(item,depth+1,counter);
 }
}
// Privacy/access choices stay on this device, even when restoring onto a new device.
function personal(state){
 const profile=clone(state.profile);delete profile.personalize;
 return {version:state.version,profile,finance:clone(state.finance),chats:clone(state.chats),notes:clone(state.notes),skills:clone(state.skills),jobs:clone(state.jobs),improvement:clone(state.improvement),memories:clone(state.companion.memories),studyHistory:clone(state.study.history)};
}
function validatePersonal(data){
 if(!object(data)||data.version!==1)throw Error('Unsupported personal backup version. Nothing was imported.');
 const raw=freshState();Object.assign(raw,{profile:{...data.profile,personalize:raw.profile.personalize},finance:data.finance,chats:data.chats,notes:data.notes,skills:data.skills,jobs:data.jobs,improvement:data.improvement});
 raw.companion.memories=data.memories;raw.study.history=data.studyHistory;
 const result=personal(validateState(raw));
 if(stable(result)!==stable(data))throw Error('Backup contains invalid, missing, unsupported or oversized personal records. Nothing was shortened or imported.');
 for(const chat of result.chats)for(const message of chat.messages)for(const source of message.sources)if(!safePublicURL(source.url))throw Error('Backup contains an unsafe source link. Nothing was imported.');
 // Duplicate identities cannot be merged safely, even when the normal loader permits them.
 for(const rows of [result.chats,result.notes,result.skills,result.jobs,result.memories,result.finance.bills,...Object.values(result.improvement)]){
  if(new Set(rows.map(item=>item.id)).size!==rows.length)throw Error('Backup has duplicate record identities. Nothing was imported.');
 }
 return result;
}
export function createPersonalBackup(state){
 const data=validatePersonal(personal(state));
 return {format:'MAX-ALPHA-personal',schema:1,data};
}
export function parsePersonalBackup(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>BACKUP_LIMIT)throw Error('Choose a personal backup no larger than 12 MB.');
 let raw;try{raw=JSON.parse(text);}catch{throw Error('This is not a valid JSON backup.');}inspect(raw);
 if(raw?.format==='MAX-ALPHA-personal'){
  if(raw.schema!==1||Object.keys(raw).some(key=>!['format','schema','data'].includes(key)))throw Error('Unsupported backup format.');
  return validatePersonal(raw.data);
 }
 // Older Export personal backup files contained the complete state. Ignore all
 // device settings, tokens, permissions and companion sharing configuration.
 if(raw?.version!==1||!object(raw.settings)||!object(raw.companion)||!object(raw.study))throw Error('Choose a complete MAX-ALPHA personal backup, not a notes-only file.');
 try{return validatePersonal(personal(raw));}catch(error){throw Error('Legacy backup cannot be restored without changing records: '+error.message);}
}
export function previewPersonalRestore(current,data,{saveChats=false}={}){
 const source=validatePersonal(data),next=clone(current),base=freshState(),changes=[],conflicts=[];
 const merge=(target,incoming,limit,label,transform=item=>item)=>{
  const out=clone(target);let added=0;
  for(const original of incoming){
   const item=transform(clone(original)),existing=out.find(row=>row.id===item.id);
   if(existing){if(stable(existing)!==stable(original)&&stable(existing)!==stable(item))conflicts.push(label+' has a changed record with the same identity.');continue;}
   out.push(item);added++;
  }
  if(out.length>limit)throw Error(`${label} would exceed the ${limit}-record limit. Nothing was imported; export and keep both backups.`);
  if(added)changes.push(`${label}: add ${added}`);return out;
 };
 next.chats=merge(current.chats,source.chats,12,'Conversations');
 next.notes=merge(current.notes,source.notes,60,'Notes',item=>({...item,enabled:false}));
 next.skills=merge(current.skills,source.skills,20,'Saved workflows',item=>({...item,enabled:false}));
 next.jobs=merge(current.jobs,source.jobs,10,'Schedules',item=>({...item,enabled:false}));
 next.companion.memories=merge(current.companion.memories,source.memories,24,'Personal memories',item=>({...item,enabled:false,checkIn:false}));
 for(const [key,limit]of Object.entries({feedback:100,lessons:40,runs:8}))next.improvement[key]=merge(current.improvement[key],source.improvement[key],limit,key==='runs'?'Check results':key==='lessons'?'Reviewed lessons':'Feedback',item=>key==='lessons'?{...item,enabled:false}:item);
 next.finance.bills=merge(current.finance.bills,source.finance.bills,240,'Bills');
 const fill=(target,incoming,defaults,label)=>{
  for(const [key,value]of Object.entries(incoming)){
   if(stable(value)===stable(target[key])||stable(value)===stable(defaults[key]))continue;
   if(stable(target[key])!==stable(defaults[key])){conflicts.push(`${label}: ${key} differs from the saved value.`);continue;}
   const describe=v=>key==='avatarDataURL'?(v?'PNG image from backup':'No custom image'):label==='Budget plan'&&key!=='month'?(v===null?'Not entered':`USD ${(v/100).toFixed(2)}`):JSON.stringify(v);
   changes.push(`${label}: ${key}: ${describe(target[key])} → ${describe(value)}`);target[key]=clone(value);
  }
 };
 fill(next.profile,source.profile,base.profile,'Profile');
 const {bills,...plan}=source.finance;fill(next.finance,plan,base.finance,'Budget plan');
 const history=clone(current.study.history);
 for(const item of source.studyHistory)if(!history.some(row=>stable(row)===stable(item)))history.push(clone(item));
 if(history.length>24)throw Error('Study history would exceed 24 records. Nothing was imported.');
 if(history.length>current.study.history.length)changes.push(`Study history: add ${history.length-current.study.history.length}`);
 next.study.history=history;
 // Never restore old model context boundaries or allow restored conversations
 // to silently become context containing previously forgotten memories.
 for(const chat of next.chats)if(!current.chats.some(item=>item.id===chat.id))next.companion.historyBoundaries[chat.id]=chat.messages.length;
 if(conflicts.length)throw Error('Restore stopped to preserve existing data. '+[...new Set(conflicts)].slice(0,8).join(' ')+' Keep both backups; use an empty separate browser profile for full recovery.');
 const needsChatSaving=next.chats.length>current.chats.length&&!current.settings.saveChats;
 if(needsChatSaving&&saveChats){next.settings.saveChats=true;changes.push('Enable chat saving on this browser (your explicit choice)');}
 // The existing persistence normalizer must not discard anything after merging.
 if(stable(validateState(next))!==stable(next))throw Error('Combined data cannot fit the current storage schema unchanged. Nothing was imported.');
 return {before:backupSnapshot(current),next,changes,needsChatSaving:needsChatSaving&&!saveChats};
}
export async function commitPersonalRestore(preview,{getState,save,setState}){
 if(preview.needsChatSaving)throw Error('Choose whether to enable chat saving before restoring conversations.');
 if(backupSnapshot(getState())!==preview.before)throw Error('Your data changed after preview. Preview the backup again.');
 await save(preview.next,()=>backupSnapshot(getState())===preview.before);
 setState(clone(preview.next));
}
