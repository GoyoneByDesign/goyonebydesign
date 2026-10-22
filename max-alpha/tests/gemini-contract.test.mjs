import test from 'node:test';
import assert from 'node:assert/strict';
import {handleGemini, GEMINI_MODEL} from '../gemini-worker.js';

// Synthetic fixtures only. Never contact a provider or load real credentials.
const token = 'synthetic_support_token_12345678901234567890';
const env = () => ({GEMINI_API_KEY:'synthetic_provider_fixture',MAXG_SUPPORT_TOKEN:token,
  GEMINI_FREE_TIER_CONFIRMED:'true',SEARCH_RATE_LIMIT:{limit:async()=>({success:true})}});
const request = (body={question:'  Hello  '},signal) => new Request('https://fixture.invalid/support', {
  method:'POST',signal,headers:{Origin:'https://www.goyonebydesign.com','Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
const answer=(finishReason='STOP',parts=[{text:'Hello'}])=>({candidates:[{finishReason,content:{parts}}]});
const response = data => new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});

test('request keeps fixed model, one user question, cap and no deprecated sampling/candidate parameters',async()=>{
  let calls=0;
  const result=await handleGemini(request(),env(),{fetcher:async(url,options)=>{
    calls++;assert.equal(url,`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`);
    const body=JSON.parse(options.body);
    assert.deepEqual(Object.keys(body).sort(),['contents','generationConfig','systemInstruction']);
    assert.deepEqual(body.contents,[{role:'user',parts:[{text:'Hello'}]}]);
    assert.deepEqual(body.generationConfig,{maxOutputTokens:512});
    assert.equal(options.redirect,'manual');assert.ok(options.signal);
    return response(answer());
  }});
  assert.equal(result.status,200);assert.equal((await result.json()).text,'Hello');assert.equal(calls,1);
});

for (const [name,data,status,error] of [
  ['truncated',answer('MAX_TOKENS'),422,'SUPPORT_TRUNCATED'],
  ['continuation',answer('CONTINUATION'),422,'SUPPORT_RESPONSE_BLOCKED'],
  ['unknown finish',answer('FUTURE_FINISH'),422,'SUPPORT_RESPONSE_BLOCKED'],
  ['missing finish',{candidates:[{content:{parts:[{text:'partial'}]}}]},502,'SUPPORT_RESPONSE_INVALID'],
  ['prompt blocked',{promptFeedback:{blockReason:'SAFETY'}},422,'SUPPORT_RESPONSE_BLOCKED'],
  ['empty',answer('STOP',[]),422,'SUPPORT_EMPTY'],
  ['thought only',answer('STOP',[{thought:true,text:'hidden'}]),422,'SUPPORT_EMPTY'],
]) test(`rejects ${name} without retries or partial answer`,async()=>{
  let calls=0;const result=await handleGemini(request(),env(),{fetcher:async()=>{calls++;return response(data);}});
  assert.equal(result.status,status);const body=await result.json();assert.equal(body.error,error);assert.equal(body.text,undefined);assert.equal(calls,1);
});

test('complete answer excludes thought parts',async()=>{
  const result=await handleGemini(request(),env(),{fetcher:async()=>response(answer('STOP',[{thought:true,text:'hidden'},{text:'Visible'}]))});
  assert.equal((await result.json()).text,'Visible');
});
test('free-tier guard blocks inference',async()=>{
  let calls=0;const result=await handleGemini(request(),{...env(),GEMINI_FREE_TIER_CONFIRMED:'false'},{fetcher:async()=>{calls++;throw Error('unexpected');}});
  assert.equal(result.status,503);assert.equal(calls,0);
});
test('history and model overrides cannot enter request',async()=>{
  for(const extra of [{history:['private']},{model:'different'}]){
    let calls=0;const result=await handleGemini(request({question:'Hello',...extra}),env(),{fetcher:async()=>{calls++;throw Error('unexpected');}});
    assert.equal(result.status,400);assert.equal(calls,0);
  }
});
test('pre-aborted request never calls provider',async()=>{
  const controller=new AbortController();controller.abort();let calls=0;
  const result=await handleGemini(request(undefined,controller.signal),env(),{fetcher:async()=>{calls++;throw Error('unexpected');}});
  assert.equal(result.status,499);assert.equal(calls,0);
});
test('provider quota failure never retries or falls back',async()=>{
  let calls=0;const result=await handleGemini(request(),env(),{fetcher:async()=>{calls++;return new Response('private upstream details',{status:429});}});
  assert.equal(result.status,429);const body=await result.json();assert.equal(body.error,'SUPPORT_QUOTA_EXHAUSTED');assert.equal(calls,1);assert.ok(!JSON.stringify(body).includes('private upstream'));
});
test('health does not perform inference',async()=>{
  let calls=0;const result=await handleGemini(new Request('https://fixture.invalid/support/health'),env(),{fetcher:async()=>{calls++;throw Error('unexpected');}});
  assert.equal((await result.json()).upstream,'not-tested');assert.equal(calls,0);
});
