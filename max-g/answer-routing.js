/** Shared web/Mac response policy. A failed service must never mean silence. */
import {weatherRequest,quickAnswer,postalReply} from './tools.js';
import {looksLikePostalCode,normalizePlaceText} from './postal-data.js';
export function needsLiveEvidence(value){
  const q=String(value||'').toLowerCase();
  if(/^(?:(?:what (?:is|are)|define|explain) (?:the )?(?:weather|climate|temperature|weather forecasting)|how (?:does|do) (?:weather forecasting|weather forecasts) work)[?.!]*$/.test(q.trim()))return false;
  return /\b(?:latest|current|currently|today|tonight|tomorrow|this week|next week|right now|breaking|news|weather|forecast|stock price|share price|exchange rate|opening hours|open now|traffic|flight status|score|standings|election results)\b/.test(q)
    || /\b(?:who is|who's|who are)\b.*\b(?:president|prime minister|ceo|governor|mayor|minister)\b/.test(q)
    || /\b(?:price|prices|costs?|buy|shop|restaurant|hotel|gas station|nearest|near me|recommend|recommendation|best .{0,35}(?:to buy|phone|laptop|model|restaurant|hotel))\b/.test(q)
    || /\b(?:version|release|compatible|supported|support)\b.*\b(?:api|sdk|library|package|model|python|javascript|browser|ios|macos|windows|android)\b/.test(q);
}
export function basicDeviceAnswer(value,date=new Date()){
  const q=String(value).trim().replace(/[?!.,]+$/,'').toLowerCase();
  if(/^(?:what(?:'s| is) (?:the )?(?:date|day)(?: today)?|what day is (?:it|today)|today's date|date|day)$/i.test(q))return {text:`Today is ${new Intl.DateTimeFormat(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(date)}.`,type:'device-clock'};
  if(/^(?:what(?:'s| is) (?:the )?time(?: (?:now|here))?|what time is it|time)$/i.test(q))return {text:`It’s ${new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(date)} on this device.`,type:'device-clock'};
  return null;
}
export function isReasoningRequest(value){
  return /^(?:please\s+)?(?:explain|compare|design|plan|debug|review|analy[sz]e|write|create|build|translate|summari[sz]e|help me (?:write|understand|plan|debug)|how (?:do|does|can|should)|why\b)/i.test(String(value).trim());
}
export function searchBeforeReply(query,{onlineFirst=true,explicit=false,personal=false,hasFiles=false}={}){
  if(hasFiles||personal)return false;
  return explicit||needsLiveEvidence(query)||(onlineFirst&&!isReasoningRequest(query));
}
export function allowLocalSearchFallback(query,{explicit=false}={}){
  return !explicit&&!needsLiveEvidence(query);
}
export function answerLimit(query,{detailed=false,document=false}={}){
  if(document)return 768;
  if(detailed||/\b(?:step[- ]by[- ]step|in detail|detailed|complex|architecture|debug|compare|analy[sz]e|implementation)\b/i.test(query))return 768;
  return 384;
}
export function userFacingFailure(error,{online=true,desktop=false}={}){
  const message=String(error?.message||'').trim();
  if(!online)return 'I think I’m offline. I can still help with calculations and local tools. Live weather and web research need an internet connection. Please reconnect and try again.';
  if(/WebGPU|GPU adapter|shader-f16|graphics acceleration/i.test(message))return 'This browser cannot start MAX-G’s local AI model. Weather, calculations, and unit conversions still work. For general conversation, use a browser with WebGPU support or open the installed MAX-G Mac app.';
  if(/download|fetch|network|timeout|timed out|too long|unavailable|connection/i.test(message))return `I couldn’t finish that request. ${message||'A required connection is unavailable.'} Please retry; ${desktop?'the local Mac model':'the downloaded local model'} can answer general questions when ready.`;
  return message||'Sorry, I couldn’t finish that request. Please try again or give me a little more detail.';
}
export function weatherFollowup(text,pending){
  if(!pending||Date.now()-pending.time>5*60*1000)return null;
  let q=normalizePlaceText(text);
  if(/^(?:cancel|never mind|nevermind|stop)$/i.test(q))return {cancel:true};
  if(/^(?:(?:use )?(?:my )?(?:current location|location|gps)|here|near me)$/i.test(q))return {useDevice:true,place:'',country:''};
  if(pending.clarification?.kind==='choice'&&/^(?:option |number )?[1-6]$/i.test(q))return {choice:Number(q.match(/[1-6]/)[0])};
  const postal=postalReply(q);if(postal)return {...postal,country:postal.country||pending.intent?.country||''};
  q=q.replace(/^(?:(?:i(?:'m| am)|we(?:'re| are))(?: located)?\s+(?:in|at)|my location is|i live in)\s+/i,'');
  if(/^\d{1,2}\s*-\s*\d{1,2}$/.test(q))return null;
  if(/^(?:postal codes?|postcodes?|zip codes?|locate|find|navigate|directions|route|take me)\b/i.test(q))return null;
  if(weatherRequest(q)||(!looksLikePostalCode(q)&&quickAnswer(q))||basicDeviceAnswer(q)||/^(?:open|close|launch|play|sing|dance|stop|turn|send|call)\b/i.test(q))return null;
  // A follow-up place is short. A new question/topic exits this pending lookup.
  if(!q||q.length>160||/[?\n]/.test(q)||/^(?:what|why|how|who|when|where|can|could|would|please|tell|explain|write|create|build|calculate|solve|remember|search|research|hi|hello|thanks)\b/i.test(q)||/^\//.test(q))return null;
  return {place:q,country:pending.intent?.country||''};
}
