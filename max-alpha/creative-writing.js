/** Read-only routing for original writing. Conversation text remains with the caller. */
export const CREATIVE_CONTEXT_TTL = 30 * 60 * 1000;
const FORMATS = new Set(['story','poem','script','song','joke','creative']);
const WORK = /\b(stories|story|tales?|fairy[ -]?tales?|fables?|novels?|novellas?|fiction|poems?|poetry|haikus?|sonnets?|limericks?|screenplays?|scripts?|scenes?|monologues?|dialogues?|lyrics|songs?|jokes?|creative writing)\b/i;
const CREATE = /^(?:write|create|compose|draft|invent|imagine|make(?: up)?|tell|give|tellme)\b/i;
const FACTUAL = /\b(?:story|stories|history)\s+(?:behind|of)\b|\b(?:true|actual|real|factual|non[ -]?fiction)\s+(?:life\s+)?(?:story|stories|account|history)\b/i;
const FICTION = /\b(?:fiction(?:al)?|imaginary|invented|made[ -]up|fantasy|fairy[ -]?tale)\b/i;
const SCRIPT_CONTEXT = /\b(?:film|movie|screenplay|stage|theat(?:er|re)|drama|sitcom|comedy|sketch|scene|character|dialogue|monologue|musical|play|video|podcast)\b/i;

/** Only a format and timestamp are retained, never a plot, name, file, or prompt. */
export function creativeContext(value,now=Date.now()) {
  if(!value || !FORMATS.has(value.format) || !Number.isFinite(value.time)
    || !Number.isFinite(now) || now<value.time || now-value.time>CREATIVE_CONTEXT_TTL)return null;
  return {format:value.format,time:value.time};
}

function formatOf(word) {
  if(/^(?:poem|poetry|haiku|sonnet|limerick)/i.test(word))return 'poem';
  if(/^(?:screenplay|script|scene|monologue|dialogue)/i.test(word))return 'script';
  if(/^(?:lyric|song)/i.test(word))return 'song';
  if(/^joke/i.test(word))return 'joke';
  return /^creative/i.test(word)?'creative':'story';
}

function requestBody(text) {
  return text.replace(/^max[ -]?g[,!:]?\s*/i,'')
    .replace(/^(?:please\s+)?(?:(?:can|could|would|will)\s+you\s+(?:please\s+)?|(?:i\s+(?:want|need|would like)|i'd like)\s+(?:you\s+to\s+)?|let'?s\s+)?(?:please\s+)?/i,'')
    .trim();
}

/**
 * Call before weather, search and device parsers: words inside a plot are not
 * instructions to run tools. This result does not authorize any external action.
 * Clear the caller's context on a different task or unsuccessful generation.
 */
export function creativeRequest(value,{context=null,now=Date.now()}={}) {
  if(typeof value!=='string' || !Number.isFinite(now))return null;
  const text=value.trim();
  if(!text || text.length>60000 || /^\//.test(text))return null;
  const body=requestBody(text),head=body.slice(0,400),previous=creativeContext(context,now);
  const done=(format,operation='new',contextUsed=false)=>({kind:'creative',format,operation,contextUsed,nextContext:{format,time:now}});

  // The leading request determines intent, rather than a quoted story/command
  // buried in an ordinary factual question, search query or programming task.
  const work=head.match(WORK);
  if(work && work.index<180) {
    const prefix=head.slice(0,work.index),noun=work[0],authoring=CREATE.test(body);
    const bare=/^(?:(?:a|an|another|one|some|the)\s+)?[\p{L}\p{N}'’ -]{0,95}$/u.test(prefix)
      && !/\b(?:what|why|how|who|when|where|is|are|was|were|explain|search|find|research|read|summari[sz]e|review|analy[sz]e|about|history|news|code|program|programming|include|add|remove|change|translate|shorten|lengthen|play|sing|email|send|delete|open|close)\b/i.test(prefix);
    const revise=/^(?:rewrite|revise|retell|adapt|rework|expand|continue|finish|complete)\b/i.test(body);
    if(authoring||bare||revise) {
      if(/\b(?:app|application|website|program|function|algorithm|software|plugin|code|api|database|about|news|review|summary|analysis|history|definition|email|letter)\b/i.test(prefix))return null;
      const leading=head.slice(0,work.index+noun.length+35);
      const implicitFactual=/^(?:tell|give)(?:\s+me)?\s+(?:the\s+)?(?:story|stories|tale|history)\s+(?:of|behind)\b/i.test(body);
      if((FACTUAL.test(leading)||implicitFactual)&&!FICTION.test(leading))return null;
      // A generic 'script' is too ambiguous to steal from coding workflows.
      if(/^scripts?$/i.test(noun)&&!SCRIPT_CONTEXT.test(head))return null;
      const format=formatOf(noun);
      const modifying=/^make\s+(?:it|that|this|the)\b/i.test(body);
      return done(format,revise?(/^(?:continue|finish|complete)\b/i.test(body)?'continue':'revise'):modifying?'revise':'new',Boolean((revise||modifying)&&previous));
    }
  }
  if(!previous)return null;

  const short=body.replace(/[.!?]+$/,'').trim();
  if(/^(?:another(?: one)?|one more|again|something different|try another)$/i.test(short))return done(previous.format,'new',true);
  if(/^(?:continue(?:\s+(?:it|that|please|the story|the poem|the scene))?|go on|keep going|more(?: please)?|tell me more|what happens next|next(?: chapter| part| scene)?|(?:write|give me|tell me)\s+(?:the\s+)?next\s+(?:chapter|part|scene)|finish(?: it| that)?|complete(?: it| that)?)$/i.test(short))return done(previous.format,'continue',true);
  if(/^(?:shorter|longer|funnier|scarier|happier|sadder|darker|lighter|more (?:romantic|dramatic|suspenseful|detailed)|less (?:scary|dark|violent)|(?:try|do) (?:it )?again|rewrite(?: it| that)?|revise(?: it| that)?)$/i.test(short))return done(previous.format,'revise',true);
  if(/^(?:make|rewrite|revise|retell|translate|adapt|expand|shorten|lengthen|change)\s+(?:it|that|this|the (?:story|poem|scene|ending|character|characters|tone|dialogue|setting|plot|title))\b/i.test(short))return done(previous.format,'revise',true);
  if(/^(?:add|include|remove)\s+(?:(?:a|an|the|some|more|less)\s+)?(?:twist|dialogue|humou?r|romance|suspense|detail|details|character|characters|happy ending|sad ending)\b/i.test(short))return done(previous.format,'revise',true);
  if(/^(?:with|without)\s+(?:(?:a|an|the|some|more|less)\s+)?(?:twist|dialogue|humou?r|romance|suspense|detail|details|happy ending|sad ending)\b/i.test(short))return done(previous.format,'revise',true);
  if(/^(?:in|now in)\s+(?:English|Tagalog|Filipino|Spanish|Chinese|Mandarin|Japanese|Italian|Russian|Korean|French|German|Portuguese|Arabic|Hindi)(?: please)?$/i.test(short))return done(previous.format,'revise',true);
  // Genres are deliberately open-ended: a new genre need not be in a registry.
  const variant=short.match(/^(?:(?:what|how) about\s+|(?:another|a|an)\s+)?([\p{L}'’ -]{1,55})\s+(?:one|version)(?: please)?$/iu);
  if(variant&&!/\b(?:weather|news|today|tomorrow|price|open|delete|send|search)\b/i.test(variant[1]))return done(previous.format,'new',true);
  return null;
}
