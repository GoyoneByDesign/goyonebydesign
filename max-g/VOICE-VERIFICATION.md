# MAX-G 1.4 voice, profile and display verification

Verified on September 11, 2026. The browser app is published at
https://www.goyonebydesign.com/max-g/ and linked from the existing homepage.
GitHub Pages deployment of commit
`14f72fbb30386a01de00ee7c0038bc41e8b18cc9` completed successfully. Direct HTTPS
checks returned 200; the live app and service worker match the tested payload.
See `verification/public-deployment.json` and `verification/public-live.json`.

## Completed checks

- JavaScript: 182 tests passed, zero skipped, including the actual Miniflare
  search Worker harness.
- Python companion: 206 tests run, 200 passed and six optional tests skipped.
- Existing browser regression: 44 PWA checks and 14 storage checks passed.
- Profile and display: 15 unit checks and 33 browser checks passed, including
  logo upload, persistence, larger text at narrow mobile widths, and microphone
  permission/cancellation behavior with synthetic media.
- Public `/max-g/` staging: 24 browser checks passed, including offline reload,
  Enter-to-send arithmetic, all three new settings tabs, scoped service-worker
  caching, and preservation of the parent website.
- Orbit: seven unit checks and 16 browser checks passed. Weather effects use
  returned condition codes; reduced-motion and offscreen behavior were checked.
- Voice frontend: 24 focused unit checks and 12 browser cancellation checks
  passed. Stop interrupts playback and pending work; unloading releases runtime
  resources. Live audio metering was separately exercised.
- Companion 1.4 startup and the installed Intel voice runtime were exercised
  from their final paths. Temporary references were deleted and models unloaded
  after verification.

The automated checks do not establish subjective voice quality, perfect cloning
similarity, accessibility on every device, or production availability of external
services. No real microphone recording, personal account action, purchase, message,
or device-control operation was performed during these tests.

## Actual generated audio

`verification/neural-voice-live.json` records real browser Kokoro generation for
Heart, Bella, Nicole, Fenrir, Puck and George. Listen to their WAV files in
`verification/voice-samples/`. These are synthetic public preset voices, not
Michael Allan's voice. The quantized model download was about 92 MB. Generation
took approximately 12–19 seconds for clips lasting 3–5 seconds on this Intel Mac.
A network-disabled reload and subsequent generation also succeeded after caching.

`verification/voice-backend-verification.json` records the permanently installed
local runtime generating a 5.46-second preset clip in 13.4 seconds and a
5.58-second synthetic-reference conversion in 176 seconds. The first conversion
includes compilation and model startup. The warmed timing in
`verification/voice-backend-timings.json` was approximately 20 seconds for 5.6
seconds of speech. A real user recording is still needed to evaluate similarity.

`verification/voice-dsp-verification.json` and
`verification/voice-cancel-verification.json` cover pitch/warmth behavior and
local cancellation/reset cleanup. No recorded voice audio was uploaded to a
cloud service. Public model downloads are required during installation.

## Operational limits

- Browser neural voices currently use English. Other conversation languages
  can use installed system voices; availability depends on the device.
- Cloning requires the running, paired Mac companion. Visiting the public site
  on a phone does not remotely expose the Mac's loopback service or its samples.
- Profiles, memory and preferences are local to each browser. The profile page
  is personalization, not an account-authentication or site-administration system.
- General live web search on the public app still requires its configured search
  Worker, or the paired companion on the same Mac. The website deployment does
  not provision that Worker. Weather and arithmetic have their own tools.
- Display controls change MAX-G's interface size, not the device resolution.
- The old desktop source archive remains in the local release. It was excluded
  from public publishing after automatic approval review rejected that upload.
- The source ZIP excludes private recordings, credentials, model caches and
  virtual environments. Its original desktop archive is checked against its
  original SHA-256 during packaging.

For setup and usage, read `VOICE-SETUP.md`.
