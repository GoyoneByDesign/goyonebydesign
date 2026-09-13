# MAX-G weather and U.S. measurements

## Everyday use

Ask **weather**, **weather update**, **hourly weather**, **weather tomorrow**, or **weather in ZIP code 20171**. Automatic location uses the device you are using, after its location permission is granted. A saved place or your most recent explicit weather area is used as a clearly labeled fallback when location is unavailable.

The current conditions card puts temperature, feels-like temperature, wind, high/low and precipitation chance first. Six hourly temperatures stay visible in a compact grid; the remaining available hours are optional. Forecasts show the place’s local time and the time associated with the data. Reopened chat cards are saved forecast snapshots, not live background updates: ask for weather again to refresh.

Forecasts are estimates and can change. Missing hourly values are shown as unavailable; MAX-G does not generate substitute temperatures. A one-minute memory cache makes repeated checks faster. New coordinates, forecast periods or unit preferences use separate cache entries.

## Seven days and other destinations

Ask **weather for 7 days in 20171**, **seven-day weather in Paris, Texas**, or **7-day weather in Tokyo, Japan**. The card shows each day’s date, conditions, high and low, and precipitation chance. Read aloud speaks the daily forecast rather than only an overall weekly range. “Next week” means the following Monday through Sunday; a seven-day request starts with the destination’s current local date.

A named destination takes priority over GPS and your saved home location. Check the full place heading before using the forecast. If you name only a state or country, MAX-G asks for a city; if several towns match, it asks you to choose. The requested forecast period is retained while you clarify the place.

English voice output expands °F to **degrees Fahrenheit** and °C to **degrees Celsius**, including negative temperatures and ranges. Written temperatures remain compact. The same pronunciation applies to automatic speech, Read aloud and saved weather messages in the web and Mac apps.

## Counties and neighboring towns

Ask **7-day weather in Fairfax County, VA**, **weather in Loudoun County, Virginia**, or **hourly weather in Reston, Virginia**. A county request resolves the exact county name, state and country, then verifies its administrative identifier. MAX-G uses the mapped county center and shows a coverage note. It does not present that point as a county-wide average. Fairfax County is separate from the independent City of Fairfax.

“Loudon” is corrected to “Loudoun” only with Virginia context. Loudon County, Tennessee is a different valid location. When several counties share a name, give the state in your next reply; the county name and original forecast period are retained.

Nearby communities often share a weather pattern, but rain, wind, elevation and temperatures can differ. The [National Weather Service](https://www.weather.gov/documentation/services-web-api) provides forecasts on roughly 2.5-km grids; [Loudoun has separate eastern and western forecast zones](https://www.loudoun.gov/ArchiveCenter/ViewFile/Item/6755). [The Weather Company](https://www.weathercompany.com/blog/the-precision-gap-how-high-fidelity-weather-data-outperforms-one-model-forecasts/) describes location-specific model blending and meteorologist review. These references informed location handling; MAX-G continues to obtain its forecast values from the free Open-Meteo endpoints and attributes them as such.

## U.S. units

**Michael → General → Measurements** selects United States or Metric. U.S. is the default for new and older profiles that have no unit preference. This sets °F, mph, feet/miles, pounds/ounces and U.S. customary volume preferences. Nearby searches still pass distances to map services in their required internal units and convert them for display. Explicitly requested conversions remain available, including metric and Imperial variants. U.S. gallons and Imperial gallons are different units.

## Animation and space

Weather cards use restrained effects based on returned weather: sunny, cloudy, foggy, rainy, snowy, windy, stormy or chilly. The main information stays separate from decoration. **Display & animation → React to returned weather**, **Animate Orbit**, animation intensity and the device’s Reduce Motion setting control movement. Expand details only when wanted. Very small windows, a large text setting or long international place names may still require scrolling; content remains accessible.

## ZIP and postal codes

The default country is United States. Leading zeros in ZIP codes are preserved. ZIP+4 searches can locate the five-digit postal area; they are not a precise street address. Explicit country names take priority for international searches. Some countries share numeric postal formats, so include the country for those searches. Unique supported formats such as full Canadian and UK codes can be recognized automatically.

Lookups use public postal and map providers on demand. They do not store the entire world’s address database in the local model. Coverage varies, and postal areas and accepted city names can change. MAX-G never treats an unreturned code as proof that it does not exist. For U.S. mailing validation, use [USPS ZIP Code Lookup](https://tools.usps.com/zip-code-lookup.htm). Other countries’ postal services remain authoritative for delivery addresses.

## Presentation and data references

- [National Weather Service hourly forecast guide](https://www.weather.gov/wrn/hourly-weather-graph): temperature, wind and precipitation presentation.
- [Open-Meteo forecast documentation](https://open-meteo.com/en/docs): current, hourly and daily forecasts, unit metadata and weather codes.
- [USPS ZIP Code Lookup](https://tools.usps.com/zip-code-lookup.htm): U.S. cities and ZIP codes.

No paid AI API or Cloudflare search credential is required for these direct weather and postal tools. Live data requires an internet connection and provider availability.
