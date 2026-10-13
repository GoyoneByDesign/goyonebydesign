import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {RELEASE_VERSION,RELEASE_BUILD} from '../release-version.js';
test('review release manifest matches every shipped byte and release identifier',()=>{
  const root=new URL('../',import.meta.url),release=JSON.parse(fs.readFileSync(new URL('release.json',root),'utf8'));
  assert.equal(release.version,RELEASE_VERSION);assert.equal(release.build,RELEASE_BUILD);
  assert.equal(JSON.parse(fs.readFileSync(new URL('package.json',root),'utf8')).version,RELEASE_VERSION);
  const worker=fs.readFileSync(new URL('sw.js',root),'utf8');
  assert.ok(worker.includes(`const RELEASE_VERSION = '${RELEASE_VERSION}'`));assert.ok(worker.includes(`const RELEASE_BUILD = ${RELEASE_BUILD}`));
  assert.equal(new Set(release.files.map(x=>x.path)).size,release.files.length);
  for(const file of release.files){
    assert.ok(!file.path.includes('..')&&!file.path.startsWith('/'));
    const bytes=fs.readFileSync(new URL(file.path,root));
    assert.equal(bytes.length,file.bytes,file.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);
  }
});
