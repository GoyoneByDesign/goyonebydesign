# MAX-G 1.9.12 county weather and address speech

County weather now resolves the named county separately from neighboring towns or independent cities. Fairfax County and Fairfax City stay distinct. A Virginia-qualified “Loudon” spelling resolves Loudoun County, while Loudon County, Tennessee retains its name. County forecasts identify the mapped county center and explain that conditions vary across the county. Named town/ZIP forecasts remain more local, with seven-day, hourly and U.S. units unchanged.

English speech reads house numbers individually and expands common street, direction, unit and contextual state abbreviations: **2603 Main St, Herndon, VA → two six zero three Main Street, Herndon, Virginia**. Written addresses remain unchanged. ZIP/year/temperature pronunciation is retained; context protects quantities, programming terms, professional initials and room identifiers. [Weather guide](WEATHER-GUIDE.md) · [Voice guide](VOICE-SETUP.md)

# MAX-G 1.9.11 daily forecasts and temperature speech

English voices now speak **78°F** as **78 degrees Fahrenheit**, including negative temperatures, ranges and Celsius. The visible forecast keeps compact °F/°C labels. Postal and year pronunciation remains supported.

Seven-day weather requests show seven dated daily rows and read each day’s conditions, high, low and precipitation chance. Explicit cities, state names/abbreviations and countries are resolved before requesting the forecast. Ambiguous places require a choice; a whole state or country needs a city for a local forecast. [Weather guide](WEATHER-GUIDE.md)

# MAX-G 1.9.10 postal and year pronunciation

English speech now reads ZIP and postal identifiers one character at a time: **20171 → “two zero one seven one.”** Leading zeros are preserved; ZIP+4 separators are silent. International postal letters are spoken individually. Contextual years use natural year readings: **2026 → “twenty twenty six,” 1905 → “nineteen oh five,” 2005 → “two thousand five.”**

Formatting happens only at the speech boundary, so the written answer stays unchanged. Resolved postal identifiers travel with weather/location replies for automatic speech, Read aloud and Hear MAX-G, including saved conversations. Prices, quantities, arithmetic and other languages retain their existing handling. No model download or internet call is needed for pronunciation. Browser, local neural, cloned and installed English voices share these rules; the advanced Mac speech window has matching handling.

# MAX-G 1.9.9 voice recorder recovery

Voice Studio now switches out of playback-only audio mode before requesting the microphone, fixing the Safari/WebKit conflict after MAX-G has spoken. It keeps recording status beside the Record button, shows elapsed time and a live input meter, and provides actionable microphone-permission errors. Waiting and canceled requests release their microphone tracks; closing the studio discards unsaved audio. Browser audio formats are selected by actual support. The Mac app explicitly handles microphone authorization for its local main window.

Open the installed **MAX-G** app for local voice cloning, then **Settings → Voice Studio → Clone my own voice**. Allow microphone access when asked, record 15–25 seconds in a quiet room, stop and listen, confirm that it is your own voice, then save the recording and select **My cloned voice**. The local cloning models are separate from the recorder. Reference-based cloning can approximate your voice; a clean sample and listening comparisons are needed to judge its similarity. [Recording and microphone recovery guide](VOICE-SETUP.md#record-or-upload-your-own-voice)

# MAX-G 1.9.8 U.S. units and compact hourly weather

MAX-G defaults to U.S. customary measurements: **°F, mph, miles/feet, pounds/ounces and U.S. cooking volumes**. Existing profiles receive this preference without clearing personal data. Change it under **Michael → General → Measurements**. Explicit conversion requests keep their requested units.

Weather answers now lead with a compact conditions card, feels-like temperature, wind, high/low, precipitation chance and the next six hourly temperatures. Expand the remaining hours when needed. Forecast times use the selected place’s timezone; U.S. presentation uses AM/PM. Forecast values come directly from the weather service, without loading the chat model. The card’s subtle sun, cloud, rain, snow, wind and chilly effects follow actual returned conditions and respect animation controls and Reduce Motion. The companion remains pinned, while a shorter composer gives the answer more room.

The default country is United States. Enter a ZIP or ZIP+4, including leading zeros, to look up its area. Distinctive international postal formats and explicit country names remain supported. Public postal databases have coverage gaps; a missing lookup is reported, never invented. [Weather, units and postal guide](WEATHER-GUIDE.md)

# MAX-G 1.9.7 automatic local weather

Ask **“weather”**, **“weather update”**, or **“weather tomorrow”**. Automatic weather location is on by default. MAX-G requests one location from the device you are using; select **Allow** in its first browser or operating-system location prompt. On the installed Mac app, MAX-G uses native macOS Location Services. Browsers use their own geolocation permission. Permission remains under your control and may need to be granted again after changing device settings or clearing browser permissions.

Explicit cities and postal codes take priority. If current location is unavailable, MAX-G uses your saved place, then your last successfully resolved explicit weather place, and says which fallback it used. Only that one coarse place and country are remembered; GPS coordinates are never saved. **Settings → Location & maps → Automatic weather location** turns automatic detection off or on. **Forget location** clears the remembered weather place; closing MAX-G keeps it for next time. [Location controls, country hints and recovery](LOCATIONS.md)

For an unqualified postal code, MAX-G can use your saved country, the country of your last weather place, or your device's configured region. The answer identifies this hint. A device region is a locale setting, not GPS or proof of your present country. Include the country when searching elsewhere. If no reliable country context is available, MAX-G asks instead of guessing.

Open the installed **MAX-G.app** or [hosted MAX-G](https://www.goyonebydesign.com/max-g/). Opening a downloaded `index.html` directly now checks the hosted app and redirects there when reachable; an offline screen offers the installed-app and website options. A raw `file://` page cannot provide the normal module, storage, PWA and location environment. The local HTTP server below remains available for development.

# MAX-G 1.9.6 readable chat, fast weather and browser tasks

MAX-G stays pinned above the conversation, replies default to 22 pixels, and long chats scroll independently. A new **Browser task** side panel shows the Mac companion's current page, progress, observed controls and reviewed attachments. Start from the button or ask MAX-G to open a website or help fill a form. Browser planning uses the installed local model with constrained JSON on the Mac; passwords and verification pause for you. The public website exposes the same UI, with Mac automation available only through a paired companion. [Browser task guide](BROWSER-TASKS.md)

Weather goes directly through bounded city/postal and forecast lookups, with recent-location reuse and a small one-minute memory cache, without loading the chat model. A live Tokyo test returned in 1.04 seconds. Text no longer waits for voice preparation; availability and latency still depend on the internet and weather provider. Existing customized display preferences, voices, account connections, personal notes and the native icon remain intact.

# MAX-G 1.8.4 optional Gemini support

MAX-G’s regular conversations use a downloaded local model through WebLLM. **Ask Gemini** adds optional cloud support for a question you review and send explicitly. The Cloudflare server needs a Gemini API key from a project marked Free, a separate MAX-G support access token, and free-tier confirmation before it can answer. The Google API key stays on the server. No automatic provider switch occurs; ChatGPT and Claude are not connected. [Gemini setup, privacy and limits](GEMINI-SUPPORT.md) Optional hourly learning uses public MDN, WebLLM, W3C, Ollama, Python and Playwright documentation excerpts; notes remain reviewable and do not retrain the model. Existing personal notes are preserved. Model capability and accuracy still depend on the selected model and device; this release makes no claim of outperforming other assistants.

Public information requests get one bounded retry for eligible temporary failures, within the original timeout. Stop cancels the request and its retry. Failed factual searches offer **Search this question on Google** and a way to restore the question without overwriting another draft. If retrieval works but the local AI cannot start, MAX-G shows the source excerpts and links rather than losing the retrieved information. The optional Google Search links open ordinary web search separately; they do not provide AI inference or automatic Google-result reading.

MAX-G includes its own public search address: **https://max-g-search.michael-goyone.workers.dev**. After updating, blank URL settings use **MAX-G Cloudflare (default)** on each device without copying an address or signing in to another AI assistant. Explicit custom URLs keep priority. **Settings → Connection → Search connection** can instead select **Paired Mac companion**; leave the optional URL blank and save settings to retain that local route. Internet permissions and personal data are preserved. Select **Test web search** for a real lookup; a configured endpoint is not a guarantee of current availability. Cloudflare's shared free service and the upstream search provider have limits and may be unavailable. [Device guide and recovery](DEVICE-GUIDE.md)

The public website uses the shared Cloudflare service. Local launcher addresses such as `http://127.0.0.1:8766` are not included in its allowed origins. On a local launcher, select **Paired Mac companion**, or open [hosted MAX-G](https://www.goyonebydesign.com/max-g/) for Cloudflare search.

# MAX-G 1.8 original songs and hip-hop dance

**Dance** now plays an original hip-hop instrumental with a beat-matched Orbit. **Sing a new song** composes a fresh short melody and three lyric lines, then sings those words with a built-in stylized male voice. The lyrics appear in chat. A bounded counter keeps compositions changing across plays and reloads in the same browser. **Stop play** stops both audio and movement; **Settings → Display & animation → Music & singing** controls sound independently of motion. The small singing sample bank is cached with the app, so no AI model or paid API is needed for musical play. [Music controls and limits](COMPANION-PLAY.md)

# MAX-G 1.7 current-device support

**Settings → This device** checks feature support and saves an automatic, lower-memory or keep-ready mode. The default local model adapts to GPU compatibility at load time. **Connectors & devices → This device** adds calling, messaging, email-draft and Spotify handoffs; store links also open directly without the Mac companion. Existing native Mac workflows remain available when paired. Browser capabilities and device permissions still determine availability; profiles and account connections do not automatically sync. [Device guide and coverage](DEVICE-GUIDE.md)

# MAX-G 1.6.3 save places

**Places & directions → Save location** now saves your typed place, country, travel mode and nearby radius directly from the Places page. A visible confirmation appears after the save completes, and edited fields show **Unsaved changes**. Saved details return after reopening MAX-G in the same browser, including offline. Your preferred maps app is retained; saving does not request GPS or search the internet. [Places guide](LOCATIONS.md)

# MAX-G 1.6.2 iPhone sound recovery

**Sound help** below the message box now includes a short local speaker test, a direct voice retry and visible download/playback status. Audio selects media playback mode where supported and primes playback on eligible Send/Enter gestures when Speak replies is enabled. Stop voice leaves the text conversation available. This fixes app-side audio startup and recovery gaps; physical iPhone output still depends on device/browser settings. [iPhone sound steps](VOICE-SETUP.md#iphone-sound-help)

# MAX-G 1.6.1 male voice styles

**Voice Studio** now offers **Young adult**, **Adult**, and **Older-sounding** male presets with individual previews. Adult is the new neural default. Each uses a distinct voice with modest delivery changes; age labels describe the sound. All existing voices, cloning and custom controls remain available. [Voice choices and setup](VOICE-SETUP.md)

# MAX-G 1.6 places update

Your personal profile is now **Michael**, with **Created by GoyoneByDesign** and the company logo shown separately. **Places & directions** adds international postal/city lookup, optional one-time device location, nearby businesses and Google Maps / Apple Maps / Waze navigation links. **Settings → Location & maps** manages defaults; **Permissions → Location** controls access. [Location guide and coverage](LOCATIONS.md)

# MAX-G 1.5 companion update

Open [MAX-G on GoyoneByDesign](https://www.goyonebydesign.com/max-g/). This update adds weather sunglasses and a scarf, optional spring sneezes, a short original humming tune and dancing, faster local greetings, and a device compatibility check. Read [Companion play and device guide](COMPANION-PLAY.md) for controls and current limits.

# MAX-G · browser edition

A complete PWA for Michael, with WebLLM inference on the device, a
separate DuckDuckGo search Worker, an animated Orbit companion and local personal
storage. Start with [DEPLOYMENT.md](DEPLOYMENT.md) for the tested setup commands and
`max-g.goyonebydesign.com` configuration. No paid model API or hosted inference
server is used. The search Worker is an online service with a free-tier quota.

## Added in 1.4: Voice Studio, profile and readable animated UI

**Voice Studio** adds six distinct Kokoro neural voices running in a browser worker,
plus an optional local OpenVoice conversion runtime for your own recorded or uploaded
voice. Adjust speed, pitch, vocal warmth and restrained expression. Natural browser
voices currently support English; installed system voices retain the other language
paths. This Intel Mac produced a short neural clip in 12–19 seconds, so voice
preparation is not instant. [Voice setup and recording guide](VOICE-SETUP.md)

**Profile** lets you change Michael, use your logo/photo, and set your preferred
style, greeting, pronouns and time zone. **Display & animation** makes text and controls
larger, increases composer height, and adds holiday/birthday outfits, occasional playful
gestures and real-weather props. Motion can be reduced or switched off.

The public web edition is prepared for `https://www.goyonebydesign.com/max-g/`.
Your personal data stays in the current browser; hosting does not synchronize private
notes, recordings, account authorizations or device access. Cloning and Mac actions
need the paired companion on that same Mac. This local owner profile is not a website
administrator login.

## Fixed in 1.3.1: automatic search on your Mac

A paired Mac companion supplies public web search. In current releases, select
**Settings → Connection → Search connection → Paired Mac companion**, leave
**Cloudflare Worker URL (optional)** blank, then save settings. You do not need a
Cloudflare account for this local route. Select **Test web search** to check it.
The local route uses Bing's public RSS results; the hosted Worker retrieves public
search results separately.
[Restart and troubleshooting steps](LOCAL-SEARCH.md)

On this Mac the new dependency is already installed. Restart the companion and
close/reopen MAX-G windows to activate the update. For a fresh ZIP installation or
an existing environment on another Mac, rerun the Setup launcher before Start.

## Added in 1.3: feedback, reviewed lessons and local checks

Rate replies **Helpful** or **Needs work**, add a correction, then open **Learning**
to review it as a lesson. Only enabled, relevant lessons enter later chat prompts.
Run the small local check suite to inspect exact answers, model, elapsed time and
criteria passed. New hourly study notes wait for review in **Memory**; research
cannot overwrite your personal notes. All improvement data is bounded, exportable
and removable. [Improvement guide](IMPROVEMENT.md)

This adds personal reference memory and measurements, not model weight training or
a guarantee of matching or surpassing another AI. These learning tools use local inference.
The actual Intel Mac model baseline passed 6 of 8 narrow checks; the exact
failures and verification limits are in [IMPROVEMENT-VERIFICATION.md](IMPROVEMENT-VERIFICATION.md).

To use this update, deploy all the web files together using the existing deployment
guide, or restart the companion from this updated source folder. Close and reopen
all MAX-G windows after the service-worker update is ready. Your existing local
profile gains empty feedback/lesson/check collections automatically; no factory
reset is required. A different browser, origin or port has a separate profile.

## Added in 1.2: shopping and food orders

Open **Connectors & devices → Shopping & food** to prepare a shopping request,
choose a retailer or restaurant website, set a budget, and work through the cart
in MAX-G’s separate browser. Checkout uses a fresh page observation and an explicit
order review. Availability varies by website; unclear totals, payment/login fields,
and verification checks require your input. Existing exact-number calls open the
Mac calling app. MAX-G does not conduct a spoken restaurant conversation over the
phone. [Shopping and calls guide](SHOPPING.md)

The updated Mac companion must be restarted for shopping support. Its protocol
version is checked before the client uses shopping actions. No real purchase or
phone call was performed while building this update.

## Added in 1.1: connectors and Mac companion

Open **Connectors & devices** for email/cloud accounts and Mac automation.
Follow [CONNECTORS.md](CONNECTORS.md) to install and launch the local companion.
Google, Microsoft and Dropbox use real OAuth adapters; Yahoo/iCloud and other
configured mail accounts use Apple Mail. The companion adds app, volume,
brightness, Spotify, Messages, calling, power and observed browser/desktop tools.
Inference remains local WebLLM. Account consent and native permissions are required;
no personal accounts or native send/power actions were exercised during testing.

The capability map below describes the original standalone web boundary. The new
local companion supplies supported native actions without modifying the preserved
desktop app. [New capability and setup details](CONNECTORS.md)

## Run the standalone web edition

```sh
npm test
npm run serve
```

Open `http://127.0.0.1:8765/`. Weather and calculations are ready without loading
a chat model. For general conversation, use **Load local AI**, then type a message and press
Enter. Shift+Enter adds a line. The first model load downloads weights; streaming
begins after loading and prompt processing. On this local address, choose **Paired Mac companion** in **Settings → Connection**
for public searches, or open the hosted website for the included Cloudflare
connection. An explicit custom Worker URL remains an alternative. Weather and calculations have separate direct paths. Turn off web-first mode for cached offline conversation.

The default `Llama-3.2-1B-Instruct-q4f16_1-MLC` runs through pinned
`@mlc-ai/web-llm@0.2.85` imported from a CDN. A GPU compatibility 1B model and a 3B
model are selectable. Inference uses a dedicated Web Worker, temperature `0.0`,
a 4,096-token context limit, bounded input, and streamed tokens. No automatic cloud inference
fallback is present; the separate Ask Gemini action is explicitly selected. WebLLM requires WebGPU; it does not provide a CPU-only fallback
in this project. Temperature zero reduces sampling randomness; it cannot guarantee
accuracy. [WebLLM usage](https://webllm.mlc.ai/docs/user/basic_usage.html)

## Files in this package

| File | Responsibility |
| --- | --- |
| `index.html` | Complete responsive UI, iOS metadata, PWA links, module initialization |
| `style.css` | Rounded desktop/mobile interface and Orbit’s 18 expression states |
| `app.js` | Conversation, routing, settings, permissions, files, memory, skills and schedules |
| `engine.js`, `inference-worker.js` | Pinned WebLLM, WebGPU checks, streaming, stop/unload/cache management |
| `state.js` | Bounded personal IndexedDB state and exact reset-code recognition |
| `locations.js`, `locations-ui.js`, `locations.css` | International place/postal lookup, automatic one-shot weather location, coarse recent-place fallback, nearby results and maps handoffs |
| `tools.js`, `unit-data.js` | Search/weather retrieval, safe arithmetic and existing unit tables |
| `voice.js` | Local installed speech voices and strictly on-device dictation detection |
| `files.js` | Text/source import, editing, ZIP, Word, Excel, slides and print-to-PDF exports |
| `manifest.json`, `sw.js` | Standalone installation and versioned offline UI/library caching |
| `gateway-worker.js`, `worker.js`, `gemini-worker.js`, `wrangler.toml` | Cloudflare entry point, public search and authenticated optional Gemini support |
| `gemini.js` | Bounded client for explicit cloud-support requests; no Google API key in the browser |
| `CNAME`, `.nojekyll` | GitHub Pages custom-domain publishing |
| `icons/`, `assets/` | Complete app icons and Orbit branding |
| `desktop/MAX-G-desktop-source.zip` | The complete, unmodified previous desktop source package |
| `tests/` | Runtime, cache, proxy, connector and local-tool checks |
| `connectors.js`, `connectors.css` | Account, email, cloud, Mac and browser controls |
| `companion/` | Local Python action service, OAuth/Keychain, native tools and Playwright |
| `Setup MAX-G Companion.command`, `Start MAX-G Companion.command` | Complete Mac setup and launch scripts |

There are no “insert previous logic here” sections. The browser implementation is
complete; the desktop source is also included in full. Browser security makes
literal native-feature parity impossible under an entirely browser-only
architecture. The map below identifies the actual behavior rather than promising
OS access a PWA cannot obtain.

## Preservation and capability map

The installed Python MAX-G application was not edited during this migration.
Its complete source ZIP is bundled for independent installation, inspection and
continued native workflows. It is not executed by the PWA, and the PWA does not
connect to Ollama or any paid AI API. Pairing the optional companion explicitly
connects it to the local Python connector service.

| Existing MAX-G feature | Browser edition | Complete desktop edition |
| --- | --- | --- |
| Michael identity; warm, lively, candid personality | Retained in the complete system prompt and user preferences | Retained unchanged |
| Globe, white eyes, moving hoop, emotional color/motion | SVG/CSS, 18 states, talking/listening/thinking; reduced motion | Original animated native avatar |
| Chat, Enter/Shift+Enter, queued message, Stop | Retained; bounded local sessions; stale results discarded | Retained unchanged |
| Six expressive voices | Six delivery profiles using locally installed browser voices; available voice identities vary | Six installed English voices and language engines |
| Eight language choices | Retained; fluency varies with the small selected model and installed voice | Original language/Whisper/Tagalog paths |
| Microphone and hands-free voice | Only when the browser provides on-device SpeechRecognition and its language pack; no server-recognition fallback | Native offline speech recognition |
| Live web research, citations, current weather | Worker search snippets, direct Open-Meteo, bounded evidence, source links | Original bounded page-reading research |
| Arithmetic and unit conversions | Restricted expression parser; existing conversion tables ported; results use bounded JavaScript numeric precision | Original Decimal calculator |
| Memory, unload/delete, reset `1435254` | IndexedDB notes, import/export, reset typed or recognized as a whole utterance | Original local note files/reset barrier |
| Limited/Full and Ask/Allow/Deny | Browser-scoped grants; Full adds a picker-selected folder where supported | Original app/tool boundary enforcement |
| Research learning every hour | While visible/open/idle, model loaded, proxy configured and permission allows; fallible snippet-based notes | Original full public-document sections |
| Reusable skills and periodic schedules | Bounded local skills and research schedules; no closed-app execution | Original local workflow scheduler |
| App/source creation and editing | Complete generated source files, editable working copy, ZIP or selected-folder writes; no claimed SDK compile | Original multi-file coding loop, backups and sandboxed Python tests |
| Documents, spreadsheets, slides | Real DOCX/XLSX/PPTX ZIP packages, Markdown, CSV analysis, browser print/Save PDF | Original richer Word/PDF/Excel/PowerPoint workflows |
| PDF/Office attachment extraction | Use complete desktop edition; browser imports text/source/CSV/JSON | Retained unchanged |
| Playwright and autonomous control of other websites | New local companion: isolated browser, observed actions and reviewed bounded agent loop | Retained unchanged |
| Wi-Fi disconnect/reconnect, OS tests and native device access | New companion provides selected Mac actions; original desktop remains the Wi-Fi/OS-test route | Retained unchanged |

A model cannot obtain another AI service’s private knowledge or become infallible
by reading its documentation. Learning saves reference notes; it does not retrain
weights or automatically modify code/tools. Source-generated instructions never
trigger file actions, searches, permissions or reset. Only direct UI/user commands
dispatch tools. File generation produces source for review, not a signed or
compiled iOS/macOS/Windows/Android application.

## Privacy, offline behavior and memory

- Chat inference and personal notes run locally. A public search sends only the
  current query to your Worker and DuckDuckGo; selected file contents, prior chat,
  personal instructions and saved notes are not sent to those services.
- The Worker uses fixed DuckDuckGo endpoints, exact-origin CORS, response limits,
  a timeout and a rate binding. It is not an open URL proxy or a bypass for logins,
  paywalls, CAPTCHAs or website policy. CORS is not authentication. Search can fail,
  and source snippets can be incomplete or wrong.
- A successful first visit caches the UI. The exact pinned WebLLM library is cached
  separately; WebLLM’s IndexedDB cache owns weights, tokenizer, configuration and
  WASM. Complete a model download and successful reply before testing offline.
  Changing model requires that model’s own cached downloads. Browser eviction can
  remove any cache. [WebLLM caching](https://webllm.mlc.ai/docs/user/advanced_usage.html),
  [WebKit storage behavior](https://webkit.org/blog/14403/updates-to-storage-policy/)
- Personal state is capped at 12 chats × 20 exchanges, 60 notes, 20 skills, 10
  schedules and 24 study receipts. Chats are not persisted unless enabled. Web
  answers are not automatically learned. Attachments and working files stay in
  tab memory until downloaded. Model downloads use much more disk space than notes.
- Stop cancels active search/generation/voice; a foreground message preempts a study
  task. Factory reset clears this browser’s personal data and current working files
  but retains downloaded base model weights. Cache removal is a separate control.
  The reset code is a convenience command, not an authentication secret.
- Note-save confirmations wait for the IndexedDB commit. The profile status shows
  pending or failed saves; wait for completion before closing the app.
- Supported browsers use a Web Lock to allow one active MAX-G personal-data window
  per origin. A second window asks you to close the first and reload. This avoids
  competing schedulers and personal-state overwrites.
- Connector results shown in chat follow the same optional chat-history setting.
  Account tokens remain in Keychain; raw mailbox lists and cloud files are not
  automatically learned. Connected private contents used for rewriting stay local.
- Browser speech synthesis uses only voices marked local. Recognition requires
  `processLocally=true` and an available on-device pack; unsupported browsers keep
  typing available rather than silently uploading microphone audio.
  [MDN on-device speech](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)

## Working with files

Import up to six text/source files with a combined limit of 500 KB. **Work studio**
keeps copies, allows editing, creates focused source files, and exports a ZIP.
Full browser access enables **Write files to a chosen folder** where the File System
Access API exists; it still requires a browser picker and permission. That action
can replace same-named files in the selected folder. Limited mode uses downloads.

For reports, enter text or use the last answer; export Word/Markdown or print to
PDF. Excel expects CSV with a header; PowerPoint splits slides at Markdown headings.
These basic deterministic Office exporters do not reproduce the native edition’s
layout engine, attachment parsers, compile tools, or test sandbox. Generated source
is never evaluated in this page. The included desktop source is the complete route
for those native capabilities.

## Hosting and browser compatibility

The connected GitHub account is **GoyoneByDesign**. DNS for its repository is:

| Type | Host | Target |
| --- | --- | --- |
| CNAME | `max-g` | `goyonebydesign.github.io` |

Use `max-g.goyonebydesign.com` in GitHub Pages → Custom domain and enable HTTPS.
The Worker URL is configured separately after deployment. No repository, Worker
or DNS change was published by this build. [Exact deployment steps](DEPLOYMENT.md)

Use current Chrome/Edge with WebGPU for the first Intel-Mac check. Safari’s WebGPU
availability depends on OS and hardware, and model allocation must be tested on
any target iPhone. Installing a PWA does not give it native OS privileges or make
background timers reliable when suspended. The app reports capability/load errors;
there is no hidden cloud or CPU-model fallback.

## Release checks

See [SHOPPING-VERIFICATION.md](SHOPPING-VERIFICATION.md) for version 1.2 checks,
[CONNECTOR-VERIFICATION.md](CONNECTOR-VERIFICATION.md) for the version 1.1 baseline,
and [VERIFICATION.md](VERIFICATION.md) for the original real-GPU baseline and device limits.
Before a public release, test your deployed Worker from the custom HTTPS origin,
verify search failures, model reload offline, mobile installation and the chosen
local voice/recognition language on each target device. Cloudflare’s free tier has
usage limits; no zero-cost or uptime guarantee is made beyond staying on its free
plan without paid APIs. [Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/)

## iPhone, iPad and shared app updates

Install the free Home Screen app from [Get MAX-G](https://www.goyonebydesign.com/max-g/install.html). Follow [the iOS installation guide](./IOS-INSTALL.md). The website, iOS/iPadOS Home Screen app and Mac share release **1.11.0 / build 206**. Open **Settings → Install & updates** to see the version and check/apply a release. Shared updates do not sync private data between devices.

The PWA caches a complete release with SHA-256 integrity checks; partial website deployments keep the previous cache. Mac downloads verified UI snapshots and switches only on its next launch. Native tools, local models, recordings and personal data remain outside this updater. A release can set `min_companion_build` when new native functionality needs an installer.

Before publishing future releases, update `package.json`, `release-version.js` and the release constants/cache version in `sw.js`, then run `python3 scripts/build-release.py`. Publish **all changed app files and release.json in the same repository commit**. Never publish local companion/private/model folders. Keep the Mac native/companion version in step when its code changes.


### Quick understanding and illustrated research (1.11.0)

MAX-G interprets common weather/place typos and short requests such as `wheather 20171`, `7days`, `news`, `who Ada Lovelace`, and `about Saturn`. A short public topic can support follow-ups for five minutes in the open conversation. Names, street addresses, source code and action commands are preserved; ambiguous requests ask for clarification. This improves request handling, not model training or consciousness.

Public questions show source cards while local AI is still unloaded. Settings → Connection → Illustrated public answers controls this automatic lookup on both web and Mac; disabling it and web-first answers prefers local knowledge. Internet-denied and private conversations are not sent to public research. BBC News and Sky News RSS supply recent headlines and publisher images through MAX-G’s existing Cloudflare Worker. Topic background uses an exact Wikipedia article or validated redirect and a freely licensed Wikimedia Commons image with attribution. Ambiguous subjects, missing photos and blocked image downloads keep readable text; no stock or generated photo is substituted. A sharing image may be archival or a logo. Each card ends with its original-source link. Small models can still make errors; sources and publication dates remain visible.

Only the current public topic is sent to research services, without chat history, notes or attachments. Images load only when internet permission permits. Research metadata is bounded to 9 KiB per reply; the optional history setting still controls saving. Up to eight topic summaries remain in a short RAM cache, cleared on a new chat, reset or closing the page. The news Worker only retrieves fixed publisher feeds; it is not an arbitrary website proxy.

Installed iPhone/iPad layout now insets the entire app and glowing border around the status area and home indicator, including a fallback when Safari reports zero safe-area values. Keyboard and orientation changes keep the composer visible. Physical device checks remain important because browser automation cannot reproduce every iPad status-bar layout.
