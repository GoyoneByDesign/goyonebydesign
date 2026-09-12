import {setting,saveSetting,readJson,record,fail} from './history-api.mjs';
const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const scope='https://www.googleapis.com/auth/drive.file';
const callback=origin=>origin+'/api/drive/callback';
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
async function google(url,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);try{const r=await fetch(url,{...options,redirect:'manual',signal:controller.signal});if(!r.ok){await r.body?.cancel();fail(r.status===401?'Google Drive authorization expired. Reconnect in History.':r.status===403?'Google Drive denied this request. Check Drive API access and available storage.':'Google Drive did not complete the request. Your private copy is retained. Retry Sync to Drive.',r.status===429?429:503);}return r;}finally{clearTimeout(timer);}}
async function credentials(env,owner){const value=await setting(env,owner,'drive:credentials');if(!value)fail('Add the Google OAuth Client ID and Client Secret in History first.',409);return JSON.parse(value);}
async function access(env,owner){const creds=await credentials(env,owner),refresh=await setting(env,owner,'drive:refresh');if(!refresh)fail('Connect Google Drive in History first.',409);const r=await google('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({client_id:creds.clientId,client_secret:creds.clientSecret,refresh_token:refresh,grant_type:'refresh_token'})}),data=await r.json();if(!data.access_token)fail('Google Drive needs to be reconnected.',409);return data.access_token;}
export async function driveRequest(env,owner,url,options={}){return google(url,{...options,headers:{...options.headers,Authorization:'Bearer '+await access(env,owner)}});}
async function sync(env,owner,id){
 const r=await record(env,owner,id);if(!r||r.deleted)fail('History file not found.',404);if(r.drive_synced)return {id,synced:true};
 const folder=await setting(env,owner,'drive:folder');if(!folder)fail('Connect Google Drive to choose its private archive folder.',409);
 // Persist a Google-generated ID before uploading, so interrupted uploads can be retried without duplicates.
 let driveId=r.drive_id;if(!driveId){const result=await(await driveRequest(env,owner,'https://www.googleapis.com/drive/v3/files/generateIds?count=1&space=drive')).json();driveId=result.ids?.[0];if(!driveId)fail('Drive could not reserve a file ID.',503);await env.DB.prepare('UPDATE report_files SET drive_id=? WHERE owner=? AND id=? AND drive_id IS NULL').bind(driveId,owner,id).run();driveId=(await record(env,owner,id)).drive_id;}
 const token=await access(env,owner),auth={Authorization:'Bearer '+token},checkUrl='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(driveId)+'?fields=id,size,trashed';
 let check=await fetch(checkUrl,{headers:auth,redirect:'manual'}),verified=check.ok?await check.json():null;if(!check.ok&&check.status!==404){await check.body?.cancel();fail('Drive could not verify the archive. Your private copy is retained.',503);}
 if(!verified){const object=await env.ARCHIVE.get(owner+'/'+id);if(!object)fail('The private copy is unavailable.',503);const metadata={id:driveId,name:r.name,parents:[folder],appProperties:{maxHistoryId:id,sha256:r.sha256}};
 const session=await google('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,size',{method:'POST',headers:{...auth,'Content-Type':'application/json','X-Upload-Content-Type':r.mime,'X-Upload-Content-Length':String(r.size)},body:JSON.stringify(metadata)}),location=session.headers.get('Location');await session.body?.cancel();
 if(!location||new URL(location).origin!=='https://www.googleapis.com')fail('Drive returned an invalid upload address. The private copy is retained.',503);
 await(await google(location,{method:'PUT',headers:{...auth,'Content-Type':r.mime,'Content-Length':String(r.size)},body:object.body,duplex:'half'})).body?.cancel();verified=await(await google(checkUrl,{headers:auth})).json();}

 if(verified.trashed||Number(verified.size)!==r.size)fail('Drive verification did not match this file. The private original is retained.',503);
 await env.DB.prepare('UPDATE report_files SET drive_synced=1 WHERE owner=? AND id=?').bind(owner,id).run();await env.ARCHIVE.delete(owner+'/'+id);return {id,synced:true};
}
export default async function driveApi(request,env,owner){
 const url=new URL(request.url),path=url.pathname.slice('/api/drive/'.length);
 if(path==='status'&&request.method==='GET'){return json({configured:!!await setting(env,owner,'drive:credentials'),connected:!!await setting(env,owner,'drive:refresh'),folderReady:!!await setting(env,owner,'drive:folder'),email:await setting(env,owner,'drive:email'),redirectUri:callback(url.origin),footerRoot:env.PMIX_FOOTER_ROOT||''});}
 if(path==='configure'&&request.method==='POST'){const b=await readJson(request,3000);if(typeof b.clientId!=='string'||!/^[-a-zA-Z0-9.]+\.apps\.googleusercontent\.com$/.test(b.clientId)||typeof b.clientSecret!=='string'||b.clientSecret.length<10||b.clientSecret.length>500||/\s/.test(b.clientSecret))fail('Enter the Web application OAuth Client ID and Client Secret from Google Cloud.');await saveSetting(env,owner,'drive:credentials',JSON.stringify({clientId:b.clientId,clientSecret:b.clientSecret}));await env.DB.prepare("DELETE FROM max_settings WHERE owner=? AND name IN ('drive:refresh','drive:email')").bind(owner).run();return json({saved:true});}
 if(path==='start'&&request.method==='POST'){
  const creds=await credentials(env,owner),state=random(),nonce=random(),verifier=random(),challenge=btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  await saveSetting(env,owner,'drive:state',JSON.stringify({state,nonce,verifier,expires:Date.now()+600000,origin:url.origin}));const params=new URLSearchParams({client_id:creds.clientId,redirect_uri:callback(url.origin),response_type:'code',scope,access_type:'offline',prompt:'consent',state,code_challenge:challenge,code_challenge_method:'S256'});
  return new Response(JSON.stringify({url:'https://accounts.google.com/o/oauth2/v2/auth?'+params}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':'__Host-maxdrive='+nonce+'; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax'}});
 }
 if(path==='callback'&&request.method==='GET'){
  // This callback requires the same Site owner and a one-use browser-bound state created after PIN unlock.
  const value=await setting(env,owner,'drive:state'),state=value?JSON.parse(value):null,nonce=request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-maxdrive=([^;]+)/)?.[1];
  if(!state||!nonce||state.nonce!==nonce||state.state!==url.searchParams.get('state')||state.expires<Date.now()||state.origin!==url.origin)fail('Google connection request expired. Return to History and connect again.',403);
  const consumed=await env.DB.prepare("DELETE FROM max_settings WHERE owner=? AND name='drive:state'").bind(owner).run();if((consumed.meta?.changes??consumed.changes)!==1)fail('This Google connection request was already used.',403);
  if(url.searchParams.has('error'))return Response.redirect(url.origin+'/#reportHistory',303);
  const creds=await credentials(env,owner),code=url.searchParams.get('code');if(!code||code.length>4000)fail('Google did not return a connection code.');
  const result=await(await google('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({code,client_id:creds.clientId,client_secret:creds.clientSecret,redirect_uri:callback(url.origin),grant_type:'authorization_code',code_verifier:state.verifier})})).json();
  if(!result.refresh_token||!(result.scope||'').split(' ').includes(scope))fail('Google did not grant persistent file access. Return to History and connect again.',409);
  const auth={Authorization:'Bearer '+result.access_token},about=await(await google('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)',{headers:auth})).json();if(String(about.user?.emailAddress||'').toLowerCase()!==String(env.OWNER_EMAIL||'').toLowerCase())fail('Use the same Google account as the MAX owner. No files were uploaded.',403);
  // Reuse the app-created private folder; no Drive writes occur until the owner completes this consent flow.
  const list=await(await google('https://www.googleapis.com/drive/v3/files?fields=files(id)&q='+encodeURIComponent("trashed=false and mimeType='application/vnd.google-apps.folder' and appProperties has { key='maxArchive' and value='v1' }"),{headers:auth})).json();let folder=list.files?.[0]?.id;
  if(!folder){const made=await(await google('https://www.googleapis.com/drive/v3/files?fields=id',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({name:'MAX Report History',mimeType:'application/vnd.google-apps.folder',appProperties:{maxArchive:'v1'}})})).json();folder=made.id;}if(!folder)fail('Drive could not create its private archive folder. No reports were uploaded.',503);
  await saveSetting(env,owner,'drive:refresh',result.refresh_token);await saveSetting(env,owner,'drive:email',about.user.emailAddress);await saveSetting(env,owner,'drive:folder',folder);
  return new Response(null,{status:303,headers:{Location:url.origin+'/#reportHistory','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Set-Cookie':'__Host-maxdrive=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'}});
 }
 if(path==='sync'&&request.method==='POST'){const b=await readJson(request);if(typeof b.id!=='string')fail('Choose a History file.');return json(await sync(env,owner,b.id));}
 if(path==='disconnect'&&request.method==='POST'){await env.DB.prepare("DELETE FROM max_settings WHERE owner=? AND name IN ('drive:refresh','drive:email','drive:state')").bind(owner).run();return json({saved:true});}
 return json({error:'Not found'},404);
}
