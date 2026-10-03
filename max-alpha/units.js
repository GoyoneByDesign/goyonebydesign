/** Display preferences only. Services keep their documented internal units. */
export const UNIT_SYSTEMS=Object.freeze({us:'United States · °F, mi, mph, ft, lb',metric:'Metric · °C, km, km/h, m, kg'});
export function normalizeUnitSystem(value){return value==='metric'?'metric':'us';}
const number=value=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(value);
export function formatDistance(meters,units='us'){
  if(typeof meters!=='number'||!Number.isFinite(meters)||meters<0)return 'unavailable';
  if(normalizeUnitSystem(units)==='metric')return meters<1000?`${Math.round(meters)} m`:`${number(meters/1000)} km`;
  const feet=meters/0.3048;
  return feet<528?`${Math.round(feet)} ft`:`${number(meters/1609.344)} mi`;
}
export function unitsPrompt(units='us'){
  return normalizeUnitSystem(units)==='us'
    ? ' Use U.S. customary units by default: Fahrenheit for temperature, miles and mph for travel, feet/inches for length, pounds/ounces for weight, U.S. cups/fluid ounces/pints/quarts/gallons for volume, square feet/acres for area, and psi for pressure. Use 12-hour time with AM/PM. Respect explicitly requested units and preserve units in quoted evidence, code, scientific formulas, and medication labels. Convert numeric values correctly; never just change the unit label.'
    : ' Use metric units by default: Celsius, kilometers, km/h, meters/centimeters, kilograms/grams and liters/milliliters. Respect explicitly requested units and preserve units in quoted evidence, code, scientific formulas, and medication labels. Convert numeric values correctly; never just change the unit label.';
}
