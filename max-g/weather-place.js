/** Shared weather-place matching. A forecast needs a locality, not an arbitrary
 * point in a country/state. Provider qualifiers are checked again in returned
 * metadata: https://open-meteo.com/en/docs/geocoding-api#location-search */
import {normalizeCountry,countryName} from './country-data.js';
import {normalizePlaceText,looksLikePostalCode,normalizePostalCode} from './postal-data.js';

const STATES='AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming|DC:District of Columbia'.split('|').map(value=>value.split(':'));
const key=value=>String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const stateNames=new Map(STATES.flatMap(([code,name])=>[[key(code),name],[key(name),name]]));
const UK_REGIONS=new Set(['england','scotland','wales','northern ireland']);
const cityKey=value=>key(value).replace(/^st\s/,'saint ').replace(/^nyc$/,'new york city');
const regionKey=value=>key(value).replace(/\s+(?:region|province|state|prefecture)$/,'');
const countryOf=row=>normalizeCountry(row.country_code||row.countryCode||row.country);
const cityAliases=value=>new Set([cityKey(value),...(cityKey(value)==='new york'?['new york city']:[])]);
const countyKey=value=>key(value).replace(/^county of\s+/,'').replace(/\s+county$/,'');

export function parseWeatherPlaceSpec(value,{country=''}={}){
  const input=typeof value==='string'?normalizePlaceText(value).trim():'';
  const spec={name:input,region:'',country:normalizeCountry(country),postal:false,broad:false,query:input,needsCountry:false};
  if(!input||input.length>200||/[\u0000-\u001f\u007f]/.test(value))return spec;
  const bare=input.replace(/^(?:the\s+)?(?:state|province|country)\s+of\s+/i,'').replace(/\s+(?:state|province|country)$/i,'');
  const bareCountry=normalizeCountry(bare),bareState=stateNames.get(key(bare));
  if(bareCountry||bareState){
    spec.broad=true;spec.name=bare;
    spec.country=bareState&&(!bareCountry||spec.country==='US')?'US':bareCountry||spec.country;
    // Georgia names both a country and a US state; ask for locality without
    // quietly deciding which country the user meant.
    if(bareState&&bareCountry&&spec.country!==normalizeCountry(country))spec.country='';
    spec.region=bareState&&spec.country==='US'?bareState:'';
    return spec;
  }
  let pieces=input.split(',').map(part=>part.trim()).filter(Boolean);
  if(pieces.length===1){
    // Full country names and postal country codes may be separated by spaces.
    for(const match of input.matchAll(/\s+/g)){
      const left=input.slice(0,match.index),right=input.slice(match.index+match[0].length);
      if(looksLikePostalCode(right)&&normalizeCountry(left)){pieces=[right,left];break;}
      if(normalizeCountry(right)&&(!/^[A-Za-z]{2}$/.test(right)||looksLikePostalCode(left))){pieces=[left,right];break;}
    }
  }
  if(pieces.length>1){
    const tail=pieces.at(-1),tailKey=key(tail),knownCountry=normalizeCountry(tail),state=stateNames.get(tailKey);
    if(UK_REGIONS.has(tailKey)){spec.country='GB';spec.region=tail;pieces.pop();}
    else if(state&&knownCountry&&pieces.length===2&&!looksLikePostalCode(pieces[0])&&spec.country!==knownCountry&&(!spec.country||spec.country==='US')){
      if(!spec.country)spec.needsCountry=true;
    }
    else if(knownCountry&&(!state||!/^[A-Za-z]{2}$/.test(tail)||pieces.length>2||looksLikePostalCode(pieces[0])||spec.country===knownCountry)){
      spec.country=knownCountry;pieces.pop();
    }else if(state&&knownCountry&&!spec.country){
      spec.needsCountry=true; // CA / IN / DE can also be country codes.
    }
  }
  // Recognize full US region names without requiring punctuation.
  if(pieces.length===1&&!looksLikePostalCode(pieces[0])&&(!spec.country||spec.country==='US')){
    const text=pieces[0];
    for(const [code,name] of [...STATES].sort((a,b)=>b[1].length-a[1].length)){
      const suffix=[name,code].find(part=>key(text).endsWith(' '+key(part)));
      if(suffix){pieces=[text.slice(0,text.length-suffix.length).trim(),suffix];break;}
    }
  }
  spec.name=pieces[0]||'';
  if(pieces.length>1)spec.region=pieces.slice(1).join(', ');
  if(spec.region){
    const state=stateNames.get(key(spec.region));
    if(state&&(!spec.country||spec.country==='US')){
      if(!spec.country&&normalizeCountry(spec.region)&&/^[A-Za-z]{2}$/.test(spec.region))spec.needsCountry=true;
      if(!spec.needsCountry){spec.country='US';spec.region=state;}
    }
  }
  spec.postal=looksLikePostalCode(spec.name)&&!spec.region;
  if(spec.postal)spec.name=normalizePostalCode(spec.name,spec.country);
  const namedState=stateNames.get(key(spec.name));
  if(!spec.postal&&!spec.region&&namedState&&(!spec.country||spec.country==='US')){
    spec.broad=true;spec.region=namedState;spec.country='US';
  }
  // Loudon is a real Tennessee county/town. Correct this common spelling only
  // with explicit Virginia context: https://www.loudoun.gov/173/Facts-Figures.
  if(spec.country==='US'&&spec.region==='Virginia'&&/^loudou?n(?: county)?$/i.test(spec.name))spec.name='Loudoun County';
  if(/(?:\s+county$|^county of\s+)/i.test(spec.name)){
    spec.scope='county';spec.name=spec.name.replace(/^county of\s+/i,'').replace(/\s+county$/i,'')+' County';
  }
  spec.query=[spec.name,spec.region].filter(Boolean).join(', ');
  if(spec.broad)spec.query=spec.name;
  return spec;
}

export function isBroadWeatherPlace(row){
  return row?.weatherScope==='region'||/^(?:ADM[1-5]|PCL)/i.test(String(row?.feature_code||''))
    ||['state','province','country','continent','county','region'].includes(String(row?.type||'').toLowerCase());
}

export function matchesWeatherPlace(row,spec){
  if(!row||!spec||spec.broad||spec.needsCountry)return false;
  if(spec.scope==='county'){
    if(!(/^ADM2$/i.test(String(row.feature_code||''))||String(row.type||'').toLowerCase()==='county'))return false;
  }else if(isBroadWeatherPlace(row))return false;
  const code=countryOf(row);
  if(spec.country&&code!==spec.country)return false;
  if(spec.region){
    const regions=spec.region.split(',').map(value=>regionKey(stateNames.get(key(value))&&code==='US'?stateNames.get(key(value)):value));
    const available=[row.admin1,row.admin2,row.admin3,row.admin4,row.region].filter(Boolean).map(value=>regionKey(stateNames.get(key(value))&&code==='US'?stateNames.get(key(value)):value));
    if(!regions.every(region=>available.includes(region)))return false;
  }
  if(spec.postal)return true; // Exact postal matching remains the provider's job.
  if(spec.scope==='county')return countyKey(row.name)===countyKey(spec.name);
  const names=[row.name,row.city,row.locality].filter(Boolean).flatMap(value=>[...cityAliases(value)]);
  return [...cityAliases(spec.name)].some(name=>names.includes(name));
}

/** The search index contains localities, while /get also exposes ADM2 records.
 * Discover county IDs from exact admin2 metadata, then verify the returned ADM2
 * object again. A similarly named city, school or road is never the forecast.
 * https://open-meteo.com/en/docs/geocoding-api#json-return-object */
export function weatherCountySearch(spec){
  return spec?.scope==='county'?[spec.name.replace(/\s+county$/i,''),spec.region].filter(Boolean).join(', '):spec?.query||'';
}
export function weatherCountyIds(rows,spec){
  if(spec?.scope!=='county'||!Array.isArray(rows))return [];
  const ids=rows.filter(row=>countyKey(row?.admin2)===countyKey(spec.name)&&matchesWeatherPlace({...row,name:spec.name,feature_code:'ADM2'},spec))
    .map(row=>row.admin2_id).filter(id=>Number.isSafeInteger(id)&&id>0);
  return [...new Set(ids)].slice(0,6);
}
export function countyWeatherPoint(row,spec){
  if(spec?.scope!=='county')return row;
  const name=spec.name,region=row.admin1||row.region||spec.region,code=countryOf(row)||spec.country;
  const area=[name,region,countryName(code)].filter(Boolean).join(', ');
  return {...row,name,label:area,weatherScope:'county',accuracy:'approximate county center'};
}
export function countyWeatherNotice(point){
  if(point?.weatherScope!=='county')return '';
  return 'This is a forecast for the mapped county center. Conditions can vary across the county; ask for a town or ZIP code for a more local forecast.';
}

export function weatherLocalityPrompt(spec){
  const area=[spec.name,spec.country&&normalizeCountry(spec.name)!==spec.country?countryName(spec.country):''].filter(Boolean).join(', ');
  return `Which city or postal code in ${area} should I check? Weather varies across a state or country, so I need a specific place for an accurate local forecast.`;
}

/** Keep the requested area through a short city answer, but let a newly stated
 * country/region replace it. This context contains no device coordinates. */
export function weatherLocalityFollowup(value,clarification={}){
  let spec=parseWeatherPlaceSpec(value);
  if(clarification.kind==='county-region'){
    const county=parseWeatherPlaceSpec(clarification.query,{country:clarification.country});
    // A state-only answer qualifies the pending county. A new county, postal
    // code or explicitly qualified city instead replaces the pending place.
    const replacement=spec.scope==='county'||spec.postal||!spec.broad&&Boolean(spec.country||spec.region);
    if(county.scope==='county'&&!replacement){
      const qualifier=spec.broad?(spec.region||spec.name):value;
      const combined=parseWeatherPlaceSpec(county.name+', '+qualifier,{country:spec.broad&&spec.country||clarification.country});
      return {place:combined.query,country:combined.country};
    }
  }
  if(spec.needsCountry&&clarification.country)spec=parseWeatherPlaceSpec(value,{country:clarification.country});
  const country=spec.country||normalizeCountry(clarification.country);
  const region=spec.region||(!spec.postal&&!spec.broad&&(!spec.country||spec.country===normalizeCountry(clarification.country))?clarification.region:'')||'';
  return {place:[spec.name,region].filter(Boolean).join(', '),country};
}
