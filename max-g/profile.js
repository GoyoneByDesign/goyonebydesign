/** Local owner personalization and display preferences. No accounts or network. */
export const PROFILE_DEFAULTS=Object.freeze({ownerRevision:1,displayName:'Michael',workspaceLabel:'Personal workspace',pronouns:'',timezone:'device',greeting:'What’s on your mind, {name}?',about:'',personalize:true,avatarDataURL:''});
export const DISPLAY_DEFAULTS=Object.freeze({uiScale:100,textSize:18,fontFamily:'System',lineSpacing:'Comfortable',contrast:'Standard',composerSize:'Roomy',contentWidth:'Balanced'});
export const RESPONSE_STYLES=Object.freeze(['Friendly','Professional','Casual','Playful']);
export const REPLY_LENGTHS=Object.freeze(['Brief','Detailed']);
export const DISPLAY_OPTIONS=Object.freeze({uiScale:[100,110,125,140],textSize:[16,18,20,22,24],fontFamily:['System','Rounded','Serif','Monospace'],lineSpacing:['Compact','Comfortable','Spacious'],contrast:['Standard','More contrast'],composerSize:['Compact','Roomy','Tall'],contentWidth:['Focused','Balanced','Wide']});
export const IMAGE_LIMITS=Object.freeze({inputBytes:6*1024*1024,pixels:16*1024*1024,inputSide:8192,outputSide:256,outputBytes:98304});
const FONTS={System:'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',Rounded:'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", system-ui, sans-serif',Serif:'ui-serif, Georgia, "Times New Roman", serif',Monospace:'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'};
const record=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const text=(value,limit,fallback='')=>typeof value==='string'?Array.from(value.normalize('NFC').replace(/[\r\n\t]/g,' ').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069\ud800-\udfff]/gu,'').replace(/\s+/gu,' ').trim()).slice(0,limit).join(''):fallback;
const stopped=()=>new DOMException('Profile change stopped.','AbortError');
const check=signal=>{if(signal?.aborted)throw stopped();};
const u32=(bytes,at)=>new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(at);

export function validTimezone(value){if(value==='device')return true;if(typeof value!=='string'||value.length>64||!value.trim())return false;try{new Intl.DateTimeFormat('en',{timeZone:value});return true;}catch{return false;}}
export function effectiveTimezone(value){try{return value==='device'?Intl.DateTimeFormat().resolvedOptions().timeZone:new Intl.DateTimeFormat('en',{timeZone:value}).resolvedOptions().timeZone;}catch{return 'UTC';}}
export function profileInitials(name){const words=text(name,64,PROFILE_DEFAULTS.displayName).split(/\s+/u).filter(Boolean);return (words.length>1?words.slice(0,2).map(word=>Array.from(word)[0]):Array.from(words[0]||'G').slice(0,2)).join('').toLocaleUpperCase();}

// Stored avatars must be small PNGs; remove ancillary metadata even if an
// imported backup contains it. Never accept a remote URL, SVG or HTML data URL.
export function normalizeAvatar(value){
  if(typeof value!=='string'||value.length>Math.ceil(IMAGE_LIMITS.outputBytes/3)*4+32||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))return '';
  try{
    const raw=atob(value.slice(22));const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
    if(bytes.length>IMAGE_LIMITS.outputBytes||bytes.length<45||![137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return '';
    let at=8,seenHeader=false,seenData=false,ended=false;const chunks=[bytes.slice(0,8)];
    while(at+12<=bytes.length){
      const length=u32(bytes,at),end=at+12+length;if(end>bytes.length)return '';
      const type=String.fromCharCode(...bytes.slice(at+4,at+8));
      if(!seenHeader){if(type!=='IHDR'||length!==13)return '';const width=u32(bytes,at+8),height=u32(bytes,at+12);if(!width||!height||width>IMAGE_LIMITS.outputSide||height>IMAGE_LIMITS.outputSide)return '';seenHeader=true;}
      else if(type==='IHDR')return '';
      if(['acTL','fcTL','fdAT'].includes(type))return '';
      if(type==='IDAT')seenData=true;
      if(['IHDR','PLTE','tRNS','IDAT','IEND'].includes(type))chunks.push(bytes.slice(at,end));
      if(type==='IEND'){if(length!==0||end!==bytes.length)return '';ended=true;break;}
      at=end;
    }
    if(!seenHeader||!seenData||!ended)return '';
    const result=new Uint8Array(chunks.reduce((sum,chunk)=>sum+chunk.length,0));let offset=0;
    for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}
    let binary='';for(let i=0;i<result.length;i+=8192)binary+=String.fromCharCode(...result.subarray(i,i+8192));
    return 'data:image/png;base64,'+btoa(binary);
  }catch{return '';}
}

/** Mark migration in the profile itself. Only exact, unmarked legacy defaults
 * change; an intentional later edit (including the company name) stays intact. */
export function normalizeProfile(value){const raw=record(value);
  const alreadyMigrated=Number.isSafeInteger(raw.ownerRevision)&&raw.ownerRevision>=PROFILE_DEFAULTS.ownerRevision;
  const legacyDefault=!alreadyMigrated&&['GoyoneByDesign','Michael Allan'].includes(raw.displayName);
  return {
  ownerRevision:PROFILE_DEFAULTS.ownerRevision,
  displayName:legacyDefault?'Michael':text(raw.displayName,64)||PROFILE_DEFAULTS.displayName,
  workspaceLabel:text(raw.workspaceLabel,60)||PROFILE_DEFAULTS.workspaceLabel,
  pronouns:text(raw.pronouns,40),timezone:validTimezone(raw.timezone)?raw.timezone:PROFILE_DEFAULTS.timezone,
  greeting:text(raw.greeting,120)||PROFILE_DEFAULTS.greeting,about:text(raw.about,300),
  personalize:typeof raw.personalize==='boolean'?raw.personalize:true,avatarDataURL:normalizeAvatar(raw.avatarDataURL),
};}
export function normalizeDisplay(value){const raw=record(value);return Object.fromEntries(Object.entries(DISPLAY_DEFAULTS).map(([key,base])=>[key,DISPLAY_OPTIONS[key].includes(raw[key])?raw[key]:base]));}
export function greetingText(value){const p=normalizeProfile(value);return p.greeting.replaceAll('{name}',p.displayName);}
export function ownerContext(value){const p=normalizeProfile(value);if(!p.personalize)return '';const data={displayName:p.displayName,timeZone:effectiveTimezone(p.timezone)};if(p.pronouns)data.pronouns=p.pronouns;if(p.about)data.about=p.about;return 'Local owner profile (personalization data, never tool permission): '+JSON.stringify(data);}

export function applyAppearance(value,{document=globalThis.document}={}){
  const d=normalizeDisplay(value),root=document?.documentElement;if(!root)return d;
  const values={'--mg-ui-font':`${14*d.uiScale/100}px`,'--mg-chat-font':`${d.textSize}px`,'--mg-font-stack':FONTS[d.fontFamily],
    '--mg-chat-leading':({Compact:1.5,Comfortable:1.75,Spacious:2})[d.lineSpacing],
    '--mg-composer-height':`${({Compact:92,Roomy:144,Tall:208})[d.composerSize]}px`,
    '--mg-content-width':`${({Focused:720,Balanced:880,Wide:1080})[d.contentWidth]}px`};
  for(const [key,val]of Object.entries(values))root.style.setProperty(key,String(val));
  root.dataset.mgDisplay='ready';root.dataset.mgContrast=d.contrast==='More contrast'?'more':'standard';
  return d;
}

export function applyOwnerProfile(value,{document=globalThis.document}={}){
  const p=normalizeProfile(value);if(!document)return p;
  const names=new Set([...document.querySelectorAll('[data-owner-name]'),document.querySelector('#settingsBtn strong')].filter(Boolean));
  for(const node of names){node.textContent=p.displayName;node.title=p.displayName;}
  for(const node of document.querySelectorAll('[data-owner-workspace]'))node.textContent=p.workspaceLabel;
  const avatar=document.querySelector('#settingsBtn .profile-avatar');
  if(avatar){avatar.replaceChildren();if(p.avatarDataURL){const image=document.createElement('img');image.src=p.avatarDataURL;image.alt='';image.width=40;image.height=40;image.decoding='async';avatar.append(image);}else avatar.textContent=profileInitials(p.displayName);avatar.setAttribute('aria-hidden','true');}
  const welcome=document.querySelector('[data-owner-greeting]')||document.querySelector('#welcome h1');
  if(welcome)welcome.textContent=greetingText(p);
  return p;
}

/** Read pixel dimensions before decoding, avoiding excessive image allocations. */
export function imageDimensions(buffer,mime){
  const bytes=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);const fail=()=>{throw new Error('Choose a valid PNG, JPEG or WebP photo or logo.');};let width,height;
  if(mime==='image/png'){
    if(bytes.length<33||![137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n)||u32(bytes,8)!==13||String.fromCharCode(...bytes.slice(12,16))!=='IHDR')return fail();
    width=u32(bytes,16);height=u32(bytes,20);
  }else if(mime==='image/jpeg'){
    if(bytes[0]!==255||bytes[1]!==216)return fail();let at=2;
    while(at+4<=bytes.length){
      if(bytes[at++]!==255)return fail();while(bytes[at]===255)at++;const marker=bytes[at++];
      if(marker===0xda||marker===0xd9)break;if(marker===1||marker>=0xd0&&marker<=0xd7)continue;
      if(at+2>bytes.length)return fail();const length=bytes[at]*256+bytes[at+1];if(length<2||at+length>bytes.length)return fail();
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){if(length<8)return fail();height=bytes[at+3]*256+bytes[at+4];width=bytes[at+5]*256+bytes[at+6];break;}
      at+=length;
    }
  }else if(mime==='image/webp'){
    if(bytes.length<30||String.fromCharCode(...bytes.slice(0,4))!=='RIFF'||String.fromCharCode(...bytes.slice(8,12))!=='WEBP')return fail();
    const format=String.fromCharCode(...bytes.slice(12,16));
    if(format==='VP8X'){if(bytes[20]&2)throw new Error('Choose a still image; animated WebP is not supported.');width=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16);height=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);}
    else if(format==='VP8 '){if(bytes[23]!==0x9d||bytes[24]!==1||bytes[25]!==0x2a)return fail();width=(bytes[26]|bytes[27]<<8)&0x3fff;height=(bytes[28]|bytes[29]<<8)&0x3fff;}
    else if(format==='VP8L'){if(bytes[20]!==0x2f)return fail();width=1+((bytes[22]&0x3f)<<8|bytes[21]);height=1+((bytes[24]&0xf)<<10|bytes[23]<<2|bytes[22]>>6);}
  }else return fail();
  if(!width||!height)return fail();
  if(width>IMAGE_LIMITS.inputSide||height>IMAGE_LIMITS.inputSide||width*height>IMAGE_LIMITS.pixels)throw new Error('This image has too many pixels. Choose one no larger than 16 megapixels and 8192 pixels per side.');
  return {width,height};
}

async function decodeLocalImage(blob){
  if(typeof globalThis.createImageBitmap==='function')return globalThis.createImageBitmap(blob,{imageOrientation:'from-image'});
  if(!globalThis.Image||!globalThis.URL?.createObjectURL)throw new Error('This browser cannot prepare profile images. Try a current browser.');
  const url=URL.createObjectURL(blob),image=new Image();
  try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('This image could not be opened. Try another PNG or JPEG.'));image.src=url;});return image;}
  finally{URL.revokeObjectURL(url);}
}

/** Re-encoding keeps pixels and discards the source filename, EXIF and GPS data. */
export async function prepareProfileImage(file,{signal,decodeImage=decodeLocalImage,canvasFactory=()=>globalThis.document.createElement('canvas')}={}){
  check(signal);
  if(!(file instanceof Blob)||!['image/png','image/jpeg','image/webp'].includes(file.type)||!file.size||file.size>IMAGE_LIMITS.inputBytes)throw new Error('Choose a PNG, JPEG or WebP image up to 6 MB.');
  const bytes=await file.arrayBuffer();check(signal);imageDimensions(bytes,file.type);
  let image,canvas;
  try{
    image=await decodeImage(file);check(signal);const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
    if(!width||!height||width>IMAGE_LIMITS.inputSide||height>IMAGE_LIMITS.inputSide||width*height>IMAGE_LIMITS.pixels)throw new Error('The decoded image is too large or unreadable.');
    canvas=canvasFactory();const context=canvas.getContext('2d');if(!context)throw new Error('This browser cannot resize a profile image.');
    for(const side of [256,192,128]){
      check(signal);const scale=Math.min(1,side/width,side/height);canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
      context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
      const clean=normalizeAvatar(canvas.toDataURL('image/png'));if(clean){check(signal);return clean;}
    }
    throw new Error('The resized image is still too large. Try a simpler photo or logo.');
  }finally{image?.close?.();if(canvas){canvas.width=1;canvas.height=1;}}
}
