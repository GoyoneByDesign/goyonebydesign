import test from 'node:test';
import assert from 'node:assert/strict';
import {createUpdateChecker, verifyRelease, verifyPackageBytes, wifiCommunicationStatus} from '../apps/update-check.mjs';
const now = 1800000000000;
const identity = {app:'statusping',platform:'android',channel:'test',signingIdentity:'synthetic-cert',build:5};
const origins = ['https://www.goyonebydesign.com'];
const endpoint = origins[0] + '/apps/releases/statusping.json';
const pair = await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'}, true, ['sign','verify']);
const publicKey = await crypto.subtle.exportKey('jwk', pair.publicKey);
const bytes = new TextEncoder().encode('synthetic package');
const sha256 = Buffer.from(await crypto.subtle.digest('SHA-256', bytes)).toString('hex');
const base = {schema:1,...identity,build:6,version:'0.2.1-test',issuedAt:now-1000,expiresAt:now+86400000,
  notes:'Synthetic test only',url:origins[0]+'/downloads/synthetic.apk',bytes:bytes.byteLength,sha256};
async function sign(patch={}) {
  const payload = JSON.stringify({...base,...patch});
  const signature = Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode(payload))).toString('base64');
  return {schema:1,payload,signature};
}
const options = {publicKey,identity,origins,now};
function checker(extra={}) {return createUpdateChecker({endpoint,publicKey,identity,origins,now:()=>now,...extra});}
test('disabled, offline, busy and unconfigured never request the network',async()=>{
  let calls=0;
  const fetcher=()=>{calls++;throw Error('unexpected');};
  const disabled=checker({fetcher});assert.equal((await disabled.check()).phase,'disabled');
  const offline=checker({fetcher,online:()=>false});offline.setEnabled(true);assert.equal((await offline.check()).phase,'offline');
  const busy=checker({fetcher,busy:()=>true});busy.setEnabled(true);assert.equal((await busy.check()).phase,'deferred');
  const unconfigured=checker({fetcher,publicKey:null});unconfigured.setEnabled(true);assert.equal((await unconfigured.check()).phase,'unconfigured');
  assert.equal(calls,0);
});
test('authenticated higher release exposes notes without installing anything',async()=>{
  const envelope=await sign();let calls=0;
  const client=checker({fetcher:async(url,opts)=>{calls++;assert.equal(url,endpoint);assert.equal(opts.credentials,'omit');assert.equal(opts.redirect,'error');return new Response(JSON.stringify(envelope));}});
  client.setEnabled(true);const value=await client.check();assert.equal(value.phase,'available');assert.equal(value.release.notes,base.notes);assert.equal(calls,1);
});
test('tampered or forged metadata is rejected',async()=>{
  const envelope=await sign();
  envelope.payload=envelope.payload.replace('0.2.1-test','0.2.9-test');
  await assert.rejects(verifyRelease(envelope,options),/authenticity/);
  await assert.rejects(verifyRelease({...await sign(),signature:Buffer.alloc(64).toString('base64')},options));
});
test('signed wrong app, platform, channel, signing identity and unsafe URLs are rejected',async()=>{
  for(const patch of [{app:'other'},{platform:'windows'},{channel:'production'},{signingIdentity:'wrong'},
    {url:'http://www.goyonebydesign.com/test.apk'},{url:'https://evil.example/test.apk'},
    {url:'https://user:password@www.goyonebydesign.com/test.apk'},{url:endpoint+'?token=secret'},
    {url:endpoint+'#fragment'}]) await assert.rejects(verifyRelease(await sign(patch),options));
});
test('expired, future, overlong lifetime and invalid integrity metadata fail',async()=>{
  for(const patch of [{expiresAt:now},{issuedAt:now+400000},{expiresAt:now+32*86400000},
    {bytes:200000001},{bytes:0},{sha256:'bad'},{build:1.5},{notes:''}])
    await assert.rejects(verifyRelease(await sign(patch),options));
});
test('same release is current; downgrades are rejected',async()=>{
  for(const [build,phase] of [[5,'current'],[4,'rollback-rejected']]){
    const envelope=await sign({build});const client=checker({fetcher:async()=>new Response(JSON.stringify(envelope))});client.setEnabled(true);
    assert.equal((await client.check()).phase,phase);
  }
});
test('network, redirect, malformed and oversized responses never report success',async()=>{
  for(const fetcher of [async()=>{throw Error('offline');},async()=>new Response('{}',{status:500}),
    async()=>new Response('not json'),async()=>new Response('x'.repeat(64001)),
    async()=>({ok:true,redirected:true})]){
    const client=checker({fetcher});client.setEnabled(true);assert.equal((await client.check()).phase,'error');
  }
});
test('disable and active work invalidate in-flight checks',async()=>{
  const envelope=await sign();let release;
  const waiting=new Promise(resolve=>{release=resolve;});
  const client=checker({fetcher:()=>waiting});client.setEnabled(true);const pending=client.check();
  await Promise.resolve();client.setEnabled(false);release(new Response(JSON.stringify(envelope)));
  assert.equal((await pending).phase,'cancelled');
  let busy=false;const another=checker({busy:()=>busy,fetcher:async()=>{busy=true;return new Response(JSON.stringify(envelope));}});
  another.setEnabled(true);assert.equal((await another.check()).phase,'deferred');
});
test('timeout fails safely and retry is possible',async()=>{
  const client=checker({timeoutMs:5,fetcher:async(_,opts)=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('timeout'))))});
  client.setEnabled(true);assert.equal((await client.check()).phase,'error');assert.equal((await client.check()).phase,'error');
});
test('package size and digest are verified',async()=>{
  const release=await verifyRelease(await sign(),options);
  assert.equal(await verifyPackageBytes(bytes,release),true);
  const altered=bytes.slice();altered[0]^=1;assert.equal(await verifyPackageBytes(altered,release),false);
  assert.equal(await verifyPackageBytes(bytes.slice(1),release),false);
});
test('Wi-Fi communication gate cannot send or call; offline is explicit',()=>{
  for(const online of [false,true]){const state=wifiCommunicationStatus({online});assert.equal(state.canSend,false);assert.equal(state.canCall,false);assert.equal(state.phase,online?'unconfigured':'offline');}
});
test('invalid endpoint error does not wedge subsequent checks',async()=>{
  const client=checker({endpoint:'https://evil.example/manifest'});client.setEnabled(true);
  assert.equal((await client.check()).phase,'error');assert.equal((await client.check()).phase,'error');
});
