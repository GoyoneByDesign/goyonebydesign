import {DB_NAME,validateState} from './state.js';
import {backupSnapshot} from './backup.js';
const fingerprint=value=>value===undefined?'missing':backupSnapshot(value);
function open(dbAPI){return new Promise((resolve,reject)=>{const request=dbAPI.open(DB_NAME,1);request.onupgradeneeded=()=>request.result.createObjectStore('state');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function readBackupBaseline(current,dbAPI=globalThis.indexedDB){
 const expected=validateState(current);if(!expected.settings.saveChats)expected.chats=[];
 const expectedSnapshot=fingerprint(expected);
 const db=await open(dbAPI);try{return await new Promise((resolve,reject)=>{const tx=db.transaction('state','readonly'),request=tx.objectStore('state').get('personal');let result;request.onsuccess=()=>{result=fingerprint(request.result);};tx.oncomplete=()=>result===expectedSnapshot?resolve(result):reject(Error('Saved data differs from this window, or this device has no saved state yet. Keep a backup, close other MAX-ALPHA windows and reload; on a new device save Settings once before restoring.'));tx.onerror=tx.onabort=()=>reject(tx.error||Error('Could not read saved personal data.'));});}finally{db.close();}
}
/** Compare and write under one IndexedDB readwrite transaction: no compensation. */
export async function saveBackupAtomically(next,baseline,{isCurrent=()=>true,onTransaction=()=>{},dbAPI=globalThis.indexedDB}={}){
 if(typeof baseline!=='string')throw Error('Preview saved personal data before restoring.');
 const stored=validateState(next);if(!stored.settings.saveChats)stored.chats=[];
 const db=await open(dbAPI);try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction('state','readwrite'),store=tx.objectStore('state');let failure;
  const abort=()=>{failure=Error('Personal data changed after preview. Nothing was imported; preview again.');try{tx.abort();}catch{}};
  tx.oncomplete=()=>{onTransaction(null);resolve();};
  tx.onerror=tx.onabort=()=>{onTransaction(null);reject(failure||tx.error||Error('Restore was not saved. Existing data is unchanged.'));};
  onTransaction(abort);if(failure)return;
  const request=store.get('personal');request.onsuccess=()=>{
   if(fingerprint(request.result)!==baseline||!isCurrent()){abort();return;}
   try{store.put(stored,'personal');}catch(error){failure=error;tx.abort();}
  };
 });}finally{db.close();}
}
