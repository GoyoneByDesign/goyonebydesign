/** Lightweight country recognition; no network requests or postal-code database.
 * ISO 3166-1 alpha-2/alpha-3 facts verified against Unicode CLDR on 2026-09-13:
 * https://raw.githubusercontent.com/unicode-org/cldr/main/common/supplemental/supplementalData.xml
 * https://www.iso.org/iso-3166-country-codes.html
 * Localized names use the device's Intl.DisplayNames/Unicode CLDR data:
 * https://cldr.unicode.org/translation/displaynames/countryregion-territory-names
 * Names describe countries and territories for lookup; they do not imply that
 * every territory has postal codes or complete coverage from a map provider.
 */
const CODE_PAIRS='AD:AND AE:ARE AF:AFG AG:ATG AI:AIA AL:ALB AM:ARM AO:AGO AQ:ATA AR:ARG AS:ASM AT:AUT AU:AUS AW:ABW AX:ALA AZ:AZE BA:BIH BB:BRB BD:BGD BE:BEL BF:BFA BG:BGR BH:BHR BI:BDI BJ:BEN BL:BLM BM:BMU BN:BRN BO:BOL BQ:BES BR:BRA BS:BHS BT:BTN BV:BVT BW:BWA BY:BLR BZ:BLZ CA:CAN CC:CCK CD:COD CF:CAF CG:COG CH:CHE CI:CIV CK:COK CL:CHL CM:CMR CN:CHN CO:COL CR:CRI CU:CUB CV:CPV CW:CUW CX:CXR CY:CYP CZ:CZE DE:DEU DJ:DJI DK:DNK DM:DMA DO:DOM DZ:DZA EC:ECU EE:EST EG:EGY EH:ESH ER:ERI ES:ESP ET:ETH FI:FIN FJ:FJI FK:FLK FM:FSM FO:FRO FR:FRA GA:GAB GB:GBR GD:GRD GE:GEO GF:GUF GG:GGY GH:GHA GI:GIB GL:GRL GM:GMB GN:GIN GP:GLP GQ:GNQ GR:GRC GS:SGS GT:GTM GU:GUM GW:GNB GY:GUY HK:HKG HM:HMD HN:HND HR:HRV HT:HTI HU:HUN ID:IDN IE:IRL IL:ISR IM:IMN IN:IND IO:IOT IQ:IRQ IR:IRN IS:ISL IT:ITA JE:JEY JM:JAM JO:JOR JP:JPN KE:KEN KG:KGZ KH:KHM KI:KIR KM:COM KN:KNA KP:PRK KR:KOR KW:KWT KY:CYM KZ:KAZ LA:LAO LB:LBN LC:LCA LI:LIE LK:LKA LR:LBR LS:LSO LT:LTU LU:LUX LV:LVA LY:LBY MA:MAR MC:MCO MD:MDA ME:MNE MF:MAF MG:MDG MH:MHL MK:MKD ML:MLI MM:MMR MN:MNG MO:MAC MP:MNP MQ:MTQ MR:MRT MS:MSR MT:MLT MU:MUS MV:MDV MW:MWI MX:MEX MY:MYS MZ:MOZ NA:NAM NC:NCL NE:NER NF:NFK NG:NGA NI:NIC NL:NLD NO:NOR NP:NPL NR:NRU NU:NIU NZ:NZL OM:OMN PA:PAN PE:PER PF:PYF PG:PNG PH:PHL PK:PAK PL:POL PM:SPM PN:PCN PR:PRI PS:PSE PT:PRT PW:PLW PY:PRY QA:QAT RE:REU RO:ROU RS:SRB RU:RUS RW:RWA SA:SAU SB:SLB SC:SYC SD:SDN SE:SWE SG:SGP SH:SHN SI:SVN SJ:SJM SK:SVK SL:SLE SM:SMR SN:SEN SO:SOM SR:SUR SS:SSD ST:STP SV:SLV SX:SXM SY:SYR SZ:SWZ TC:TCA TD:TCD TF:ATF TG:TGO TH:THA TJ:TJK TK:TKL TL:TLS TM:TKM TN:TUN TO:TON TR:TUR TT:TTO TV:TUV TW:TWN TZ:TZA UA:UKR UG:UGA UM:UMI US:USA UY:URY UZ:UZB VA:VAT VC:VCT VE:VEN VG:VGB VI:VIR VN:VNM VU:VUT WF:WLF WS:WSM YE:YEM YT:MYT ZA:ZAF ZM:ZMB ZW:ZWE';
const pairs=CODE_PAIRS.split(' ').map(pair=>pair.split(':'));
export const COUNTRY_CODES=Object.freeze(pairs.map(([code])=>code));
// XK is a widely used provider/CLDR compatibility code for Kosovo, not an
// officially assigned ISO 3166-1 entry. Do not invent an ISO alpha-3 alias.
export const COMPATIBILITY_CODES=Object.freeze(['XK']);
const recognizedCodes=[...COUNTRY_CODES,...COMPATIBILITY_CODES];
const codes=new Set(recognizedCodes),codeAliases=new Map(pairs.flatMap(([two,three])=>[[two.toLowerCase(),two],[three.toLowerCase(),two]]));
for(const code of COMPATIBILITY_CODES)codeAliases.set(code.toLowerCase(),code);
const LOCALES=Object.freeze(['en','fil','es','zh-Hans','zh-Hant','ja','it','ru','ko']);
const formatters=new Map();
function formatter(locale='en'){
  if(typeof locale!=='string'||!locale||locale.length>80)return formatter('en');
  if(formatters.has(locale))return formatters.get(locale);
  let result=null;try{result=new Intl.DisplayNames([locale,'en'],{type:'region',fallback:'code'});}catch{}
  if(formatters.size<32)formatters.set(locale,result);
  return result;
}
function key(value){
  if(typeof value!=='string'||value.length>240||/[\u0000-\u001f\u007f-\u009f\p{Cs}]/u.test(value))return '';
  // Fold Latin accents for "Espana"/"España", but retain Japanese voicing,
  // Cyrillic letters and other non-Latin marks. Never strip whole scripts.
  return value.normalize('NFKD').replace(/(\p{Script=Latin})\p{M}+/gu,'$1').normalize('NFC')
    .toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu,'');
}
const COMMON_ALIASES={
  GB:['UK','U.K.','Great Britain','Britain','England','Scotland','Wales','Northern Ireland','United Kingdom of Great Britain and Northern Ireland','Nagkakaisang Kaharian'],
  US:['U.S.','U.S.A.','United States of America','Estados Unidos de América','Estados Unidos','Estados Unidos ng Amerika','Amerika','美国','美國','アメリカ','アメリカ合衆国','Соединённые Штаты Америки','США','미국'],
  PH:['Philippines','The Philippines','Republic of the Philippines','Pilipinas','Republika ng Pilipinas','Filipinas','菲律宾','菲律賓','フィリピン','Филиппины','필리핀'],
  KR:['South Korea','Republic of Korea','Korea Republic of','대한민국','한국','韩国','韓國','韓国','Timog Korea'],
  KP:['North Korea',"Democratic People's Republic of Korea",'DPRK','朝鲜','朝鮮','北朝鮮','조선민주주의인민공화국','Hilagang Korea'],
  RU:['Russia','Russian Federation','Российская Федерация','Россия','Rusya'],
  CN:['China',"People's Republic of China",'PRC','中华人民共和国','中華人民共和國','中国','中國','Tsina'],
  JP:['Japan','日本','日本国','日本國','Nippon','Nihon','Hapon'],
  ES:['Espanya'],IT:['Italya'],DE:['Alemanya'],FR:['Pransiya','Pransya'],
  VN:['Vietnam','Viet Nam'],CZ:['Czech Republic','Czechia'],CI:['Ivory Coast',"Côte d’Ivoire"],
  TR:['Turkey','Türkiye'],SZ:['Swaziland','Eswatini'],CV:['Cape Verde','Cabo Verde'],
  MM:['Burma','Myanmar'],TL:['East Timor','Timor-Leste'],MK:['North Macedonia','Republic of North Macedonia'],
  LA:['Laos',"Lao People's Democratic Republic"],TZ:['Tanzania','United Republic of Tanzania'],
  BO:['Bolivia','Bolivia Plurinational State of'],VE:['Venezuela','Venezuela Bolivarian Republic of'],
  IR:['Iran','Islamic Republic of Iran'],SY:['Syria','Syrian Arab Republic'],MD:['Moldova','Republic of Moldova'],
  CD:['Democratic Republic of the Congo','DR Congo','DRC','Congo Kinshasa'],
  CG:['Republic of the Congo','Congo Brazzaville'],VA:['Vatican City','Holy See'],PS:['Palestine','State of Palestine'],
  TW:['Taiwan','台湾','台灣','臺灣'],HK:['Hong Kong','香港'],MO:['Macau','Macao','澳门','澳門'],
  XK:['Kosovo','Kosova','Republic of Kosovo'],
};
let names=null;
function nameAliases(){
  if(names)return names;
  const result=new Map();
  function add(value,code){const normalized=key(value);if(!normalized)return;
    // If translations collide, require a country code instead of guessing.
    if(result.has(normalized)&&result.get(normalized)!==code)result.set(normalized,'');else result.set(normalized,code);
  }
  for(const locale of LOCALES){const display=formatter(locale);if(!display)continue;
    for(const code of recognizedCodes){try{add(display.of(code),code);}catch{}}
  }
  for(const [code,aliases]of Object.entries(COMMON_ALIASES))if(codes.has(code))for(const alias of aliases)add(alias,code);
  names=result;return result;
}
export function normalizeCountry(value){const normalized=key(value);return normalized?(codeAliases.get(normalized)||nameAliases().get(normalized)||''):'';}
export function countryName(value,locale='en'){
  const code=normalizeCountry(value);if(!code)return '';
  try{return formatter(locale)?.of(code)||formatter('en')?.of(code)||code;}catch{return code;}
}
export const COUNTRY_OPTIONS=Object.freeze(recognizedCodes.map(code=>Object.freeze({code,label:countryName(code)})).sort((a,b)=>a.label.localeCompare(b.label)));
