/** Profile forms stage changes. The caller confirms durable local storage. */
import {PROFILE_DEFAULTS,DISPLAY_DEFAULTS,DISPLAY_OPTIONS,RESPONSE_STYLES,REPLY_LENGTHS,normalizeProfile,normalizeDisplay,profileInitials,greetingText,effectiveTimezone,validTimezone,prepareProfileImage} from './profile.js';
let nextId=0;
const el=(tag,text='',className='')=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
function field(label,value,{options,type='text',maxLength,help,rows=3}={}){
  const wrap=el('label','','mg-profile-field'),id=`maxg-profile-field-${++nextId}`;
  const caption=el('span',label),input=el(options?'select':type==='textarea'?'textarea':'input');input.id=id;caption.htmlFor=id;
  if(options)for(const entry of options){const option=el('option',typeof entry==='object'?entry.label:String(entry));option.value=typeof entry==='object'?entry.value:String(entry);input.append(option);}
  else if(type==='textarea')input.rows=rows;else input.type=type;
  input.value=String(value??'');if(maxLength)input.maxLength=maxLength;input.setAttribute('aria-label',label);wrap.append(caption,input);
  if(help){const hint=el('small',help,'mg-profile-muted');hint.id=id+'-help';input.setAttribute('aria-describedby',hint.id);wrap.append(hint);}
  return {wrap,input};
}
function layout(title,description,{signal}={}){
  const section=el('section','','mg-profile-settings');section.append(el('h3',title),el('p',description,'mg-profile-muted'));
  const form=el('form','','mg-profile-form');form.noValidate=true;
  const fields=el('fieldset','','mg-profile-fields'),footer=el('div','','mg-profile-actions');
  const status=el('p','','mg-profile-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const error=el('p','','mg-profile-error');error.setAttribute('role','alert');error.hidden=true;
  form.append(fields,footer,status,error);section.append(form);
  const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  section.dispose=()=>{controller.abort();signal?.removeEventListener('abort',abort);};
  const check=()=>{if(controller.signal.aborted)throw new DOMException('Settings change stopped.','AbortError');};
  let busy=false;
  const action=async callback=>{
    if(busy||controller.signal.aborted)return;busy=true;fields.disabled=true;form.setAttribute('aria-busy','true');
    for(const button of footer.querySelectorAll('button'))button.disabled=true;
    error.hidden=true;error.textContent='';status.textContent='';
    try{check();await callback(check);check();}
    catch(problem){if(problem?.name!=='AbortError'){status.textContent='';error.textContent=problem?.message||'This change could not be saved.';error.hidden=false;}}
    finally{busy=false;fields.disabled=false;form.removeAttribute('aria-busy');for(const button of footer.querySelectorAll('button'))button.disabled=false;}
  };
  return {section,form,fields,footer,status,error,signal:controller.signal,action,check};
}
function actionButton(label,callback,{primary=false}={}){const button=el('button',label,`button${primary?' button-primary':''}`);button.type='button';if(callback)button.addEventListener('click',callback);return button;}
function saveButton(label,onSave,form){const button=actionButton(label,null,{primary:true});button.type='submit';form.addEventListener('submit',event=>{event.preventDefault();onSave();});return button;}
async function committed(callback,value,signal){if(typeof callback!=='function')throw new Error('Local saving is not available in this view.');const saved=await callback(value,{signal});if(saved!==true)throw new Error('This change could not be saved on this device. Keep this form open and try again.');}

/**
 * Returns a section with dispose() to cancel pending image preparation and UI
 * completion when a tab closes. onSave({profile,style,replyLength},{signal}) must
 * return true only after storage commits; false or rejection stays an error.
 */
export function renderProfileSettings({profile,style='Friendly',replyLength='Brief',onSave,onBeforeImage,signal,prepareImage=prepareProfileImage}={}){
  const original=normalizeProfile(profile),ui=layout('Your local profile','Personalize MAX-G on this browser. This is a local owner profile, not a website login or an account with administrator privileges.',{signal});
  const maker=el('div','','mg-maker-credit mg-maker-profile'),makerLogo=el('img'),makerText=el('div');
  makerLogo.src=new URL('./assets/goyonebydesign-logo.png',import.meta.url).href;makerLogo.alt='';makerLogo.width=44;makerLogo.height=44;
  makerText.append(el('small','MAX-G is created by'),el('strong','GoyoneByDesign'));maker.append(makerLogo,makerText);ui.section.insertBefore(maker,ui.form);
  let draftAvatar=original.avatarDataURL;
  const avatarRow=el('div','','mg-profile-avatar-row'),preview=el('div','','mg-profile-avatar-preview');
  const imageInfo=el('div','','mg-profile-image-info');imageInfo.append(el('strong','Your photo or logo'),el('p','Choose a still PNG, JPEG or WebP, up to 6 MB. MAX-G keeps a small resized PNG; the original filename and photo metadata are discarded. The resized image is included in personal backups.','mg-profile-muted'));
  const picker=field('Choose profile photo or logo','',{type:'file'});picker.input.accept='image/png,image/jpeg,image/webp';
  const photoActions=el('div','','mg-profile-actions'),remove=actionButton('Remove photo or logo',()=>{draftAvatar='';picker.input.value='';renderAvatar();ui.status.textContent='Photo removal is staged. Select Save profile to keep this change.';});
  const brand=actionButton('Use GoyoneByDesign logo',()=>ui.action(async check=>{
    const response=await fetch(new URL('./assets/goyonebydesign-logo.png',import.meta.url),{signal:ui.signal,credentials:'omit',cache:'force-cache',redirect:'error'});check();
    if(!response.ok||Number(response.headers.get('content-length'))>6*1024*1024)throw new Error('The bundled logo is unavailable. You can choose a photo or logo from this device instead.');
    const file=await response.blob();check();const prepared=await prepareImage(file,{signal:ui.signal});check();
    const checked=normalizeProfile({...candidate(),avatarDataURL:prepared}).avatarDataURL;if(!checked)throw new Error('The bundled logo could not be prepared.');
    draftAvatar=checked;renderAvatar();ui.status.textContent='GoyoneByDesign logo prepared locally. Select Save profile to keep it.';
  }));
  photoActions.append(brand,remove);imageInfo.append(picker.wrap,photoActions);avatarRow.append(preview,imageInfo);ui.fields.append(avatarRow);
  const name=field('Display name',original.displayName,{maxLength:64,help:'Used in this workspace and, when personalization is on, in local replies.'});
  const workspace=field('Workspace label',original.workspaceLabel,{maxLength:60,help:'A label for this local workspace; it does not create an account.'});
  const pronouns=field('Pronouns (optional)',original.pronouns,{maxLength:40});
  const zone=field('Time zone',original.timezone,{maxLength:64,help:'Use “device” for this device’s zone, or an IANA name such as America/New_York. Existing schedule intervals stay unchanged.'});
  const timezoneList=el('datalist');timezoneList.id=`maxg-timezones-${++nextId}`;zone.input.setAttribute('list',timezoneList.id);
  let zones=['UTC','America/New_York','America/Los_Angeles','Europe/London','Asia/Manila','Asia/Tokyo'];try{zones=Intl.supportedValuesOf('timeZone');}catch{}
  for(const value of ['device',...zones]){const option=el('option');option.value=value;timezoneList.append(option);}zone.wrap.append(timezoneList);
  const greeting=field('Welcome greeting',original.greeting,{maxLength:120,help:'Optional {name} inserts your display name. This changes the welcome screen.'});
  const about=field('About you (optional)',original.about,{type:'textarea',maxLength:300,help:'A short note about your work or interests for local replies. Avoid passwords and other secrets.'});
  const styleField=field('Response style',RESPONSE_STYLES.includes(style)?style:'Friendly',{options:RESPONSE_STYLES});
  const lengthField=field('Reply length',REPLY_LENGTHS.includes(replyLength)?replyLength:'Brief',{options:REPLY_LENGTHS});
  const personalize=field('Use profile details in local replies',original.personalize?'yes':'no',{options:[{value:'yes',label:'On · personalize local replies'},{value:'no',label:'Off · keep profile out of model prompts'}],help:'Only your display name, pronouns, time zone and About you are used by the local model. The photo stays in the interface; profile fields are not added to public search queries.'});
  const grid=el('div','','mg-profile-grid');grid.append(name.wrap,workspace.wrap,pronouns.wrap,zone.wrap,styleField.wrap,lengthField.wrap);
  ui.fields.append(grid,greeting.wrap,about.wrap,personalize.wrap);
  const greetingPreview=el('div','','mg-profile-greeting-preview');greetingPreview.setAttribute('aria-label','Welcome greeting preview');
  const datePreview=el('p','','mg-profile-muted');ui.fields.append(greetingPreview,datePreview);
  const candidate=()=>normalizeProfile({ownerRevision:PROFILE_DEFAULTS.ownerRevision,displayName:name.input.value,workspaceLabel:workspace.input.value,pronouns:pronouns.input.value,timezone:zone.input.value.trim(),greeting:greeting.input.value,about:about.input.value,personalize:personalize.input.value==='yes',avatarDataURL:draftAvatar});
  function renderAvatar(){preview.replaceChildren();if(draftAvatar){const image=el('img');image.src=draftAvatar;image.alt='Selected profile photo or logo';image.width=88;image.height=88;preview.append(image);}else{preview.textContent=profileInitials(name.input.value);preview.setAttribute('aria-label','Profile initials');}remove.disabled=!draftAvatar;}
  function renderPreview(){greetingPreview.textContent=greetingText(candidate());if(validTimezone(zone.input.value.trim())){try{datePreview.textContent='Time zone preview: '+new Intl.DateTimeFormat(undefined,{timeZone:effectiveTimezone(zone.input.value.trim()),dateStyle:'medium',timeStyle:'short'}).format(new Date());}catch{datePreview.textContent='';}}else datePreview.textContent='Enter a valid IANA time zone or “device”.';}
  for(const input of [name.input,greeting.input,zone.input])input.addEventListener('input',()=>{renderPreview();if(input===name.input)renderAvatar();});
  picker.input.addEventListener('change',()=>ui.action(async check=>{
    const file=picker.input.files?.[0];if(!file)return;
    try{if(onBeforeImage&&await onBeforeImage({signal:ui.signal})===false)throw new Error('Profile image access was not allowed.');check();
      const prepared=await prepareImage(file,{signal:ui.signal});check();
      const checked=normalizeProfile({...candidate(),avatarDataURL:prepared}).avatarDataURL;if(!checked)throw new Error('This image could not be prepared. Choose another photo or logo.');
      draftAvatar=checked;renderAvatar();ui.status.textContent='Image prepared locally. Select Save profile to keep it.';
    }finally{picker.input.value='';}
  }));
  ui.footer.append(saveButton('Save profile',()=>ui.action(async check=>{
    if(!name.input.value.trim())throw new Error('Enter a display name.');
    if(!validTimezone(zone.input.value.trim()))throw new Error('Enter a valid time zone, such as America/New_York, or use “device”.');
    const next=candidate();await committed(onSave,{profile:next,style:styleField.input.value,replyLength:lengthField.input.value},ui.signal);check();
    draftAvatar=next.avatarDataURL;renderAvatar();renderPreview();ui.status.textContent='Profile saved on this device.';
  }),ui.form));
  ui.section.addEventListener('input',()=>{if(ui.status.textContent.includes('saved'))ui.status.textContent='Changes are staged. Select Save profile to keep them.';});
  renderAvatar();renderPreview();return ui.section;
}

export function renderDisplaySettings({display,onSave,signal}={}){
  const initial=normalizeDisplay(display),ui=layout('Display & readability','Choose comfortable text, spacing and controls. The sample below previews your choices; Save display applies them across this browser.',{signal});
  const fields={};
  const definitions={uiScale:['Interface size',DISPLAY_OPTIONS.uiScale.map(value=>({value,label:value===100?'100% · Standard':`${value}% · Larger controls`}))],
    textSize:['Conversation text size',DISPLAY_OPTIONS.textSize.map(value=>({value,label:`${value} px`}))],fontFamily:['Reading font',DISPLAY_OPTIONS.fontFamily],lineSpacing:['Line spacing',DISPLAY_OPTIONS.lineSpacing],
    contrast:['Contrast',DISPLAY_OPTIONS.contrast],composerSize:['Message box height',DISPLAY_OPTIONS.composerSize],contentWidth:['Conversation width',DISPLAY_OPTIONS.contentWidth]};
  const grid=el('div','','mg-profile-grid');
  for(const [key,[label,options]]of Object.entries(definitions)){const item=field(label,initial[key],{options});fields[key]=item.input;grid.append(item.wrap);}
  ui.fields.append(grid);
  const preview=el('div','','mg-display-preview'),label=el('span','MAX-G · READABILITY PREVIEW','mg-profile-muted'),message=el('p','I’m here to help. We can think through your question, make a plan, or create something together.'),composer=el('div','Your next message goes here…','mg-display-composer-preview');
  preview.append(label,message,composer);ui.fields.append(preview,el('p','Theme and Orbit animation remain in General. Font choices use fonts already available on your device; no font download is needed.','mg-profile-muted'));
  const candidate=()=>normalizeDisplay(Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,['uiScale','textSize'].includes(key)?Number(input.value):input.value])));
  function showPreview(){const value=candidate();preview.dataset.contrast=value.contrast==='More contrast'?'more':'standard';preview.style.setProperty('--mg-preview-font',`${value.textSize}px`);preview.style.setProperty('--mg-preview-leading',({Compact:1.5,Comfortable:1.75,Spacious:2})[value.lineSpacing]);preview.dataset.font=value.fontFamily.toLowerCase();composer.style.minHeight=`${({Compact:62,Roomy:84,Tall:112})[value.composerSize]}px`;}
  for(const input of Object.values(fields))input.addEventListener('change',()=>{showPreview();ui.status.textContent='Display changes are staged. Select Save display to apply them.';});
  ui.footer.append(saveButton('Save display',()=>ui.action(async check=>{await committed(onSave,candidate(),ui.signal);check();ui.status.textContent='Display settings saved on this device.';}),ui.form),
    actionButton('Restore display defaults',()=>{for(const [key,input]of Object.entries(fields))input.value=String(DISPLAY_DEFAULTS[key]);showPreview();ui.status.textContent='Defaults are staged. Select Save display to apply them.';}));
  showPreview();return ui.section;
}
