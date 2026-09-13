/** English pronunciation only. Never changes a transcript or asks a model to
 * guess whether a number is an address, a year, or a quantity. */
const DIGITS = ['zero','one','two','three','four','five','six','seven','eight','nine'];
const LETTERS = ['ay','bee','see','dee','ee','ef','gee','aitch','eye','jay','kay','el','em','en','oh','pee','cue','ar','ess','tee','you','vee','double you','ex','why','zee'];
const SMALL = [...DIGITS,'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const LABEL = '(?:zip(?:\\+4)?(?:\\s*codes?)?|postal\\s*codes?|postcodes?|eircode)';
const DASH = '[-\u2010-\u2015]';
const UK = '[A-Za-z]{1,2}\\d[A-Za-z\\d]?\\s*\\d[A-Za-z]{2}';
const CA = '[A-Za-z]\\d[A-Za-z]\\s*\\d[A-Za-z]\\d';
const IE = '[A-Za-z]\\d[A-Za-z\\d]\\s*[A-Za-z\\d]{4}';
const NL = '\\d{4}\\s+[A-Z]{2}';
const MIXED = '[A-Za-z]{1,3}\\d{2,6}[A-Za-z]{0,4}';
const NUMERIC = `\\d{3}[ \\t]\\d{2}|\\d{2,10}(?:${DASH}\\d{1,5})?`;
const POSTAL = new RegExp(`(?<![A-Za-z0-9_])(?:${UK}|${CA}|${IE}|${NL}|${MIXED}|${NUMERIC})(?![A-Za-z0-9_])`,'g');
const POSTAL_BEFORE = new RegExp(`\\b${LABEL}\\s*(?:(?:is|are|number|no\\.?)\\s*|[:#=]\\s*)?$`,'i');
const POSTAL_PLACE_BEFORE = new RegExp(`\\b${LABEL}\\s+(?:for|in|of)\\s+[^\\d\\n:;.!?]{1,60}\\s+(?:is|are|:)\\s*$`,'i');
const POSTAL_AFTER = new RegExp(`^\\s*(?:(?:is|was)\\s+(?:(?:my|the|a|its)\\s+)?)?${LABEL}\\b`,'i');
const US_STATE = /(?:\b[A-Z][a-z]+[\w .'-]*,?\s+)?\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|PR|VI|GU|AS|MP)\s+$/;
const UNITS = /^\s*(?:°\s*[CF]|%|(?:items?|invoices?|residents?|people|dollars?|euros?|USD|EUR|GBP|units?|miles?|mi|kilometers?|kilometres?|km|meters?|metres?|m|feet|foot|ft|inches|pounds?|lbs?|ounces?|oz|kilograms?|kg|grams?|g|hours?|minutes?|seconds?|watts?|volts?|bytes?|MB|GB|days?|percent|degrees|employees|users|customers|orders|books|votes|calories)\b)/i;
const MONTH = '(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)';
const YEAR_BEFORE = new RegExp(`(?:\\byears?\\s*[:=]\\s*|\\b(?:years?|in|since|during|until|through|by|before|after|from|around|circa|born|copyright|as of)(?:\\s+(?:is|was|will be|the|of))?\\s+|©\\s*|\\b${MONTH}\\s+(?:\\d{1,2}(?:st|nd|rd|th)?[,]?\\s+)?)$`,'i');
const YEAR_AFTER = /^\s*(?:AD\b|CE\b|BCE\b|BC\b|(?:is|was)\s+(?:the|a)\s+year\b|(?:was|will be|calendar|edition|season|forecast|election|Olympics)\b)/i;
const key = value => String(value).toUpperCase().replace(/[\s\u2010-\u2015-]/g,'');
const boundedHints = values => Array.isArray(values) ? values.slice(0,16).filter(x=>typeof x==='string'&&x.length<=20&&/^[A-Za-z0-9\s\u2010-\u2015-]+$/.test(x)&&/\d/.test(x)).map(key) : [];
const small = n => n<20?SMALL[n]:TENS[Math.floor(n/10)]+(n%10?' '+SMALL[n%10]:'');
const TEMPERATURE_NUMBER = '[+−-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)';
const TEMPERATURE_UNIT = '(?:°\\s*(?:[FfCc]|Fahrenheit|Celsius)|℉|℃|(?:degrees?\\s+)?(?:Fahrenheit|Celsius|F|C))';
const TEMPERATURE = new RegExp(`(?<![\\w.])(${TEMPERATURE_NUMBER})\\s*(${TEMPERATURE_UNIT})(?![\\w])`,'g');
const TEMPERATURE_RANGE = new RegExp(`(?<![\\w.])(${TEMPERATURE_NUMBER})\\s*(${TEMPERATURE_UNIT})?\\s*(?:to|[-–—])\\s*(${TEMPERATURE_NUMBER})\\s*(${TEMPERATURE_UNIT})(?![\\w])`,'g');
const temperatureScale = unit => /F|℉/i.test(unit)?'Fahrenheit':'Celsius';
const temperatureNumber = value => value.replace(/^[−-]/,'minus ').replace(/^\+/,'plus ');
const temperatureWords = (number,unit) => `${temperatureNumber(number)} ${Math.abs(Number(number.replace('−','-')))===1?'degree':'degrees'} ${temperatureScale(unit)}`;
const electricalUnit = (source,start,unit) => /^[FC]$/.test(unit)&&/\b(?:capacitance|capacitor|farads?|(?:electric(?:al)?\s+)?charge|coulombs?)\b[^.!?;\n]*$/i.test(source.slice(Math.max(0,start-100),start));

export function pronouncePostalCode(value) {
  return [...key(value)].map(c=>/\d/.test(c)?DIGITS[Number(c)]:LETTERS[c.charCodeAt(0)-65]||'').filter(Boolean).join(' ');
}

export function pronounceYear(value) {
  if(!/^[12]\d{3}$/.test(String(value)))return String(value);
  const year=Number(value),first=Math.floor(year/100),last=year%100;
  if(year===1000||year>=2000&&year<=2009)return `${DIGITS[Math.floor(year/1000)]} thousand${year%1000?' '+small(year%1000):''}`;
  return small(first)+(last===0?' hundred':last<10?' oh '+DIGITS[last]:' '+small(last));
}

function quantity(before,after,allowYearRange=false) {
  return /[$€£¥#]\s*$/.test(before)||/[\d.,/]$/.test(before)||/^[.,/]\d/.test(after)||UNITS.test(after)
    ||/[+*/=<>×÷]\s*$/.test(before)||/^\s*[+*/=<>×÷]/.test(after)
    ||!allowYearRange&&(/[-−]\s*$/.test(before)||/^\s*[-−]\s*\d/.test(after))
    ||/\b(?:version|build|account|invoice|order|model|phone|telephone|ISBN|ID|PIN)\s*[:#]?\s*$/i.test(before)
    ||/\b(?:there (?:are|were)|has|had|have|contains|total of|costs?|we counted)\s*$/i.test(before);
}

/** Hints contain only identifiers already resolved by the location tool. They
 * never take precedence over an explicit year or an adjacent unit/currency. */
export function normalizePronunciation(text,{language='en-US',postalCodes=[],years=[]}={}) {
  const original=String(text);
  if(!/^(?:en(?:-|$)|English$)/i.test(language))return original;
  const postalHints=new Set(boundedHints(postalCodes)),yearHints=new Set(boundedHints(years));
  const spans=[];
  const add=(start,end,value,type)=>{if(!spans.some(x=>start<x.end&&end>x.start))spans.push({start,end,value,type});};
  // Paired emphasis has no spoken meaning and otherwise hides immediate labels.
  const source=original.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/`([^`\n]+)`/g,'$1');
  // Claim explicit temperatures before identifiers so postal/year hints cannot
  // turn 2026 F into a postal code or calendar year. Expand speech only.
  for(const match of source.matchAll(TEMPERATURE_RANGE)) {
    const [,first,firstUnit,last,lastUnit]=match;
    if(/^\s*=/.test(source.slice(match.index+match[0].length))||electricalUnit(source,match.index,lastUnit)||firstUnit&&electricalUnit(source,match.index,firstUnit))continue;
    const value=firstUnit&&temperatureScale(firstUnit)!==temperatureScale(lastUnit)
      ?`${temperatureWords(first,firstUnit)} to ${temperatureWords(last,lastUnit)}`
      :`${temperatureNumber(first)} to ${temperatureNumber(last)} degrees ${temperatureScale(lastUnit)}`;
    add(match.index,match.index+match[0].length,value,'temperature');
  }
  for(const match of source.matchAll(TEMPERATURE)){
    if(!electricalUnit(source,match.index,match[2]))add(match.index,match.index+match[0].length,temperatureWords(match[1],match[2]),'temperature');
  }
  let previousPostal=null;
  for(const match of source.matchAll(POSTAL)) {
    const token=match[0],start=match.index,end=start+token.length;
    if(spans.some(x=>start<x.end&&end>x.start)){previousPostal=null;continue;}
    const before=source.slice(Math.max(0,start-100),start),after=source.slice(end,end+70);
    const explicit=POSTAL_BEFORE.test(before)||POSTAL_PLACE_BEFORE.test(before)||POSTAL_AFTER.test(after);
    const numeric=/^\d/.test(token)&&!/[A-Za-z]/.test(token);
    const strong=new RegExp(`^(?:${UK}|${CA}|${IE})$`).test(token);
    const address=/^\d{5}(?:-\d{4})?$/.test(token)&&US_STATE.test(before);
    const list=previousPostal&&/^(?:\s*(?:,|and|or|;)\s*)+$/i.test(source.slice(previousPostal.end,start));
    const year=YEAR_BEFORE.test(before)||YEAR_AFTER.test(after);
    const hinted=postalHints.has(key(token))&&!year;
    if((explicit||list||strong||address||hinted)&&!quantity(before,after)) {
      // Strong formats contain digits, so ordinary words cannot become letters.
      add(start,end,pronouncePostalCode(token),'postal');previousPostal={end};
    } else if(!numeric||!list)previousPostal=null;
  }
  for(const match of source.matchAll(/(?<![\w\d])([12]\d{3})(?![\w\d])/g)) {
    const start=match.index,end=start+4,before=source.slice(Math.max(0,start-80),start),after=source.slice(end,end+70);
    const previous=spans.find(x=>x.type==='year'&&/^(?:\s*(?:to|through|until|and|[-\u2010-\u2015])\s*)$/i.test(source.slice(x.end,start)));
    if(quantity(before,after,Boolean(previous||YEAR_BEFORE.test(before)))||!previous&&/\d[-\u2010-\u2015]$/.test(before)||/^[-\u2010-\u2015]\d{1,3}(?:\D|$)/.test(after))continue;
    if(/\d\s*[-+*/]\s*\d[^.!?]*=/.test(before+match[0]+after))continue;
    const hinted=yearHints.has(match[0])&&/^(?:\s*$|\s*[.!?,;:)”"'])/.test(after);
    let contextual=YEAR_BEFORE.test(before)||YEAR_AFTER.test(after)||hinted;
    if(previous)contextual=true;
    if(contextual){
      add(start,end,pronounceYear(match[0]),'year');
      if(previous&&/^\s*[-\u2010-\u2015]\s*$/.test(source.slice(previous.end,start)))add(previous.end,start,' to ','separator');
    }
  }
  spans.sort((a,b)=>a.start-b.start);
  let result='',offset=0;
  for(const span of spans){result+=source.slice(offset,span.start)+span.value;offset=span.end;}
  return result+source.slice(offset);
}
