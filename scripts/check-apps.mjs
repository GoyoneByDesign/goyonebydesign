import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const apps=JSON.parse(fs.readFileSync(path.join(root,'apps/catalog.json')));
const html=fs.readFileSync(path.join(root,'apps/index.html'),'utf8');
assert.equal(new Set(apps.map(a=>a.id)).size,apps.length,'Unique app IDs');
let enabled=0;
for(const app of apps){
  for(const asset of [app.icon,app.screen].filter(Boolean))assert.ok(fs.existsSync(path.join(root,'apps/assets',asset)),asset);
  assert.ok(html.includes(`id="${app.id}"`),`${app.id} is rendered`);
  for(const [platform,download] of Object.entries(app.downloads)){
    assert.ok(['android','ios','windows'].includes(platform));
    assert.ok(download.file && download.label);
    assert.ok(html.includes(`/${download.file}"`),'Real release file link is rendered');
    enabled++;
  }
}
assert.equal((html.match(/class="download active"/g)||[]).length,enabled);
assert.equal((html.match(/class="download" disabled/g)||[]).length,apps.length*3-enabled);
assert.equal((html.match(/<article class="app-card"/g)||[]).length,apps.length);
console.log(`${apps.length} apps; ${enabled} enabled installer links; ${apps.length*3-enabled} genuinely disabled platform buttons; all image files present.`);
