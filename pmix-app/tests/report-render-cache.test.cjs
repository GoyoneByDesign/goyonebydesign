const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../public/report-render-cache.js');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('rapid filter changes build only the active and newest reports, serially, and reuse the result',async()=>{
 let running=0,maxRunning=0;const calls=[],release=[];
 const cache=create(async input=>{calls.push(input);maxRunning=Math.max(maxRunning,++running);await new Promise(resolve=>release.push(resolve));running--;return 'PDF '+input;});
 const first=cache.request('a','A');await tick();const skipped=cache.request('b','B'),latest=cache.request('c','C'),same=cache.request('c','C');assert.equal(await skipped,null);assert.equal(latest,same);release.shift()();assert.equal(await first,'PDF A');await tick();assert.deepEqual(calls,['A','C']);release.shift()();assert.equal(await latest,'PDF C');assert.equal(await cache.request('c','C'),'PDF C');assert.equal(calls.length,2);assert.equal(maxRunning,1);
});
test('font changes invalidate old bytes and failed builds can be retried',async()=>{
 let calls=0;const cache=create(async()=>{calls++;if(calls===1)throw Error('Font unavailable');return calls;});
 await assert.rejects(cache.request('same',{}),/Font unavailable/);await tick();assert.equal(await cache.request('same',{}),2);cache.invalidate();await tick();assert.equal(await cache.request('same',{}),3);
});
