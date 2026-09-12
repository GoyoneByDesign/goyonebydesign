// Private file bytes live in R2 until a verified Drive copy exists; never in Git.
import {seal,unseal} from './create-api.mjs';
const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export const fail=(m,s=400)=>{throw Object.assign(Error(m),{status:s});};
export async function setting(env,owner,name){const r=await env.DB.prepare('SELECT value FROM max_settings WHERE owner=? AND name=?').bind(owner,name).first();return r?unseal(r.value,env):null;}
export async function saveSetting(env,owner,name,value){await env.DB.prepare('INSERT INTO max_settings(owner,name,value,updated) VALUES(?,?,?,?) ON CONFLICT(owner,name) DO UPDATE SET value=excluded.value,updated=excluded.updated').bind(owner,name,await seal(value,env),new Date().toISOString()).run();}
export async function readJson(request,max=12000){const t=await request.text();if(t.length>max)fail('Request is too large.',413);try{return JSON.parse(t);}catch{fail('Invalid request.');}}
const validId=s=>typeof s==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(s);
export const record=(env,owner,id)=>env.DB.prepare('SELECT * FROM report_files WHERE owner=? AND id=?').bind(owner,id).first();
export async function historyApi(request,env,owner){
 const url=new URL(request.url),path=url.pathname.slice('/api/report-history'.length);
 if(!env.ARCHIVE)fail('Private file storage is unavailable. No download has been started.',503);
 if(path===''&&request.method==='GET'){const cursor=(url.searchParams.get('before')||'9999|~').split('|'),before=cursor[0],beforeId=cursor[1]||'~',deleted=url.searchParams.get('trash')==='1'?1:0;const {results}=await env.DB.prepare('SELECT id,title,name,mime,size,kind,sources,created,deleted,drive_id,drive_synced FROM report_files WHERE owner=? AND deleted=? AND (created<? OR (created=? AND id<?)) ORDER BY created DESC,id DESC LIMIT 101').bind(owner,deleted,before,before,beforeId).all();return json({files:results.slice(0,100).map(r=>({...r,sources:JSON.parse(r.sources)})),next:results.length>100?results[99].created+'|'+results[99].id:null});}
 if(path===''&&request.method==='POST'){
  const length=Number(request.headers.get('content-length'));if(length>40*1024*1024)fail('History accepts files up to 40 MB.',413);
  const form=await request.formData(),file=form.get('file'),id=form.get('id'),title=form.get('title'),kind=form.get('kind');let sources;try{sources=JSON.parse(form.get('sources')||'[]');}catch{fail('Invalid source references.');}
  if(!validId(id)||!file||typeof file.arrayBuffer!=='function'||!file.name||file.size>40*1024*1024||!['upload','download'].includes(kind)||typeof title!=='string'||title.length>200||!Array.isArray(sources)||sources.length>200||sources.some(x=>!validId(x)))fail('Invalid file history entry.');
  const old=await record(env,owner,id);if(old)return json({id:old.id,saved:true,driveSynced:!!old.drive_synced});
  for(const source of sources)if(!await record(env,owner,source))fail('An uploaded original is missing from History. Upload it again before downloading.');
  const bytes=await file.arrayBuffer(),sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join(''),name=file.name.replace(/[\x00-\x1f/\\]/g,'-').slice(0,200),key=owner+'/'+id,mime=file.type||'application/octet-stream';
  await env.ARCHIVE.put(key,bytes,{httpMetadata:{contentType:mime}});
  await env.DB.prepare('INSERT INTO report_files(owner,id,title,name,mime,size,kind,sources,sha256,created,deleted) VALUES(?,?,?,?,?,?,?,?,?,?,0) ON CONFLICT(owner,id) DO NOTHING').bind(owner,id,title||name,name,mime,bytes.byteLength,kind,JSON.stringify(sources),sha,new Date().toISOString()).run();
  return json({id,saved:true,driveSynced:false});
 }
 if(path==='/file'&&request.method==='GET'){
  const r=await record(env,owner,url.searchParams.get('id'));if(!r)fail('File not found.',404);
  let body;if(r.drive_synced){const {driveRequest}=await import('./drive-api.mjs');const response=await driveRequest(env,owner,'https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(r.drive_id)+'?alt=media');body=response.body;}else{const object=await env.ARCHIVE.get(owner+'/'+r.id);if(!object)fail('The archived file is unavailable. Your History entry has been preserved.',503);body=object.body;}
  return new Response(body,{headers:{'Content-Type':r.mime,'Content-Length':String(r.size),'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(r.name),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'"}});
 }
 if((path==='/delete'||path==='/restore')&&request.method==='POST'){
  const b=await readJson(request);if(!Array.isArray(b.ids)||!b.ids.length||b.ids.length>100||b.ids.some(x=>!validId(x)))fail('Choose up to 100 History files.');
  const ids=[...new Set(b.ids)];await env.DB.batch(ids.map(id=>env.DB.prepare('UPDATE report_files SET deleted=? WHERE owner=? AND id=?').bind(path==='/delete'?1:0,owner,id)));return json({saved:true,ids});
 }
 return json({error:'Not found'},404);
}
