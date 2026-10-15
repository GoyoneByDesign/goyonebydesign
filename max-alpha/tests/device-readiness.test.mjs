import test from 'node:test';
import assert from 'node:assert/strict';
import {deviceReadiness} from '../device-readiness.js';

test('device check is read-only and explains missing browser and companion capabilities',()=>{
  const environment={get fetch(){throw Error('Network access forbidden');},get localStorage(){throw Error('Storage access forbidden');}};
  const checks=deviceReadiness({environment});
  assert.equal(checks.length,6);
  assert.equal(checks[0].status,'Setup needed');
  assert.equal(checks[4].status,'Mac companion required');
  assert.equal(checks[5].status,'Separate setup required');
});
test('detects browser APIs without claiming models, accounts or permissions are ready',()=>{
  const environment={isSecureContext:true,navigator:{gpu:{}},SpeechRecognition:class {},speechSynthesis:{},File:class {},Blob};
  const checks=deviceReadiness({environment,companion:true});
  assert.ok(checks.slice(0,4).every(item=>item.status==='Browser support detected'));
  assert.equal(checks[4].status,'Companion mode detected');
  assert.equal(checks[5].status,'Separate setup required');
  assert.match(checks[0].detail,/has not been tested/);
});
test('insecure contexts do not claim local AI or microphone recognition support',()=>{
  const checks=deviceReadiness({environment:{navigator:{gpu:{}},webkitSpeechRecognition:class {}}});
  assert.equal(checks[0].status,'Setup needed');
  assert.equal(checks[1].status,'Setup needed');
});
