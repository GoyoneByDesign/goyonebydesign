/* Source-first public research. No model, private history, credentials, arbitrary
 * page proxy, generated pictures, or article-body scraping is used here.
 * References: mediawiki.org/wiki/API:Imageinfo; mediawiki.org/wiki/Extension:PageImages;
 * blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/ (social images may be logos).
 */
const WIKI = 'https://en.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const GDELT = 'https://api.gdeltproject.org/api/v2/doc/doc';
const MAX_JSON_BYTES = 512 * 1024;
const MAX_CARD_BYTES = 9 * 1024;
const encoder = new TextEncoder();
const abortError = () => new DOMException('Research stopped.', 'AbortError');
const aborted = signal => { if (signal?.aborted) throw abortError(); };

export function researchText(value, limit=750) {
  if (typeof value !== 'string') return '';
  const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
  return value.slice(0,12000).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
    .replace(/<[^>]*>/g,' ').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(match,name)=>{
      if(name[0]!=='#')return entities[name.toLowerCase()]||match;
      const n=name[1].toLowerCase()==='x'?parseInt(name.slice(2),16):parseInt(name.slice(1),10);
      return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):'';
    }).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,' ')
    .replace(/\s+/g,' ').trim().slice(0,limit);
}

export function researchURL(value) {
  if(typeof value!=='string'||value.length>1400||/[\s\\\u0000-\u001f\u007f]/.test(value))return null;
  try{
    const url=new URL(value),host=url.hostname.toLowerCase().replace(/\.$/,'');
    if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')
      ||!host.includes('.')||/[:\[\]]/.test(host)||/^[\d.]+$/.test(host)
      ||/(^|\.)(localhost|local|localdomain|internal|invalid|test|example|lan|home|corp|onion)$/.test(host)
      ||host.endsWith('.home.arpa'))return null;
    url.hash='';return url.href;
  }catch{return null;}
}

function imageURL(value){
  const safe=researchURL(value);if(!safe)return null;
  return /\.(?:jpe?g|png|webp|avif)$/i.test(new URL(safe).pathname)?safe:null;
}
function iso(value){
  if(typeof value!=='string'||value.length>40)return null;
  const fields=/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.exec(value);
  if(!fields)return null;
  const [year,month,day,hour,minute,second]=fields.slice(1).map(Number);
  const days=[31,year%4===0&&(year%100!==0||year%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
  if(month<1||month>12||day<1||day>days[month-1]||hour>23||minute>59||second>59)return null;
  const time=Date.parse(value);return Number.isFinite(time)?new Date(time).toISOString():null;
}
function hostOf(url){return new URL(url).hostname.replace(/^www\./,'');}
function wikiURL(title){return 'https://en.wikipedia.org/wiki/'+encodeURIComponent(title.replace(/ /g,'_'));}
function commonsURL(filename){return 'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(filename.replace(/ /g,'_'));}
function titleKey(value){return researchText(value,180).normalize('NFKC').replace(/_/g,' ').replace(/\s+/g,' ').toLocaleLowerCase('en-US');}

function normalizeImage(value,parentURL,subject,{wiki=false}={}){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const url=imageURL(value.url),sourceUrl=researchURL(value.sourceUrl);
  if(!url||!sourceUrl)return null;
  if(wiki){
    const image=new URL(url),source=new URL(sourceUrl);
    if(image.hostname!=='upload.wikimedia.org'||!image.pathname.startsWith('/wikipedia/commons/')
      ||source.hostname!=='commons.wikimedia.org'||!source.pathname.startsWith('/wiki/File:'))return null;
  }else if(sourceUrl!==parentURL)return null;
  return {url,sourceUrl,subject:researchText(subject,180),
    caption:researchText(value.caption,220)|| (wiki?'Image associated with this Wikipedia article.':'Publisher sharing image; may be archival or a logo.'),
    artist:researchText(value.artist,160),license:researchText(value.license,100),
    licenseUrl:researchURL(value.licenseUrl)||'',imagePublisher:wiki?'Wikimedia Commons':hostOf(parentURL)};
}

/** Accept only bounded, display-safe research data for saved chat cards. */
export function normalizeResearch(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||!['news','topic'].includes(value.kind))return null;
  const query=researchText(value.query,300),checkedAt=iso(value.checkedAt);
  if(!query||!checkedAt)return null;
  const articles=[],seen=new Set();
  for(const row of (Array.isArray(value.articles)?value.articles:[]).slice(0,12)){
    if(!row||typeof row!=='object')continue;
    const url=researchURL(row.url),title=researchText(row.title,180);
    if(!url||!title||seen.has(url))continue;
    seen.add(url);articles.push({title,url,snippet:researchText(row.snippet,750),publisher:hostOf(url),
      publishedAt:iso(row.publishedAt),observedAt:iso(row.observedAt),image:normalizeImage(row.image,url,title)});
    if(articles.length===4)break;
  }
  let background=null;
  if(value.kind==='topic'&&value.background&&typeof value.background==='object'){
    const row=value.background,title=researchText(row.title,180),url=researchURL(row.url),summary=researchText(row.summary,1200);
    if(title&&url===wikiURL(title)&&summary){
      background={title,url,summary,source:'Wikipedia',image:normalizeImage(row.image,url,title,{wiki:true})};
    }
  }
  const result={version:1,kind:value.kind,query,checkedAt,provider:researchText(value.provider,80)||'Public sources',
    articles,background,notice:researchText(value.notice,450),complete:value.complete===true};
  const size=()=>encoder.encode(JSON.stringify(result)).byteLength;
  if(size()>MAX_CARD_BYTES)for(const row of result.articles)row.snippet=row.snippet.slice(0,240);
  if(size()>MAX_CARD_BYTES&&result.background)result.background.summary=result.background.summary.slice(0,600);
  for(let i=result.articles.length-1;i>=0&&size()>MAX_CARD_BYTES;i--)result.articles[i].image=null;
  if(size()>MAX_CARD_BYTES&&result.background)result.background.image=null;
  while(size()>MAX_CARD_BYTES&&result.articles.length>1)result.articles.pop();
  return size()<=MAX_CARD_BYTES?result:null;
}

function deadline(task,signal,milliseconds){
  const controller=new AbortController();let timer,abort;
  const stop=new Promise((_,reject)=>{
    abort=()=>{controller.abort();reject(abortError());};
    signal?.addEventListener('abort',abort,{once:true});
    if(signal?.aborted){abort();return;}
    timer=setTimeout(()=>{controller.abort();reject(Error('The public research source took too long.'));},milliseconds);
  });
  return Promise.race([stop,Promise.resolve().then(()=>{aborted(controller.signal);return task(controller.signal);})])
    .finally(()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);});
}

async function boundedJSON(response,signal){
  aborted(signal);
  if(!response?.ok||response.redirected||response.type==='opaque')throw Error('The public research source is unavailable.');
  const length=Number(response.headers?.get('Content-Length'));
  if(Number.isFinite(length)&&length>MAX_JSON_BYTES){await response.body?.cancel();throw Error('The public source returned too much data.');}
  if(!response.body?.getReader)throw Error('The research source returned an unreadable response.');
  const reader=response.body.getReader(),decoder=new TextDecoder();let text='',bytes=0;
  try{
    while(true){
      aborted(signal);const {value,done}=await reader.read();if(done)break;
      bytes+=value.byteLength;if(bytes>MAX_JSON_BYTES){await reader.cancel();throw Error('The public source returned too much data.');}
      text+=decoder.decode(value,{stream:true});
    }
    aborted(signal);return JSON.parse(text+decoder.decode());
  }finally{reader.releaseLock();}
}

async function publicJSON(endpoint,params,fetcher,signal){
  if(![WIKI,COMMONS,GDELT].includes(endpoint))throw Error('Unsupported research source.');
  const url=new URL(endpoint);for(const [key,value]of Object.entries(params))url.searchParams.set(key,String(value));
  const response=await fetcher(url.href,{method:'GET',mode:'cors',credentials:'omit',cache:'no-store',
    referrerPolicy:'no-referrer',redirect:'error',signal,headers:{Accept:'application/json'}});
  return boundedJSON(response,signal);
}

export function topicSubject(value){
  return researchText(value,300).replace(/^(?:please\s+)?(?:who\s+(?:is|was|are)|what\s+(?:is|was|are)|tell\s+me\s+(?:more\s+)?about|(?:show|find|give)(?:\s+me)?\s+(?:information|details|facts|photos|pictures)\s+(?:about|of|on)|information\s+(?:about|on))\s+/i,'')
    .replace(/[?.!]+$/g,'').trim().slice(0,140);
}

function matchedPage(data,subject){
  const rows=data?.query?.pages;if(!Array.isArray(rows)||rows.length!==1)return null;
  const page=rows[0];if(!page||page.ns!==0||!Number.isSafeInteger(page.pageid)||page.pageid<=0||page.missing||!page.title)return null;
  if(page.pageprops&&Object.hasOwn(page.pageprops,'disambiguation'))return null;
  let current=titleKey(subject);const target=titleKey(page.title);
  for(const group of [data.query.normalized,data.query.converted,data.query.redirects]){
    for(const row of (Array.isArray(group)?group:[]).slice(0,5)){
      if(titleKey(row.from)===current)current=titleKey(row.to);
    }
  }
  return current===target?page:null;
}

async function wikipediaBackground(subject,fetcher,signal,onBackground=()=>{},includeImages=true){
  if(!subject||subject.length>140||/[|\u0000-\u001f]/.test(subject))return null;
  const data=await publicJSON(WIKI,{action:'query',format:'json',formatversion:2,origin:'*',titles:subject,
    redirects:1,prop:'pageimages|extracts|pageprops|info',inprop:'url',exintro:1,explaintext:1,exsentences:4,
    piprop:'name|thumbnail',pithumbsize:640,pilicense:'free',ppprop:'disambiguation'},fetcher,signal);
  const page=matchedPage(data,subject);if(!page)return null;
  const title=researchText(page.title,180),summary=researchText(page.extract,1200);
  if(!summary)return null;
  const result={title,url:wikiURL(title),summary,source:'Wikipedia',image:null};
  onBackground(result);
  if(!includeImages)return result;
  if(typeof page.pageimage!=='string'||page.pageimage.length>300||/[|\u0000-\u001f]/.test(page.pageimage))return result;
  try{
    const imageData=await publicJSON(COMMONS,{action:'query',format:'json',formatversion:2,origin:'*',
      titles:'File:'+page.pageimage,prop:'imageinfo',iiprop:'url|extmetadata|mime|thumbmime',iiurlwidth:640,
      iiextmetadatalanguage:'en',iiextmetadatafilter:'Artist|Attribution|Credit|LicenseShortName|LicenseUrl|ImageDescription'},fetcher,signal);
    const imagePage=imageData?.query?.pages?.[0],info=imagePage?.imageinfo?.[0];
    if(!info||imagePage.ns!==6||titleKey(imagePage.title)!==titleKey('File:'+page.pageimage)
      ||!/^image\/(?:jpeg|png|webp|avif)$/.test(info.thumbmime||info.mime||''))return result;
    const meta=info.extmetadata||{},license=researchText(meta.LicenseShortName?.value,100);
    if(!license)return result;
    const licenseValue=String(meta.LicenseUrl?.value||'').replace(/^http:\/\/creativecommons\.org\//,'https://creativecommons.org/');
    result.image=normalizeImage({url:info.thumburl||info.url,sourceUrl:commonsURL(page.pageimage),
      caption:researchText(meta.ImageDescription?.value,220)||'Image associated with the Wikipedia article '+title+'.',
      artist:researchText(meta.Attribution?.value||meta.Artist?.value||meta.Credit?.value,160),license,
      licenseUrl:researchURL(licenseValue)||''},result.url,title,{wiki:true});
  }catch(error){aborted(signal);/* A missing image must not hide the sourced background. */}
  return result;
}

function gdeltDate(value){
  const match=/^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z$/.exec(String(value||''));
  return match?iso(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`):null;
}
function newsTopic(value){
  return researchText(value,240).replace(/^(?:please\s+)?(?:(?:what(?:'s| is| are)?|show me|give me|find me|tell me)\s+)?(?:the\s+)?(?:latest\s+|current\s+|breaking\s+|today'?s?\s+)?(?:news|headlines|updates)(?:\s+(?:about|on|for|in))?\s*/i,'')
    .replace(/[^\p{L}\p{N}\s'-]/gu,' ').replace(/\s+/g,' ').trim().slice(0,100);
}
async function gdeltNews(query,fetcher,signal){
  const topic=newsTopic(query),phrase=topic?`"${topic}" sourcelang:english`:'(world OR economy OR technology) sourcelang:english';
  const data=await publicJSON(GDELT,{query:phrase,mode:'artlist',format:'json',maxrecords:4,sort:'datedesc',timespan:'1d'},fetcher,signal);
  return {provider:'GDELT news index',articles:(Array.isArray(data?.articles)?data.articles:[]).slice(0,4).flatMap(row=>{
    const url=researchURL(row?.url),title=researchText(row?.title,180);if(!url||!title)return [];
    return [{title,url,snippet:'',publishedAt:null,observedAt:gdeltDate(row.seendate),
      image:normalizeImage({url:row.socialimage,sourceUrl:url,caption:'Publisher sharing image; may be archival or a logo.'},url,title)}];
  })};
}

/** search(query, signal) uses MAX-G's existing transport. Optional
 * newsFetcher(query,{signal}) can provide a fixed-publisher RSS adapter instead
 * of GDELT. Both are independent of local language-model loading. lookup with
 * includeImages:false skips photo metadata and bounds optional-source waiting
 * after usable search/news evidence; full article cards remain the default.
 */
export function createResearch({search,newsFetcher,fetcher=globalThis.fetch?.bind(globalThis),now=()=>Date.now(),
  searchTimeoutMs=8000,newsTimeoutMs=5000,topicTimeoutMs=5000,enrichmentGraceMs=1000,conversationGraceMs=180}={}){
  if(typeof search!=='function')throw TypeError('Supply MAX-G’s public search adapter.');
  const cache=new Map(),runs=new Set();let generation=0;
  return {
    clear(){generation++;cache.clear();for(const cancel of runs)cancel();},
    async lookup(rawQuery,{mode='topic',subject='',signal,onPartial=()=>{},includeImages=true}={}){
      const query=researchText(rawQuery,300);if(!query||!['news','topic'].includes(mode))throw Error('Enter a news topic, person, or item to research.');
      aborted(signal);const turn=generation,searchController=new AbortController(),extraController=new AbortController();
      const cancel=()=>{searchController.abort();extraController.abort();};runs.add(cancel);
      signal?.addEventListener('abort',cancel,{once:true});
      let finished=false,graceTimer,markEnriched;
      const enriched=new Promise(resolve=>{markEnriched=resolve;});
      const value={version:1,kind:mode,query,checkedAt:new Date(now()).toISOString(),provider:'Public sources',
        articles:[],background:null,notice:'',complete:false};
      let searchRows=[],newsRows=[],searchProvider='',newsProvider='';
      const active=()=>{aborted(signal);if(finished||turn!==generation)throw abortError();};
      const emit=()=>{active();const clean=normalizeResearch(value);if(clean)onPartial(structuredClone(clean));};
      const merge=()=>{
        value.articles=mode==='news'&&newsRows.length?newsRows:searchRows;
        value.provider=mode==='news'&&newsRows.length?newsProvider:searchProvider||'Public sources';
        if(mode==='news')value.notice=newsRows.length?'Open the original articles for full reporting. Sharing images may be archival or publisher logos.':'Web search matches; checking current news sources.';
      };
      const searchTask=deadline(async inner=>{
        const data=await search(mode==='news'&&!/\bnews\b/i.test(query)?query+' latest news':query,inner);
        active();aborted(inner);searchRows=normalizeResearch({...value,articles:Array.isArray(data?.results)?data.results:[]})?.articles||[];
        searchProvider=researchText(data?.provider,40)||'Web search';merge();emit();
        if(!includeImages&&searchRows.length)markEnriched();
      },searchController.signal,searchTimeoutMs).catch(error=>{if(error?.name==='AbortError'&&signal?.aborted)throw error;});
      let extraTask;
      if(mode==='news'){
        extraTask=deadline(async inner=>{
          const data=typeof newsFetcher==='function'?await newsFetcher(query,{signal:inner}):await gdeltNews(query,fetcher,inner);
          active();aborted(inner);newsRows=normalizeResearch({...value,articles:Array.isArray(data?.articles)?data.articles:(Array.isArray(data?.results)?data.results:[])})?.articles||[];
          newsProvider=researchText(data?.provider,40)||'News sources';merge();emit();if(newsRows.length)markEnriched();
        },extraController.signal,newsTimeoutMs).catch(error=>{if(error?.name==='AbortError'&&signal?.aborted)throw error;});
      }else{
        extraTask=deadline(async inner=>{
          // A text-only lookup must not cache away a later request for photos.
          const topic=topicSubject(subject||query),key=(includeImages?'full:':'text:')+titleKey(topic),hit=cache.get(key),time=now();
          const background=hit&&time-hit.time>=0&&time-hit.time<600000?structuredClone(hit.value):await wikipediaBackground(topic,fetcher,inner,early=>{
            active();aborted(inner);value.background=early;emit();
          },includeImages);
          active();aborted(inner);value.background=background;
          if(background){cache.set(key,{time,value:structuredClone(background)});while(cache.size>8)cache.delete(cache.keys().next().value);emit();if(includeImages&&background.image)markEnriched();}
        },extraController.signal,topicTimeoutMs).catch(error=>{if(error?.name==='AbortError'&&signal?.aborted)throw error;});
      }
      try{
        // Conversational answers use current search evidence as soon as it is
        // ready; photos and other optional enrichment must not delay speech.
        // Encyclopedia text alone never cuts short a pending fresh search.
        // Full article cards retain the longer photo/news enrichment grace.
        const grace=enriched.then(()=>new Promise(resolve=>{graceTimer=setTimeout(resolve,includeImages?enrichmentGraceMs:conversationGraceMs);}));
        await Promise.race([Promise.all([searchTask,extraTask]),grace]);active();value.complete=true;
        value.notice=mode==='news'?(newsRows.length?'Open the original articles for full reporting. Sharing images may be archival or publisher logos.':'Live web search results. Article publication dates and sharing images were not independently available.')
          :'Wikipedia is background information. Check the linked original sources for current details.';
        const result=normalizeResearch(value);
        if(!result||!result.articles.length&&!result.background)throw Error('I could not retrieve reliable sources for that question. Please try again or make the topic more specific.');
        onPartial(structuredClone(result));active();return result;
      }finally{
        finished=true;clearTimeout(graceTimer);cancel();runs.delete(cancel);signal?.removeEventListener('abort',cancel);
      }
    },
  };
}
