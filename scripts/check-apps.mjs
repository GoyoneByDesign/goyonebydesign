import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const apps=JSON.parse(fs.readFileSync(path.join(root,'apps/catalog.json')));
const html=fs.readFileSync(path.join(root,'apps/index.html'),'utf8');
const release='https://github.com/GoyoneByDesign/goyonebydesign/releases/download/apps-preview-2026-09-26/';
assert.equal(new Set(apps.map(a=>a.id)).size,apps.length,'Unique app IDs');
const validUrl=value=>typeof value==='string' && (/^\/(?!\/)/.test(value)||/^https:\/\//.test(value));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
let enabled=0, disabled=0;
for(const app of apps){
  assert.match(app.id,/^[a-z0-9-]+$/);
  assert.equal(typeof app.development,'boolean',`${app.id} has explicit development status`);
  for(const asset of [app.icon,app.screen].filter(Boolean)){
    assert.ok(!asset.includes('..'),'Asset stays inside catalog assets');
    assert.ok(fs.existsSync(path.join(root,'apps/assets',asset)),asset);
  }
  assert.ok(html.includes(`id="${app.id}"`),`${app.id} is rendered`);
  for(const link of [app.web,app.install,app.releaseNotes].filter(Boolean)){
    assert.ok(validUrl(link),`${app.id} uses a safe destination`);
    assert.ok(!html.includes(`href="${escape(link)}"`),`${app.id} application destination is not exposed as a gallery launch control`);
    if(link.startsWith('/')){
      const pathname=link.split('#')[0];
      assert.ok(fs.existsSync(path.join(root,pathname.endsWith('/')?pathname+'index.html':pathname)),link);
    }
  }
  for(const [platform,download] of Object.entries(app.downloads)){
    assert.ok(['android','ios','windows'].includes(platform));
    assert.ok(download.file && download.label);
    assert.match(download.sha256,/^[0-9a-f]{64}$/,'Recorded package checksum');
    assert.ok(Number.isInteger(download.bytes)&&download.bytes>0,'Recorded package size');
    assert.match(download.verified,/^\d{4}-\d{2}-\d{2}$/,'Verification date');
    const url=download.url||release+download.file;
    assert.ok(validUrl(url));
    assert.ok(!html.includes(`href="${escape(url)}"`),'Installer is not a public gallery control');
    if(url.startsWith('/')){
      const bytes=fs.readFileSync(path.join(root,url));
      assert.equal(bytes.length,download.bytes);
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),download.sha256);
    }
    enabled++;
  }
  if(app.compact)assert.equal(Object.keys(app.downloads).length,0,'Compact cards cannot hide downloads');
  else disabled+=3-Object.keys(app.downloads).length;
}
assert.equal((html.match(/class="download active"/g)||[]).length,0);
assert.equal((html.match(/class="download" disabled/g)||[]).length,0);
assert.equal((html.match(/<article class="app-card"/g)||[]).length,apps.length);
assert.ok(html.includes(`${apps.length} applications`),'Accurate app count');
assert.ok(apps.some(a=>a.id==='boardroom'),'Preserve BOARDROOM');
assert.ok(!apps.some(a=>a.id==='mythang'),'Preserve requested MyThang removal');
assert.ok(apps.find(a=>a.id==='justmypick').downloads.android.label.includes('Legacy'),'Old SavvyKin build stays labeled');
assert.ok(apps.find(a=>a.id==='view4real').downloads.windows.label.includes('Legacy'),'Old SightSync build stays labeled');
assert.ok(html.includes('href="/owner/"'),'Owner entry links to the separately protected hub');
console.log(`${apps.length} preview-only app cards; ${enabled} preserved installer records; no public gallery launch/download controls; assets, routes and catalog metadata pass.`);
