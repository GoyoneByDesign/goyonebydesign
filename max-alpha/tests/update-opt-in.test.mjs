import test from 'node:test';
import assert from 'node:assert/strict';
import {createAppUpdates,renderUpdateSettings} from '../updates.js';
import {freshState,validateState} from '../state.js';
import {RELEASE_VERSION,RELEASE_BUILD} from '../release-version.js';
const response=()=>new Response(JSON.stringify({schema:1,version:RELEASE_VERSION,build:RELEASE_BUILD}));
const registration=()=>({waiting:null,updates:0,addEventListener(){},async update(){this.updates++;}});
test('new and migrated records default automatic checks off; explicit choice survives validation',()=>{
  assert.equal(freshState().settings.automaticUpdateChecks,false);
  const old={settings:{saveChats:true},notes:[{id:'n',text:'preserved'}],chats:[{id:'c',messages:[{role:'user',content:'saved'}]}]};
  const migrated=validateState(old);assert.equal(migrated.settings.automaticUpdateChecks,false);
  assert.equal(migrated.notes[0].text,'preserved');assert.equal(migrated.chats[0].messages[0].content,'saved');
  migrated.settings.automaticUpdateChecks=true;assert.equal(validateState(migrated).settings.automaticUpdateChecks,true);
  migrated.settings.automaticUpdateChecks='true';assert.equal(validateState(migrated).settings.automaticUpdateChecks,false);
});
test('automatic checking defaults off and has zero app-requested network traffic',async()=>{
  let calls=0;const manager=createAppUpdates({fetcher:async()=>{calls++;return response();}});
  await manager.check({automatic:true});assert.equal(calls,0);assert.equal(manager.state.phase,'idle');
});
test('explicit opt-in checks while manual checks remain available without opting in',async()=>{
  for(const automatic of [false,true]){
    let calls=0;const manager=createAppUpdates({canAutomaticCheck:()=>automatic,fetcher:async()=>{calls++;return response();}});
    const reg=registration();manager.attach(reg);await manager.check({automatic});
    assert.equal(calls,1);assert.equal(reg.updates,1);assert.equal(manager.state.phase,'current');
  }
});
test('offline or denied internet gate prevents both automatic and manual app-requested checks',async()=>{
  let calls=0;const manager=createAppUpdates({canCheck:()=>false,canAutomaticCheck:()=>true,fetcher:async()=>{calls++;return response();}});
  await manager.check({automatic:true});await manager.check();assert.equal(calls,0);
});
test('revoking opt-in during metadata fetch prevents worker update request',async()=>{
  let optedIn=true,resolve;
  const manager=createAppUpdates({canAutomaticCheck:()=>optedIn,fetcher:()=>new Promise(done=>{resolve=done;})});
  const reg=registration();manager.attach(reg);const checking=manager.check({automatic:true});
  optedIn=false;resolve(response());await checking;assert.equal(reg.updates,0);assert.equal(manager.state.phase,'idle');
});
test('revoking opt-in during save prevents automatic worker activation',async()=>{
  let optedIn=true,sent=0;
  const manager=createAppUpdates({canAutomaticCheck:()=>optedIn,canAutoApply:()=>true,beforeApply:async()=>{optedIn=false;}});
  const reg=registration();reg.waiting={postMessage(){sent++;}};manager.attach(reg);
  await assert.rejects(manager.apply({automatic:true}),/paused/);assert.equal(sent,0);
});
test('active work save guard prevents activation',async()=>{
  let sent=0;const manager=createAppUpdates({beforeApply:async()=>{throw Error('Finish current work');}});
  const reg=registration();reg.waiting={postMessage(){sent++;}};manager.attach(reg);
  await assert.rejects(manager.apply(),/Finish current work/);assert.equal(sent,0);assert.equal(manager.state.phase,'ready');
});
test('network failure never reports the installed release as current',async()=>{
  const manager=createAppUpdates({canAutomaticCheck:()=>true,fetcher:async()=>{throw Error('network failed');}});
  await manager.check({automatic:true});assert.equal(manager.state.phase,'error');
});
test('older website manifest cannot report the review release as current or request installation',async()=>{
  const manager=createAppUpdates({fetcher:async()=>new Response(JSON.stringify({schema:1,version:'1.16.2',build:RELEASE_BUILD-1}))});
  const reg=registration();manager.attach(reg);await manager.check();assert.equal(manager.state.phase,'error');assert.equal(reg.updates,0);
});
test('same build with a different display version is rejected',async()=>{
  const manager=createAppUpdates({fetcher:async()=>new Response(JSON.stringify({schema:1,version:'9.9.9',build:RELEASE_BUILD}))});
  await manager.check();assert.equal(manager.state.phase,'error');
});
test('settings checkbox saves explicit choices and restores persisted value after save failure',async()=>{
  const original=globalThis.document;
  class Element {constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.events={};}append(...items){this.children.push(...items);}setAttribute(){}addEventListener(name,fn){this.events[name]=fn;}}
  globalThis.document={createElement:tag=>new Element(tag)};
  try{
    let enabled=false,fail=false;
    const view=renderUpdateSettings({manager:{state:{phase:'idle',message:'Ready'}},check(){},apply(){},getAutomaticChecks:()=>enabled,setAutomaticChecks:async value=>{if(fail)throw Error('disk full');enabled=value;}});
    const label=view.children.find(x=>x.className==='update-opt-in'),checkbox=label.children[0];assert.equal(checkbox.checked,false);
    checkbox.checked=true;await checkbox.events.change();assert.equal(enabled,true);assert.equal(checkbox.disabled,false);
    fail=true;checkbox.checked=false;await checkbox.events.change();assert.equal(checkbox.checked,true);assert.equal(enabled,true);
    assert.match(view.children.find(x=>x.className==='update-status').textContent,/could not be saved/);
  }finally{globalThis.document=original;}
});
