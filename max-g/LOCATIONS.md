# MAX-G 1.9.7 places, weather and directions

Open [MAX-G](https://www.goyonebydesign.com/max-g/), then **Places & directions**.
Your personal profile is **Michael**. GoyoneByDesign and the company logo appear
separately as the creator credit. Existing personal settings and notes are retained.

## Try it

- “Weather” or “weather update” — use this device’s location
- “Weather tomorrow” — forecast for the current device location
- “Find restaurants near 10001, US”
- “Weather in SW1A 1AA, United Kingdom”
- “Find groceries near K1A 0B1, Canada”
- “Where am I?”
- “Find gas stations near me”
- “Directions to Tokyo Station, Japan”

Enter a city, street address or postal code. **United States is the default
country** when no preference has been saved. Bare five-digit ZIP codes and ZIP+4
use the selected/default country; leading zeros are retained. Explicit country
names take priority. Distinctive full UK and Canadian formats can identify their
country when they do not fit a U.S. ZIP. A saved non-U.S. country remains useful
for overlapping numeric formats. Include the country when searching elsewhere
or when the format alone is ambiguous. MAX-G identifies country hints rather
than presenting them as a GPS fix. [Weather and U.S. units](WEATHER-GUIDE.md)
Use full country names when a region abbreviation could be mistaken for a country.
For example, use **Portland, Oregon, United States**. Choose among multiple matches.
Keep leading zeros in codes such as **02108**. Places without postal codes can use
their city or street address.

Postal matching covers international formats through public providers, but their
datasets do not contain every code or address worldwide. Incorrect fuzzy postal
matches are rejected. Some fallback datasets locate only a larger postal area,
such as the first three Canadian characters or the first five ZIP+4 digits. MAX-G
labels these as approximate area matches. A postal centre is not a building or
your precise location. If lookup fails, check the country, enter a city, or use
the offered map search links.

## Automatic weather location

**Settings → Location & maps → Automatic weather location** is on by default.
Ask “weather”, “weather update”, or another local forecast question. MAX-G asks
the current device for one location; it does not start a background watcher.
Choose **Allow** in the first system/browser location prompt. That permission
normally remains available until it expires or you change it in device settings.
MAX-G cannot override browser or operating-system denial.

The installed Mac app uses native macOS Location Services. If access is denied,
check **System Settings → Privacy & Security → Location Services → MAX-G**.
On other devices, allow location for the browser/site or installed PWA. The
location can come from GPS, Wi-Fi or network estimates; its accuracy depends on
the device. MAX-G requests a fresh fix for explicit current-location requests.
For a repeated bare weather question, it can reuse a fix less than one minute old
after rechecking authorization. Revoked permission prevents reuse, and an older
fix is refreshed so weather can follow you when you travel.

A city or postal code in your question takes priority over automatic location.
When device location fails or is denied, MAX-G uses your saved place first, then
your last successfully resolved explicit weather place. The answer says
**Using your saved location** or **Using your last weather location** so you can
tell which place the forecast describes. That recent record contains only the
place text and country, never device coordinates. If neither location nor a
fallback is available, MAX-G asks for a city or postal code once and can remember
that successfully resolved weather request for next time.

Turning automatic location off uses saved or recent place context without
requesting GPS. An explicit “weather here” request still asks for a one-time
fix. Saving the toggle preserves the coarse fallback; it clears the old device
fix. **Forget location** removes the recent weather place as well as transient
location data. It does not erase a separately saved default; clear that default
in Settings if you want to remove it too.

Weather uses direct public data without loading the local chat model or waiting
for voice preparation. Small forecast responses are cached in memory for one
minute. New lookups have bounded deadlines; latency depends on device location
services, permission prompts, network conditions and public API availability.

## Current location and nearby places

**Use current location** requests one device position. The browser or operating
system asks permission. On phones this may use GPS; on laptops it may use Wi-Fi
or network estimates. MAX-G displays the reported accuracy. HTTPS or localhost is
required. Denied, unavailable and timed-out location requests offer a typed-place
alternative. There is no continuous tracking or background location watcher.

Select Restaurants, Fuel stations, Shopping malls, Supermarkets, Pharmacies,
Cafés or EV charging. Choose a radius from about 0.5 to 3.1 miles (750 m to 5 km internally). Distances and device accuracy use your U.S. or Metric measurement preference. The list contains at
most 12 returned map entries sorted by approximate straight-line distance. It is
not a complete business directory; the closest returned entry may not be the
closest business in reality. Listed hours are not a live open/closed check.

**Google Maps**, **Apple Maps** and **Waze** links hand the destination to the
provider. Waze is offered for driving, Apple for driving/walking/transit, and
Google also for cycling. The selected maps app supplies routes, traffic and
turn-by-turn navigation, using its own permissions and network access. MAX-G
does not run turn-by-turn guidance, detect road hazards, or promise traffic ETAs.
Links open only when selected; MAX-G does not automatically launch a maps app.

Weather can use a selected postal area or a one-time current location. Current,
today, tomorrow, this-week and next-week requests retain their requested period
and the existing animated weather effects. Forecasts remain estimates.

## Settings and data

On the **Places & directions** page, enter a city, address or postal code and its
country, choose the travel mode and nearby radius, then tap **Save location**.
Wait for **Location saved on this device**. These details return when you leave
the page or reopen MAX-G in the same browser. Changes show **Unsaved changes**
until saved. Saving works offline and does not run a search or request GPS.
Leading zeros in postal codes are retained. If storage fails, MAX-G shows an
error and keeps your typed details so you can retry.

The save applies to this browser or installed app on this device; it does not
sync automatically to another device. **Use current location** still provides a
temporary position: Save location requires a typed place and never stores that
GPS fix. **Find this place** searches without saving a new default. Your preferred
maps app is retained. To remove a saved default, clear the default place under
**Settings → Location & maps** and save the preferences there.

**Settings → Location & maps** saves automatic-weather-location preference, a
default country, optional typed place, travel mode, radius and preferred maps app. **Settings → Permissions → Location**
offers Ask / Allow / Deny; browser and OS permission are still required. A clear
request such as “near me”, or local weather with automatic location enabled,
counts as asking for a one-time fix. Denying location clears the device fix while
retaining the coarse weather fallback.

Device coordinates remain in the current tab's memory. They are not added to
profile settings, notes, backups or chat source URLs. If chat saving is enabled,
your typed place requests and human-readable results can be saved as conversation
text. Location responses use no-store requests and are excluded from the app's
service-worker disk cache. Small in-memory lookup caches expire after two minutes.
**Forget location**, factory reset and closing the page clear those caches and
cancel pending lookups. The one coarse `recentWeather` record survives closing
the page and is replaced by the next successfully resolved explicit weather
place. **Forget location** or factory reset removes that record. It does not sync
automatically between devices. Leaving the view or hiding the page cancels active
work.

The browser sends submitted place/country text to a geocoder. A nearby or weather
request sends the selected coordinates to that provider. Opening a map link
shares its destination with that maps service. Inference stays local; public map
and weather retrieval require the internet. The location tools do not require
a Cloudflare search Worker URL or a paid model API.

## Providers and operating limits

- [Photon](https://github.com/komoot/photon) provides OpenStreetMap geocoding.
  Its public server permits reasonable use, without an availability guarantee.
- [Zippopotam.us](https://docs.zippopotam.us/docs/getting-started/) supplies postal
  fallback for supported countries, sometimes only at area level.
- [Open-Meteo geocoding](https://open-meteo.com/en/docs/geocoding-api) provides a
  city/locality fallback and weather. Its free endpoint is for noncommercial
  use under its [terms](https://open-meteo.com/en/terms).
- [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances)
  supplies bounded OpenStreetMap nearby queries at `overpass-api.de`. Its current
  guidance requires an app-identifying User-Agent or Referer and counts regular
  usage across all users of an app. MAX-G sends only its app origin as the
  Referer for this provider; the header excludes page paths, queries, GPS and
  account information. Other location providers receive no referrer. A provider
  rejection or nearby transport error enforces a 30-second pause, without retries.
  The operator suggests roughly 50 requests per day or less as a fair share
  across the whole app; this browser's local limiter cannot enforce
  a global quota. Use a provider-approved or self-hosted service before scaling.
  See the [operator's identification guidance](https://community.openstreetmap.org/t/overpass-api-performance-issues/140598/74)
  and [regular-usage guidance](https://community.openstreetmap.org/t/overpass-api-performance-issues/140598/171).

Requests are submitted explicitly, with no autocomplete traffic, no hourly
location research and no retry loops. Each host is limited in this tab to one
request per second and 12 per minute. Place lookup uses at most three providers. Weather prioritizes the lightweight
postal/city endpoint and has one short total location-lookup deadline; ordinary
place and street searches retain their map-oriented provider order. Limits are local to this tab, not an app-wide quota manager.
Busy services show an error or map handoff instead of invented results. For a
commercial or high-traffic deployment, configure suitable licensed/self-hosted
geocoding and weather services; these shared free endpoints are for this personal
assistant's modest usage. Provider attribution stays with the results.

Official navigation references: [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started),
[Apple map links](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html),
[Waze links](https://developers.google.com/waze/deeplinks),
[browser geolocation](https://www.w3.org/TR/geolocation/).

## Open the right app

Use the installed **MAX-G.app**, [hosted MAX-G](https://www.goyonebydesign.com/max-g/),
or a local HTTP development server. A directly opened `index.html` (`file://`)
checks whether the hosted app is reachable and redirects there if it is. If the
site is unavailable, the page shows the installed-app/website recovery options.
The raw file itself does not run the normal location, module or PWA environment.

## Updating

Refresh MAX-G after the update, and close/reopen other installed MAX-G windows if
the new Places button is missing. Existing local data migrates automatically.
For the local Mac companion edition, restart the companion from the updated
source folder to serve the new modules. No model download or factory reset is
required for location tools.
