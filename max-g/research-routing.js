/** Public research policy and an immediate, extractive answer independent of model startup. */
import {searchBeforeReply} from './answer-routing.js';
import {normalizeResearch} from './research.js';

export function researchPlan(query,{onlineFirst=true,explicit=false,personal=false,hasFiles=false}={}) {
  const text=String(query).trim();
  // Selected files, personal conversations, credentials and street addresses are
  // never silently turned into public research queries.
  if(hasFiles||personal||text.length>500||/\b(?:my|our|password|secret|token|inbox|ssn|credit card)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|```|\b\d{1,6}\s+(?:[\p{L}\d.'’-]+\s+){1,6}(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct)\b/iu.test(text))return null;
  if(!searchBeforeReply(text,{onlineFirst,explicit,personal,hasFiles}))return null;
  return {query:text,mode:/\b(?:news|headlines|breaking)\b/i.test(text)?'news':'topic'};
}

export function researchSources(value) {
  const data=normalizeResearch(value);if(!data)return [];
  const rows=data.articles.map(({title,url,snippet})=>({title,url,snippet}));
  if(data.background)rows.unshift({title:data.background.title,url:data.background.url,snippet:data.background.summary});
  return rows.slice(0,4);
}

export function researchAnswer(value) {
  const data=normalizeResearch(value);if(!data)return '';
  if(data.background)return `${data.background.summary}\n\nBackground from Wikipedia. See the source cards for pictures and original articles.`;
  if(!data.articles.length)return '';
  const dated=data.kind==='news'&&data.articles.some(row=>row.publishedAt);
  const intro=dated?'Here are recent headlines from the publishers below.':data.kind==='news'?'Here are web search matches. I could not verify their publication dates.':'Here is what the linked sources report:';
  return intro+'\n\n'+data.articles.map((row,i)=>`${i+1}. ${row.title}${row.snippet?'\n'+row.snippet:''}`).join('\n\n');
}
