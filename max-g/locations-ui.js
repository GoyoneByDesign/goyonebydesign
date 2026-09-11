/** Explicit place searches and one-shot location. Device coordinates stay in this tab's memory. */
import {LOCATION_DEFAULTS,normalizeLocationSettings,normalizeCountry,COUNTRY_OPTIONS,CATEGORY_LABELS,resolvePlace,nearbyPlaces,getDeviceLocation,directionsLinks,clearLocationCache} from './locations.js';
const el=(tag,text='',className='')=>{const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;};
const button=(label,fn)=>{const n=el('button',label,'button button-small');n.type='button';n.onclick=()=>Promise.resolve().then(fn).catch(()=>{});return n;};
const link=(label,url)=>{const n=el('a',label,'button button-small');n.href=url;n.target='_blank';n.rel='noopener noreferrer';return n;};
const distance=meters=>meters<1000?`${Math.round(meters/10)*10} m`:`${(meters/1000).toFixed(1)} km`;
const stopped=()=>new DOMException('Location operation stopped.','AbortError');
const MODES={driving:'Driving',walking:'Walking',bicycling:'Cycling',transit:'Public transport'};
function field(label,value,{options,placeholder}={}){const wrap=el('label','','location-field');const input=el(options?'select':'input');input.setAttribute('aria-label',label);if(options)for(const [value,title]of Object.entries(options)){const option=el('option',title);option.value=value;input.append(option);}else {input.type='text';input.maxLength=180;input.autocomplete='off';}input.value=String(value||'');if(placeholder)input.placeholder=placeholder;wrap.append(el('span',label),input);if(!options&&/country$/i.test(label)){const list=el('datalist');list.id='maxg-countries-'+crypto.randomUUID();for(const country of COUNTRY_OPTIONS){const option=el('option',country.code);option.value=country.label;list.append(option);}input.setAttribute('list',list.id);wrap.append(list);}return {wrap,input};}

export function createLocationHub({getSettings=()=>LOCATION_DEFAULTS,saveSettings=async()=>{},permission=async()=>{},runTask=async fn=>fn(new AbortController().signal),onCancel=()=>{},onNavigate=()=>{},onReply=async()=>{},toast=()=>{}}={}){
  let panel=null,mounted=false,origin=null,originTime=0,originQuery='',controller=null,epoch=0,status='',results=[],choices=[],selection=null,fallback=null,attribution=null,resultRadius=null;
  let fields={},draft=null,saving=false,saveEpoch=0,saveError='',saveNotice='',saveControl=null,saveStatusNode=null;
  const config=()=>normalizeLocationSettings(getSettings());
  function currentOrigin(){if(origin?.source==='device'&&Date.now()-originTime>300000)origin=null;return origin;}
  function cancel(){const wasRunning=Boolean(controller);epoch++;controller?.abort();controller=null;onCancel();if(wasRunning){status='Location search stopped.';render();}}
  function forget(){saveEpoch++;saving=false;saveError='';saveNotice='';cancel();clearLocationCache();origin=null;originTime=0;originQuery='';draft=null;fields={};results=[];choices=[];selection=null;fallback=null;attribution=null;status='Location and nearby results cleared from this tab.';render();}
  function verify(id,signal){if(id!==epoch||signal.aborted)throw stopped();}
  function read(){return {...config(),...(draft||{}),...(fields.place?{place:fields.place.value,country:fields.country.value,mode:fields.mode.value,radius:Number(fields.radius.value)}:{})};}
  const sameDetails=(a,b)=>['place','country','mode','radius'].every(key=>a[key]===b[key]);
  function refreshSaveFeedback(){
    if(!mounted||!saveStatusNode?.isConnected)return;
    const value=read(),dirty=Boolean(value.country.trim()&&!normalizeCountry(value.country))||!sameDetails(normalizeLocationSettings(value),config());
    saveControl.disabled=saving;saveControl.textContent=saving?'Saving…':'Save location';
    saveStatusNode.dataset.state=saving?'saving':saveError?'error':dirty?'unsaved':'saved';
    saveStatusNode.textContent=saving?'Saving location on this device…':saveError|| (dirty?'Unsaved changes. Tap Save location to keep them.':saveNotice|| (config().place?'Saved location loaded on this device.':'Save a typed place to use it next time on this device.'));
  }
  async function saveLocation(){
    if(saving)return;
    const value=read(),id=saveEpoch;
    try{
      if(!value.place.trim())throw Error('Enter a city, address or postal code to save. Current GPS coordinates are not saved.');
      if(value.place.trim().length>160)throw Error('Keep the saved place to 160 characters or fewer.');
      if(value.country.trim()&&!normalizeCountry(value.country))throw Error('Choose a valid country name or two-letter country code.');
      const saved=normalizeLocationSettings({...value,mapProvider:config().mapProvider});
      saving=true;saveError='';saveNotice='';refreshSaveFeedback();
      await saveSettings(saved);
      if(id!==saveEpoch)return;
      // Keep edits made while storage was busy. Saving never starts or clears a lookup.
      if(sameDetails(read(),value)){
        draft={...read(),...saved};
        if(fields.place){fields.place.value=saved.place;fields.country.value=saved.country;}
      }
      saveNotice='Location saved on this device. It will be here when you reopen MAX-G.';
    }catch(error){if(id===saveEpoch)saveError=error.message||'Location could not be saved. Please try again.';}
    finally{if(id===saveEpoch){saving=false;refreshSaveFeedback();}}
  }
  function maps(destination){const prefs=normalizeLocationSettings(read());const point=destination.lat+','+destination.lon;const links=destination.source==='device'?[{provider:'google',label:'Google Maps',url:'https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:point})},{provider:'apple',label:'Apple Maps',url:'https://maps.apple.com/?'+new URLSearchParams({ll:point,q:'Current location'})},{provider:'waze',label:'Waze',url:'https://waze.com/ul?'+new URLSearchParams({ll:point,zoom:'16'})}]:directionsLinks(destination,{mode:prefs.mode});return [...links].sort((a,b)=>Number(b.provider===prefs.mapProvider)-Number(a.provider===prefs.mapProvider));}
  function renderSources(parent){if(attribution?.url){const a=el('a',attribution.text||'Map data source','location-attribution');a.href=attribution.url;a.target='_blank';a.rel='noopener noreferrer';parent.append(a);}}
  function render(){
    if(!mounted||!panel?.isConnected)return;
    const previous=read();draft=previous;panel.replaceChildren();fields={};
    const card=el('section','','card locations-card');card.append(el('h3','Where would you like to go?'),el('p','Use a city or postal code with its country, or share your current location once.','muted'));
    const form=el('form','','location-form');
    const place=field('City, address or postal code',previous.place,{placeholder:'02108 · SW1A 1AA · Manila'}),country=field('Country',previous.country,{placeholder:'US, United Kingdom, Canada…'}),mode=field('Travel mode',previous.mode,{options:MODES}),radius=field('Nearby radius',previous.radius,{options:{750:'750 m',1500:'1.5 km',3000:'3 km',5000:'5 km'}});
    place.input.maxLength=160;
    fields={place:place.input,country:country.input,mode:mode.input,radius:radius.input};
    for(const input of Object.values(fields))input.oninput=()=>{draft=read();saveError='';saveNotice='';refreshSaveFeedback();};
    mode.input.onchange=()=>render();
    const grid=el('div','','location-grid');grid.append(place.wrap,country.wrap,mode.wrap,radius.wrap);form.append(grid);
    const resolve=button('Find this place',()=>lookup());resolve.type='submit';resolve.onclick=null;form.onsubmit=e=>{e.preventDefault();lookup().catch(()=>{});};
    saveControl=button('Save location',saveLocation);saveControl.classList.add('button-primary');
    const actions=el('div','','location-actions');actions.append(saveControl,resolve,button('Use current location',()=>locate()),button('Forget location',forget));form.append(actions);
    saveStatusNode=el('p','','location-save-status');saveStatusNode.setAttribute('role','status');saveStatusNode.setAttribute('aria-live','polite');form.append(saveStatusNode);card.append(form);
    const selected=currentOrigin();card.append(el('p',selected?`Searching around ${selected.label||'your current location'}${Number.isFinite(selected.accuracyMeters)?` · device accuracy about ${Math.round(selected.accuracyMeters)} m`: ' · approximate place centre'}.`:'No location selected. Your GPS is not being tracked.','location-origin'));
    const categories=el('div','','location-categories');for(const [category,label]of Object.entries(CATEGORY_LABELS))categories.append(button(label,()=>findNearby(category)));card.append(categories);
    const note=el('p','A device fix may use GPS, Wi-Fi or network estimates. Searching shares the selected point with the map-data service. Directions open the selected maps app, which uses its own location permission.','location-note');card.append(note);
    const live=el('p',status,'location-status');live.setAttribute('role','status');card.append(live);if(controller)card.append(button('Stop location search',()=>{cancel();status='Location search stopped.';render();}));panel.append(card);refreshSaveFeedback();
    if(choices.length){const section=el('section','','card location-choices');section.append(el('h3','Choose the matching place'),el('p','Postal codes identify an area. Check the country and region before continuing.','muted'));for(const item of choices)section.append(button(item.label,()=>choose(item)));panel.append(section);}
    if(results.length){const section=el('section','','location-results');section.append(el('h3',results.some(x=>Number.isFinite(x.distanceMeters))?'Nearby places':'Selected place'));
      for(const item of results){const row=el('article','','card location-result');row.append(el('h4',item.name||item.label));if(item.address)row.append(el('p',item.address,'muted'));if(Number.isFinite(item.distanceMeters))row.append(el('p',`${distance(item.distanceMeters)} away · straight-line estimate`,'location-distance'));if(item.openingHours)row.append(el('p',`Listed hours: ${item.openingHours} · verify with the business`,'location-note'));const actions=el('div','','location-map-links');for(const destination of maps(item))actions.append(link(destination.label,destination.url));row.append(actions);section.append(row);}renderSources(section);panel.append(section);
    }
    if(fallback){const section=el('section','','card');section.append(el('h3','Continue in a maps app'),el('p','The public lookup has limited coverage or is busy. You can continue your search here:','muted'));const q=fallback,google=new URL('https://www.google.com/maps/search/');google.search=new URLSearchParams({api:'1',query:q});const apple=new URL('https://maps.apple.com/');apple.search=new URLSearchParams({q});const waze=new URL('https://waze.com/ul');waze.search=new URLSearchParams({q});section.append(link('Search Google Maps',google.href),link('Search Apple Maps',apple.href),link('Search Waze',waze.href));panel.append(section);}
    panel.append(el('p','Nearby data comes from public map contributors and may be incomplete. These are the closest returned results within the completed search radius, not live traffic estimates or guaranteed opening hours.','location-note'));
  }
  async function perform(fn){
    cancel();const id=epoch;controller=new AbortController();const local=controller;status='Looking up your request…';render();
    try{return await runTask(async signal=>{const abort=()=>local.abort();signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();try{verify(id,local.signal);return await fn(local.signal,()=>verify(id,local.signal));}finally{signal.removeEventListener('abort',abort);}},{signal:local.signal});}
    catch(error){if(id===epoch){status=error.name==='AbortError'?'Location search stopped.':error.message;toast(status);}return null;}
    finally{if(id===epoch){controller=null;render();}}
  }
  async function device(signal,check){await permission('location',{picked:true});check();const fix=await getDeviceLocation({signal});check();origin={...fix,label:'your current location'};originTime=Date.now();originQuery='';return origin;}
  async function resolve(query,country,signal,check){await permission('internet');check();const found=await resolvePlace(query,{country,signal});check();status=found.message||'';if(found.needsCountry){status=found.message||'Choose a country for this postal code.';return null;}if(found.results.length!==1){choices=found.results;fallback=choices.length?null:[query,country].filter(Boolean).join(', ');return null;}return found.results[0];}
  async function setOriginFromFields(signal,check,{useDevice=false}={}){
    const value=read();
    if(useDevice){origin=null;return device(signal,check);}
    if(value.place.trim()){
      if(currentOrigin()&&origin.source!=='device'&&[originQuery,origin.label].includes(value.place.trim())&&(!value.country||normalizeCountry(value.country)===origin.countryCode))return origin;
      origin=null;const found=await resolve(value.place,value.country,signal,check);if(found){origin=found;originTime=Date.now();originQuery=value.place.trim();}return found;
    }
    if(currentOrigin()?.source==='device'){
      try{await permission('location',{picked:true});check();const access=navigator.permissions?.query?await navigator.permissions.query({name:'geolocation'}).catch(()=>null):null;check();if(access?.state==='denied')throw Error('Location access was revoked. Use a city or postal code instead.');if(access?.state!=='granted'){origin=null;return device(signal,check);}return origin;}catch(error){origin=null;throw error;}
    }
    if(currentOrigin())return origin;
    status='Enter a place and country, or choose Use current location.';return null;
  }
  async function locate(){origin=null;originTime=0;originQuery='';draft=read();draft.place='';if(fields.place)fields.place.value='';results=[];choices=[];fallback=null;selection=null;return perform(async(signal,check)=>{await device(signal,check);results=[origin];attribution=null;status=`Location ready${origin.accuracyMeters?` (about ${Math.round(origin.accuracyMeters)} m accuracy)`:''}. Choose a nearby category. Nothing is being tracked in the background.`;await onReply(`I have your device’s approximate location${Number.isFinite(origin.accuracyMeters)?`, with about ${Math.round(origin.accuracyMeters)} metres of reported accuracy`:''}. Open it in a maps app or choose a nearby category in Places & directions.`);});}
  async function lookup({query,country,after=selection}={}){origin=null;originTime=0;originQuery='';draft={...read(),...(query!==undefined?{place:query}:{}),...(country!==undefined?{country}: {})};fields={};results=[];choices=[];fallback=null;attribution=null;selection=after||null;const requestedPlace=draft.place,requestedCountry=draft.country;return perform(async(signal,check)=>{const selected=await resolve(requestedPlace,requestedCountry,signal,check);if(!selected)return;origin=selected;originTime=Date.now();originQuery=requestedPlace.trim();results=[selected];attribution=selected.attribution||null;status=[status,'Place selected. Choose a nearby category or open directions.'].filter(Boolean).join(' ');selection=null;if(after)await continueSelection(selected,after,signal,check);else await onReply(`I found ${selected.label}. This is an approximate place or postal-area centre. Choose a maps app in Places & directions for the route.`);});}
  async function continueSelection(item,after,signal,check){if(after?.kind==='nearby')return loadNearby(item,after.category,signal,check);if(after?.kind==='weather')return after.callback(item,signal);if(after?.kind==='directions'){status='Choose a maps app below to start directions. The maps app will ask for your starting location.';return onReply(`I found ${item.label}. Open Google Maps, Apple Maps or an available Waze link in Places & directions to start the route.`);}}
  async function choose(item){const after=selection;return perform(async(signal,check)=>{origin=item;originTime=Date.now();originQuery=item.label;draft={...read(),place:item.label,country:item.countryCode||read().country};fields={};choices=[];fallback=null;results=[item];attribution=item.attribution||null;selection=null;status='Place selected. Choose a nearby category or open directions.';if(after)await continueSelection(item,after,signal,check);else await onReply(`I selected ${item.label}. Choose a nearby category or open directions in Places & directions.`);});}
  async function loadNearby(point,category,signal,check){await permission('internet');check();const settings=normalizeLocationSettings(read());fallback=`${CATEGORY_LABELS[category]||category} near ${point.lat},${point.lon}`;const found=await nearbyPlaces({lat:point.lat,lon:point.lon,category,radius:settings.radius},{signal});check();choices=[];results=found.results;attribution=found.attribution;resultRadius=found.radius;status=`${found.message||'Nearby search complete.'} Search radius: ${distance(resultRadius)}.`;if(results.length)fallback=null;await onReply(results.length?`I found ${results.length} nearby places. The closest returned result is ${results[0].name||results[0].label}, about ${distance(results[0].distanceMeters)} in a straight line. Choose a maps app in Places & directions for the route.`:status);}
  async function findNearby(category,{useDevice=false}={}){draft=read();results=[];choices=[];fallback=null;selection={kind:'nearby',category};return perform(async(signal,check)=>{const point=await setOriginFromFields(signal,check,{useDevice});if(!point)return;check();return loadNearby(point,category,signal,check);});}
  async function handleIntent(intent){onNavigate();draft={...read(),...(intent.place?{place:intent.place}:{}),...(intent.country?{country:intent.country}:{}),...(intent.modeExplicit?{mode:intent.mode}:{})};if(intent.useDevice)draft.place='';fields={};render();if(intent.kind==='nearby')return findNearby(intent.category||'restaurant',{useDevice:intent.useDevice});if(intent.useDevice)return locate();return lookup({query:intent.place||intent.query||'',country:intent.country||draft.country,after:intent.kind==='directions'?{kind:'directions'}:null});}
  function renderPreferences({signal}={}){
    const section=el('section','','card');
    section.append(el('h3','Places & directions'),el('p','Save a default country and an optional city/postal code for quicker requests. Device coordinates are never saved here.','muted'));
    const value=config(),country=field('Default country',value.country,{placeholder:'US or United States'}),place=field('Default city or postal code',value.place),mode=field('Default travel mode',value.mode,{options:MODES}),provider=field('Preferred maps app',value.mapProvider,{options:{google:'Google Maps',apple:'Apple Maps',waze:'Waze (driving)'}}),radius=field('Default nearby radius',value.radius,{options:{750:'750 m',1500:'1.5 km',3000:'3 km',5000:'5 km'}});
    place.input.maxLength=160;
    const inputs=[country.input,place.input,mode.input,provider.input,radius.input];let pending=false;
    const save=button('Save location preferences',async()=>{
      if(signal?.aborted||pending)return;
      const id=saveEpoch;
      try{
        if(saving)throw Error('Wait for your Places location save to finish.');
        if(country.input.value.trim()&&!normalizeCountry(country.input.value))throw Error('Choose a valid country name or two-letter country code.');
        const next=normalizeLocationSettings({country:country.input.value,place:place.input.value,mode:mode.input.value,mapProvider:provider.input.value,radius:Number(radius.input.value)});
        pending=true;save.disabled=true;for(const input of inputs)input.disabled=true;
        await saveSettings(next);
        // Closing Settings, reset, or clearing the location must not clear a newer draft/search.
        if(signal?.aborted||id!==saveEpoch||!section.isConnected)return;
        forget();toast('Location preferences saved. Previous location cleared.');
      }catch(error){if(!signal?.aborted&&id===saveEpoch&&section.isConnected)toast(error.message);}
      finally{pending=false;save.disabled=false;for(const input of inputs)input.disabled=false;}
    });
    section.append(country.wrap,place.wrap,mode.wrap,provider.wrap,radius.wrap,save,button('Clear current location and results',forget),el('p','GPS access also has an Ask / Allow / Deny control in Permissions. The browser and operating system still control location access.','location-note'));
    return section;
  }
  return {render:node=>{if(node){panel=node;mounted=true;}render();},unmount(){draft=read();fields={};mounted=false;cancel();},renderPreferences,handleIntent,cancel,forget,get current(){return currentOrigin();},
    async prepareWeather(intent,callback){onNavigate();origin=null;originTime=0;originQuery='';choices=[];results=[];fallback=null;attribution=null;draft={...read(),place:intent.useDevice?'':intent.place,country:intent.country||read().country};fields={};selection={kind:'weather',callback};if(intent.useDevice){return perform(async(signal,check)=>{const fix=await device(signal,check);check();await callback(fix,signal);});}return lookup({query:draft.place,country:draft.country,after:selection});},
    dispose(){mounted=false;forget();panel=null;}};
}
