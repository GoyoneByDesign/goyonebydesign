import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {containsProviderCredential,validateSupportToken} from '../gemini.js';
test('provider keys and setup commands are identified without accessing storage or network',()=>{
  for(const value of ['sk-placeholder','sess-placeholder','AIzaPlaceholder','SK-placeholder','Here is sk-placeholder','/key placeholder','/token placeholder'])assert.equal(containsProviderCredential(value),true);
  for(const value of ['Help with my task-list','A normal message',''])assert.equal(containsProviderCredential(value),false);
});
test('provider key formats cannot become Worker support access',()=>{
  for(const prefix of ['sk-','sess-','AIza','SK-','aiZA'])assert.throws(()=>validateSupportToken(prefix+'x'.repeat(40)),error=>error.code==='INVALID_TOKEN');
  assert.equal(validateSupportToken('x'.repeat(40)),'x'.repeat(40));
});
test('actual submission guard stops keys before history or queue and preserves the unsent draft',async()=>{
  const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const start=app.indexOf('async function submit('),end=app.indexOf('  if(text.length>3000)',start);
  let status='',draft='synthetic unsent draft';
  const submit=vm.runInNewContext('('+app.slice(start,end)+'})',{containsProviderCredential,isResetCode:()=>false,
    $:()=>({get value(){return draft;},set value(_){throw Error('Must preserve draft');}}),attachments:[],toast:value=>{status=value;}});
  await submit('sk-placeholder');assert.match(status,/cannot be sent/);assert.equal(draft,'synthetic unsent draft');
});
