/** Small input helpers, not a postal-code database or address validator.
 * A matching shape does not establish that a code exists or identify its country.
 * Keep the selected country separate and resolve real places with a data provider.
 * Unknown formats remain searchable; a false heuristic result must not reject them.
 *
 * Format references (checked 2026-09-13):
 * https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions
 * https://www.canadapost-postescanada.ca/cpc/en/support/articles/addressing-guidelines/postal-codes.page
 * https://www.ons.gov.uk/methodology/geography/ukgeographies/postalgeography
 * https://www.eircode.ie/faqs
 * https://www.postnl.nl/klantenservice/algemene-vragen/opbouw-postcode/
 * https://www.post.japanpost.jp/question/35.html
 * https://www.correios.com.br/enviar/precisa-de-ajuda/tudo-sobre-cep
 * https://faq.usps.com/articles/Knowledge/ZIP-Code-The-Basics
 * https://www.unicode.org/terminology/digits.html
 */
const MAX_PLACE_LENGTH=500;
const MAX_POSTAL_LENGTH=32;
// Decimal zero code points for Arabic-Indic, Eastern Arabic-Indic, common Indic,
// Thai, Lao, Tibetan, Myanmar, Khmer and Mongolian scripts. Fullwidth and
// mathematical compatibility digits already become ASCII under NFKC.
const DIGIT_ZEROS=Object.freeze([0x0660,0x06f0,0x0966,0x09e6,0x0a66,0x0ae6,0x0b66,0x0be6,0x0c66,0x0ce6,0x0d66,0x0e50,0x0ed0,0x0f20,0x1040,0x17e0,0x1810]);
const decimalDigit=character=>{
  const point=character.codePointAt(0),zero=DIGIT_ZEROS.find(value=>point>=value&&point<value+10);
  return zero===undefined?character:String(point-zero);
};

/** Preserve names, leading zeros and accents. Invalid/oversized inputs return ''.
 * No implicit conversion of numbers: a numeric argument may already have lost zeros.
 */
export function normalizePlaceText(value){
  if(typeof value!=='string'||value.length>MAX_PLACE_LENGTH)return '';
  const normalized=value.normalize('NFKC');
  if(normalized.length>MAX_PLACE_LENGTH)return '';
  return [...normalized].map(decimalDigit).join('')
    .replace(/[\u2010-\u2015\u2212\ufe58\ufe63\uff0d]/g,'-')
    .replace(/[\u200b\u200e\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g,'')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g,' ')
    .replace(/\s+/gu,' ').trim();
}

function postalText(value){
  return normalizePlaceText(value).replace(/^〒\s*(?=[A-Za-z0-9])/,'')
    // A Japanese keyboard can produce a long-vowel mark in a numeric code.
    // Leave that character intact in place names such as カトー.
    .replace(/([0-9])ー(?=[0-9])/g,'$1-').trim();
}
const compact=value=>value.replace(/[\s-]/g,'').toUpperCase();
const CANADIAN_SHAPE=/^[A-Z][0-9][A-Z][0-9][A-Z][0-9]$/;
const BRITISH_SHAPE=/^(?:GIR0AA|[A-Z]{1,2}[0-9][A-Z0-9]?[0-9][A-Z]{2})$/;
const IRISH_SHAPE=/^[A-Z][0-9][A-Z0-9][A-Z0-9]{4}$/;

/** A routing hint only. Unknown shapes must still reach ordinary place search.
 * Require code-like letters/digits rather than classifying ordinary city names.
 */
export function looksLikePostalCode(value){
  const text=postalText(value);
  if(!text||text.length>MAX_POSTAL_LENGTH||!/^[A-Za-z0-9 -]+$/.test(text))return false;
  const key=compact(text);
  if(/^[0-9]{2,12}$/.test(key))return true;
  if(CANADIAN_SHAPE.test(key)||BRITISH_SHAPE.test(key)||IRISH_SHAPE.test(key)||/^[0-9]{4}[A-Z]{2}$/.test(key))return true;
  // A few broad shapes also cover, for example, Malta, Argentina, Bermuda,
  // Brunei and alphanumeric codes used by some island territories. These are
  // deliberately not lists of allowed letters, assigned codes, or countries.
  if(/^(?:[A-Z]{3}[0-9]{4}|[A-Z][0-9]{4}[A-Z]{3}|[A-Z]{2}[0-9]{2,4}|[A-Z][0-9]{3}|[A-Z]{4}[0-9][A-Z]{2})$/.test(key))return true;
  // Leave room for less common compact formats, but do not swallow a street
  // address or a city followed by its district ("Paris 13", "District 9").
  return !/\s/.test(text)&&/^[A-Za-z0-9-]{3,12}$/.test(text)&&
    (key.match(/[0-9]/g)||[]).length>=2&&(key.match(/[A-Z]/g)||[]).length<=4;
}

/** Format only recognized shapes for an explicitly supplied ISO country code.
 * Unknown countries/formats are retained, with no validity claim or country guess.
 */
export function normalizePostalCode(value,country=''){
  const text=postalText(value);
  if(!text||text.length>MAX_POSTAL_LENGTH||!looksLikePostalCode(text))return text;
  const key=compact(text),code=typeof country==='string'?country.trim().toUpperCase():'';
  if(code==='CA'&&CANADIAN_SHAPE.test(key))return key.slice(0,3)+' '+key.slice(3);
  if(['GB','UK'].includes(code)&&BRITISH_SHAPE.test(key))return key.slice(0,-3)+' '+key.slice(-3);
  if(code==='IE'&&IRISH_SHAPE.test(key))return key.slice(0,3)+' '+key.slice(3);
  if(code==='NL'&&/^[0-9]{4}[A-Z]{2}$/.test(key))return key.slice(0,4)+' '+key.slice(4);
  if(code==='JP'&&/^[0-9]{7}$/.test(key))return key.slice(0,3)+'-'+key.slice(3);
  if(code==='BR'&&/^[0-9]{8}$/.test(key))return key.slice(0,5)+'-'+key.slice(5);
  if(code==='US'&&/^[0-9]{9}$/.test(key))return key.slice(0,5)+'-'+key.slice(5);
  return text.toUpperCase();
}

/** Case/separator-insensitive matching; never use this key as a country guess.
 * Does not discard punctuation other than whitespace and normalized hyphens, nor
 * fold O→0 or I→1: those substitutions could select a different real address.
 */
export function postalComparisonKey(value){return compact(postalText(value));}
