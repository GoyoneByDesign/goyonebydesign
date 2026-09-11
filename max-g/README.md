# MAX-G · browser edition

A complete PWA for Michael Allan, with WebLLM inference on the device, a
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

**Profile** lets you change GoyoneByDesign, use your logo/photo, and set your preferred
style, greeting, pronouns and time zone. **Display & animation** makes text and controls
larger, increases composer height, and adds holiday/birthday outfits, occasional playful
gestures and real-weather props. Motion can be reduced or switched off.

The public web edition is prepared for `https://www.goyonebydesign.com/max-g/`.
Your personal data stays in the current browser; hosting does not synchronize private
notes, recordings, account authorizations or device access. Cloning and Mac actions
need the paired companion on that same Mac. This local owner profile is not a website
administrator login.

## Fixed in 1.3.1: automatic search on your Mac

A paired Mac companion now supplies public web search when **Settings → Connection →
Cloudflare Worker URL (optional)** is blank. You do not need a Cloudflare account
for this local route. Select **Test web search** to check it. The local route uses
Bing's public RSS results; the separately hosted Worker still uses DuckDuckGo.
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
a guarantee of matching or surpassing another AI. No cloud inference is added.
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

Open `http://127.0.0.1:8765/`. Use **Load local AI**, then type a message and press
Enter. Shift+Enter adds a line. The first model load downloads weights; streaming
begins after loading and prompt processing. For public searches, use a paired running Mac companion with a blank Worker URL,
or configure your deployed Worker URL in **Settings → Connection**. Weather and calculations have
separate direct paths. Turn off web-first mode for cached offline conversation.

The default `Llama-3.2-1B-Instruct-q4f16_1-MLC` runs through pinned
`@mlc-ai/web-llm@0.2.85` imported from a CDN. A GPU compatibility 1B model and a 3B
model are selectable. Inference uses a dedicated Web Worker, temperature `0.0`,
a 4,096-token context limit, bounded input, and streamed tokens. No cloud inference
fallback is present. WebLLM requires WebGPU; it does not provide a CPU-only fallback
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
| `tools.js`, `unit-data.js` | Search/weather retrieval, safe arithmetic and existing unit tables |
| `voice.js` | Local installed speech voices and strictly on-device dictation detection |
| `files.js` | Text/source import, editing, ZIP, Word, Excel, slides and print-to-PDF exports |
| `manifest.json`, `sw.js` | Standalone installation and versioned offline UI/library caching |
| `worker.js`, `wrangler.toml` | Configured Cloudflare DuckDuckGo adapter and deployment settings |
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
| Michael Allan identity; warm, lively, candid personality | Retained in the complete system prompt and user preferences | Retained unchanged |
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
