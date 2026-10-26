import test from 'node:test';
import assert from 'node:assert/strict';
test('panel starts untested and supports explicit synthetic, report and reset actions',async()=>{
 class Node{constructor(tag){this.tag=tag;this.children=[];this.events={};this.textContent='';this.value='';}append(...nodes){this.children.push(...nodes);}setAttribute(key,value){this[key]=value;}addEventListener(type,fn){this.events[type]=fn;}}
 const ids=Object.fromEntries(['version','capabilities','smoke-checks','synthetic','synthetic-result','reset','reset-result'].map(id=>[id,new Node(id)]));ids['synthetic-result'].textContent='Not run in this page.';
 const prior=globalThis.document;globalThis.document={createElement:tag=>new Node(tag),getElementById:id=>ids[id]};
 try{
  await import('../capability-panel.js');assert.equal(ids.capabilities.children.length,7);assert.equal(ids['smoke-checks'].children.length,4);assert.equal(ids['synthetic-result'].textContent,'Not run in this page.');
  const first=ids['smoke-checks'].children[0],select=first.children.find(x=>x.tag==='select'),status=first.children.at(-1);assert.equal(status.textContent,'Not run');select.value='passed';select.events.change();assert.match(status.textContent,/User-reported; not independently verified: passed/);
  ids.synthetic.events.click();assert.match(ids['synthetic-result'].textContent,/Automated module check passed/);ids.reset.events.click();assert.equal(status.textContent,'Not run');assert.equal(select.value,'not-run');assert.equal(ids['synthetic-result'].textContent,'Not run in this page.');
 }finally{globalThis.document=prior;}
});
