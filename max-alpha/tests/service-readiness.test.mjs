import test from 'node:test';
import assert from 'node:assert/strict';
import {checkAIServiceReadiness} from '../service-readiness.js';
test('hosted setup reports configured models without claiming inference was tested',async()=>{
  let calls=0;const health=async()=>{calls++;return {ready:true,model:'synthetic-model'};};
  const result=await checkAIServiceReadiness({cloudflare:health,gemini:health});assert.equal(calls,2);assert.ok(result.every(x=>x.ready&&x.model==='synthetic-model'&&x.detail.includes('has not been tested')));
});
test('one unavailable service does not hide the other service status',async()=>{
  const result=await checkAIServiceReadiness({cloudflare:async()=>{throw Error('Unavailable');},gemini:async()=>({ready:false,model:'fixture'})});
  assert.equal(result[0].ready,false);assert.equal(result[0].detail,'Unavailable');assert.equal(result[1].model,'fixture');assert.equal(result[1].ready,false);
});
test('a cancelled check makes no health requests',async()=>{
  const controller=new AbortController();controller.abort();let calls=0;const health=async()=>{calls++;};
  await assert.rejects(checkAIServiceReadiness({signal:controller.signal,cloudflare:health,gemini:health}),{name:'AbortError'});assert.equal(calls,0);
});
