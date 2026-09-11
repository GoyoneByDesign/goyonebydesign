# MAX-G Voice Studio

## Male voice styles

Open **Settings → Voice Studio**. MAX-G now defaults to the male **Adult** voice.
Choose a style, use **Hear** to compare, and select **Save voice settings** to keep
it on this device:

| Style | Voice | Accent | Delivery |
| --- | --- | --- | --- |
| Young adult | Puck | American English | Lively, slightly brighter, a little quicker |
| Adult | Fenrir | American English | Warm, steady and clear |
| Older-sounding | George | British English | Calmer, measured, slightly deeper |

These labels describe MAX-G’s delivery presets; they are not verified ages of the
source speakers. All three use distinct male identities from the
[official Kokoro voice catalogue](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md).
The same local voice model is reused. Its first load may take time on an Intel Mac;
subsequent previews reuse it while loaded. Pitch, depth/warmth, speed and expression
remain adjustable. The full six-voice selector and your own recorded-voice option
remain available. These neural voices currently speak English; other languages
use your installed local voices, whose gender and availability vary by device.

Existing legacy female neural selections switch once to the male default for this
update, preserving custom delivery controls. Already selected male, cloned or
installed-system voices are retained. Later deliberate choices remain yours.
Refresh the app and close/reopen older MAX-G windows to activate the new controls.

MAX-G 1.4 adds actual neural speech, your own voice recordings, and adjustable
pitch, warmth, speed and restrained expression. It does not reproduce ChatGPT’s
proprietary voice engine or guarantee identical quality. Listen to the previews
before choosing a voice.

## iPhone sound help

1. Refresh MAX-G, then close and reopen all older MAX-G tabs and its Home Screen app so the update can activate. Keep MAX-G visible during this check.
2. Turn up **media volume**. Open **Sound help** below the message box and tap **Play speaker test**. This short tone needs no model download, internet connection or microphone permission. It also recreates the audio context to recover stalled playback.
3. If you hear the tone, tap **Try MAX-G’s voice**. The first natural-voice use on each device downloads a model and may take a few minutes. Progress and errors stay visible below the message box and in Sound help.
4. Leave **Speak replies** on to hear future answers. **Stop voice** cancels speech without canceling your text conversation.

If the tone is silent, check Control Center’s audio destination (Bluetooth or AirPlay may be receiving it), media volume and Silent Mode, then tap the test again. A finished test means the browser completed playback; MAX-G cannot measure what you heard. Browser and iOS versions vary, so these checks do not establish the exact cause on a particular phone.

If the tone works but natural speech fails, open **Voice Studio** to retry loading the voice or explicitly choose an available **Installed system voice**. No paid or cloud speech fallback is added. Voice settings and cached downloads are separate on each device. A cloned voice stored with the Mac companion is not automatically available on your iPhone.

The app requests the browser’s `playback` audio-session mode when available and unlocks audio from direct interactions. Unsupported browsers continue using their existing audio API. It reports stalled playback instead of waiting indefinitely. Mobile browser audio behavior can still require a fresh tap after switching apps or locking the phone.

## Natural voices on your browser

1. Restart the updated MAX-G companion, or open the updated website.
2. Open **Settings → Voice Studio**.
3. Select **Natural neural voice** and choose Heart, Bella, Nicole, Fenrir, Puck
   or George. These are six distinct Kokoro voice identities.
4. Select **Load natural voice**, then **Hear this voice**. The first use downloads
   the speech model, runtime and selected voice; subsequent use reuses browser
   caches. The model runs on this device through a separate CPU/WASM worker.
5. Adjust speed, pitch, depth/warmth and expression, then **Save voice settings**.
   Leave **Speak replies** enabled below the conversation to hear replies.

The current browser Kokoro integration supports English. For the other conversation
languages, select **Installed system voice**; that uses an installed local voice
for that language. The small chat model and each voice engine have different
language capabilities. Changing the chat language does not create a missing voice.

Speed adjusts synthesis rhythm. Pitch shifts playback in semitones and can also
change its duration. Depth is a gentle low-frequency tone adjustment, not a new
speaker identity. Expression introduces small timing and pitch variations; it is
not a claim of human emotions or full expressive-dialogue synthesis. Modest values
usually sound more natural than extreme settings.

**Unload voice model** releases its runtime from memory. Downloads remain cached.
Stop interrupts playback and pending synthesis. Browser storage eviction can remove
cached downloads, and older devices may need time to synthesize the first sentence.

## Record or upload your own voice

Cloning uses the paired Mac companion and an optional local voice installation.
There is no cloud upload or paid inference API. Your Mac must be running the
companion; a website on another device cannot use that Mac’s loopback service.

1. Double-click **Setup MAX-G Voice.command** in the source folder. It installs
   about 252 MB of models plus isolated Python packages; reserve a few GB of disk
   space. A supported Python 3.10–3.12 is required, and the launcher explains how
   to install Python 3.12 if needed. This is separate from the browser voice model.
2. Start the updated companion and use the paired window it opens.
3. In **Voice Studio**, select **Check voice setup & recordings**.
4. Read one of the displayed practice phrases naturally in a quiet room. Click
   **Record my voice**, then **Stop recording**. It stops automatically after
   29 seconds. Microphone capture begins only when you press Record and approve
   the browser’s microphone access.
5. Alternatively, select **Upload my voice recording**. Use a supported audio file
   under 15 MB with one clear speaker, no background music, and 3–30 seconds of
   speech. About 15–25 seconds is a useful starting point.
6. Listen to the recording using its audio player. Give it a name and confirm it
   is your own voice, then select **Save my voice recording**.
7. Choose **My cloned voice**, select the saved recording, and use **Hear this
   voice**. Adjust lightly and save your settings.

The local OpenVoice converter extracts a speaker representation from your reference
and applies it to synthesized speech. This is reference-based tone-color cloning,
not training MAX-G’s language model. Recording more practice phrases creates
alternative takes you can select; it does not secretly accumulate a training set.
On this Intel Mac, the first reference-conversion test took about 170 seconds
including initial compilation and model startup. A fully warmed repeat took about
20 seconds for 5.6 seconds of speech. Allow a few minutes for a first preview;
cloning is a slower, optional choice on this Intel Mac. A good microphone and clean recording matter. Similarity must be evaluated using
your real recording; a synthetic development fixture cannot establish that.

Closing Voice Studio stops recording and discards its unsaved audio. Saved
recordings and derived speaker data stay in the companion’s private data directory.
**Delete selected recording** removes the selected take and its derived data.
A full personal reset also removes voice recordings from the paired companion;
unpaired or unreachable devices require their own reset. Model downloads remain
separate. Voice samples never enter chat prompts, public web queries, the public
website package, or a browser personal-data backup.

## Profile, readability and Orbit

- **Profile:** display name, workspace label, logo/photo, pronouns, time zone,
  greeting, response style and optional personalization. Use the bundled
  **GoyoneByDesign logo**, or choose your own image. Save the profile to keep it.
- **Display & animation:** conversation font size, interface scale, reading font,
  spacing, contrast, message-box height and conversation width. These change
  MAX-G’s interface; they do not change the device’s screen resolution.
- Orbit can dress for Halloween, Christmas, New Year, Valentine’s Day,
  St Patrick’s Day and a configured birthday. Automatic holidays use the device
  calendar. Set a birthday month and day yourself; MAX-G does not invent one.
- Weather props use returned Open-Meteo condition codes: rain brings an umbrella,
  with matching sun, clouds, fog or snow when appropriate. Decorations fade after
  ten minutes. Gentle, lively and off modes respect reduced-motion preferences.

Profile settings are local to each browser. They do not grant website administrator
privileges, sign you into email, or expose your Mac to website visitors. Native tools
still require explicit local pairing and their existing permissions. Public web
hosting does not synchronize private memory, voice samples or account connections.

## Technical sources

[Kokoro’s official browser implementation](https://github.com/hexgrad/kokoro/tree/main/kokoro.js)
documents local WASM/WebGPU inference and the voice model.
[OpenVoice’s official repository](https://github.com/myshell-ai/OpenVoice) and its
[research paper](https://arxiv.org/abs/2312.01479) explain short-reference voice
cloning and tone-color conversion. MAX-G keeps these local implementations separate
from proprietary hosted voice products.
