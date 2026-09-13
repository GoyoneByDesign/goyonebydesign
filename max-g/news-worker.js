/** Public, fixed-source RSS news. Never fetches a URL supplied by a caller,
 * article, image, or feed body. Queries are filtered inside this Worker only. */
import {allowedOrigins,normalizeQuery,plainText,safeResultURL,readBounded,SearchError} from './worker.js';
const MAX_BYTES=256*1024,MAX_ARTICLES=6,MAX_ITEMS=80,FEED_TIMEOUT=3500;
const BBC='https://feeds.bbci.co.uk/',SKY='https://feeds.skynews.com/feeds/rss/';
const feed=(publisher,url)=>Object.freeze({publisher,url});
export const NEWS_FEEDS=Object.freeze({
 world:Object.freeze([feed('BBC News',BBC+'news/world/rss.xml'),feed('Sky News',SKY+'world.xml')]),
 us:Object.freeze([feed('Sky News',SKY+'us.xml')]),
 general:Object.freeze([feed('BBC News',BBC+'news/world/rss.xml'),feed('BBC News',BBC+'news/world/us_and_canada/rss.xml'),feed('Sky News',SKY+'world.xml')]),
 technology:Object.freeze([feed('BBC News',BBC+'news/technology/rss.xml'),feed('Sky News',SKY+'technology.xml')]),
 business:Object.freeze([feed('BBC News',BBC+'news/business/rss.xml'),feed('Sky News',SKY+'business.xml')]),
 sports:Object.freeze([feed('BBC Sport',BBC+'sport/rss.xml')]),
 science:Object.freeze([feed('BBC News',BBC+'news/science_and_environment/rss.xml')]),
 entertainment:Object.freeze([feed('BBC News',BBC+'news/entertainment_and_arts/rss.xml'),feed('Sky News',SKY+'entertainment.xml')]),
});
const ALLOWED_FEEDS=new Set(Object.values(NEWS_FEEDS).flat().map(value=>value.url));
const fieldNames=new Set(['title','description','link','pubdate','media:description','media:credit']);
const folded=value=>String(value).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
const words=value=>folded(value).match(/[\p{L}\p{N}]+/gu)||[];
const clean=(value,limit)=>plainText(String(value||'').replace(/<[^>]*>/g,' '),limit).replace(/\s+([,.!?;:])/g,'$1');
const categoryNames={tech:'technology',technology:'technology',business:'business',finance:'business',sports:'sports',sport:'sports',science:'science',scientific:'science',entertainment:'entertainment',arts:'entertainment'};
const noise=new Set('what whats is are the latest recent current breaking today todays news headline headlines update updates show me tell give please about on in for of from around worldwide happening going now any can could you a an this week with and get find read some us'.split(' '));
export function newsSelection(query){
 const normalized=normalizeQuery(query),lower=folded(normalized).replace(/what['’]s/g,'whats').replace(/today['’]s/g,'todays');
 const us=/\b(?:united states|usa|u\.s\.(?:a\.)?|american|america)\b/i.test(normalized)||/\b(?:us news|news (?:in|from|about) (?:the )?us)\b/i.test(normalized);
 let remainder=lower.replace(/\b(?:united states|usa|u\.s\.(?:a\.)?|american|america)\b/g,' ');
 const tokens=words(remainder);let category=tokens.map(word=>categoryNames[word]).find(Boolean)||'';
 if(!category&&tokens.some(word=>['ai','artificial','intelligence','software','computers'].includes(word)))category='technology';
 if(!category&&tokens.includes('market')&&tokens.includes('stock'))category='business';
 const worldwide=tokens.includes('world')||tokens.includes('global');
 const terms=[...new Set(tokens.filter(word=>!noise.has(word)&&!categoryNames[word]&&!['world','global','bbc','sky'].includes(word)))];
 const topic=us&&!category?'us':category||(worldwide?'world':'general');
 let feeds=NEWS_FEEDS[topic];
 if(tokens.includes('bbc'))feeds=feeds.filter(value=>value.publisher.startsWith('BBC'));
 if(tokens.includes('sky'))feeds=feeds.filter(value=>value.publisher==='Sky News');
 // An unsupported source/category combination stays empty; never substitute a
 // different publisher or return unrelated general headlines.
 return {query:normalized,topic,terms,feeds,maxAgeMs:(/\bweek\b/.test(lower)||category?7:3)*86400000};
}
function attributes(raw){
 const values={};let count=0;
 for(const match of raw.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)){
  if(++count>32)break;const key=match[1].toLowerCase();if(!Object.hasOwn(values,key))values[key]=plainText(match[2]??match[3],2048);
 }
 return values;
}
function articleURL(value,publisher){
 const result=safeResultURL(plainText(value||'',2048));if(!result)return null;
 const url=new URL(result),bbc=publisher.startsWith('BBC');
 if(bbc?!['www.bbc.co.uk','www.bbc.com','bbc.co.uk','bbc.com'].includes(url.hostname):url.hostname!=='news.sky.com')return null;
 if(bbc?!/^\/(?:news|sport)\//.test(url.pathname):!/^\/story\//.test(url.pathname))return null;
 return result;
}
function imageURL(value,publisher){
 const result=safeResultURL(value);if(!result)return null;
 const host=new URL(result).hostname;
 return publisher.startsWith('BBC')?(['ichef.bbci.co.uk','images.bbci.co.uk'].includes(host)?result:null):(/^e\d+\.365dm\.com$/.test(host)?result:null);
}
function parsedArticle(row,publisher,now){
 const title=clean(row.fields.title,220),url=articleURL(row.fields.link,publisher),published=Date.parse(plainText(row.fields.pubdate||'',120));
 if(!title||!url||!Number.isFinite(published)||published>now+5*60*1000)return null;
 const snippet=clean(row.fields.description,500),rawImage=row.media.find(value=>imageURL(value.url,publisher));
 let image=null;
 if(rawImage){
  const description=clean(row.fields['media:description'],400),credit=clean(row.fields['media:credit'],100)||description.match(/\b(?:pic(?:ture)?s?|photos?|images?)\s*:\s*([^.;]{1,100})/i)?.[1]?.trim()||publisher;
  image={url:imageURL(rawImage.url,publisher),sourceUrl:url,caption:description?`${description} — Publisher image; may be archival.`:`Image supplied with this ${publisher} article; it may be archival.`,imagePublisher:credit};
 }
 return {title,url,snippet,publisher,publishedAt:new Date(published).toISOString(),image};
}
/** Small RSS field tokenizer, bounded before parsing. CDATA is a single text
 * token, never markup; DTD/entity declarations and malformed nesting fail closed.
 * Plain text fields/entity references are decoded exactly once at the boundary. */
export function parseNewsRSS(xml,publisher,{now=Date.now()}={}){
 if(typeof xml!=='string'||new TextEncoder().encode(xml).byteLength>MAX_BYTES)throw new SearchError('NEWS_TOO_LARGE','The news feed exceeded its size limit.');
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new SearchError('NEWS_FORMAT','Unsupported news feed declarations.');
 const stack=[],rows=[];let row=null,collect=null,rss=false,channel=false;
 const pattern=/<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<((?:[^>"']|"[^"]*"|'[^']*')+)>|([^<]+)/g;
 for(const token of xml.matchAll(pattern)){
  if(token[1]!==undefined||token[3]!==undefined){if(collect&&collect.text.length<8192)collect.text+=(token[1]??token[3]).slice(0,8192-collect.text.length);continue;}
  if(!token[2]||token[2].startsWith('?'))continue;
  const raw=token[2],closing=raw.startsWith('/'),match=raw.match(/^\/?([\w:.-]+)/);if(!match)throw new SearchError('NEWS_FORMAT','The news feed contains invalid markup.');
  const name=match[1].toLowerCase();
  if(closing){
   if(stack.at(-1)!==name)throw new SearchError('NEWS_FORMAT','The news feed is incomplete.');
   if(collect?.depth===stack.length){row.fields[collect.name]??=collect.text;collect=null;}
   if(name==='item'&&row?.depth===stack.length){if(rows.length<MAX_ITEMS)rows.push(row);row=null;}
   stack.pop();continue;
  }
  if(stack.length>24)throw new SearchError('NEWS_FORMAT','The news feed is too deeply nested.');
  if(name==='rss')rss=true;if(name==='channel')channel=true;
  const selfClosing=/\/\s*$/.test(raw),depth=stack.length+1;
  if(name==='item'){if(row)throw new SearchError('NEWS_FORMAT','Nested news items are unsupported.');row={depth,fields:{},media:[]};}
  if(row&&fieldNames.has(name)&&depth===row.depth+1&&!selfClosing&&!collect)collect={name,depth,text:''};
  if(row&&['media:thumbnail','media:content','enclosure'].includes(name)&&row.media.length<6){const attrs=attributes(raw);if(name!=='enclosure'||/^image\//i.test(attrs.type||''))row.media.push(attrs);}
  if(!selfClosing)stack.push(name);
 }
 if(stack.length||!rss||!channel)throw new SearchError('NEWS_FORMAT','The news feed is incomplete or unsupported.');
 return rows.map(value=>parsedArticle(value,publisher,now)).filter(Boolean);
}
function matchesTopic(article,terms){
 const tokens=new Set(words(`${article.title} ${article.snippet}`));
 return terms.every(term=>term==='ai'?tokens.has('ai')||(tokens.has('artificial')&&tokens.has('intelligence')):tokens.has(term)||term.endsWith('s')&&tokens.has(term.slice(0,-1)));
}
export function selectNewsArticles(rows,selection,{now=Date.now()}={}){
 const seen=new Set();return rows.filter(article=>{
  if(Date.parse(article.publishedAt)<now-selection.maxAgeMs||!matchesTopic(article,selection.terms)||seen.has(article.url))return false;
  seen.add(article.url);return true;
 }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,MAX_ARTICLES);
}
function json(value,status,origin,headers={}){
 return new Response(value===null?null:JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0','Vary':'Origin','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...(origin?{'Access-Control-Allow-Origin':origin}:{}),...headers}});
}
export function newsOrigins(env={}){return new Set([...allowedOrigins(env),'http://127.0.0.1:8767','http://localhost:8767']);}
async function fetchFeed(feed,fetcher,signal,now){
 if(!ALLOWED_FEEDS.has(feed.url))throw new SearchError('NEWS_SOURCE','Unsupported news source.');
 // Workers supports manual/follow redirect handling. Reject every 3xx below;
 // redirect:'error' itself throws in workerd before an HTTP request is sent.
 const response=await fetcher(feed.url,{method:'GET',redirect:'manual',credentials:'omit',signal,headers:{Accept:'application/rss+xml, application/xml, text/xml','User-Agent':'MAX-G-News/1.0 (+https://www.goyonebydesign.com/max-g/)'},cf:{cacheTtl:60,cacheEverything:true}});
 if(!response.ok||response.redirected){await response.body?.cancel();const error=new SearchError('NEWS_UPSTREAM','A news publisher is temporarily unavailable.');error.upstreamStatus=response.status;throw error;}
 if(!/(?:rss\+xml|application\/xml|text\/xml)/i.test(response.headers.get('content-type')||'')){await response.body?.cancel();throw new SearchError('NEWS_FORMAT','A news publisher returned an unsupported format.');}
 return parseNewsRSS(await readBounded(response,MAX_BYTES),feed.publisher,{now});
}
function abortBounded(promise,signal){
 return new Promise((resolve,reject)=>{
  const abort=()=>{signal.removeEventListener('abort',abort);reject(new SearchError('NEWS_TIMEOUT','News took too long. Please try again.',504));};
  signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
  Promise.resolve(promise).then(value=>{signal.removeEventListener('abort',abort);resolve(value);},error=>{signal.removeEventListener('abort',abort);reject(error);});
 });
}
export function createNewsHandler({fetcher=globalThis.fetch,timeoutMs=FEED_TIMEOUT,now=()=>Date.now()}={}){
 return async(request,env={})=>{
  const url=new URL(request.url),origin=request.headers.get('Origin'),allowed=newsOrigins(env).has(origin)?origin:null;
  if(!allowed)return json({error:'ORIGIN_DENIED',message:'This origin cannot use MAX-G news.'},403,null);
  if(url.pathname!=='/news')return json({error:'NOT_FOUND',message:'Use /news?q=your+topic.'},404,allowed);
  if(request.method==='OPTIONS'){
   const headers=(request.headers.get('Access-Control-Request-Headers')||'').toLowerCase().split(',').map(value=>value.trim()).filter(Boolean);
   if(request.headers.get('Access-Control-Request-Method')!=='GET'||headers.some(value=>!['accept','content-type'].includes(value)))return json({error:'PREFLIGHT_DENIED',message:'Only public GET news requests are supported.'},403,allowed);
   return json(null,204,allowed,{'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept, Content-Type','Access-Control-Max-Age':'600'});
  }
  if(request.method!=='GET')return json({error:'METHOD_NOT_ALLOWED',message:'Only GET news requests are supported.'},405,allowed,{Allow:'GET, OPTIONS'});
  try{
   if([...url.searchParams.keys()].some(key=>key!=='q')||url.searchParams.getAll('q').length!==1)throw new SearchError('INVALID_QUERY','Supply exactly one q parameter; custom feed URLs are not supported.',400);
   const selection=newsSelection(url.searchParams.get('q'));
   if(!env.SEARCH_RATE_LIMIT?.limit)throw new SearchError('RATE_LIMIT_UNAVAILABLE','News is temporarily unavailable until its existing request limit is configured.',503);
   if(request.signal.aborted)throw new SearchError('NEWS_TIMEOUT','The news request was cancelled.',504);
   const limitController=new AbortController(),cancelLimit=()=>limitController.abort();request.signal.addEventListener('abort',cancelLimit,{once:true});
   const limitTimer=setTimeout(cancelLimit,Math.min(timeoutMs,500));let allowance;
   try{allowance=await abortBounded(Promise.resolve().then(()=>env.SEARCH_RATE_LIMIT.limit({key:'max-g-search'})),limitController.signal);}
   finally{clearTimeout(limitTimer);request.signal.removeEventListener('abort',cancelLimit);}
   if(!allowance.success)throw new SearchError('RATE_LIMITED','News is busy. Please wait a minute and try again.',429);
   const controller=new AbortController(),abort=()=>controller.abort();request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)abort();
   const timer=setTimeout(abort,timeoutMs),timestamp=now();
   try{
    if(controller.signal.aborted)throw new SearchError('NEWS_TIMEOUT','The news request was cancelled.',504);
    const outcomes=await Promise.allSettled(selection.feeds.map(feed=>abortBounded(fetchFeed(feed,fetcher,controller.signal,timestamp),controller.signal)));
    const successful=outcomes.filter(value=>value.status==='fulfilled');
    if(!successful.length&&selection.feeds.length){
     const error=new SearchError(controller.signal.aborted?'NEWS_TIMEOUT':'NEWS_UNAVAILABLE',controller.signal.aborted?'News took too long. Please try again.':'The selected news feeds are unavailable. Please try again shortly.',controller.signal.aborted?504:502);
     // These are fixed public publishers and a closed set of failure categories.
     // Never expose upstream response bodies, arbitrary messages, headers or query.
     error.upstreamFailures=outcomes.map((value,index)=>({publisher:selection.feeds[index].publisher,code:value.reason instanceof SearchError?value.reason.code:'NEWS_FETCH_FAILED',errorClass:value.reason instanceof SearchError?'SearchError':value.reason instanceof TypeError?'TypeError':value.reason?.name==='AbortError'?'AbortError':'Error',...(Number.isInteger(value.reason?.upstreamStatus)?{status:value.reason.upstreamStatus}:{}),...(value.reason instanceof SearchError?{message:value.reason.message}:{})}));
     throw error;
    }
    const articles=selectNewsArticles(successful.flatMap(value=>value.value),selection,{now:timestamp});
    return json({articles,provider:'BBC News / Sky News RSS',timestamp:new Date(timestamp).toISOString()},200,allowed);
   }finally{clearTimeout(timer);request.signal.removeEventListener('abort',abort);}
  }catch(error){const known=error instanceof SearchError,status=known?error.status:502;return json({error:known?error.code:'NEWS_UNAVAILABLE',message:known?error.message:'News could not connect. Please try again shortly.',...(known&&error.upstreamFailures?{upstreamFailures:error.upstreamFailures}:{})},status,allowed,status===429?{'Retry-After':'60'}:{});}
 };
}
export const handleNews=(request,env)=>createNewsHandler()(request,env);
