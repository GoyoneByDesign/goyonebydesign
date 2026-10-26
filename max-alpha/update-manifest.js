/** Complete same-origin release staging. A marker is written only after every
 * declared file has passed byte-length and SHA-256 verification. */
export function validateManifest(release,{version,build,scope,requiredPaths=[]}){
 if(release?.schema!==1||release.version!==version||release.build!==build||!Array.isArray(release.files)||!release.files.length||release.files.length>200)throw Error('The shared release is still being published.');
 const seen=new Set();let total=0;
 for(const file of release.files){
  if(typeof file.path!=='string'||!/^[a-zA-Z0-9_./-]+$/.test(file.path)||file.path.startsWith('/')||file.path.split('/').some(p=>!p||p==='.'||p==='..')||seen.has(file.path)||!Number.isSafeInteger(file.bytes)||file.bytes<0||file.bytes>8*1024*1024||!/^[a-f0-9]{64}$/.test(file.sha256))throw Error('Invalid release file information.');
  const url=new URL(file.path,scope);if(url.origin!==scope.origin||!url.href.startsWith(scope.href))throw Error('Release file is outside this app.');
  seen.add(file.path);total+=file.bytes;
 }
 if(requiredPaths.some(path=>!seen.has(path)))throw Error('Required app files are missing from the release.');
 if(total>24*1024*1024||!seen.has('index.html')||!seen.has('release-version.js'))throw Error('Incomplete or oversized app release.');
 return release.files;
}
export async function stageRelease({cache,release,raw,scope,version,build,requiredPaths=[],fetcher=fetch,digest=bytes=>crypto.subtle.digest('SHA-256',bytes)}){
 const files=validateManifest(release,{scope,version,build,requiredPaths});
 // Bound concurrent downloads; wait for every worker before deleting a failed stage.
 let index=0,failed;
 const worker=async()=>{while(!failed&&index<files.length){const file=files[index++];try{
  const url=new URL(file.path,scope).href,response=await fetcher(new Request(url,{cache:'no-store',credentials:'omit',redirect:'error'}));
  if(!response.ok||response.redirected||response.type==='opaque')throw Error('A release file could not be downloaded.');
  const body=await response.arrayBuffer();
  if(body.byteLength!==file.bytes)throw Error('A release file is incomplete.');
  const hash=Array.from(new Uint8Array(await digest(body)),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==file.sha256)throw Error('A release file failed integrity verification.');
  await cache.put(url,new Response(body,{headers:response.headers,status:200}));
 }catch(error){failed=error;}}};
 await Promise.all(Array.from({length:4},worker));if(failed)throw failed;
 await cache.put(new URL('./release.json',scope).href,new Response(raw,{headers:{'Content-Type':'application/json'}}));
}
