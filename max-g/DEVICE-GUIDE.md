# MAX-G on your current device

Open [MAX-G](https://www.goyonebydesign.com/max-g/) on a phone, tablet or computer.
The same interface and browser tools are delivered to each device. Local AI uses
that device's GPU; natural English speech, calculations, file generation and
animations use its CPU. Online requests use its connection. Opening the website
does not borrow your Mac's processor, account authorizations or installed apps.

## Check and adjust your device

Open **Settings → This device**. Its read-only check shows local AI, speech,
microphone, location, files, internet, offline storage and companion requirements.
It does not record sound, acquire a position, open apps or download a model.
An available browser API is not a guarantee of a working microphone, audible
speaker, installed app handler, sufficient memory or successful connection.

Choose **Device memory mode**, then **Save device settings**:

- **Automatic:** use browser resource hints to release an idle AI model after
  90 seconds on touch/constrained devices, or five minutes otherwise.
- **Use less memory:** release the idle AI model after 90 seconds.
- **Keep model ready:** retain the loaded model while the page remains open.

Active model work is not interrupted. Visible enabled learning/schedules retain
the model so scheduled work can run. Browser suspension can delay timers. Voice
has its existing separate idle-release policy. Unloading releases the runtime;
cached downloads remain and can be loaded again. This saves idle memory but does
not increase the physical speed of a processor or internet connection.

The default 1B model automatically uses its GPU compatibility variant if the GPU
lacks half-precision shader support. This choice is checked at model load, not
only at startup. The actual loaded model is shown and recorded in evaluations.
The compatibility variant uses more estimated memory than the normal 1B variant;
it is not a low-memory substitute. Supported manual 3B choices are preserved.

## Feature coverage

| Feature | What runs on the current device |
| --- | --- |
| Local conversation and source generation | Streamed WebLLM on a compatible GPU, after downloading a model. No paid inference or cloud fallback. |
| Calculations, supported conversions, text/source editing and exports | Browser CPU; model-independent tools remain usable without WebGPU. |
| Natural speaking voice | Local CPU/WASM English speech after its own download. Use Sound help to test output. |
| Other speaking languages | Installed local voices exposed by the browser; availability varies by language/device. |
| Microphone conversations | Verified on-device browser dictation and an available language pack, with microphone permission. Otherwise type or use the device keyboard's dictation under its own privacy settings. |
| Places, postal codes, weather and directions | Current device's connection and optional one-time location permission. Directions open a maps app or website on this device. |
| General live web search | A configured search Worker, or a paired companion on the same device. Internet access alone does not configure search. |
| Calls, messages, email drafts and Spotify | **Connectors & devices → This device** opens supported apps/sites. You finish the call, send or playback there. No completed call/send/play is inferred from opening a link. |
| Shopping and food | Direct store links open on this device. Automated cart preparation still needs the companion; checkout can be completed in the store. |
| Folder writing | Where supported, a folder selected with Full access. Import and ZIP downloads remain alternatives. |
| Email/cloud account automation, cloned voice and desktop control | Current implementation needs the paired Mac companion and its separate account/device authorizations. These are not universally available in a mobile website. |

No browser page can promise full operating-system control on every platform.
Shut down, app management, brightness, desktop interaction and full browser
automation need platform-specific native support. The existing companion's native
controls are implemented for macOS; Windows/Android/iOS native agents are not
included in this update. Helper URLs remain loopback-only so a phone is never
mistaken for another computer's localhost.

WebLLM requires WebGPU. Devices without it can use the non-model tools, but this
release does not add a separate CPU language model. On such a device, use a
supported browser/device for general local AI chat. Feature checks use APIs,
not device-brand names or a guessed browser user agent.

## Current-device app handoffs

In **Connectors & devices → This device**, enter an exact phone number to open
the calling or messaging app. SMS links contain the recipient only; **Copy
message** copies the visible draft for pasting. This avoids incompatible SMS
body-link conventions. An email link can prefill a draft. Sending is performed
by you in the chosen app. Spotify links open a search; they do not confirm music
started playing. Desktop browsers also need an installed handler for phone/SMS
links. The existing authorized Mac automation path remains available when paired.

## Data and permissions

Profiles, saved places, notes, conversations and downloads remain local to each
browser or installed app. There is no automatic cross-device account sync.
Export important personal backups/notes from **Memory & data**. A personal
backup file does not grant another device your microphone, location, files,
connector credentials, pairing or operating-system access. The current import
flow supports notes; full personal-backup restoration is not implemented.

Each device requires its own permissions and initial model/voice downloads.
Offline UI caching does not mean every model is cached. Browser storage can be
cleared or evicted. Missing search setup, denied permission and unavailable GPU
support are reported separately from the browser's online/offline hint.

## Technical references

- [WebLLM getting started](https://webllm.mlc.ai/docs/user/get_started.html)
- [Pinned WebLLM model configuration](https://github.com/mlc-ai/web-llm/blob/v0.2.85/src/config.ts)
- [Browser logical processor hints](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency)
- [Approximate browser device memory](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory)
- [Limits of the browser online flag](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)

Close and reopen old MAX-G windows after an update so the new offline shell can
activate. Native Mac installs also need the updated companion running to serve
the new device-settings modules.
