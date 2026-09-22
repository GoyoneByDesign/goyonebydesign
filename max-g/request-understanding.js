/** Conservative interpretation for short, read-only requests. Original chat text stays with the caller. */
export const REQUEST_CONTEXT_TTL = 5 * 60 * 1000;
const MAX_QUERY = 3000, MAX_TOPIC = 100;
const PROTECTED = /https?:\/\/|www\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|```|`[^`]*`|[{};]|=>|===|\$\(|\n|"[^"]*"|“[^”]*”|(?:^|\s)'[^']+'(?:$|[\s.!?,])/i;
const CODE = /^(?:import\s|from\s.+\simport\s|def\s|class\s|const\s|let\s|function\s|select\s.+\sfrom\s|curl\s|sudo\s|#!)/i;
const ADDRESS = /\b\d{1,6}\s+(?:[\p{L}\d.'’-]+\s+){1,6}(?:st(?:reet)?|ave(?:nue)?|rd|road|blvd|boulevard|dr(?:ive)?|lane|ln|court|ct|way|pl(?:ace)?|pkwy|parkway)\b/iu;
const PRIVATE = /\b(?:my|mine|our|password|secret|token|account|email|inbox|address|ssn|social security|credit card)\b/i;
const ACTION = /^(?:open|close|launch|send|delete|erase|reset|buy|purchase|order|book|call|text|email|upload|download|install|uninstall|turn|restart|shutdown|shut|play|sing|dance|run|execute|write|create|build)\b/i;
const REPAIRS = Object.freeze({wheather:'weather',wether:'weather',wather:'weather',weahter:'weather',waether:'weather',forcast:'forecast',forecats:'forecast',forcasts:'forecasts',temprature:'temperature',temperatue:'temperature',tempature:'temperature',resturants:'restaurants',resturantsnear:'restaurants near',restuarants:'restaurants',resturant:'restaurant',restuarant:'restaurant',direcions:'directions',directons:'directions',dierctions:'directions'});
const INTRO = /^(?<lead>(?:please\s+)?(?:(?:what(?:'s| is| are)|whats|show me|tell me|tellme|give me|i want|i need)(?:\s+the)?\s+)?)(?<word>[a-z]+)\b/i;
const WEATHER = /^(?:please\s+)?(?:(?:what(?:'s| is| are)|show me|tell me|give me|i want|i need)(?:\s+the)?\s+)?(?:weather|forecast|forecasts|temperature)\b/i;
const WEATHER_DEFINITION = /^(?:what (?:is|are)|define|explain|tell me about)\s+(?:a\s+|the\s+)?(?:weather|climate|temperature|wether|weather forecasting)(?:\s+mean)?[?.!]*$/i;
const NEWS = /^(?:please\s+)?(?:(?:what(?:'s| is)|show me|tell me|give me|i want|i need)(?:\s+the)?\s+)?(?:(?:latest|current|breaking|today'?s)\s+)?news\b/i;
const TIME_ONLY = /^(?:(?:and|what about|how about)\s+)?(?:tomorrow|today|tonight|this week|next week|hourly|daily|weekly|(?:7|seven)\s*-?\s*days?)[?.!]*$/i;
function safeTopic(value,{weather=false}={}) {
  if(typeof value !== 'string' || !value || value.length>MAX_TOPIC || PROTECTED.test(value) || CODE.test(value) || ADDRESS.test(value) || PRIVATE.test(value) || ACTION.test(value))return false;
  if(!/^[\p{L}\p{N}\s.,'’&()/-]+$/u.test(value))return false;
  // Explicit public postal locators are useful; long number strings and contact details are not topic memory.
  if(/\d{7,}/.test(value) || /\b\d{3}[- ]\d{2}[- ]\d{4}\b/.test(value))return false;
  return weather || !/^\d[\d -]*$/.test(value);
}
export function requestContext(value,now=Date.now()) {
  if(!value || !['weather','news','general'].includes(value.kind) || !Number.isFinite(value.time)
    || !Number.isFinite(now) || now<value.time || now-value.time>REQUEST_CONTEXT_TTL)return null;
  if(typeof value.topic!=='string' || value.topic!==''&&!safeTopic(value.topic,{weather:value.kind==='weather'}))return null;
  if(value.kind==='general'&&!value.topic)return null;
  return {kind:value.kind,topic:value.topic,time:value.time};
}
function weatherQuery(time,topic='') {
  const phrase=time.replace(/[?.!]+$/,'').replace(/^(?:and|what about|how about)\s+/i,'').replace(/^(?:7|seven)\s*-?\s*days?$/i,'7 day');
  return `${phrase} weather${topic?` in ${topic}`:''}`;
}
function topicAfter(query,pattern) {
  const rest=query.replace(pattern,'').replace(/[?.!]+$/,'').trim();
  return rest.replace(/^(?:about|on|in|for)\s+/i,'').trim();
}
/** Call only for read-only understanding, never to authorize or repair an action command. */
export function understandRequest(value,{context=null,now=Date.now(),hasFiles=false,hasConversation=false}={}) {
  const original=String(value??''),text=original.trim();
  const result={query:original,kind:'unchanged',changed:false,clarification:null,contextUsed:false,nextContext:null};
  const done=(query,kind,extra={})=>({...result,query,kind,changed:query!==original,...extra});
  if(!text || text.length>MAX_QUERY || hasFiles || PROTECTED.test(text) || CODE.test(text) || ADDRESS.test(text))return result;
  const previous=requestContext(context,now);
  const remember=(kind,topic='')=>({kind,topic,time:now});
  const clarify=message=>done(original,'clarification',{clarification:message});
  if(/^(?:new|go|do it|do that|that one|the other one)[?.!]*$/i.test(text))return clarify('What would you like me to do or find?');
  const incompleteAction=text.match(/^(send|delete|erase|reset|buy|order|book|call|open|close)[?.!]*$/i);
  if(incompleteAction)return clarify(`What would you like me to ${incompleteAction[1].toLowerCase()}?`);
  if(ACTION.test(text))return result;
  if(WEATHER_DEFINITION.test(text))return done(original,'general');
  if(/^(?:more|tell me more|more please|and more)[?.!]*$/i.test(text)) {
    if(!previous)return hasConversation?done(original,'general',{contextUsed:true}):clarify('What would you like more information about?');
    const query=previous.kind==='weather'?`Detailed weather forecast${previous.topic?` in ${previous.topic}`:''}`
      :previous.kind==='news'?`More latest news${previous.topic?` about ${previous.topic}`:''}`:`Tell me more about ${previous.topic}.`;
    return done(query,previous.kind,{contextUsed:true,nextContext:remember(previous.kind,previous.topic)});
  }
  let query=text.replace(/^tellme\b/i,'tell me').replace(/^whats\b/i,"what's");
  query=query.replace(INTRO,(full,...args)=>{
    const groups=args.at(-1),replacement=REPAIRS[groups.word.toLowerCase()];
    const rest=query.slice(full.length).trimStart();
    if(replacement&&/^(?:is|was|said|says|wrote|works|llc|inc\.?|ltd\.?|corporation|company|university|school)\b/i.test(rest))return full;
    return replacement?groups.lead+replacement:full;
  });
  const temporal=query.replace(/\b(?:tomorow|tommorow|tommorrow)\b/i,'tomorrow').replace(/^7days\b/i,'7 days');
  if(TIME_ONLY.test(temporal)) {
    if(previous?.kind==='weather')return done(weatherQuery(temporal,previous.topic),'weather',{contextUsed:true,nextContext:remember('weather',previous.topic)});
    if(hasConversation)return done(original,'general',{contextUsed:true});
    return clarify('What would you like to know for that time—weather, news, or something else?');
  }
  const follow=query.match(/^(?:and|what about|how about)\s+(.+?)[?.!]*$/i);
  if(follow&&safeTopic(follow[1],{weather:previous?.kind==='weather'})) {
    const topic=follow[1].trim();
    if(previous?.kind==='news')return done(`Latest news about ${topic}`,'news',{contextUsed:true,nextContext:remember('news',topic)});
    if(previous?.kind==='weather'&&!/^(?:sports|news|music|movies|you|me)$/i.test(topic))return done(`Weather in ${topic}`,'weather',{contextUsed:true,nextContext:remember('weather',topic)});
    if(hasConversation)return done(original,'general',{contextUsed:true});
    return clarify(`What would you like to know about ${topic}?`);
  }
  const placeFollow=query.match(/^(?:in|for)\s+(.+?)[?.!]*$/i);
  if(previous?.kind==='weather'&&placeFollow&&safeTopic(placeFollow[1],{weather:true}))return done(`Weather in ${placeFollow[1]}`,'weather',{contextUsed:true,nextContext:remember('weather',placeFollow[1])});
  if(WEATHER.test(query)) {
    // Repair a time word only before an explicit place, preserving names such as “Tomorow” after “in”.
    const placeAt=query.search(/\s+(?:in|for)\s+/i);
    const head=placeAt<0?query:query.slice(0,placeAt),tail=placeAt<0?'':query.slice(placeAt);
    const timeTail=/^ for (?:tomorow|tommorow|tommorrow)[?.!]*$/.test(tail)?tail.replace(/tomorow|tommorow|tommorrow/,'tomorrow'):tail;
    query=head.replace(/\b(?:tomorow|tommorow|tommorrow)\b/gi,'tomorrow').replace(/\b7days\b/gi,'7 days')+timeTail;
    const location=query.match(/\s+(?:in|for)\s+(.+?)[?.!]*$/i);
    const bare=topicAfter(query,WEATHER);
    let topic=location?.[1]?.trim()||(/^(?:\d{5}(?:-\d{4})?|[a-z]\d[a-z][ -]?\d[a-z]\d|[a-z]{1,2}\d[a-z\d]?[ ]?\d[a-z]{2})$/i.test(bare)?bare:'');
    if(TIME_ONLY.test(topic))topic='';
    const nextContext=topic&&!safeTopic(topic,{weather:true})?null:remember('weather',topic);
    return done(query,'weather',{nextContext});
  }
  if(NEWS.test(query)) {
    let topic=topicAfter(query,NEWS);
    if(/^(?:today|now|please)$/i.test(topic))topic='';
    return done(query,'news',{nextContext:!topic||safeTopic(topic)?remember('news',topic):null});
  }
  if(/^(?:please\s+)?(?:find\s+)?(?:restaurants?|directions|gas stations|grocery stores|nearest|nearby)\b/i.test(query))return done(query,'places');
  const about=query.match(/^(?:tell me\s+)?about\s+(.+?)[?.!]*$/i);
  if(about&&safeTopic(about[1])) {
    const topic=about[1].trim(),kind=previous?.kind==='news'?'news':'general';
    return done(kind==='news'?`Latest news about ${topic}`:`Tell me about ${topic}.`,kind,{contextUsed:kind==='news',nextContext:remember(kind,topic)});
  }
  const who=query.match(/^who\s+(?!is\b|are\b|was\b|were\b|am\b|has\b|had\b|does\b|did\b|can\b|will\b|would\b|should\b|wrote\b|writes\b|won\b|wins\b|made\b|makes\b|said\b|says\b|knows\b|created\b|invented\b)(.+?)[?.!]*$/i);
  if(who&&/^\p{Lu}/u.test(who[1])&&safeTopic(who[1]))return done(`Who is ${who[1]}?`,'general',{nextContext:remember('general',who[1])});
  const named=query.match(/^(?:who (?:is|was)|what (?:is|was)|tell me (?:more )?about)\s+(.+?)[?.!]*$/i);
  if(named&&safeTopic(named[1])&&!/^(?:it|this|that|you|he|she|they|the weather)$/i.test(named[1]))return done(query,'general',{nextContext:remember('general',named[1].trim())});
  const pictures=query.match(/^(?:pics|pictures|photos)\s+of\s+(.+?)[?.!]*$/i);
  if(pictures&&safeTopic(pictures[1]))return done(`Find pictures of ${pictures[1]}`,'general');
  if(/^(?:what(?:'s| is)?|tell me|about|who|pics)[?.!]*$/i.test(query))return clarify('What would you like to know about?');
  // Known wording can be expanded without treating arbitrary place/person names as another topic.
  return done(query,'general');
}
