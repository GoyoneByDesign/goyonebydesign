import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ActivityState} from '../activity-frame.js';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('MAX-ALPHA branding and centered A are shipped',()=>{
 for(const name of ['index.html','install.html','manifest.json','companion-interactions.js']){assert.ok(read(name).includes('MAX-ALPHA'));assert.ok(!read(name).includes('MAX-G'));}
 assert.match(read('index.html'),/class="orb-forehead-mark" x="200"[^>]*>A<\/text>/);
 assert.match(read('assets/icon.svg'),/<text x="256"[^>]*>A<\/text>/);
 assert.equal(JSON.parse(read('manifest.json')).short_name,'MAX-ALPHA');
});
test('A glow follows processing and speaking, and respects reduced motion',()=>{
 const css=read('style.css');assert.ok(css.includes('html[data-maxg-processing="true"] .orb-forehead-mark'));
 assert.ok(css.includes('[data-state="thinking"],[data-state="speaking"]'));
 assert.match(css,/\.orb-forehead-mark\{filter:none/);
 assert.ok(css.includes('animation:alpha-mark-glow 1.8s'));
 assert.ok(css.includes('html[data-maxg-reduced-motion="true"] .orb-forehead-mark'));
 assert.ok(css.includes('animation:blink 9.8s'));
 assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
});
test('activity clears after all work and preserves reduced-motion indication',()=>{
 const a=new ActivityState();a.set('task',true);a.model('generating');assert.equal(a.snapshot.processing,true);a.set('task',false);assert.equal(a.snapshot.processing,true);a.model('idle');assert.equal(a.snapshot.processing,false);a.reduce(true);assert.equal(a.snapshot.reducedMotion,true);a.set('task',true);a.clear();assert.equal(a.snapshot.processing,false);
});
test('rename preserves personal data storage and installed native protocol',()=>{
 assert.ok(read('state.js').includes("DB_NAME='maxg-personal-v1'"));
 assert.ok(read('connectors.js').includes('maxg.helper.session.v1'));
 assert.ok(read('locations.js').includes('MAXGNativeLocation'));
 assert.ok(read('tools.js').includes('max-g-search.michael-goyone.workers.dev'));
});
