/** Explicit place searches and one-shot location. Device coordinates stay in this tab's memory. */
import {LOCATION_DEFAULTS,normalizeLocationSettings,normalizeCountry,describePlaceQuery,postalCountryHint,COUNTRY_OPTIONS,CATEGORY_LABELS,resolvePlace,nearbyPlaces,getDeviceLocation,getLocationPermission,directionsLinks,clearLocationCache} from './locations.js';
const el=(tag,text='',className='')=>{const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;};
const button=(label,fn)=>{const n=el('button',label,'button button-small');n.type='button';n.onclick=()=>Promise.resolve().then(fn).catch(()=>{});return n;};
const link=(label,url)=>{const n=el('a',label,'button button-small');n.href=url;n.target='_blank';n.rel='noopener noreferrer';return n;};
import {formatDistance} from './units.js';
const stopped=()=>new DOMException('Location operation stopped.','AbortError');
const MODES={driving:'Driving',walking:'Walking',bicycling:'Cycling',transit:'Public transport'};
const placeKey=value=>String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
function weatherPoint(items,query){
  if(items.length===1)return items[0];
  const exact=items.filter(item=>placeKey(item.name)===placeKey(query));
  const candidates=exact.length?exact:items;
  if(candidates.length===1)return candidates[0];
  const first=candidates[0];
  // Duplicate mapped objects in one small area should not require a choice.
  // Different towns/countries still need the user's selection.
  if(first&&candidates.every(item=>item.countryCode&&item.countryCode===first.countryCode&&
    Math.hypot((item.lat-first.lat)*111_320,(item.lon-first.lon)*111_320*Math.cos(first.lat*Math.PI/180))<1500))return first;
  return null;
}
function field(label,value,{options,placeholder}={}){const wrap=el('label','','location-field');const input=el(options?'select':'input');input.setAttribute('aria-label',label);if(options)for(const [value,title]of Object.entries(options)){const option=el('option',title);option.value=value;input.append(option);}else {input.type='text';input.maxLength=180;input.autocomplete='off';}input.value=String(value||'');if(placeholder)input.placeholder=placeholder;wrap.append(el('span',label),input);if(!options&&/country$/i.test(label)){const list=el('datalist');list.id='maxg-countries-'+crypto.randomUUID();for(const country of COUNTRY_OPTIONS){const option=el('option',country.code);option.value=country.label;list.append(option);}input.setAttribute('list',list.id);wrap.append(list);}return {wrap,input};}

export function createLocationHub({getSettings=()=>LOCATION_DEFAULTS,getUnits=()=> 'us',saveSettings=async()=>{},permission=async()=>{},runTask=async fn=>fn(new AbortController().signal),onCancel=()=>{},onForget=()=>{},getDeviceLocale=()=>globalThis.navigator?.language||'',onNavigate=()=>{},onReply=async()=>{},onClarify=()=>{},toast=()=>{},services={resolvePlace,nearbyPlaces,getDeviceLocation,getLocationPermission}}={}){
  let panel=null,mounted=false,origin=null,originTime=0,originQuery='',controller=null,epoch=0,status='',results=[],choices=[],selection=null,fallback=null,attribution=null,resultRadius=null;
  let fields={},draft=null,saving=false,saveEpoch=0,saveError='',saveNotice='',saveControl=null,saveStatusNode=null,clarification=null,internetApproved=false;
  const config=()=>normalizeLocationSettings(getSettings());
  const distance=meters=>formatDistance(meters,getUnits());
  const radiusOptions=()=>Object.fromEntries([750,1500,3000,5000].map(meters=>[meters,distance(meters)]));
  function currentOrigin(){if(origin?.source==='device'&&Date.now()-originTime>300000)origin=null;return origin;}
  function cancel(){const wasRunning=Boolean(controller);epoch++;controller?.abort();controller=null;onCancel();if(wasRunning){status='Location search stopped.';render();}}
  function retireSelection(){const waiting=Boolean(selection||clarification);cancel();selection=null;clarification=null;choices=[];if(waiting){status='Location request canceled.';render();}return {retired:waiting};}
  function retireWeather(){const waiting=selection?.kind==='weather'||clarification?.weather===true;cancel();if(waiting){selection=null;clarification=null;choices=[];status='Weather request canceled.';render();}return {retired:waiting};}
  function forget({persist=true}={}){const hadRecent=Boolean(config().recentWeather);saveEpoch++;saving=false;saveError='';saveNotice='';cancel();clearLocationCache();onForget();origin=null;originTime=0;originQuery='';draft=null;fields={};results=[];choices=[];selection=null;clarification=null;fallback=null;attribution=null;status='Location and nearby results cleared from this tab.';if(persist&&hadRecent)Promise.resolve(saveSettings({...config(),recentWeather:null})).catch(()=>toast('The recent weather place could not be cleared from storage. Try again.'));render();}
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
    const card=el('section','','card locations-card');card.append(el('h3','Where would you like to go?'),el('p','US ZIP codes work on their own. For other countries, include the country or use a full UK/Canadian postcode. You can also share your current location once.','muted'));
    const form=el('form','','location-form');
    const place=field('City, address or postal code',previous.place,{placeholder:'02108 · SW1A 1AA · Manila'}),country=field('Country',previous.country,{placeholder:'US, United Kingdom, Canada…'}),mode=field('Travel mode',previous.mode,{options:MODES}),radius=field('Nearby radius',previous.radius,{options:radiusOptions()});
    place.input.maxLength=160;
    fields={place:place.input,country:country.input,mode:mode.input,radius:radius.input};
    for(const input of Object.values(fields))input.oninput=()=>{draft=read();saveError='';saveNotice='';refreshSaveFeedback();};
    mode.input.onchange=()=>render();
    const grid=el('div','','location-grid');grid.append(place.wrap,country.wrap,mode.wrap,radius.wrap);form.append(grid);
    const resolve=button('Find this place',()=>lookup());resolve.type='submit';resolve.onclick=null;form.onsubmit=e=>{e.preventDefault();lookup().catch(()=>{});};
    saveControl=button('Save location',saveLocation);saveControl.classList.add('button-primary');
    const actions=el('div','','location-actions');actions.append(saveControl,resolve,button('Use current location',()=>locate()),button('Forget location',forget));form.append(actions);
    saveStatusNode=el('p','','location-save-status');saveStatusNode.setAttribute('role','status');saveStatusNode.setAttribute('aria-live','polite');form.append(saveStatusNode);card.append(form);
    const selected=currentOrigin();card.append(el('p',selected?`Searching around ${selected.label||'your current location'}${Number.isFinite(selected.accuracyMeters)?` · device accuracy about ${distance(selected.accuracyMeters)}`: ' · approximate place centre'}.`:'No location selected. Your GPS is not being tracked.','location-origin'));
    const categories=el('div','','location-categories');for(const [category,label]of Object.entries(CATEGORY_LABELS))categories.append(button(label,()=>findNearby(category)));card.append(categories);
    const note=el('p','A device fix may use GPS, Wi-Fi or network estimates. Searching shares the selected point with the map-data service. Directions open the selected maps app, which uses its own location permission.','location-note');card.append(note);
    const live=el('p',status,'location-status');live.setAttribute('role','status');card.append(live);if(controller)card.append(button('Stop location search',()=>{cancel();status='Location search stopped.';render();}));panel.append(card);refreshSaveFeedback();
    if(choices.length){const section=el('section','','card location-choices');section.append(el('h3','Choose the matching place'),el('p','A place can have several postal areas. Check the country and region before continuing.','muted'));for(const item of choices)section.append(button(item.label,()=>choose(item)));panel.append(section);}
    if(results.length){const section=el('section','','location-results');section.append(el('h3',results.some(x=>Number.isFinite(x.distanceMeters))?'Nearby places':'Selected place'));
      for(const item of results){const row=el('article','','card location-result');row.append(el('h4',item.name||item.label));if(item.address)row.append(el('p',item.address,'muted'));if(Number.isFinite(item.distanceMeters))row.append(el('p',`${distance(item.distanceMeters)} away · straight-line estimate`,'location-distance'));if(item.openingHours)row.append(el('p',`Listed hours: ${item.openingHours} · verify with the business`,'location-note'));const actions=el('div','','location-map-links');for(const destination of maps(item))actions.append(link(destination.label,destination.url));row.append(actions);section.append(row);}renderSources(section);panel.append(section);
    }
    if(fallback){const section=el('section','','card');section.append(el('h3','Continue in a maps app'),el('p','The public lookup has limited coverage or is busy. You can continue your search here:','muted'));const q=fallback,google=new URL('https://www.google.com/maps/search/');google.search=new URLSearchParams({api:'1',query:q});const apple=new URL('https://maps.apple.com/');apple.search=new URLSearchParams({q});const waze=new URL('https://waze.com/ul');waze.search=new URLSearchParams({q});section.append(link('Search Google Maps',google.href),link('Search Apple Maps',apple.href),link('Search Waze',waze.href));if(['US','PR','VI','GU','AS','MP'].includes(normalizeCountry(read().country)))section.append(link('Official USPS ZIP Code lookup','https://tools.usps.com/go/ZipLookupTool'));panel.append(section);}
    panel.append(el('p','Worldwide lookup uses public map and postal sources. Coverage is incomplete; a missing result does not mean a city or postal code does not exist. Some countries do not use postal codes.','location-note'));
    panel.append(el('p','Nearby data comes from public map contributors and may be incomplete. These are the closest returned results within the completed search radius, not live traffic estimates or guaranteed opening hours.','location-note'));
  }
  async function perform(fn){
    cancel();const id=epoch;controller=new AbortController();const local=controller;internetApproved=false;status='Looking up your request…';render();
    try{return await runTask(async signal=>{const abort=()=>local.abort();signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();try{verify(id,local.signal);return await fn(local.signal,()=>verify(id,local.signal));}finally{signal.removeEventListener('abort',abort);}},{signal:local.signal});}
    catch(error){if(id===epoch){status=error.name==='AbortError'?'Location search stopped.':error.message||'I could not finish that location lookup. Please try a city and country.';toast(status);if(error.name!=='AbortError')await onReply(status);}return null;}
    finally{if(id===epoch){controller=null;render();}}
  }
  async function device(signal,check,{automatic=false,recent=null,recentTime=0,forceFresh=false}={}){
    await permission('location',{picked:true,automatic});check();
    const access=await (services.getLocationPermission||getLocationPermission)({signal});check();
    if(access==='denied')throw Error('Location access is off on this device.');
    if(!forceFresh&&recent?.source==='device'&&Date.now()>=recentTime&&Date.now()-recentTime<60000&&access==='granted'){
      origin=recent;originTime=recentTime;originQuery='';return origin;
    }
    const fix=await services.getDeviceLocation({signal,timeout:automatic&&access==='granted'?4500:12000,maximumAge:30000});check();
    origin={...fix,label:'your current location'};originTime=Number.isFinite(fix.timestamp)?Math.min(Date.now(),fix.timestamp):Date.now();originQuery='';return origin;
  }
  async function rememberWeather(query,country,point,signal,check){
    if(!query)return;check();
    const recentWeather={place:query.trim().slice(0,160),country:point.countryCode||normalizeCountry(country)};
    if(!recentWeather.country)return;
    if(JSON.stringify(config().recentWeather)===JSON.stringify(recentWeather))return;
    try{await saveSettings({...config(),recentWeather});}catch(error){if(signal.aborted)throw error;toast('Weather is available, but this device could not remember the place for next time.');}
    check();
  }
  async function ask(kind,message,{query='',country='',choices:options=[]}={}){
    status=message;clarification={kind,query,country,weather:selection?.kind==='weather',...(options.length?{choices:options.map((item,index)=>({index:index+1,id:item.id,label:item.label}))}:{})};
    await onClarify(clarification);await onReply(message);return null;
  }
  async function resolve(query,country,signal,check){
    clarification=null;
    if(typeof query!=='string'||!query.trim())return ask('place',selection?.kind==='weather'?'Which city or postal code should I check for the weather?':'Which city, address or postal code should I look up?',{country});
    const stated=describePlaceQuery(query);
    if(stated.country)country=stated.country;
    else if(stated.postal&&!selection?.countryExplicit)country=postalCountryHint({query:stated.query,savedCountry:country}).country;
    const parts=describePlaceQuery(query,country);
    if(parts.needsCountry)return ask('country',parts.ambiguousCountry?`Which country is “${query}” in? Please give the full country name.`:`Which country is postal code ${parts.query} in? For example, reply “United States” or “Canada”.`,{query:parts.query,country:''});
    await permission('internet');check();internetApproved=true;const found=await services.resolvePlace(query,{country,signal,...(selection?.kind==='weather'?{purpose:'weather'}:{})});check();status=found.message||'';
    if(found.needsCountry)return ask('country',`Which country is “${query}” in? Please give the full country name.`,{query,country:''});
    const unique=found.results.filter((item,index,list)=>list.findIndex(other=>other.countryCode===item.countryCode&&other.lat===item.lat&&other.lon===item.lon&&other.label===item.label)===index);
    const selected=selection?.kind==='weather'?weatherPoint(unique,parts.query):unique.length===1?unique[0]:null;
    if(selected)return selected;
    choices=unique;fallback=choices.length?null:[query,country].filter(Boolean).join(', ');
    if(choices.length){if(selection?.kind!=='weather'&&!selection?.fromChat)onNavigate();return ask('choice',`I found more than one matching place. Which one do you mean?\n${choices.map((item,index)=>`${index+1}. ${item.label}`).join('\n')}`,{query,country,choices});}
    return ask('place',`I could not find “${query}”${country?` in ${country}`:''} in the available sources. Coverage varies; this does not mean the place or code does not exist. Please try a city and country, a district or a street address.${parts.postal&&['US','PR','VI','GU','AS','MP'].includes(country)?' You can also check the [official USPS ZIP Code lookup](https://tools.usps.com/go/ZipLookupTool).':''}`,{query,country});
  }
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
    return ask('place','Which city or postal code should I search near? You can also choose Use current location.');
  }
  async function locate(){origin=null;originTime=0;originQuery='';draft=read();draft.place='';if(fields.place)fields.place.value='';results=[];choices=[];fallback=null;selection=null;return perform(async(signal,check)=>{await device(signal,check);results=[origin];attribution=null;status=`Location ready${origin.accuracyMeters?` (about ${distance(origin.accuracyMeters)} accuracy)`:''}. Choose a nearby category. Nothing is being tracked in the background.`;await onReply(`I have your device’s approximate location${Number.isFinite(origin.accuracyMeters)?`, with about ${distance(origin.accuracyMeters)} of reported accuracy`:''}. Open it in a maps app or choose a nearby category in Places & directions.`);});}
  async function lookup({query,country,after=selection}={}){origin=null;originTime=0;originQuery='';draft={...read(),...(query!==undefined?{place:query}:{}),...(country!==undefined?{country}: {})};fields={};results=[];choices=[];fallback=null;attribution=null;selection=after||null;const requestedPlace=draft.place,requestedCountry=draft.country;return perform(async(signal,check)=>{const selected=await resolve(requestedPlace,requestedCountry,signal,check);check();if(!selected)return clarification?{pending:clarification}:null;origin=selected;originTime=Date.now();originQuery=requestedPlace.trim();results=[selected];attribution=selected.attribution||null;status=[status,'Place selected. Choose a nearby category or open directions.'].filter(Boolean).join(' ');selection=null;if(after)await continueSelection(selected,after,signal,check);else await onReply(`I found ${selected.label}. This is an approximate place or postal-area centre. Choose a maps app in Places & directions for the route.`);return {place:selected};});}
  async function continueSelection(item,after,signal,check){if(after?.kind==='nearby')return loadNearby(item,after.category,signal,check);if(after?.kind==='weather'){draft={...read(),country:item.countryCode||read().country};fields={};await rememberWeather(after.explicitQuery,after.explicitCountry,item,signal,check);return after.callback(item,signal,{internetApproved,locationSource:after.locationSource||'explicit',fallbackNotice:after.fallbackNotice||'',postalCountryNotice:after.postalCountryNotice||''});}if(after?.kind==='location'){const codes=item.postal?[item.postal]:item.postcodes||[];let answer=(after.postalCountryNotice?after.postalCountryNotice+'\n\n':'')+`I found ${item.label}.`;if(codes.length)answer+=` Listed postal ${codes.length===1?'code':'codes'}: ${codes.slice(0,8).join(', ')}${codes.length>8?' (showing the first 8)':''}.`;if(after.postalLookup)answer+=codes.length?' A city can have many postal areas; check the full address with its postal service.':' This source did not provide a postal code for that place. Try a district or full street address; I won’t guess a code.';answer+=' This is an approximate place or postal-area centre.';return onReply(answer,item.attribution?.url?[{title:item.attribution.text||item.source,url:item.attribution.url}]:[]);}if(after?.kind==='directions'){status='Choose a maps app below to start directions. The maps app will ask for your starting location.';return onReply(`I found ${item.label}. Open Google Maps, Apple Maps or an available Waze link in Places & directions to start the route.`);}}
  async function choose(item){const after=selection;return perform(async(signal,check)=>{origin=item;originTime=Date.now();originQuery=item.label;draft={...read(),place:item.label,country:item.countryCode||read().country};fields={};choices=[];fallback=null;results=[item];attribution=item.attribution||null;selection=null;status='Place selected. Choose a nearby category or open directions.';if(after)await continueSelection(item,after,signal,check);else await onReply(`I selected ${item.label}. Choose a nearby category or open directions in Places & directions.`);});}
  async function loadNearby(point,category,signal,check){await permission('internet');check();const settings=normalizeLocationSettings(read());fallback=`${CATEGORY_LABELS[category]||category} near ${point.lat},${point.lon}`;const found=await services.nearbyPlaces({lat:point.lat,lon:point.lon,category,radius:settings.radius},{signal});check();choices=[];results=found.results;attribution=found.attribution;resultRadius=found.radius;status=`${found.message||'Nearby search complete.'} Search radius: ${distance(resultRadius)}.`;if(results.length)fallback=null;await onReply(results.length?`I found ${results.length} nearby places. The closest returned result is ${results[0].name||results[0].label}, about ${distance(results[0].distanceMeters)} in a straight line. Choose a maps app in Places & directions for the route.`:status);}
  async function findNearby(category,{useDevice=false,countryExplicit=false}={}){draft=read();results=[];choices=[];fallback=null;selection={kind:'nearby',category,countryExplicit};return perform(async(signal,check)=>{const point=await setOriginFromFields(signal,check,{useDevice});if(!point)return clarification?{pending:clarification}:null;check();await loadNearby(point,category,signal,check);return {place:point};});}
  async function handleIntent(intent){if(!intent.fromChat)onNavigate();let parts;try{if(intent.place)parts=describePlaceQuery(intent.place);}catch{}const hint=parts?.postal&&!intent.country&&!parts?.country?postalCountryHint({query:intent.place,savedCountry:config().country,recentCountry:config().recentWeather?.country,locale:getDeviceLocale()}):{country:'',notice:''};const country=intent.country||parts?.country||hint.country||(!intent.place?read().country:'');draft={...read(),...(intent.place?{place:intent.place}:{}),country,...(intent.modeExplicit?{mode:intent.mode}:{})};if(intent.useDevice)draft.place='';fields={};render();if(intent.kind==='nearby')return findNearby(intent.category||'restaurant',{useDevice:intent.useDevice,countryExplicit:Boolean(intent.country||parts?.country)});if(intent.useDevice)return locate();return lookup({query:intent.place||'',country:intent.country||draft.country,after:intent.kind==='directions'?{kind:'directions',countryExplicit:Boolean(intent.country||parts?.country)}:intent.kind==='location'?{kind:'location',countryExplicit:Boolean(intent.country||parts?.country),fromChat:Boolean(intent.fromChat),postalLookup:Boolean(intent.postalLookup),postalCountryNotice:hint.notice}:null});}
  function renderPreferences({signal}={}){
    const section=el('section','','card');
    section.append(el('h3','Places & directions'),el('p','United States is the default. Save another country and an optional city/postal code for quicker requests. Device coordinates are never saved here.','muted'));
    const value=config(),country=field('Default country',value.country,{placeholder:'US or United States'}),place=field('Default city or postal code',value.place),automatic=field('Automatic weather location',value.autoLocate?'on':'off',{options:{on:'On · use this device’s current location',off:'Off · use a saved or recent place'}}),mode=field('Default travel mode',value.mode,{options:MODES}),provider=field('Preferred maps app',value.mapProvider,{options:{google:'Google Maps',apple:'Apple Maps',waze:'Waze (driving)'}}),radius=field('Default nearby radius',value.radius,{options:radiusOptions()});
    place.input.maxLength=160;
    const inputs=[country.input,place.input,automatic.input,mode.input,provider.input,radius.input];let pending=false;
    const save=button('Save location preferences',async()=>{
      if(signal?.aborted||pending)return;
      const id=saveEpoch;
      try{
        if(saving)throw Error('Wait for your Places location save to finish.');
        if(country.input.value.trim()&&!normalizeCountry(country.input.value))throw Error('Choose a valid country name or two-letter country code.');
        const next=normalizeLocationSettings({...value,country:country.input.value,place:place.input.value,autoLocate:automatic.input.value==='on',mode:mode.input.value,mapProvider:provider.input.value,radius:Number(radius.input.value)});
        pending=true;save.disabled=true;for(const input of inputs)input.disabled=true;
        await saveSettings(next);
        // Closing Settings, reset, or clearing the location must not clear a newer draft/search.
        if(signal?.aborted||id!==saveEpoch||!section.isConnected)return;
        forget({persist:false});toast('Location preferences saved. Previous device location cleared.');
      }catch(error){if(!signal?.aborted&&id===saveEpoch&&section.isConnected)toast(error.message);}
      finally{pending=false;save.disabled=false;for(const input of inputs)input.disabled=false;}
    });
    section.append(automatic.wrap,el('p','When on, asking for local weather requests one device location. A recent fix may be reused for one minute. MAX-G does not track you in the background or save GPS coordinates. If location is unavailable, your saved place or last explicit weather place is used and identified in the answer.','location-note'),country.wrap,place.wrap,mode.wrap,provider.wrap,radius.wrap,save,button('Clear current location and results',forget),el('p','GPS access also has an Ask / Allow / Deny control in Permissions. The browser and operating system still control location access.','location-note'));
    return section;
  }
  return {render:node=>{if(node){panel=node;mounted=true;}render();},unmount(){draft=read();fields={};mounted=false;cancel();},renderPreferences,handleIntent,cancel,retireWeather,retireSelection,forget,get current(){return currentOrigin();},
    async prepareWeather(intent,callback){
      const previous=read(),saved=config(),explicitPlace=typeof intent.place==='string'?intent.place.trim():'',selectedOrigin=currentOrigin(),selectedQuery=originQuery,selectedTime=originTime;
      let parsed=null;try{if(explicitPlace)parsed=describePlaceQuery(explicitPlace);}catch{}
      const hint=parsed?.postal&&!intent.country&&!parsed?.country?postalCountryHint({query:explicitPlace,savedCountry:saved.country,recentCountry:saved.recentWeather?.country,locale:getDeviceLocale()}):{country:'',notice:''};
      const country=intent.country||parsed?.country||hint.country||(!explicitPlace?(previous.country||saved.country):'');
      const automatic=!explicitPlace&&(intent.useDevice||saved.autoLocate);
      const savedFallback=saved.place?{place:saved.place,country:saved.country,locationSource:'saved'}:saved.recentWeather?{...saved.recentWeather,locationSource:'recent'}:null;
      const after={kind:'weather',callback,countryExplicit:Boolean(intent.country||parsed?.country),explicitQuery:explicitPlace,explicitCountry:country,locationSource:explicitPlace?'explicit':!previous.place&&savedFallback?savedFallback.locationSource:'saved',postalCountryNotice:hint.notice};
      const requestedPlace=explicitPlace||previous.place.trim()||savedFallback?.place||'';
      const reuse=!automatic&&selectedOrigin&&selectedOrigin.source!=='device'&&
        [selectedQuery,selectedOrigin.label].some(value=>placeKey(value)===placeKey(requestedPlace))&&(!country||normalizeCountry(country)===selectedOrigin.countryCode);
      origin=null;originTime=0;originQuery='';choices=[];results=[];fallback=null;attribution=null;clarification=null;
      draft={...previous,place:explicitPlace||previous.place||savedFallback?.place||'',country:country||savedFallback?.country||''};fields={};selection=after;
      if(automatic)return perform(async(signal,check)=>{
        let fix;
        try{fix=await device(signal,check,{automatic:true,recent:selectedOrigin,recentTime:selectedTime,forceFresh:Boolean(intent.useDevice)});}
        catch(error){
          check();if(error.name==='AbortError')throw error;
          origin=null;originTime=0;
          if(!savedFallback){await ask('place','I couldn’t get this device’s location. Allow Location in device settings, or tell me a city or postal code once and I’ll remember it for weather.');return {pending:clarification};}
          draft={...read(),place:savedFallback.place,country:savedFallback.country};fields={};
          const fallbackNotice=savedFallback.locationSource==='recent'?'I couldn’t get this device’s location. Using your last weather location.':'I couldn’t get this device’s location. Using your saved location.';
          const fallbackAfter={...after,locationSource:savedFallback.locationSource,fallbackNotice};selection=fallbackAfter;
          const chosen=await resolve(savedFallback.place,savedFallback.country,signal,check);check();
          if(!chosen)return clarification?{pending:clarification}:null;
          origin=chosen;originTime=Date.now();originQuery=savedFallback.place;results=[chosen];attribution=chosen.attribution||null;selection=null;
          await continueSelection(chosen,fallbackAfter,signal,check);check();
          return {place:chosen,fallback:true};
        }
        check();selection=null;results=[fix];await callback(fix,signal,{internetApproved:false,locationSource:'device',fallbackNotice:''});check();return {place:fix,reused:fix===selectedOrigin};
      });
      if(reuse)return perform(async(signal,check)=>{check();origin=selectedOrigin;originTime=selectedTime;originQuery=selectedQuery;results=[selectedOrigin];attribution=selectedOrigin.attribution||null;selection=null;await continueSelection(selectedOrigin,after,signal,check);check();return {place:selectedOrigin,reused:true};});
      return lookup({query:draft.place,country:draft.country,after});
    },
    async selectChoice(index){
      if(!Number.isInteger(index)||index<1||index>choices.length){
        const id=epoch,pending=choices.length&&clarification?.kind==='choice'?{...clarification,choices:choices.map((item,index)=>({index:index+1,id:item.id,label:item.label}))}:null;
        if(pending)await onClarify(pending);
        if(id!==epoch)return null;
        await onReply(choices.length?`Choose a number from 1 to ${choices.length}.`:'Those place choices have expired. Please ask for the weather again.');
        return pending?{pending}:null;
      }
      return choose(choices[index-1]);
    },
    dispose(){mounted=false;forget({persist:false});panel=null;}};
}
