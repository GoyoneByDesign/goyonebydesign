/** English address speech, kept separate from the written address.
 * USPS names: https://pe.usps.com/text/pub28/pub28apb.htm and pub28apc_002.htm.
 * Reading house numbers individually is Michael's preference, not a postal rule.
 */
export const STATE_NAMES=Object.freeze(Object.fromEntries('AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming|DC:District of Columbia|AS:American Samoa|GU:Guam|MP:Northern Mariana Islands|PR:Puerto Rico|VI:Virgin Islands|FM:Federated States of Micronesia|MH:Marshall Islands|PW:Palau'.split('|').map(pair=>pair.split(':'))));
const SUFFIXES=Object.freeze({ST:'Street',AVE:'Avenue',BLVD:'Boulevard',RD:'Road',DR:'Drive',LN:'Lane',CT:'Court',CIR:'Circle',PL:'Place',TER:'Terrace',TRL:'Trail',PKWY:'Parkway',HWY:'Highway',FWY:'Freeway',EXPY:'Expressway',SQ:'Square',ALY:'Alley',CRES:'Crescent',XING:'Crossing',PLZ:'Plaza',TPKE:'Turnpike'});
const DIRECTIONS=Object.freeze({N:'North',S:'South',E:'East',W:'West',NE:'Northeast',NW:'Northwest',SE:'Southeast',SW:'Southwest'});
const SECONDARY=Object.freeze({APT:'Apartment',STE:'Suite',BLDG:'Building',FL:'Floor',RM:'Room',DEPT:'Department'});
const PREFIXES=Object.freeze({St:'Saint',Mt:'Mount',Ft:'Fort'});
const HOUSE='[0-9]{1,8}[A-Za-z]?(?:-[0-9]{1,8})?';
const WORD="[\\p{L}0-9][\\p{L}0-9'’.-]*";
const SUFFIX_PATTERN=[...Object.keys(SUFFIXES),...Object.values(SUFFIXES)].sort((a,b)=>b.length-a.length).join('|');
const STREET=new RegExp(`(?<![\\w.$€£¥])(?=((${HOUSE})[ \\t]+((?:${WORD}[ \\t]+){1,6}?)(${SUFFIX_PATTERN})(?![\\p{L}0-9])))`,'giu');
const HOUSE_LABEL= /\b(?:house\s+(?:number|no\.?|#)|street\s+(?:number|no\.?|#)|address\s+number|(?:home\s+|street\s+|mailing\s+)?address)\s*(?:(?:is|was)\s*|[:#=]\s*)?$/i;
const LOCATION_CUE=/\b(?:(?:state|territory)(?:\s+(?:of|is))?|(?:weather|forecast|temperature|directions|located|location|travel|traveling|visiting|live|living|moved|moving|going|driving)(?:\s+(?:in|for|at|to|from))?|in|near|across|around)\s+$/i;
const STATE_TOKEN=/(?<![A-Za-z])(?:[A-Z]\.[A-Z]\.|[A-Z]{2})(?![A-Za-z])/gi;
const LOCATION_END=/^\s*(?:\d{5}(?:-\d{4})?\b|$|[,.;:!?)]|(?:weather|forecast|today|tomorrow|is|has)\b)/i;
const CITY_BEFORE=/(?:^|[^\p{L}])(?:[A-Z][\p{L}'’.-]+\s+){0,4}[A-Z][\p{L}'’.-]+,?\s*$/u;
const nonAddressQuantity=(before,after)=>/[$€£¥+*/=<>×÷−-]\s*$/.test(before)||/^\s*[+*/=<>×÷]/.test(after)||/\b(?:there (?:are|were)|counted|costs?|total(?: of)?|contains)\s*$/i.test(before)||/\b(?:model|version|build|account|invoice|order|phone|ISBN|ID|PIN|years?|temperature|capacitance|charge)\s*(?:(?:is|was|of|number)\s*|[:#]\s*)?$/i.test(before)||/^\s+(?:dollars?|items?|residents?|people|feet|miles?|meters?|units?)\b/i.test(after);
const PROSE_BODY=/\b(?:is|are|was|were|will|would|can|could|when|where|because|from|to|on|at|in|we|you|they|has|have|runs?|costs?|equals?|degrees?)\b/i;

/** Return replacements at original offsets. The caller applies them alongside
 * postal/year/temperature spans, so expanding VA cannot hide a ZIP-code label. */
export function addressSpeechSpans(source,pronounceIdentifier){
  const spans=[],addresses=[];
  const add=(start,end,value,type='address')=>{if(!spans.some(s=>start<s.end&&end>s.start))spans.push({start,end,value,type});};
  const abbreviation=(start,token,value,internal=false)=>{let end=start+token.length;if(source[end]==='.'&&(/^\s*,/.test(source.slice(end+1))||internal&&/^\s+\S/.test(source.slice(end+1))))end++;add(start,end,value);};
  for(const match of source.matchAll(STREET)){
    const [,text,number,body,suffix]=match,start=match.index;
    const before=source.slice(Math.max(0,start-80),start);
    if(addresses.some(a=>start>a.start&&start<a.streetEnd)||PROSE_BODY.test(body)||nonAddressQuantity(before,source.slice(start+number.length,start+number.length+50)))continue;
    if(/(?:\b(?:zero|one|two|three|four|five|six|seven|eight|nine)\s+){2,10}$/i.test(before)){add(start,start+number.length,number,'streetName');continue;}
    add(start,start+number.length,pronounceIdentifier(number),'streetHouse');
    const suffixStart=start+text.length-suffix.length,bodyStart=start+number.length+text.slice(number.length).match(/^[ \t]+/)[0].length;
    for(const numeric of body.matchAll(/\b\d+(?:st|nd|rd|th)?\b/gi))add(bodyStart+numeric.index,bodyStart+numeric.index+numeric[0].length,numeric[0],'streetName');
    const continuation=/^\.\s+(?:NE|NW|SE|SW|N|S|E|W|APT|STE|BLDG|FL|RM|DEPT)\b/i.test(source.slice(suffixStart+suffix.length));
    if(SUFFIXES[suffix.toUpperCase()])abbreviation(suffixStart,suffix,SUFFIXES[suffix.toUpperCase()],continuation);
    const prefix=body.match(/^(NE|NW|SE|SW|N|S|E|W)\.?\s+/i);
    if(prefix)abbreviation(bodyStart,prefix[1],DIRECTIONS[prefix[1].toUpperCase()],true);
    const saint=body.match(/\b(St|Mt|Ft)\.?(?=\s+[A-Z])/);
    if(saint)abbreviation(bodyStart+saint.index,saint[1],PREFIXES[saint[1]],true);
    let end=start+text.length;
    const post=source.slice(end).match(/^\.?[ \t]+(NE|NW|SE|SW|N|S|E|W)\b\.?/i);
    if(post){const index=end+post[0].indexOf(post[1]);abbreviation(index,post[1],DIRECTIONS[post[1].toUpperCase()]);end+=post[0].length;}
    const secondary=source.slice(end,end+90).match(/^\.?[ \t,]+(APT|STE|BLDG|FL|RM|DEPT)\.?\s+([A-Za-z0-9][A-Za-z0-9/-]{0,15})/i);
    if(secondary){const index=end+secondary[0].indexOf(secondary[1]);abbreviation(index,secondary[1],SECONDARY[secondary[1].toUpperCase()],true);const unitStart=end+secondary[0].lastIndexOf(secondary[2]);add(unitStart,unitStart+secondary[2].length,secondary[2],'unit');}
    addresses.push({start,streetEnd:end,end:Math.min(source.length,end+130)});
  }
  // Keep unit identifiers stable even on a second speech pass, when the house
  // number may already be words. They are not calendar years or postal codes.
  for(const match of source.matchAll(/\b(?:Apartment|Suite|Room|Unit|Apt|Ste|Rm)\.?\s+([A-Za-z0-9][A-Za-z0-9/-]{0,15})\b/gi)){
    const start=match.index+match[0].lastIndexOf(match[1]);add(start,start+match[1].length,match[1],'unit');
  }
  for(const match of source.matchAll(new RegExp(`(?<![\\w.])${HOUSE}(?![\\w])`,'g'))){
    const before=source.slice(Math.max(0,match.index-80),match.index),after=source.slice(match.index+match[0].length,match.index+match[0].length+60);
    if(HOUSE_LABEL.test(before)&&!nonAddressQuantity(before,after))add(match.index,match.index+match[0].length,pronounceIdentifier(match[0]),'house');
  }
  let previousState=null;
  for(const match of source.matchAll(STATE_TOKEN)){
    const code=match[0].replaceAll('.','').toUpperCase(),name=STATE_NAMES[code];if(!name)continue;
    const start=match.index,end=start+match[0].length,before=source.slice(Math.max(0,start-90),start),after=source.slice(end,end+65);
    const inAddress=addresses.some(a=>start>a.start&&start<=a.end)&&/^\s*\d{5}\b/.test(after);
    if(match[0]!==match[0].toUpperCase()&&!inAddress){previousState=null;continue;}
    if(code==='MD'&&(/\b(?:Dr\.?|Doctor|physician)\s+[^.!?;\n]*,\s*$/i.test(before)||/^\s*,?\s*(?:(?:is|was)\s+)?(?:(?:a|the)\s+)?(?:physician|doctor|surgeon)\b/i.test(after))){previousState=null;continue;}
    if(/\b(?:file|parser|markdown|operator|select|where|join|query|sql)\b[^.!?;\n]*$/i.test(before)||/(?:^|[.!?;\n]\s*)(?:IN|OR|AND|WHERE|SELECT|Yes|No|Okay),?\s*$/i.test(before)){previousState=null;continue;}
    const city=CITY_BEFORE.test(before)&&LOCATION_END.test(after);
    const explicit=LOCATION_CUE.test(before)&&!/(?:SELECT|WHERE|AND|OR|IN)\s*$/.test(before);
    const list=previousState&&/^(?:\s*(?:,|and|or|;)\s*)+$/i.test(source.slice(previousState.end,start));
    if(city||explicit||list||inAddress){add(start,end,name,'state');previousState={end};
      const postal=inAddress&&after.match(/^\s*(\d{5}(?:-\d{4})?)\b/);
      if(postal){const at=end+postal[0].indexOf(postal[1]);add(at,at+postal[1].length,pronounceIdentifier(postal[1]),'postal');}
      // St./Mt./Ft. is a place-name prefix here, not a street suffix or unit.
      for(const prefix of before.matchAll(/\b(St|Mt|Ft)\.?(?=\s+[A-Z])/g))abbreviation(start-before.length+prefix.index,prefix[0],PREFIXES[prefix[1]]);
    }else previousState=null;
  }
  return spans;
}
