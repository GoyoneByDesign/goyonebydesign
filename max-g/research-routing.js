/** Public research policy and an immediate, extractive answer independent of model startup. */
import {searchBeforeReply} from './answer-routing.js';
import {normalizeResearch} from './research.js';

export function researchPlan(query,{onlineFirst=false,explicit=false,personal=false,hasFiles=false}={}) {
  const text=String(query).trim();
  // Selected files, personal conversations, credentials and street addresses are
  // never silently turned into public research queries.
  if(hasFiles||personal||text.length>500||/\b(?:my|our|password|secret|token|inbox|ssn|credit card)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|```|\b\d{1,6}\s+(?:[\p{L}\d.'’-]+\s+){1,6}(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct)\b/iu.test(text))return null;
  if(!searchBeforeReply(text,{onlineFirst,explicit,personal,hasFiles}))return null;
  return {query:text,mode:/\b(?:news|headlines|breaking)\b/i.test(text)?'news':'topic'};
}

/** Evidence may be fetched silently; a visual source collection is always opt-in. */
export function requestsArticles(value){
  const text=String(value||'').trim().replace(/[’]/gu,"'");
  const media='(?:articles?|sources?|photos?|pictures?|images?|links?|search results|headlines)';
  if(/\b(?:do not|don't|never|stop)\b[^.!?\n]{0,35}\b(?:show|display|give|list|send|articles?|photos?|pictures?|images?|sources?)\b/iu.test(text)
    || new RegExp('\\b(?:no|without|hide)\\s+(?:any\\s+|the\\s+|those\\s+)?'+media,'iu').test(text))return false;
  return /^\/(?:research|search)\s+\S/iu.test(text)
    || new RegExp('\\b(?:show|display|list|give|find|bring|pull up|see)\\b[^.!?\\n]{0,45}\\b'+media+'\\b','iu').test(text)
    || /^(?:(?:some|more)\s+)?(?:articles?|sources?|photos?|pictures?|images?|links?)\s+(?:about|of|on|for)\b/iu.test(text)
    || /^(?:show (?:me )?(?:the )?)?(?:articles|sources|photos|pictures|images|links|search results)[.!?]*$/iu.test(text);
}

export function researchSources(value) {
  const data=normalizeResearch(value);if(!data)return [];
  const rows=data.articles.map(({title,url,snippet})=>({title,url,snippet}));
  if(data.background)rows.unshift({title:data.background.title,url:data.background.url,snippet:data.background.summary});
  return rows.slice(0,4);
}

export function researchAnswer(value,{conversational=false}={}) {
  const data=normalizeResearch(value);if(!data)return '';
  if(conversational){
    const excerpt=text=>{const clean=String(text||'').replace(/\s+/gu,' ').trim();if(clean.length<=420)return clean;const short=clean.slice(0,420);const end=short.search(/[.!?][^.!?]*$/u);return end>100?short.slice(0,end+1):short.replace(/\s+\S*$/u,'')+'…';};
    if(data.background)return excerpt(data.background.summary);
    if(!data.articles.length)return '';
    const lines=data.articles.slice(0,2).map(row=>excerpt(row.snippet||row.title));
    const uncertainty=data.kind==='news'&&!data.articles.some(row=>row.publishedAt)?' I couldn’t verify when these reports were published.':'';
    return 'From the sources I found: '+lines.join(' ')+uncertainty;
  }
  if(data.background)return `${data.background.summary}\n\nBackground from Wikipedia. See the source cards for pictures and original articles.`;
  if(!data.articles.length)return '';
  const dated=data.kind==='news'&&data.articles.some(row=>row.publishedAt);
  const intro=dated?'Here are recent headlines from the publishers below.':data.kind==='news'?'Here are web search matches. I could not verify their publication dates.':'Here is what the linked sources report:';
  return intro+'\n\n'+data.articles.map((row,i)=>`${i+1}. ${row.title}${row.snippet?'\n'+row.snippet:''}`).join('\n\n');
}
