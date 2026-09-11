/** Explicit, bounded location tools. No tracking, persistent coordinates or keys.
 * Photon: github.com/komoot/photon#demo-server (reasonable manual use).
 * Postal fallback: docs.zippopotam.us/docs/getting-started/ (coverage varies).
 * City fallback: open-meteo.com/en/terms (free noncommercial use).
 * Nearby: wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances.
 * Overpass needs app identification: its referrer reveals only this app's origin.
 */
export const LOCATION_DEFAULTS=Object.freeze({country:'',place:'',radius:1500,mode:'driving',mapProvider:'google'});
export const CATEGORY_LABELS=Object.freeze({restaurant:'Restaurants',fuel:'Fuel stations',mall:'Shopping malls',supermarket:'Supermarkets',pharmacy:'Pharmacies',cafe:'Cafés',evcharging:'EV charging'});
const FILTERS=Object.freeze({restaurant:'["amenity"~"^(restaurant|fast_food)$"]',fuel:'["amenity"="fuel"]',mall:'["shop"="mall"]',supermarket:'["shop"="supermarket"]',pharmacy:'["amenity"="pharmacy"]',cafe:'["amenity"="cafe"]',evcharging:'["amenity"="charging_station"]'});
const COUNTRIES=new Set(('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' '));
const ZIP_COUNTRIES=new Set(('AD AR AS AT AU AX BD BE BG BR CA CH CL CZ DE DK DO ES FI FO FR GB GF GG GL GP GT GU GY HR HU IM IN IS IT JE JP LI LK LT LU MC MD MH MK MP MQ MT MX MY NL NO NZ PH PK PL PM PR PT RE RU SE SI SJ SK SM TH TR US VA VI WF YT ZA').split(' '));
const countryKey=value=>String(value).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const countryAliases=new Map();
let displayNames;
try{displayNames=new Intl.DisplayNames(['en'],{type:'region'});}catch{}
for(const code of COUNTRIES){countryAliases.set(code.toLowerCase(),code);if(displayNames)countryAliases.set(countryKey(displayNames.of(code)),code);}
for(const [name,code] of Object.entries({uk:'GB',greatbritain:'GB',britain:'GB',england:'GB',scotland:'GB',wales:'GB',northernireland:'GB',usa:'US',unitedstatesofamerica:'US',southkorea:'KR',republicofkorea:'KR',northkorea:'KP',russia:'RU',russianfederation:'RU',vietnam:'VN',czechrepublic:'CZ',ivorycoast:'CI',philippines:'PH'}))countryAliases.set(name,code);
export function normalizeCountry(value){return typeof value==='string'?countryAliases.get(countryKey(value.trim()))||'':'';}
export const COUNTRY_OPTIONS=Object.freeze([...COUNTRIES].map(code=>Object.freeze({code,label:displayNames?.of(code)||code})).sort((a,b)=>a.label.localeCompare(b.label)));
const clean=(value,max=180)=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max):'';
const countryName=code=>code?(displayNames?.of(code)||code):'';
const MODES=new Set(['driving','walking','bicycling','transit']);
export function normalizeLocationSettings(value={}){
  const data=value&&typeof value==='object'?value:{};
  return {country:normalizeCountry(data.country),place:clean(data.place,160),
    radius:typeof data.radius==='number'&&Number.isFinite(data.radius)?Math.round(Math.max(100,Math.min(5000,data.radius))):1500,
    mode:MODES.has(data.mode)?data.mode:'driving',mapProvider:['google','apple','waze'].includes(data.mapProvider)?data.mapProvider:'google'};
}
export class LocationError extends Error{constructor(code,message){super(message);this.name='LocationError';this.code=code;}}
const abortError=()=>new DOMException('Location request stopped.','AbortError');
const checkAbort=signal=>{if(signal?.aborted)throw abortError();};
function coordinates(value){
  const {lat,lon}=value||{};
  if(typeof lat!=='number'||typeof lon!=='number'||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw new LocationError('INVALID_COORDINATES','Choose a valid location before searching nearby.');
  return {lat,lon};
}
function postalLike(query){
  const compact=query.toUpperCase().replace(/\s/g,'');
  return /^(?:GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/.test(compact)||
    /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(compact)||
    /^\d[\d -]{1,11}$/.test(query)||
    /^[A-Za-z0-9-]{3,10}$/.test(query)&&(query.match(/\d/g)||[]).length>=2||
    /^\d{4} [A-Za-z]{2}$/.test(query)||
    /^[A-Za-z]\d[A-Za-z0-9] [A-Za-z0-9]{4}$/.test(query);
}
function queryParts(value,country=''){
  if(typeof value!=='string'||!value.trim()||value.length>200||/[\u0000-\u001f\u007f-\u009f]/.test(value))throw new LocationError('INVALID_PLACE','Enter a place or postal code of up to 200 characters.');
  let query=value.trim(),code=normalizeCountry(country),ambiguousCountry=false;
  if(country&&!code)throw new LocationError('INVALID_COUNTRY','Choose a country name or a valid two-letter country code.');
  const pieces=query.split(',');
  if(pieces.length>1){
    const explicit=normalizeCountry(pieces.at(-1));
    if(explicit){
      const prefix=pieces.slice(0,-1).join(',').trim(),short=/^[A-Za-z]{2}$/.test(pieces.at(-1).trim());
      // CA, IN, DE and other region abbreviations also identify countries.
      // An explicitly selected country disambiguates the administrative suffix.
      if(short&&!/\d/.test(prefix)&&code!==explicit){if(!code)ambiguousCountry=true;}
      else {if(code&&code!==explicit)throw new LocationError('COUNTRY_MISMATCH','The country in your search differs from the selected country. Choose the intended country.');code=explicit;query=prefix;}
    }
  }else{
    // Country names may precede or follow a postal code in a natural query.
    // Restrict extraction to postal-shaped text so street suffixes stay intact.
    for(const match of query.matchAll(/\s+/g)){
      const left=query.slice(0,match.index),right=query.slice(match.index+match[0].length);
      let explicit='',postalPart='';
      if(postalLike(left)&&normalizeCountry(right)){explicit=normalizeCountry(right);postalPart=left;}
      else if(normalizeCountry(left)&&postalLike(right)){explicit=normalizeCountry(left);postalPart=right;}
      if(explicit){if(code&&code!==explicit)throw new LocationError('COUNTRY_MISMATCH','Check the country selected for this postal code.');code=explicit;query=postalPart;break;}
    }
  }
  const compact=query.toUpperCase().replace(/\s/g,'');
  const uk=/^(?:GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/.test(compact);
  const canada=/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(compact);
  const postal=postalLike(query);
  if(postal){
    if(code==='US'&&!/^\d{5}(?:-\d{4})?$/.test(compact))throw new LocationError('INVALID_POSTAL','US ZIP codes use five digits or ZIP+4. Check the code and country.');
    if(code==='GB'&&uk)query=compact.slice(0,-3)+' '+compact.slice(-3);
    else if(code==='CA'&&canada)query=compact.slice(0,3)+' '+compact.slice(3);
    else query=query.toUpperCase().replace(/\s+/g,' ');
  }
  return {query,country:code,postal,needsCountry:ambiguousCountry||postal&&!code,ambiguousCountry};
}
const CATEGORY_MATCHES=[
  ['evcharging',/\b(?:ev charging|electric vehicle charg(?:e|er|ing)|charging stations?)\b/i],
  ['fuel',/\b(?:gas|petrol|fuel)\s*(?:stations?|pumps?)?\b/i],
  ['mall',/\b(?:shopping malls?|malls?|shopping cent(?:er|re)s?)\b/i],
  ['supermarket',/\b(?:supermarkets?|grocery stores?|groceries)\b/i],
  ['pharmacy',/\b(?:pharmacies|pharmacy|drugstores?|chemists?)\b/i],
  ['cafe',/\b(?:caf[eé]s?|coffee shops?|coffee)\b/i],
  ['restaurant',/\b(?:restaurants?|places to eat|food nearby|fast food)\b/i],
];
export function parseLocationIntent(value){
  if(typeof value!=='string'||value.length>500)return null;
  const query=value.trim().replace(/[?!]+$/,'');
  const useDevice=/\b(?:near me|nearby|around me|my (?:current )?location|where am i|here)\b/i.test(query);
  const mode=/\b(?:walk|walking|on foot)\b/i.test(query)?'walking':/\b(?:cycle|cycling|bike|bicycle|bicycling)\b/i.test(query)?'bicycling':/\b(?:transit|public transport|by bus|by train)\b/i.test(query)?'transit':'driving';
  const category=CATEGORY_MATCHES.find(([,pattern])=>pattern.test(query))?.[0];
  let kind,place='';
  if(/\b(?:weather|forecast|temperature|raining)\b/i.test(query)){
    // Preserve ordinary explanations, unit conversions and research questions.
    if(/\b(?:why|define|definition|explain|meaning|climate|yesterday|last|next|week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday|convert|history|historical)\b|\d{4}-\d\d-\d\d/i.test(query)||/^(?:what is|what's|what does) (?:weather|temperature|forecast)(?: mean)?$/i.test(query)||/^(?:how|what)\b.*\b(?:work|works|measure|measured|affect|affects|change|changes)\b/i.test(query))return null;
    kind='weather';place=query.match(/\b(?:in|at|for)\s+(.+)$/i)?.[1]||query.match(/^(?:weather|forecast|temperature)\s+(.+)$/i)?.[1]||'';
    if(/^(?:today|tomorrow|now|currently|right now)$/i.test(place))place='';
  }
  else if(/^(?:(?:please|can you|could you)\s+)?(?:give me |show me )?(?:directions? to|navigate to|take me to|route to|how (?:do i|to) get to)\s+/i.test(query)){kind='directions';place=query.replace(/^.*?\b(?:to)\s+/i,'').replace(/\s+(?:by car|by bike|by bus|by train|on foot|walking|driving)$/i,'');}
  else if(category&&(useDevice||/\b(?:near|in|around|find|show|closest|nearest|looking for)\b/i.test(query))){kind='nearby';place=query.match(/\b(?:near|in|around)\s+(.+)$/i)?.[1]||'';}
  else if(/^(?:where am i|what(?: is|'s) my (?:current )?location|my location)$/i.test(query)){kind='location';}
  else if(/^(?:locate|find (?:location|postal code|postcode|zip code)|where is|postal code|postcode|zip code)\b/i.test(query)){kind='location';place=query.replace(/^(?:locate|find (?:location|postal code|postcode|zip code)|where is|postal code|postcode|zip code)\s*/i,'');}
  else return null;
  if(/^(?:me|here|nearby|my (?:current )?location)$/i.test(place))place='';
  place=place.replace(/\s+(?:please|today|tomorrow|right now)$/i,'').trim();
  let country='';
  if(place){try{const parts=queryParts(place);place=parts.query;country=parts.country;}catch{}}
  return {kind,query,place,country,useDevice:useDevice&&!place,mode,modeExplicit:/\b(?:walk|walking|on foot|cycle|cycling|bike|bicycle|bicycling|transit|public transport|by bus|by train|driving|by car|drive)\b/i.test(query),...(category?{category}:{})};
}
const PHOTON_ATTR=Object.freeze({text:'© OpenStreetMap contributors · Photon',url:'https://www.openstreetmap.org/copyright'});
const GEONAMES_ATTR=Object.freeze({text:'GeoNames · Zippopotam.us',url:'https://www.geonames.org/'});
const METEO_ATTR=Object.freeze({text:'Open-Meteo · GeoNames',url:'https://open-meteo.com/en/docs/geocoding-api'});
const OVERPASS_ATTR=Object.freeze({text:'© OpenStreetMap contributors · Overpass',url:'https://www.openstreetmap.org/copyright'});
function postalKey(value){return clean(value,20).toUpperCase().replace(/[\s-]/g,'');}
function postalArea(postal,country){
  if(country==='US')return postal.slice(0,5);
  if(country==='CA')return postal.replace(/\s/g,'').slice(0,3);
  if(country==='GB'&&postal.includes(' '))return postal.split(' ')[0];
  if(country==='NL'&&/^\d{4}/.test(postal))return postal.slice(0,4);
  if(country==='IE')return postal.replace(/\s/g,'').slice(0,3);
  return postal;
}
const joinLabel=values=>[...new Set(values.map(value=>clean(value,100)).filter(Boolean))].join(', ').slice(0,320);
function safeSite(value){
  if(typeof value!=='string'||value.length>1500||/[\u0000-\u0020\u007f]/.test(value))return '';
  try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
function photonRows(data,parts){
  if(!Array.isArray(data?.features))throw new LocationError('LOCATION_FORMAT','The location service returned an unreadable response.');
  const results=[];
  for(const feature of data.features.slice(0,20)){
    const props=feature?.properties,point=feature?.geometry;
    if(!props||point?.type!=='Point'||!Array.isArray(point.coordinates))continue;
    let loc;try{loc=coordinates({lat:point.coordinates[1],lon:point.coordinates[0]});}catch{continue;}
    const code=normalizeCountry(props.countrycode);
    if(parts.country&&code!==parts.country)continue;
    const postal=clean(props.postcode||(props.osm_value==='postcode'?props.name:''),20);
    if(parts.postal&&postalKey(postal)!==postalKey(parts.query))continue; // Never accept a fuzzy wrong postal code.
    const label=joinLabel([props.name,props.housenumber&&props.street?props.housenumber+' '+props.street:props.street,props.city||props.district,props.state,postal,props.country]);
    if(!label)continue;
    results.push({id:'photon:'+String(props.osm_id||loc.lat+','+loc.lon),label,...loc,country:clean(props.country,90)||countryName(code),countryCode:code,postal,source:'Photon',attribution:{...PHOTON_ATTR},accuracy:'approximate'});
  }
  return results.slice(0,6);
}
function postalRows(data,parts,area){
  if(!data||typeof data!=='object'||!Array.isArray(data.places))return [];
  if(normalizeCountry(data['country abbreviation'])!==parts.country||postalKey(data['post code'])!==postalKey(area))return [];
  const results=[];
  for(const row of data.places.slice(0,20)){
    let loc;try{loc=coordinates({lat:Number(row.latitude),lon:Number(row.longitude)});}catch{continue;}
    if(typeof row.latitude!=='string'||!row.latitude.trim()||typeof row.longitude!=='string'||!row.longitude.trim())continue;
    results.push({id:'postal:'+parts.country+':'+area+':'+loc.lat+','+loc.lon,label:joinLabel([row['place name'],row.state,area,data.country]),...loc,
      country:clean(data.country,90),countryCode:parts.country,postal:area,requestedPostal:parts.query,source:'Zippopotam.us',attribution:{...GEONAMES_ATTR},accuracy:'postal area'});
  }
  return results.slice(0,6);
}
function meteoRows(data,parts){
  if(data?.error||data?.results!==undefined&&!Array.isArray(data.results))throw new LocationError('LOCATION_FORMAT','The location service returned an unreadable response.');
  const results=[];
  for(const row of (data?.results||[]).slice(0,20)){
    let loc;try{loc=coordinates({lat:row.latitude,lon:row.longitude});}catch{continue;}
    const code=normalizeCountry(row.country_code);if(parts.country&&code!==parts.country)continue;
    const matchingPostal=(Array.isArray(row.postcodes)?row.postcodes:[]).find(code=>postalKey(code)===postalKey(parts.query));
    if(parts.postal&&!matchingPostal)continue;
    results.push({id:'geonames:'+String(row.id),label:joinLabel([row.name,row.admin1,row.country]),...loc,country:clean(row.country,90),countryCode:code,postal:matchingPostal||'',
      source:'Open-Meteo',attribution:{...METEO_ATTR},accuracy:'city or locality'});
  }
  return results.slice(0,6);
}
function distance(a,b){
  const rad=Math.PI/180,x=(b.lat-a.lat)*rad,y=(b.lon-a.lon)*rad;
  const h=Math.sin(x/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(y/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
function nearbyRows(data,origin,category,radius){
  if(!Array.isArray(data?.elements)||data.remark)throw new LocationError('NEARBY_INCOMPLETE','The map service could not finish this search. Try a smaller radius later.');
  const rows=[];
  for(const item of data.elements.slice(0,80)){
    if(!['node','way','relation'].includes(item.type)||!Number.isSafeInteger(item.id))continue;
    let loc;try{loc=coordinates(item.type==='node'?{lat:item.lat,lon:item.lon}:item.center);}catch{continue;}
    const meters=distance(origin,loc);if(meters>radius)continue;
    const tags=item.tags||{};
    const matches={restaurant:['restaurant','fast_food'].includes(tags.amenity),fuel:tags.amenity==='fuel',mall:tags.shop==='mall',supermarket:tags.shop==='supermarket',pharmacy:tags.amenity==='pharmacy',cafe:tags.amenity==='cafe',evcharging:tags.amenity==='charging_station'};
    if(!matches[category])continue;
    const name=clean(tags.name||tags.brand||tags.operator,120)||'Unnamed '+({restaurant:'restaurant',fuel:'fuel station',mall:'mall',supermarket:'supermarket',pharmacy:'pharmacy',cafe:'café',evcharging:'EV charger'}[category]);
    rows.push({id:'osm:'+item.type+':'+item.id,name,label:name,...loc,category,distanceMeters:Math.round(meters),
      address:joinLabel([tags['addr:housenumber'],tags['addr:street'],tags['addr:city'],tags['addr:postcode']]),postal:clean(tags['addr:postcode'],20),
      country:'',countryCode:'',source:'OpenStreetMap',attribution:{...OVERPASS_ATTR},accuracy:'mapped point',
      website:safeSite(tags.website||tags['contact:website']),openingHours:clean(tags.opening_hours,160),
      mapUrl:'https://www.openstreetmap.org/'+item.type+'/'+item.id});
  }
  const unique=[];
  for(const row of rows.sort((a,b)=>a.distanceMeters-b.distanceMeters)){
    if(!unique.some(other=>other.id===row.id||other.name===row.name&&distance(other,row)<35))unique.push(row);
    if(unique.length===12)break;
  }
  return unique;
}

/** Injectable client for tests; the default client uses only fixed public APIs. */
export function createLocationClient({fetch:fetchImpl=(...args)=>globalThis.fetch(...args),now=()=>globalThis.performance?.now()??Date.now(),cacheTTL=120000}={}){
  const cache=new Map(),requests=new Map(),cooldowns=new Map(),controllers=new Set();let generation=0;
  function clearCache(){generation++;for(const entry of cache.values())clearTimeout(entry.timer);cache.clear();for(const controller of controllers)controller.abort();controllers.clear();}
  function cached(key){const entry=cache.get(key);if(!entry)return null;if(now()-entry.time>=cacheTTL){clearTimeout(entry.timer);cache.delete(key);return null;}return {...structuredClone(entry.value),cached:true};}
  function remember(key,value,epoch){
    if(epoch!==generation)throw abortError();
    while(cache.size>=20){const first=cache.keys().next().value;clearTimeout(cache.get(first).timer);cache.delete(first);}
    const previous=cache.get(key);if(previous)clearTimeout(previous.timer);
    const entry={value:structuredClone(value),time:now(),timer:setTimeout(()=>cache.delete(key),cacheTTL)};entry.timer?.unref?.();cache.set(key,entry);return {...value,cached:false};
  }
  async function request(url,{signal,method='GET',body,missingOK=false}={}){
    checkAbort(signal);
    const host=new URL(url).hostname,time=now(),history=(requests.get(host)||[]).filter(value=>time-value<60000);
    if(time<(cooldowns.get(host)||0))throw new LocationError('LOCATION_RATE_LIMIT','This map service needs a pause. Wait at least 30 seconds before trying again.');
    if(history.length>=12||history.length&&time-history.at(-1)<1000)throw new LocationError('LOCATION_RATE_LIMIT','Please wait a moment before another location search. Public map services have limited capacity.');
    history.push(time);requests.set(host,history);
    const controller=new AbortController();controllers.add(controller);let timedOut=false;
    const timer=setTimeout(()=>{timedOut=true;controller.abort();},15000);
    const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
    let reader;
    try{
      const response=await fetchImpl(url,{method,body,signal:controller.signal,mode:'cors',credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:host==='overpass-api.de'?'origin':'no-referrer',
        headers:{Accept:'application/json',...(method==='POST'?{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}:{})}});
      if(missingOK&&response.status===404)return null;
      if(response.status===429||response.status===406){cooldowns.set(host,now()+30000);throw new LocationError('LOCATION_RATE_LIMIT','The public map service is busy or declined this request. Wait at least 30 seconds before trying again.');}
      if(!response.ok)throw new LocationError('LOCATION_SERVICE','The public map service is unavailable. Try again later or open your preferred Maps app.');
      if(Number(response.headers.get('content-length'))>1024*1024)throw new LocationError('LOCATION_TOO_LARGE','The map response was too large. Try a smaller search.');
      reader=response.body?.getReader();if(!reader)throw new LocationError('LOCATION_BROWSER','This browser cannot read bounded map responses. Update the browser or open a Maps link.');
      const chunks=[];let bytes=0;
      for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1024*1024)throw new LocationError('LOCATION_TOO_LARGE','The map response was too large. Try a smaller search.');chunks.push(value);}
      const combined=new Uint8Array(bytes);let position=0;for(const chunk of chunks){combined.set(chunk,position);position+=chunk.length;}
      checkAbort(signal);if(controller.signal.aborted)throw abortError();
      try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(combined));}catch{throw new LocationError('LOCATION_FORMAT','The map service returned unreadable data. Try again later.');}
    }catch(error){
      if(host==='overpass-api.de'&&!signal?.aborted&&!(controller.signal.aborted&&!timedOut))cooldowns.set(host,now()+30000);
      if(signal?.aborted||controller.signal.aborted&&!timedOut)throw abortError();
      if(timedOut)throw new LocationError('LOCATION_TIMEOUT','The map service took too long. Try again later or use your Maps app.');
      if(error instanceof LocationError)throw error;
      throw new LocationError('LOCATION_NETWORK','I could not reach the map service. Check the connection or open your Maps app.');
    }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);controller.abort();controllers.delete(controller);try{await reader?.cancel();}catch{}}
  }
  async function resolvePlace(value,{country='',signal}={}){
    checkAbort(signal);const parts=queryParts(value,country),epoch=generation;
    const base={query:parts.query,country:parts.country,needsCountry:parts.needsCountry};
    if(parts.needsCountry)return {...base,results:[],message:parts.ambiguousCountry?'That abbreviation can identify a region or a country. Select the intended country, or write its full name.':'Choose the country for this postal code; the same digits can identify different places worldwide.',cached:false};
    const key=JSON.stringify(['place',value,parts.country]);const hit=cached(key);if(hit)return hit;
    const url=new URL('https://photon.komoot.io/api/');url.search=new URLSearchParams({q:parts.query,limit:'6',lang:'en',...(parts.country?{countrycode:parts.country}:{})});
    let results=[],firstError;
    try{results=photonRows(await request(url.href,{signal}),parts);}catch(error){if(error.name==='AbortError'||error.code==='LOCATION_RATE_LIMIT')throw error;firstError=error;}
    let fallbackMessage='';
    if(!results.length){
      checkAbort(signal);
      try{
        if(parts.postal&&ZIP_COUNTRIES.has(parts.country)){
          const area=postalArea(parts.query,parts.country);
          const endpoint='https://api.zippopotam.us/'+parts.country.toLowerCase()+'/'+encodeURIComponent(area);
          const data=await request(endpoint,{signal,missingOK:true});results=postalRows(data,parts,area);
          fallbackMessage=postalKey(area)!==postalKey(parts.query)?'Only the '+area+' postal area was found for '+parts.query+'. This is an approximate area location, not the exact address.':'These are approximate postal-area locations, not exact street addresses.';
        }else{
          const endpoint=new URL('https://geocoding-api.open-meteo.com/v1/search');
          endpoint.search=new URLSearchParams({name:parts.query,count:'6',language:'en',format:'json',...(parts.country?{countryCode:parts.country}:{})});
          results=meteoRows(await request(endpoint.href,{signal}),parts);fallbackMessage='These are approximate city/locality coordinates, not an exact street address.';
        }
      }catch(error){if(error.name==='AbortError'||error.code==='LOCATION_RATE_LIMIT')throw error;throw firstError||error;}
    }
    checkAbort(signal);
    const message=results.length?(fallbackMessage||'Choose the matching place. Map coordinates and postal coverage are approximate.'):'I could not find a matching location. Check the country and postal code, or enter the city and street instead.';
    return remember(key,{...base,results,message},epoch);
  }
  async function nearbyPlaces({lat,lon,category,radius=1500}={}, {signal}={}){
    checkAbort(signal);const origin=coordinates({lat,lon}),epoch=generation;
    if(!Object.hasOwn(FILTERS,category))throw new LocationError('INVALID_CATEGORY','Choose one of the supported nearby-place categories.');
    if(typeof radius!=='number'||!Number.isFinite(radius)||radius<100||radius>5000)throw new LocationError('INVALID_RADIUS','Choose a search radius between 100 metres and 5 kilometres.');
    radius=Math.round(radius);const key=JSON.stringify(['nearby',lat,lon,category,radius]),hit=cached(key);if(hit)return hit;
    const query='[out:json][timeout:10][maxsize:8388608];nwr(around:'+radius+','+lat+','+lon+')'+FILTERS[category]+';out center tags 60;';
    const endpoint=new URL('https://overpass-api.de/api/interpreter');endpoint.search=new URLSearchParams({data:query});
    const data=await request(endpoint.href,{signal});
    const results=nearbyRows(data,origin,category,radius);checkAbort(signal);
    return remember(key,{results,category,radius,attribution:{...OVERPASS_ATTR},
      message:results.length?'Mapped places within the search area, sorted by straight-line distance. This is a limited list; verify hours, availability and the route in Maps.':'No matching places were returned in this area. Map coverage may be incomplete; try a larger radius or your Maps app.'},epoch);
  }
  return {resolvePlace,nearbyPlaces,clearCache};
}
const defaultClient=createLocationClient();
export const resolvePlace=(query,options)=>defaultClient.resolvePlace(query,options);
export const nearbyPlaces=(place,options)=>defaultClient.nearbyPlaces(place,options);
export const clearLocationCache=()=>defaultClient.clearCache();
globalThis.addEventListener?.('pagehide',clearLocationCache);

/** One position request. Abort rejects immediately and ignores any later fix. */
export function getDeviceLocation({signal}={}){
  if(signal?.aborted)return Promise.reject(abortError());
  const geolocation=globalThis.navigator?.geolocation;
  if(!geolocation)return Promise.reject(new LocationError('LOCATION_UNSUPPORTED','This browser cannot read device location. Enter a place or postal code instead.'));
  if(globalThis.isSecureContext===false)return Promise.reject(new LocationError('LOCATION_SECURE_CONTEXT','Device location needs HTTPS or a local MAX-G window. Enter a place instead.'));
  return new Promise((resolve,reject)=>{
    let done=false,timer;
    const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);globalThis.removeEventListener?.('pagehide',abort);error?reject(error):resolve(value);};
    const abort=()=>finish(abortError());signal?.addEventListener('abort',abort,{once:true});globalThis.addEventListener?.('pagehide',abort,{once:true});
    timer=setTimeout(()=>finish(new LocationError('LOCATION_TIMEOUT','Your device did not provide a location in time. Try again or enter a place.')),14000);
    try{geolocation.getCurrentPosition(position=>{
      if(done)return;
      try{const point=coordinates({lat:position.coords.latitude,lon:position.coords.longitude}),accuracy=position.coords.accuracy;
        if(typeof accuracy!=='number'||!Number.isFinite(accuracy)||accuracy<0)throw new Error();
        finish(null,{...point,accuracyMeters:accuracy,timestamp:Number.isFinite(position.timestamp)?position.timestamp:Date.now(),source:'device'});
      }catch{finish(new LocationError('LOCATION_UNAVAILABLE','The device returned an invalid location. Enter a place or try again.'));}
    },error=>{
      const message=error?.code===1?'Location permission was denied. Allow location in browser settings, or enter a place or postal code.':error?.code===3?'Your device could not locate you in time. Try again or enter a place.':'Your device could not determine its location. Check location services or enter a place.';
      finish(new LocationError(error?.code===1?'LOCATION_DENIED':error?.code===3?'LOCATION_TIMEOUT':'LOCATION_UNAVAILABLE',message));
    },{enableHighAccuracy:false,timeout:12000,maximumAge:30000});}catch{finish(new LocationError('LOCATION_UNAVAILABLE','Location services are unavailable. Enter a place or postal code instead.'));}
  });
}

/** HTTPS handoff links only. No navigation or request occurs until clicked. */
export function directionsLinks(destination,{origin,mode='driving'}={}){
  if(!MODES.has(mode))throw new LocationError('INVALID_TRAVEL_MODE','Choose driving, walking, cycling or public transport.');
  const end=coordinates(destination),start=origin?coordinates(origin):null,point=end.lat+','+end.lon;
  const google=new URL('https://www.google.com/maps/dir/');
  google.search=new URLSearchParams({api:'1',destination:point,travelmode:mode,...(start?{origin:start.lat+','+start.lon}:{})});
  const links=[{provider:'google',label:'Google Maps',url:google.href,mode}];
  if(mode!=='bicycling'){
    const apple=new URL('https://maps.apple.com/');
    apple.search=new URLSearchParams({daddr:point,dirflg:{driving:'d',walking:'w',transit:'r'}[mode],...(start?{saddr:start.lat+','+start.lon}:{})});
    links.push({provider:'apple',label:'Apple Maps',url:apple.href,mode});
  }
  if(mode==='driving'){
    const waze=new URL('https://waze.com/ul');waze.search=new URLSearchParams({ll:point,navigate:'yes'});
    links.push({provider:'waze',label:'Waze · driving from current location',url:waze.href,mode});
  }
  return links;
}
