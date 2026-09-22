/** Start one stable sentence while inference continues, then narrate the rest once.
 * No timer guesses, partial words, model tags, or speculative audio are used. */
let segmenter;
export function firstSpeakableSentence(value){
  const text=String(value||'').trimStart();
  if(!text||/^[\s#>*`~\[{]/u.test(text)||typeof Intl.Segmenter!=='function')return '';
  segmenter ||= new Intl.Segmenter(undefined,{granularity:'sentence'});
  const segments=segmenter.segment(text.slice(0,600));
  const first=segments[Symbol.iterator]().next().value?.segment||'';
  const sentence=first.trimEnd(),rest=text.slice(first.length);
  // A following word confirms the boundary. Short greetings, abbreviations,
  // URLs, markdown and unfinished numeric expressions wait for the final reply.
  if(sentence.length<20||sentence.length>360||!rest.trim()||!/[.!?。！？]["'”’)]*$/u.test(sentence)
    ||/[`~\[\]{}]|https?:\/\/|www\./iu.test(sentence)
    ||/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Ave|Rd|Blvd|Ct|Ln|Cir|Pl|Ter|Trl|Pkwy|Hwy|Fwy|Expy|Sq|Aly|Cres|Xing|Plz|Tpke|Apt|Ste|Bldg|Fl|Rm|Dept|Mt|Ft|NE|NW|SE|SW|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|vs|etc|e\.g|i\.e|a\.m|p\.m|[A-Z])\.$/iu.test(sentence)
    ||/\d\.$/u.test(sentence)&&/^\d/u.test(rest.trimStart()))return '';
  return sentence;
}

export function createReplySpeech({speak,enabled=()=>true,signal,onError=()=>{}}){
  const controller=new AbortController();let prefix='',pending=Promise.resolve(),closed=false,failed=false;
  const available=()=>!controller.signal.aborted&&!signal?.aborted&&enabled();
  const cancel=()=>controller.abort();
  signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  const narrate=(text,options)=>Promise.resolve().then(()=>{
    if(!available())return;
    return speak(text,{...options,signal:controller.signal});
  }).catch(error=>{failed=true;if(error?.name!=='AbortError'&&available())onError(error);});
  return {
    get started(){return Boolean(prefix);},
    offer(text,options={}){
      if(closed||prefix||!available())return false;
      const first=firstSpeakableSentence(text);if(!first)return false;
      prefix=first;pending=narrate(first,options);return true;
    },
    async finish(text,options={}){
      closed=true;
      // Returning true also suppresses the full-reply fallback after Stop voice.
      if(!available())return true;
      if(!prefix)return false;
      await pending;
      if(!available()||failed)return true;
      const complete=String(text||'').trimStart();
      if(!complete.startsWith(prefix)){cancel();return true;}
      const remainder=complete.slice(prefix.length).trim();
      if(remainder)await narrate(remainder,{...options,delivery:{...options.delivery,chuckle:false}});
      return true;
    },
    cancel,
    dispose(){closed=true;signal?.removeEventListener('abort',cancel);},
  };
}
