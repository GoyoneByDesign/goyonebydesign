# MAX-G: conversation, weather and musical play

Open https://www.goyonebydesign.com/max-g/ on your device. After an update, close
all MAX-G windows and reopen the page so the new offline version can activate.

## A livelier Orbit

- Ask **“weather in Boston, Massachusetts, USA”** or set your weather city in
  Settings → Connection. A current clear/sunny daytime result gives Orbit dark
  sunglasses. A current temperature or feels-like temperature at or below 10°C
  gives him a scarf. Nighttime and missing day/night data do not trigger glasses.
  Forecasts retain their weather decorations without guessing current conditions.
- Spring brings an occasional silent cartoon sneeze after several idle minutes.
  Choose **Northern** or **Southern** hemisphere in Display & animation. This
  uses the device calendar; it is not a pollen forecast or a medical assessment.
- Type **“dance”**, **“please sneeze”**, **“sing a tune”**, or **“sing and dance”**.
  The buttons beside the composer also work. **Stop play** stops immediately;
  typing **“stop”** also stops the current operation.
- **Settings → Display & animation** contains independent controls for weather
  accessories, spring sneezes, dancing and Music & singing. Still mode and the
  device's reduced-motion preference stop decorative movement. Musical audio
  has its own toggle so it can play with a still Orbit.
- Existing emotion colors, expressive eyes, holiday outfits, birthday setting,
  umbrella and other weather props remain available.

## Original music, version 1.8

- **Dance** creates a 16-second, 96 BPM hip-hop groove: kick, snare, claps,
  swung hi-hats, bass, chords and a melodic motif. Orbit's movement follows
  the beat. The instruments are synthesized on your device.
- **Sing a new song** writes three short English lyric lines and a new melody,
  then sings the words using a built-in male vocal bank. The title and lyrics
  appear in the conversation. “Sing another song” and “sing and dance” work too.
- Each request advances a single saved composition counter. The notes, lyrics,
  chord pattern and timbre vary by seed; MAX-G no longer replays one fixed hum.
  This is a finite procedural composer, not an unlimited music-generation model.
  Clearing/resetting browser data resets the counter; devices have separate histories.
- **Stop play**, a new conversation/task, opening Settings, leaving the app or
  hiding the page stops audio and releases the music worker. Nothing auto-plays
  when MAX-G opens. On mobile, tap the button or press Enter to enable audio;
  a spoken command may require a confirming tap because of browser audio rules.
- Turn off **Music & singing** for silent dance animations. Disable **Dance
  animations**, use Still mode, or enable the device's reduced-motion setting
  for music with no dance movement. The sneezing effect stays silent.

The music runs locally without WebGPU, a loaded chat model, a paid API, or the
Mac companion. Its initial app update includes a roughly 1.3 MB vocal bank;
once the offline app is installed, both dance and song work from the cache.
Use **Sound help** if you do not hear audio, and check the device's media volume.

The singing voice is **stylized synthetic male singing**. It uses short words
synthesized locally with Kokoro, then changes their musical pitch and duration.
It is separate from your conversational voice choice and voice clone. It does
not imitate an artist, sing arbitrary supplied lyrics, or currently sing in
other languages. The limited vocabulary lets short original songs render quickly
without a large singing model. [Vocal sample provenance](assets/song/README.md).

## Conversation and speed

Exact greetings and playful commands now run immediately without loading a
language model or making a search request. Personal and creative conversation is
handled locally; explicit search commands still request web evidence. These
routes are bounded rules, not evidence that the model understands every request.
Math and supported unit conversions retain their deterministic calculation tools.

General chat uses the existing streamed WebLLM model. The 1B choice is the default
for lower memory use; 3B takes more memory. After a model reply, the status bar
shows actual elapsed generation time and time to first text on that device.
**Settings → General → Check this device** tests WebGPU and local audio support.
The model loads only when requested or when a question needs it. Voice Studio
has the six neural voices and the local Mac cloning controls described in
`VOICE-SETUP.md`. Listen to a preview and keep expressive controls moderate.

MAX-G remains a small local model with connected tools. It is not established to
be more accurate or more capable than ChatGPT or Gemini. Temperature zero reduces
random variation; it cannot guarantee correct facts or perfect instruction
following. Reviewed sources, deterministic tools and the checks in Learning help
you evaluate answers. No extra account credentials or private data are published.

## Use on phones, tablets and computers

| Device | How to open MAX-G | Local AI requirement |
| --- | --- | --- |
| iPhone or iPad | Safari; Share → Add to Home Screen | A WebGPU-capable version and enough available memory. Safari 26 added WebGPU. |
| Android | Current Chrome; install/add to home screen when offered | Browser, Android version and GPU must expose WebGPU. |
| Windows | Current Chrome or Edge; install from the browser | Graphics acceleration and a supported GPU/driver. |
| Mac | A supported Safari, Chrome or Edge; add to Dock/install when offered | A working WebGPU adapter. Older Intel Macs may need Chrome or Edge. |

The website can load anywhere with internet, but internet access alone does not
guarantee local model compatibility. The app checks the actual device. Supported
browsers can use the cached UI, calculations and musical play offline after the
initial visit. Language models and natural voices need their first downloads;
the browser may later evict cached files. Native Mac actions and voice cloning
require the paired companion on the same Mac. Profiles, conversations, model
downloads and voice recordings are not synchronized across devices.

General live search from the hosted app still needs your configured search
Worker. On the same Mac, the paired companion can provide search instead.
Weather uses its direct Open-Meteo tool and does not need that Worker.

Sources: [WebLLM browser requirements](https://webllm.mlc.ai/docs/user/get_started.html),
[Safari 26 WebGPU support](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/),
[Open-Meteo weather fields](https://open-meteo.com/en/docs).
