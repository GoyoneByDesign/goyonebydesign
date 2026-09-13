/** Bounded public retrieval and deterministic calculation. No eval, model calls, or storage. */
import {symbols,aliases,ambiguous} from './unit-data.js';
import {normalizePlaceText} from './postal-data.js';
// Release configuration: set this to the deployed public Worker base URL (no /search).
// Keep it empty in distributions that only use a paired Mac companion.
export const BUILTIN_SEARCH_URL='https://max-g-search.michael-goyone.workers.dev';
export function safePublicURL(raw){try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port)return null;const host=u.hostname.toLowerCase().replace(/\.$/,'');if(!host.includes('.')||host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||/^[\d.]+$/.test(host)||host.includes(':'))return null;return u.href;}catch{return null;}}
export function proxyBase(raw){const value=String(raw).trim();if(!value)throw new Error('Web search is not connected. Start MAX-G Companion or add an optional Cloudflare Worker URL in Settings → Connection.');const u=new URL(value);const local=['localhost','127.0.0.1'].includes(u.hostname);if((u.protocol!=='https:'&&!(u.protocol==='http:'&&local))||u.username||u.password||u.search||u.hash)throw new Error('Use a plain HTTPS Worker URL, without credentials, query or fragment.');return u.href.replace(/\/$/,'');}
/** Resolve defaults at request time so existing blank settings receive deployment updates.
 * Invalid custom URLs fail visibly; they never silently send a query elsewhere.
 */
export function searchRoute(raw,{builtinURL=BUILTIN_SEARCH_URL,connection='default'}={}){
  const custom=String(raw||'').trim(),builtIn=String(builtinURL||'').trim();
  if(custom)return {source:'custom',base:proxyBase(custom)};
  if(connection==='companion')return {source:'companion',base:''};
  return builtIn?{source:'builtin',base:proxyBase(builtIn)}:{source:'companion',base:''};
}
const RETRYABLE_PUBLIC_STATUS=new Set([429,502,503,504]);
const RETRYABLE_PUBLIC_CODES=new Set(['SEARCH_TIMEOUT','SEARCH_UNAVAILABLE','RATE_LIMITED','SERVICE_UNAVAILABLE','GATEWAY_TIMEOUT','BAD_GATEWAY','TOO_MANY_REQUESTS']);
function transientPublicResponse(data){
  const raw=data?.code||data?.error?.code||data?.error;
  // Typed setup, origin, parser and challenge failures need intervention, even
  // when a provider represents them with HTTP 503. Unknown typed codes fail closed.
  const code=typeof raw==='string'&&/^[A-Z][A-Z0-9_]{2,80}$/.test(raw)?raw:'';
  return !code||RETRYABLE_PUBLIC_CODES.has(code);
}
function retryDelay(response){
  const value=response.headers.get('retry-after')?.trim();
  if(value&&/^\d+$/.test(value))return Number(value)*1000;
  // HTTP dates contain a month name; do not interpret malformed numeric delays as dates.
  if(value&&/[a-z]{3}/i.test(value)){const time=Date.parse(value);if(Number.isFinite(time))return Math.max(0,time-Date.now());}
  return response.status===429?1000:250;
}
function transientPublicNetwork(error){
  if(/cors|origin|security|certificate|invalid|unsupported|blocked|redirect/i.test(String(error?.message||'')))return false;
  const code=error?.cause?.code||error?.code;
  if(['ECONNRESET','ETIMEDOUT','EAI_AGAIN','ECONNABORTED','ENETDOWN','ENETUNREACH'].includes(code))return true;
  // Fetch hides some CORS failures behind the same TypeError as a dropped connection.
  // A single retry repeats only this validated GET; it never changes origin or access mode.
  return error?.name==='TypeError'&&/failed to fetch|fetch failed|load failed|network|connection/i.test(String(error.message));
}
/** Public GET only, with at most one retry inside the original total deadline.
 * Retry-After is never shortened: if it does not fit, return the service error.
 * Parsing/size/security failures never trigger an alternate route or another request.
 */
export async function readJSON(url,{signal,timeout=16000,maxBytes=180000,method='GET'}={}){
  if(signal?.aborted)throw signal.reason||new DOMException('Public request stopped.','AbortError');
  if(method!=='GET'||!(typeof url==='string'||url instanceof URL))throw new TypeError('Public retrieval accepts a URL and GET requests only.');
  const target=new URL(url),local=['localhost','127.0.0.1','[::1]'].includes(target.hostname);
  if((target.protocol!=='https:'&&!(target.protocol==='http:'&&local))||target.username||target.password||target.hash)throw new TypeError('Use an HTTPS public URL without credentials or a fragment.');
  if(!Number.isFinite(timeout)||timeout<=0||timeout>120000||!Number.isSafeInteger(maxBytes)||maxBytes<=0)throw new TypeError('Use a positive size limit and a timeout up to 120 seconds.');
  const controller=new AbortController(),started=performance.now();let reader=null,response=null,rejectInterrupted;
  const interrupted=new Promise((_,reject)=>{rejectInterrupted=reject;});
  const stop=()=>rejectInterrupted(controller.signal.reason||new DOMException('Public request stopped.','AbortError'));
  controller.signal.addEventListener('abort',stop,{once:true});
  const abort=()=>controller.abort(signal?.reason);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  const timer=setTimeout(()=>controller.abort(new Error('The public service took too long to respond.')),timeout);
  const check=()=>{if(controller.signal.aborted)throw controller.signal.reason||new DOMException('Public request stopped.','AbortError');};
  const discard=()=>{try{const done=reader?reader.cancel():response?.body?.cancel();Promise.resolve(done).catch(()=>{});}catch{}};
  const pause=delay=>new Promise((resolve,reject)=>{
    let timer;const cancel=()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',cancel);reject(controller.signal.reason);};
    controller.signal.addEventListener('abort',cancel,{once:true});if(controller.signal.aborted){cancel();return;}
    timer=setTimeout(()=>{controller.signal.removeEventListener('abort',cancel);resolve();},delay);
  });
  const fits=delay=>Number.isFinite(delay)&&delay<timeout-(performance.now()-started);
  async function retrieve(){
    for(let attempt=0;attempt<2;attempt++){
      check();reader=null;response=null;
      try{response=await fetch(target.href,{method:'GET',signal:controller.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',redirect:'error'});}
      catch(error){check();if(attempt===0&&transientPublicNetwork(error)&&fits(300)){await pause(300);continue;}throw error;}
      if(controller.signal.aborted){discard();check();}
      if(['opaque','opaqueredirect'].includes(response.type)||response.redirected)throw new Error('The public service returned a blocked or redirected response.');
      if(Number(response.headers.get('content-length'))>maxBytes)throw new Error('Public response exceeds the size limit.');
      if(!response.headers.get('content-type')?.includes('json'))throw new Error(response.ok?'The service returned an unreadable response.':`Public service returned HTTP ${response.status} with an unreadable response.`);
      if(!response.body)throw new Error('The public service returned an empty response.');
      reader=response.body.getReader();let count=0;const chunks=[];
      while(true){const {done,value}=await reader.read();check();if(done)break;count+=value.byteLength;if(count>maxBytes)throw new Error('Public response exceeds the size limit.');chunks.push(value);}
      reader.releaseLock();reader=null;
      const bytes=new Uint8Array(count);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
      const data=JSON.parse(new TextDecoder().decode(bytes));check();
      if(response.ok)return data;
      const error=new Error(String(data?.message||data?.error||`Public service returned HTTP ${response.status}.`).slice(0,500));
      if(attempt===0&&RETRYABLE_PUBLIC_STATUS.has(response.status)&&transientPublicResponse(data)){const delay=retryDelay(response);if(fits(delay)){await pause(delay);continue;}}
      throw error;
    }
  }
  try{return await Promise.race([retrieve(),interrupted]);}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);controller.signal.removeEventListener('abort',stop);discard();}
}

export async function search(query,base,signal,localSearch,configuration){
  if(signal?.aborted)throw new DOMException('Search stopped.','AbortError');
  const text=String(query).slice(0,500),route=searchRoute(base,configuration);let data;
  if(!route.base&&typeof localSearch==='function')data=await localSearch(text,{signal});
  else {const url=new URL(proxyBase(route.base)+'/search');url.searchParams.set('q',text);data=await readJSON(url,{signal});}
  if(signal?.aborted)throw new DOMException('Search stopped.','AbortError');
  const results=(Array.isArray(data.results)?data.results:[]).filter(x=>x&&safePublicURL(x.url)&&typeof x.snippet==='string').slice(0,4).map(x=>({title:String(x.title||'Public source').slice(0,180),url:safePublicURL(x.url),snippet:x.snippet.slice(0,750)}));if(!results.length)throw new Error('Search returned no usable evidence. Try another query or source.');return {results,timestamp:data.timestamp||new Date().toISOString(),provider:data.provider||'DuckDuckGo'};}
const bounded=x=>{if(!Number.isFinite(x)||Math.abs(x)>1e100)throw new Error('Use finite numbers no larger than 10^100.');return x;};
const fmt=x=>Number(bounded(x).toPrecision(12)).toString();
export function calculate(expression){
  if(expression.length>240)throw new Error('Please shorten the equation.');
  const tokens=expression.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|sqrt|\*\*|[()+\-*/%]/gi)||[];
  if(tokens.join('').toLowerCase()!==expression.replace(/\s/g,'').toLowerCase()||tokens.length>64)throw new Error('Only numbers, arithmetic, parentheses and sqrt are supported.');
  let i=0,depth=0;
  function atom(){if(++depth>20)throw new Error('Equation is nested too deeply.');const token=tokens[i++];let value;if(token==='+'||token==='-')value=(token==='-'?-1:1)*power();else if(token==='('){value=sum();if(tokens[i++]!==')')throw new Error('Close each parenthesis.');}else if(token?.toLowerCase()==='sqrt'){if(tokens[i++]!=='(')throw new Error('Use sqrt(number).');value=Math.sqrt(sum());if(tokens[i++]!==')')throw new Error('Close each parenthesis.');}else if(token&&/^\d|^\./.test(token))value=Number(token);else throw new Error('Please check the equation.');depth--;return bounded(value);}
  function power(){let value=atom();if(tokens[i]==='**'){i++;const exponent=power();if(!Number.isInteger(exponent)||Math.abs(exponent)>100)throw new Error('Use whole-number exponents from -100 to 100.');if(value===0&&exponent<=0)throw new Error('Zero needs a positive exponent here.');value=bounded(value**exponent);}return value;}
  function product(){let value=power();while(['*','/','%'].includes(tokens[i])){const op=tokens[i++],right=power();if(right===0&&op!=='*')throw new Error('Division by zero is undefined.');value=bounded(op==='*'?value*right:op==='/'?value/right:((value%right)+right)%right);}return value;}
  function sum(){let value=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++],right=product();value=bounded(op==='+'?value+right:value-right);}return value;}
  const value=sum();if(i!==tokens.length)throw new Error('Please check the equation.');return value;
}
const customaryUnits={gallon:'US gallon',gallons:'US gallon',gal:'US gallon',quart:'US quart',quarts:'US quart',pint:'US pint',pints:'US pint',cup:'US cup',cups:'US cup','fluid ounce':'US fl oz','fluid ounces':'US fl oz','fl oz':'US fl oz',ton:'US short ton',tons:'US short ton',tablespoon:'US tbsp',tablespoons:'US tbsp',tbsp:'US tbsp',teaspoon:'US tsp',teaspoons:'US tsp',tsp:'US tsp'};
const unit=(name,units)=>symbols[name.trim()]||aliases[name.trim().toLowerCase()]||(units==='us'?symbols[customaryUnits[name.trim().toLowerCase()]]:undefined);
export function quickAnswer(query,{units='us'}={}){
  let text=query.trim().replace(/[?!.]+$/,'').replace(/^(?:please\s+)?(?:what(?:'s| is)|calculate|compute|evaluate|solve|convert)\s+/i,'');
  let conversion=text.match(/^([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*(.+?)\s+(?:to|in|into|as|=)\s+(.+)$/i);
  const natural=text.match(/^how many (.+?) (?:are (?:there )?in|in|is)\s+(?:an? |one |([-+]?\d*\.?\d+)\s*)(.+)$/i);
  if(natural)conversion=[null,natural[2]||'1',natural[3],natural[1]];
  if(conversion){const [,n,from,to]=conversion,src=unit(from,units),dst=unit(to,units);if(src||dst){if([from,to].some(name=>ambiguous.includes(name.trim().toLowerCase())&&!(units==='us'&&customaryUnits[name.trim().toLowerCase()])))return {text:'Please specify the unit variant, such as US gallon, imperial gallon, or metric cup.',type:'clarification'};if(!src||!dst||src[0]!==dst[0])return {text:'Please choose supported units of the same kind.',type:'clarification'};let value=bounded(Number(n)),answer;if(src[0]==='temperature'){const k=src[1]==='°C'?value+273.15:src[1]==='°F'?(value-32)*5/9+273.15:value;if(k<0)return {text:'That temperature is below absolute zero.',type:'clarification'};answer=dst[1]==='°C'?k-273.15:dst[1]==='°F'?(k-273.15)*9/5+32:k;}else answer=value*Number(src[2])/Number(dst[2]);return {text:`${fmt(value)} ${src[1]} = ${fmt(answer)} ${dst[1]}.`,type:'calculation'};}}
  for(const [word,op]of [['multiplied by','*'],['divided by','/'],['to the power of','**'],['plus','+'],['minus','-'],['times','*']])text=text.replace(new RegExp(`\\b${word}\\b`,'gi'),op);
  text=text.replace(/[×x](?=\s*\d)/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/\^/g,'**').replace(/\s*(?:equals?|=)$/i,'');
  text=text.replace(/^(?:the )?square root of ([-+]?\d*\.?\d+)$/i,'sqrt($1)').replace(/^([-+]?\d*\.?\d+)\s*(?:%|percent) of ([-+]?\d*\.?\d+)$/i,'($1)/100*($2)');
  if(!/^[\d\s.eE+*/()%\-sqrt]+$/.test(text)||!/[+*/%\-]|sqrt/.test(text))return null;
  try{return {text:`${text} = ${fmt(calculate(text))}.`,type:'calculation'};}catch(error){return {text:error.message,type:'clarification'};}
}
/** A ZIP label supplies a US hint only for an otherwise unqualified US-shaped
 * code. Explicit countries remain in the place text for the location resolver. */
export function postalReply(value){
  if(typeof value!=='string'||value.length>180)return null;
  const text=normalizePlaceText(value).replace(/[?!.]+$/,'');
  const match=text.match(/^(?:(?:my|the)\s+)?(zip\s*codes?|zip|postal\s*codes?|postcodes?)\s*(?:(?:is|are|:|=)\s*)?(.+)$/i);
  if(!match)return null;
  const place=match[2].trim();if(!place)return null;
  const country=/^zip/i.test(match[1])&&/^\d{5}(?:-\d{4})?$/.test(place)?'US':'';
  return {place,country};
}
export function weatherRequest(query,city=''){
  if(typeof query!=='string'||query.length>500)return null;
  const text=query.trim().replace(/[’‘]/g,"'");
  if(!/\b(?:weather|forecast|raining|temperature)\b/i.test(text))return null;
  if(/\b(?:under the weather|weather the storm|weather permitting)\b/i.test(text))return null;
  // Explanations, historical research and non-weather uses belong in normal chat.
  if(/\b(?:why|define|definition|explain|meaning|climate|yesterday|last|month|year|convert|history|historical)\b|\d{4}-\d\d-\d\d/i.test(text)||
    /^(?:what is|what does) (?:weather|temperature|forecast)(?: mean)?[?!.]*$/i.test(text)||
    /^(?:how|what)\b.*\b(?:work|works|measure|measured|affect|affects|change|changes)\b/i.test(text)||
    /\b(?:sales|revenue|stock|stocks|market|demand|budget|body|fever|oven|cpu|boiling|freezing point|water temperature)\b/i.test(text))return null;
  // Avoid answering an unsupported date with current conditions.
  if(/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend)\b/i.test(text)||/\bnext\b(?!\s+(?:week|7\s+days|seven\s+days|(?:(?:6|12|24)|six|twelve|twenty[- ]four|few)\s+hours))/i.test(text))return null;
  const requestedUnits=text.match(/\b(?:in\s+)?(celsius|fahrenheit|metric|u\.?s\.? units)\b/i)?.[1]?.toLowerCase();
  const hourCount=text.match(/\bnext\s+(6|12|24|six|twelve|twenty[- ]four)\s+hours\b/i)?.[1]?.toLowerCase();
  const hours=hourCount?({six:6,twelve:12,'twenty four':24,'twenty-four':24}[hourCount]||Number(hourCount)):undefined;
  const nextWeek=/\bnext\s+week\b/i.test(text),hourly=/\b(?:hourly|hour[ -]by[ -]hour|next\s+(?:(?:6|12|24)|six|twelve|twenty[- ]four|few)\s+hours)\b/i.test(text);
  const mode=/\b(?:week|weekly|7[ -]day|seven[ -]day|next (?:7|seven) days)\b/i.test(text)?'week':/\btomorrow\b/i.test(text)?'tomorrow':/\btoday\b/i.test(text)?'today':hourly?'hourly':'current';
  const stripped=text.replace(/\b(?:in\s+)?(?:celsius|fahrenheit|metric|u\.?s\.? units)\b/gi,' ').replace(/\b(?:for\s+)?(?:the\s+)?next\s+(?:(?:6|12|24)|six|twelve|twenty[- ]four|few)\s+hours\b|\b(?:hourly|hour[ -]by[ -]hour)\b/gi,' ').replace(/\b(?:for\s+)?(?:the\s+)?(?:next|this)\s+week\b|\b(?:for\s+)?(?:the\s+)?(?:next\s+)?(?:7|seven)[ -]days?\b|\b(?:right now|today|tomorrow|currently|now|please|weekly|week)\b/gi,' ').replace(/[?!.]+$/,'').replace(/\s+/g,' ').trim();
  const prepositions=[...stripped.matchAll(/\b(?:in|for|at)\s+/gi)],last=prepositions.at(-1);
  let place=last?stripped.slice(last.index+last[0].length):stripped.match(/^(?:weather|forecast|temperature)\s+(.+)$/i)?.[1]||'';
  // Request nouns are not cities: “weather update” must use current location.
  // Explicit “weather in Update” is left intact because the user named a place.
  if(!last)place=place.replace(/^(?:(?:latest|current|local|a|an|the)\s+)*(?:(?:updates?|reports?|conditions?|check)\b\s*)+/i,'').trim();
  place=place.replace(/^(?:like|forecast)\s*/i,'').replace(/\s+(?:like|forecast)$/i,'').replace(/^[,\s]+|[,\s]+$/g,'').trim();
  if(/^(?:here|outside|near me|nearby|my area|my location|my current location|like|the|is it|it|for|in|at)$/i.test(place))place='';
  const postal=postalReply(place);if(postal)place=postal.place;
  const fallback=typeof city==='string'?city.trim():'';
  return {city:(place||fallback).slice(0,150),mode,...(mode==='hourly'&&hours?{hours}:{}),...(requestedUnits?{units:/celsius|metric/.test(requestedUnits)?'metric':'us'}:{}),...(postal?.country?{country:postal.country}:{}),...(nextWeek?{period:'next-week'}:{})};
}
export class WeatherError extends Error{constructor(code,message){super(message);this.name='WeatherError';this.code=code;}}
const weatherCodes={0:'clear sky',1:'mainly clear',2:'partly cloudy',3:'overcast',45:'fog',48:'rime fog',51:'light drizzle',53:'drizzle',55:'dense drizzle',56:'light freezing drizzle',57:'dense freezing drizzle',61:'light rain',63:'rain',65:'heavy rain',66:'light freezing rain',67:'heavy freezing rain',71:'light snow',73:'snow',75:'heavy snow',77:'snow grains',80:'rain showers',81:'rain showers',82:'heavy showers',85:'light snow showers',86:'heavy snow showers',95:'thunderstorm',96:'thunderstorm with hail',99:'thunderstorm with hail'};
const weatherClarification=(code,text,sources=[])=>({type:'clarification',code,text,sources});
const weatherNumber=value=>typeof value==='number'&&Number.isFinite(value)?Number(value.toFixed(1)):null;
const weatherName=row=>String(row.label||[...new Set([row.name,row.admin1,row.country].filter(value=>typeof value==='string'&&value.trim()))].join(', ')||'Selected location').slice(0,240);
const validWeatherCoordinate=row=>row&&Number.isFinite(row.latitude)&&Number.isFinite(row.longitude)&&Math.abs(row.latitude)<=90&&Math.abs(row.longitude)<=180;
const validWeatherDate=value=>{if(typeof value!=='string'||!/^\d{4}-\d\d-\d\d$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return !Number.isNaN(date.valueOf())&&date.toISOString().slice(0,10)===value;};
const validWeatherTime=value=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)&&validWeatherDate(value.slice(0,10));
const conditionName=code=>weatherCodes[code]||'conditions unavailable';
export const WEATHER_TIMEOUT_MS=6000;
async function readWeatherJSON(url,signal){
  if(globalThis.navigator?.onLine===false)throw new WeatherError('WEATHER_OFFLINE',"I think I'm offline. Connect this device to the internet, then ask me for the weather again.");
  try{return await readJSON(url,{signal,timeout:WEATHER_TIMEOUT_MS,maxBytes:100000});}
  catch(error){
    if(signal?.aborted||error?.name==='AbortError')throw error;
    if(/took too long|timed? ?out/i.test(error?.message||''))throw new WeatherError('WEATHER_TIMEOUT','The weather service took too long to reply. Please try again in a moment.');
    if(globalThis.navigator?.onLine===false)throw new WeatherError('WEATHER_OFFLINE',"I think I'm offline. Connect this device to the internet, then ask me for the weather again.");
    throw new WeatherError('WEATHER_UNAVAILABLE',"I couldn't reach the weather service. Check your internet connection and try again in a moment.");
  }
}

/** A few validated answers in tab memory only. Repeated requests share retrieval;
 * every subscriber can stop independently, and the last stop cancels the HTTP work.
 * Caller permission checks still run before this client, even for a cache hit.
 */
export function createWeatherClient({retrieve=weather,now=()=>Date.now(),ttl=60000,limit=6}={}){
  if(!Number.isFinite(ttl)||ttl<=0||ttl>60000||!Number.isInteger(limit)||limit<1||limit>12)throw new TypeError('Use a weather cache of 1–12 answers for at most one minute.');
  const cache=new Map(),pending=new Map();let epoch=0;
  const stopped=()=>new DOMException('Weather request stopped.','AbortError');
  function remove(key){clearTimeout(cache.get(key)?.timer);cache.delete(key);}
  function clear(){epoch++;for(const key of cache.keys())remove(key);for(const entry of pending.values())entry.controller.abort(stopped());pending.clear();}
  async function get(request,signal){
    if(signal?.aborted)throw signal.reason||stopped();
    // Unresolved/invalid requests retain the normal validation and clarification path.
    if(!request||!validWeatherCoordinate(request.location)||request.city!==undefined&&(typeof request.city!=='string'||request.city.length>200||/[\u0000-\u001f\u007f]/.test(request.city))||!['current','today','tomorrow','week','hourly'].includes(request.mode||'current')||request.units!==undefined&&!['us','metric'].includes(request.units)||request.hours!==undefined&&(![6,12,24].includes(request.hours)||request.mode!=='hourly')||request.period&&(request.period!=='next-week'||request.mode!=='week'))return retrieve(request,signal);
    const key=JSON.stringify([request.mode||'current',request.period||'',request.units||'us',request.hours||12,request.location.latitude,request.location.longitude,weatherName(request.location),Boolean(request.location.privateOrigin)]);
    const hit=cache.get(key),time=now();
    if(hit&&time>=hit.time&&time-hit.time<ttl)return {...structuredClone(hit.value),cached:true,fetchedAt:hit.time};
    remove(key);
    let entry=pending.get(key);
    if(!entry){
      const controller=new AbortController(),generation=epoch;
      entry={controller,users:0,promise:null};pending.set(key,entry);
      entry.promise=Promise.resolve().then(()=>retrieve(structuredClone(request),controller.signal)).then(value=>{
        if(controller.signal.aborted||generation!==epoch)throw stopped();
        const fetchedAt=now();
        if(value?.type==='weather'){
          while(cache.size>=limit)remove(cache.keys().next().value);
          const saved={value:structuredClone(value),time:fetchedAt,timer:null};
          saved.timer=setTimeout(()=>{if(cache.get(key)===saved)cache.delete(key);},ttl);saved.timer?.unref?.();cache.set(key,saved);
        }
        return {...value,cached:false,fetchedAt};
      }).finally(()=>{if(pending.get(key)===entry)pending.delete(key);});
    }
    entry.users++;
    return new Promise((resolve,reject)=>{
      let done=false;
      const finish=(error,value)=>{if(done)return;done=true;signal?.removeEventListener('abort',abort);entry.users--;if(!entry.users&&pending.get(key)===entry){pending.delete(key);entry.controller.abort(stopped());}error?reject(error):resolve(structuredClone(value));};
      const abort=()=>finish(signal.reason||stopped());signal?.addEventListener('abort',abort,{once:true});
      if(signal?.aborted){abort();return;}
      entry.promise.then(value=>finish(null,value),error=>finish(error));
    });
  }
  return {weather:get,clear};
}
function weatherPlaceParts(value){
  const aliases={us:'US',usa:'US','united states':'US','united states of america':'US',uk:'GB',gb:'GB','united kingdom':'GB',canada:'CA',japan:'JP',philippines:'PH',china:'CN',italy:'IT',spain:'ES',russia:'RU','south korea':'KR',germany:'DE',france:'FR',australia:'AU',india:'IN'};
  let parts=value.split(',').map(part=>part.trim()).filter(Boolean);
  if(parts.length===1&&/\d/.test(value)){
    for(const match of value.matchAll(/\s+/g)){
      const first=value.slice(0,match.index).trim(),second=value.slice(match.index+match[0].length).trim();
      if(/^[\w -]+$/.test(first)&&/\d/.test(first)&&(aliases[second.toLowerCase()]||/^[A-Za-z]{2}$/.test(second))){parts=[first,second];break;}
      if((aliases[first.toLowerCase()]||/^[A-Za-z]{2}$/.test(first))&&/^[\w -]+$/.test(second)&&/\d/.test(second)){parts=[second,first];break;}
    }
  }
  const country=aliases[parts.at(-1)?.toLowerCase()]||(/^[A-Za-z]{2}$/.test(parts.at(-1)||'')?parts.at(-1).toUpperCase():'');
  const postal=parts[0]&&/\d/.test(parts[0])&&/^[A-Za-z\d -]{2,16}$/.test(parts[0]);
  return {parts,country,postal};
}
const incompleteWeather=()=>new WeatherError('WEATHER_DATA_INCOMPLETE','The weather service returned incomplete data. Please try again in a moment.');
const weatherCode=value=>Number.isInteger(value)&&Object.hasOwn(weatherCodes,value)?value:null;
const boundedWeatherNumber=(value,min,max)=>{const number=weatherNumber(value);return number!==null&&number>=min&&number<=max?number:null;};
function weatherTimezone(value){
  if(typeof value!=='string'||value.length>80||!value)throw incompleteWeather();
  try{new Intl.DateTimeFormat('en-US',{timeZone:value}).format(0);return value;}catch{throw incompleteWeather();}
}
function localWeatherTime(timezone){
  const fields=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}
/** Trust the provider's unit metadata before displaying a value. Temperature
 * absence stays unavailable; a conflicting unit never gets relabelled. */
function weatherDataCard(data,{mode,units,period,location,hours=12}){
  if(!data||typeof data!=='object'||Array.isArray(data)||data.error)throw incompleteWeather();
  const timezone=weatherTimezone(data.timezone),temperatureUnit=units==='us'?'°F':'°C',windSpeedUnit=units==='us'?'mph':'km/h';
  const tempMin=units==='us'?-148:-100,tempMax=units==='us'?176:80;
  const temperature=(value,metadata,key)=>{
    if(value===null||value===undefined)return null;
    if(metadata?.[key]!==temperatureUnit)throw incompleteWeather();
    return boundedWeatherNumber(value,tempMin,tempMax);
  };
  const wind=(value,metadata)=>{
    if(value===null||value===undefined)return null;
    if(!(units==='us'?['mp/h','mph']:['km/h','kmh']).includes(metadata?.wind_speed_10m))throw incompleteWeather();
    return boundedWeatherNumber(value,0,units==='us'?310:500);
  };
  const probability=(value,metadata,key)=>{
    if(value===null||value===undefined)return null;
    if(metadata?.[key]!=='%')throw incompleteWeather();
    return boundedWeatherNumber(value,0,100);
  };
  for(const metadata of [data.current_units,data.daily_units,data.hourly_units])if(metadata?.time!==undefined&&metadata.time!=='iso8601')throw incompleteWeather();
  let current=null;
  if(data.current!==null&&data.current!==undefined){
    if(typeof data.current!=='object'||Array.isArray(data.current)||!validWeatherTime(data.current.time))throw incompleteWeather();
    const temperatureValue=temperature(data.current.temperature_2m,data.current_units,'temperature_2m');
    if(temperatureValue!==null)current={temperature:temperatureValue,feelsLike:temperature(data.current.apparent_temperature,data.current_units,'apparent_temperature'),windSpeed:wind(data.current.wind_speed_10m,data.current_units),code:weatherCode(data.current.weather_code),isDay:data.current.is_day===1?true:data.current.is_day===0?false:null};
  }
  if(mode==='current'&&!current)throw incompleteWeather();
  const updatedAt=validWeatherTime(data.current?.time)?data.current.time:localWeatherTime(timezone),today=updatedAt.slice(0,10);
  const dayData=data.daily,allDays=[];
  if(dayData!==null&&dayData!==undefined){
    if(!Array.isArray(dayData.time)||dayData.time.length>16||!Array.isArray(dayData.temperature_2m_max)||!Array.isArray(dayData.temperature_2m_min)||dayData.temperature_2m_max.length!==dayData.time.length||dayData.temperature_2m_min.length!==dayData.time.length)throw incompleteWeather();
    let previous='';
    for(let index=0;index<dayData.time.length;index++){
      const date=dayData.time[index];if(!validWeatherDate(date)||date<=previous||previous&&Date.parse(date+'T00:00:00Z')-Date.parse(previous+'T00:00:00Z')!==86400000)throw incompleteWeather();previous=date;
      const high=temperature(dayData.temperature_2m_max[index],data.daily_units,'temperature_2m_max'),low=temperature(dayData.temperature_2m_min[index],data.daily_units,'temperature_2m_min');
      if(high!==null&&low!==null&&high<low)throw incompleteWeather();
      allDays.push(high===null||low===null?null:{date,high,low,code:weatherCode(dayData.weather_code?.[index]),precipitationProbability:probability(dayData.precipitation_probability_max?.[index],data.daily_units,'precipitation_probability_max')});
    }
  }
  // The provider's daily array starts on today in its timezone. Validate dates
  // against that reference, then select tomorrow or the next calendar week.
  const reference=dayData?.time?.[0]||today;
  if(data.current&&reference!==today)throw incompleteWeather();
  let start=mode==='tomorrow'?1:0;
  if(mode==='week'&&period==='next-week'){
    const weekday=new Date(reference+'T00:00:00Z').getUTCDay();start=weekday===1?7:(8-weekday)%7;
  }
  const count=mode==='week'?7:1;
  const selectedDays=allDays.slice(start,start+count);
  if(['today','tomorrow','week'].includes(mode)&&(selectedDays.length!==count||selectedDays.some(day=>day===null)))throw incompleteWeather();
  const daily=selectedDays.filter(Boolean);
  const hourData=data.hourly,allHours=[];
  if(hourData!==null&&hourData!==undefined){
    if(!Array.isArray(hourData.time)||hourData.time.length>72||!Array.isArray(hourData.temperature_2m)||hourData.temperature_2m.length!==hourData.time.length)throw incompleteWeather();
    let previous='';
    for(let index=0;index<hourData.time.length;index++){
      const time=hourData.time[index];if(!validWeatherTime(time)||time<=previous)throw incompleteWeather();previous=time;
      const value=temperature(hourData.temperature_2m[index],data.hourly_units,'temperature_2m');
      allHours.push({time,temperature:value,code:weatherCode(hourData.weather_code?.[index]),precipitationProbability:probability(hourData.precipitation_probability?.[index],data.hourly_units,'precipitation_probability'),windSpeed:wind(hourData.wind_speed_10m?.[index],data.hourly_units),isDay:hourData.is_day?.[index]===1?true:hourData.is_day?.[index]===0?false:null});
    }
  }
  const currentHour=updatedAt.slice(0,13)+':00',targetDay=daily[0]?.date||today;
  const hourly=mode==='week'?[]:allHours.filter(hour=>hour.time>=currentHour&&(!['today','tomorrow'].includes(mode)||hour.time.slice(0,10)===targetDay)).slice(0,mode==='hourly'?hours:12);
  if(mode==='hourly'&&!hourly.some(hour=>hour.temperature!==null))throw incompleteWeather();
  return {version:1,units,temperatureUnit,windSpeedUnit,precipitationUnit:units==='us'?'inch':'mm',location,mode,timezone,updatedAt,current,daily,hourly};
}
export async function weather(request,signal){
  if(signal?.aborted)throw signal.reason||new DOMException('Weather request stopped.','AbortError');
  if(!request||typeof request!=='object'||Array.isArray(request))throw new WeatherError('WEATHER_REQUEST_INVALID','Ask for weather in a city or postal code, for example “weather in Tokyo, Japan”.');
  const mode=request.mode||'current',units=request.units===undefined?'us':request.units;
  if(request.hours!==undefined&&(![6,12,24].includes(request.hours)||mode!=='hourly'))throw new WeatherError('WEATHER_REQUEST_INVALID','Ask for the next 6, 12 or 24 hours.');
  if(!['us','metric'].includes(units))throw new WeatherError('WEATHER_REQUEST_INVALID','Choose U.S. or metric weather units.');
  if(!['current','today','tomorrow','week','hourly'].includes(mode)||request.period&&(request.period!=='next-week'||mode!=='week'))throw new WeatherError('WEATHER_REQUEST_INVALID','Ask for current weather, an hourly forecast, today, tomorrow, this week, or next week.');
  if(request.city!==undefined&&typeof request.city!=='string')throw new WeatherError('WEATHER_LOCATION_INVALID','Choose a valid city, postal code, or current location before requesting weather.');
  const city=request.city?.trim()||'';
  if(!city&&!request.location)return weatherClarification('WEATHER_LOCATION_REQUIRED','Which city or postal code should I check? Include the country, for example “19104, US” or “Tokyo, Japan”. You can also use your current location in Places & directions.');
  if(city.length>200||/[\u0000-\u001f\u007f]/.test(city))throw new WeatherError('WEATHER_LOCATION_INVALID','Choose a valid city or postal code of up to 200 characters.');
  let row;
  if(request.location){
    if(!validWeatherCoordinate(request.location))throw new WeatherError('WEATHER_LOCATION_INVALID','Choose a valid location before requesting weather.');
    row={latitude:request.location.latitude,longitude:request.location.longitude,label:String(request.location.label||'Selected location').slice(0,200)};
  }else{
    const {parts,country,postal}=weatherPlaceParts(city);
    if(!parts.length)return weatherClarification('WEATHER_LOCATION_REQUIRED','Which city or postal code should I check? Please include the country.');
    if(postal&&parts.length===1)return weatherClarification('WEATHER_COUNTRY_REQUIRED',`Which country is ${parts[0]} in? For example, “${parts[0]}, US”. Postal codes can occur in more than one country.`);
    const geo=new URL('https://geocoding-api.open-meteo.com/v1/search');
    geo.search=new URLSearchParams({name:parts[0],count:10,language:'en',format:'json',...(country?{countryCode:country}:{})});
    const places=await readWeatherJSON(geo,signal);
    if(!places||typeof places!=='object'||Array.isArray(places)||places.error||places.results!==undefined&&!Array.isArray(places.results))throw new WeatherError('WEATHER_LOCATION_UNAVAILABLE','The location service returned an incomplete answer. Try the city, region and country, or use your current location.');
    let rows=(places.results||[]).filter(validWeatherCoordinate);
    for(const part of parts.slice(1)){
      const aliases={us:'united states',usa:'united states',uk:'united kingdom',gb:'united kingdom'},needle=aliases[part.toLowerCase()]||part.toLowerCase();
      rows=rows.filter(item=>['country','country_code','admin1','admin2','admin3'].some(key=>String(item[key]||'').toLowerCase()===needle));
    }
    if(postal){const key=value=>String(value).toUpperCase().replace(/[\s-]/g,'');rows=rows.filter(item=>Array.isArray(item.postcodes)&&item.postcodes.some(code=>key(code)===key(parts[0])));}
    else {const exact=rows.filter(item=>typeof item.name==='string'&&item.name.toLowerCase()===parts[0].toLowerCase());if(exact.length)rows=exact;}
    rows=[...new Map(rows.map(item=>[`${item.latitude},${item.longitude}`,item])).values()];
    if(rows.length!==1)return weatherClarification(rows.length?'WEATHER_LOCATION_AMBIGUOUS':'WEATHER_LOCATION_NOT_FOUND',rows.length?`Which place do you mean? ${rows.slice(0,3).map(weatherName).join('; ')}. Include the region and country.`:`I couldn’t find ${city}. Please include the city, region and country, or select a place in Places & directions.`,[{title:'Open-Meteo locations',url:geo.href}]);
    row=rows[0];
  }
  const url=new URL('https://api.open-meteo.com/v1/forecast');
  url.search=new URLSearchParams({latitude:row.latitude,longitude:row.longitude,current:'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',hourly:'temperature_2m,weather_code,precipitation_probability,wind_speed_10m,is_day',temperature_unit:units==='us'?'fahrenheit':'celsius',wind_speed_unit:units==='us'?'mph':'kmh',precipitation_unit:units==='us'?'inch':'mm',timezone:'auto',forecast_days:mode==='week'?(request.period==='next-week'?14:7):2,forecast_hours:48});
  const data=await readWeatherJSON(url,signal);
  const weatherCard=weatherDataCard(data,{mode,units,period:request.period,location:weatherName(row),hours:request.hours});
  const {current,daily,hourly,temperatureUnit,windSpeedUnit}=weatherCard;
  const degrees=value=>`${Math.round(value)}${temperatureUnit}`;
  const range=values=>{const low=Math.min(...values),high=Math.max(...values);return low===high?degrees(low):`${Math.round(low)}–${degrees(high)}`;};
  const chance=value=>value===null?'':` Chance of precipitation: ${Math.round(value)}%.`;
  let text,condition,appearance={};
  if(mode==='current'){
    condition=current.code;
    const toC=value=>weatherNumber(units==='us'?(value-32)*5/9:value);
    appearance={tempC:toC(current.temperature),...(current.feelsLike===null?{}:{apparentC:toC(current.feelsLike)}),isDay:current.isDay};
    text=`${weatherName(row)}: ${degrees(current.temperature)}, ${conditionName(condition)}.`;
    if(current.feelsLike!==null)text+=` Feels like ${degrees(current.feelsLike)}.`;
    if(current.windSpeed!==null)text+=` Wind ${Math.round(current.windSpeed)} ${windSpeedUnit}.`;
    if(current.feelsLike===null||current.windSpeed===null||condition===null)text+=' Some weather details are temporarily unavailable.';
  }else if(mode==='hourly'){
    condition=hourly[0].code;
    const probabilities=hourly.map(item=>item.precipitationProbability).filter(value=>value!==null);
    text=`${weatherName(row)}, hourly outlook: ${range(hourly.map(item=>item.temperature).filter(value=>value!==null))}.`;
    if(probabilities.length)text+=` Precipitation chances up to ${Math.round(Math.max(...probabilities))}%.`;
  }else if(mode==='week'){
    condition=daily[0].code;
    text=`${weatherName(row)}, ${request.period==='next-week'?'next week':'7-day outlook'}: highs ${range(daily.map(item=>item.high))}, lows ${range(daily.map(item=>item.low))}.`;
  }else{
    const day=daily[0];condition=day.code;
    text=`${weatherName(row)}, ${mode}: ${conditionName(day.code)}, high ${degrees(day.high)}, low ${degrees(day.low)}.`+chance(day.precipitationProbability);
    if(day.precipitationProbability===null)text+=' Precipitation chance is unavailable.';
  }
  return {type:'weather',text,weatherCard,orbitWeather:{code:condition,source:'open-meteo',label:weatherName(row)+' · '+mode,...appearance},sources:[{title:'Open-Meteo weather data',url:request.location?.privateOrigin?'https://open-meteo.com/':url.href},{title:'Weather methodology',url:'https://open-meteo.com/en/docs'}]};
}
