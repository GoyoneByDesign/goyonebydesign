import test from 'node:test';
import assert from 'node:assert/strict';
import {loadLocalGenerator} from '../public/max-runtime.mjs';

test('local MAX chooses WASM when WebGPU is missing, null, or denied', async () => {
  for (const navigator of [{}, {gpu:{requestAdapter:async()=>null}}, {gpu:{requestAdapter:async()=>{throw Error('unavailable');}}}]) {
    const calls=[];
    const result=await loadLocalGenerator(async(task,model,options)=>{calls.push(options.device);return 'ready';},navigator,()=>{});
    assert.equal(result,'ready'); assert.deepEqual(calls,['wasm']);
  }
});
test('local MAX retries failed GPU initialization once on WASM', async () => {
  const calls=[],events=[];
  const result=await loadLocalGenerator(async(task,model,options)=>{
    calls.push(options.device); assert.equal(options.dtype,'q4');
    if(options.device==='webgpu')throw Error('GPU initialization failed');
    return 'ready';
  },{gpu:{requestAdapter:async()=>({})}},event=>events.push(event));
  assert.equal(result,'ready');assert.deepEqual(calls,['webgpu','wasm']);assert.equal(events[0].status,'fallback');
});
test('local MAX retains working WebGPU and surfaces a failed WASM load', async () => {
  const calls=[];
  assert.equal(await loadLocalGenerator(async(task,model,o)=>{calls.push(o.device);return 'gpu';},{gpu:{requestAdapter:async()=>({})}},()=>{}),'gpu');
  assert.deepEqual(calls,['webgpu']);
  await assert.rejects(()=>loadLocalGenerator(async()=>{throw Error('model unavailable');},{},()=>{}),/model unavailable/);
});
