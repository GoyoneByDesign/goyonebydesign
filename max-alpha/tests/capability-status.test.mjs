import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CAPABILITIES,SMOKE_CHECKS,reportSmokeCheck,runSyntheticCheck} from '../capability-status.js';
test('capability inventory distinguishes configuration, testing, prerequisites and unavailable services',()=>{
 assert.equal(CAPABILITIES.length,7);assert.ok(CAPABILITIES.some(x=>x.state==='Configured in source'));assert.ok(CAPABILITIES.some(x=>x.state==='Automated module tests passed'));assert.ok(CAPABILITIES.some(x=>x.state.includes('Unavailable')));assert.ok(Object.isFrozen(CAPABILITIES));
});
test('smoke reports remain explicitly user-reported and unverified',()=>{for(const check of SMOKE_CHECKS){assert.equal(reportSmokeCheck(check.id,'not-run').evidence,'Not run');for(const outcome of ['passed','failed'])assert.match(reportSmokeCheck(check.id,outcome).evidence,/User-reported; not independently verified/);}});
test('unknown checks and invented states are rejected',()=>{assert.throws(()=>reportSmokeCheck('other','passed'));assert.throws(()=>reportSmokeCheck('reply','verified'));});
test('synthetic refresh check is repeatable and independent of provider access',()=>{assert.deepEqual(runSyntheticCheck(),runSyntheticCheck());assert.equal(runSyntheticCheck().passed,true);assert.equal(runSyntheticCheck().checks,4);});
test('panel uses safe text rendering without storage, network or automatic inference',()=>{const source=fs.readFileSync(new URL('../capability-panel.js',import.meta.url),'utf8')+fs.readFileSync(new URL('../capability-status.js',import.meta.url),'utf8');assert.doesNotMatch(source,/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB|innerHTML|eval)\b/);assert.match(source,/addEventListener\('click'/);});
test('page provides manual-only instructions and accessible result controls',()=>{const html=fs.readFileSync(new URL('../capabilities.html',import.meta.url),'utf8');assert.match(html,/No request runs automatically/);assert.match(html,/<noscript>/);assert.match(html,/role="status"/);assert.match(html,/rel="noopener"/);});
test('external panel link does not trigger internal workspace navigation',()=>{const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');assert.doesNotMatch(app,/querySelectorAll\('\.nav-button'\)/);assert.match(app,/querySelectorAll\('\.nav-button\[data-view\]'\)/);});
