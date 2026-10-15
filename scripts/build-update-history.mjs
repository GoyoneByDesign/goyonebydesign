import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function easternTime(value){
  if(!value)return 'Not recorded';
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))throw Error('A timestamp must include its timezone');
  return new Intl.DateTimeFormat('en-US',{dateStyle:'long',timeStyle:'long',timeZone:'America/New_York'}).format(new Date(value))+' (Eastern / America/New_York)';
}
export function validateHistory(data){
  if(data.schema!==1||data.timezone!=='America/New_York'||!Array.isArray(data.apps))throw Error('Invalid history schema');
  const ids=new Set();
  for(const app of data.apps){
    if(!/^[a-z0-9-]+$/.test(app.id)||ids.has(app.id)||!app.name||!Array.isArray(app.entries))throw Error('Invalid app history');ids.add(app.id);
    const entries=new Set();for(const entry of app.entries){
      if(!entry.id||entries.has(entry.id)||!entry.status||!entry.version||!Array.isArray(entry.changes)||!entry.changes.length)throw Error('Invalid release entry');entries.add(entry.id);
      if(entry.build!==null&&(!Number.isInteger(entry.build)||entry.build<0))throw Error('Invalid build number');
      easternTime(entry.recordedAt);easternTime(entry.releasedAt);
      for(const reference of entry.references||[]){const u=new URL(reference.url);if(u.protocol!=='https:')throw Error('Unsafe reference');}
    }
  }return data;
}
export function renderHistory(data,onlyId){
  validateHistory(data);const apps=onlyId?data.apps.filter(a=>a.id===onlyId):data.apps;
  if(!apps.length)throw Error('Unknown app');
  const nav=apps.map(a=>`<a href="#${a.id}">${escape(a.name)}</a>`).join('');
  const sections=apps.map(app=>`<section id="${app.id}"><h2>${escape(app.name)}</h2>${app.entries.map(e=>`<article><span class="status">${escape(e.status)}</span><h3>Version ${escape(e.version)} · Build ${e.build===null?'not recorded':escape(e.build)}</h3><p>${escape(e.channel)}</p><dl><dt>Release / source update time</dt><dd>${escape(easternTime(e.releasedAt))}</dd><dt>History entry recorded</dt><dd>${escape(easternTime(e.recordedAt))}</dd></dl>${e.dateNote?`<p class="note">${escape(e.dateNote)}</p>`:''}<ul>${e.changes.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><p><strong>Validation:</strong> ${escape(e.validation||'Not verified')}</p>${(e.references||[]).map(r=>`<a class="reference" href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${escape(r.label)}</a>`).join('')}</article>`).join('')}</section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Update history | GoyoneByDesign</title><style>body{margin:0;background:#14191d;color:#f4f1e9;font:16px/1.6 system-ui,sans-serif}main,header{max-width:1000px;margin:auto;padding:24px}a{color:#9de3dd;text-underline-offset:4px}nav{display:flex;gap:12px;flex-wrap:wrap}nav a,.reference{display:inline-block;padding:9px 12px;border:1px solid #53626b;border-radius:10px;margin:4px 6px 4px 0}h1{font-size:clamp(32px,6vw,54px);line-height:1.1}h2{margin-top:44px}h3{font-size:21px;margin:12px 0}article{background:#20292f;border:1px solid #4b5a63;border-radius:16px;padding:22px;margin:18px 0;overflow-wrap:anywhere}section{scroll-margin-top:20px}.status{color:#b8e6ce;font-size:14px;font-weight:700}.note,dt{color:#c1ccd1}dt{font-size:14px}dd{margin:2px 0 12px}ul{padding-left:22px}.skip{display:block;padding:8px 24px}@media(max-width:500px){main,header{padding:18px}article{padding:17px}nav a{padding:11px}}</style></head><body><a class="skip" href="#history">Skip to update history</a><header><a href="https://www.goyonebydesign.com/apps/">GoyoneByDesign app projects</a><h1>Update history</h1><p>Versions, builds, changes and testing status. All recorded times use Eastern time, including daylight saving. A source update is not a new installer. Older dates or build numbers that were not recorded stay unknown.</p><nav aria-label="Choose application">${nav}</nav></header><main id="history">${sections}<p><a href="https://www.goyonebydesign.com/apps/READINESS-2026-10-15.md">App comparisons and readiness review</a></p></main></body></html>`;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=fileURLToPath(new URL('../',import.meta.url));const data=JSON.parse(fs.readFileSync(path.join(root,'apps/update-history.json'),'utf8'));
  fs.mkdirSync(path.join(root,'apps/updates'),{recursive:true});fs.writeFileSync(path.join(root,'apps/updates/index.html'),renderHistory(data));
  const exportDir=process.argv[2];if(exportDir){fs.mkdirSync(exportDir,{recursive:true});for(const app of data.apps)fs.writeFileSync(path.join(exportDir,app.id+'.html'),renderHistory(data,app.id));}
  console.log(`Validated history for ${data.apps.length} applications`);
}
