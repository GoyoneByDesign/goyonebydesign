# MAX-G browser edition — original GPU and PWA verification

This records the version 1.0 baseline. Version 1.1 retains this runtime and adds
connectors; see [CONNECTOR-VERIFICATION.md](CONNECTOR-VERIFICATION.md) for its
current test counts, native boundaries and repeated UI/storage regression checks.

Tested on September 11, 2026. This is a runnable, tested implementation; it has
not been published to GitHub Pages or deployed to a production Cloudflare account.

## Executed checks

| Check | Result |
| --- | --- |
| Node runtime, cache, state, local tools, exports, voice and Cloudflare HTMLRewriter | All 68 passed with the real Miniflare runtime enabled |
| Full desktop/mobile browser UI integration | 44 checks passed, zero uncaught page errors |
| Additional storage commit/reset/quota-failure integration | 14 checks passed, zero uncaught page errors |
| Actual Intel GPU inference, online and after network-off reload | Passed with the 1B q4f16 model |
| Actual chat UI → Enter → model → streamed DOM reply | Passed, no model redownloads or script errors |
| Actual Worker → DuckDuckGo request using local Cloudflare runtime | HTTP 200, six valid results in 4.67 seconds |
| DOCX, XLSX and PPTX exports | ZIP CRC, XML and all relationship targets valid; opened by python-docx, openpyxl and python-pptx |
| PowerPoint theme/master/layout and save/reopen | Passed |
| Wrangler 4.131.0 production configuration dry run | Passed; no deployment performed |
| Existing desktop source preservation | SHA-256 identical to the pre-existing complete source ZIP |

Run the portable checks from this folder:

```sh
npm test
```

At the 1.0 baseline, the portable suite passed 67 checks and skipped the one real
Worker-runtime check. The full 68-check command also passed. The current suite
includes additional connector checks listed in the version 1.1 report.

The optional real Worker test can also be reproduced with a temporary local
Miniflare installation. It is skipped by default so the app itself requires no
npm dependencies. Use a supported Node version and set `MAXG_MINIFLARE_MODULE`
to the absolute installed `miniflare/dist/src/index.js` path before running the
tests. The deployment guide describes the real local Worker test through Wrangler.

## Real Intel-Mac measurements

Chrome 152, headless test browser, Intel Gen-11 WebGPU adapter, `shader-f16`
supported. The test used a separate browser profile and ordinary supported GPU
settings. Model: `Llama-3.2-1B-Instruct-q4f16_1-MLC`.

| Small 41-token prompt benchmark | Online first load | Cached, network disabled, page reloaded |
| --- | ---: | ---: |
| Model load | 37.54 s | 15.46 s |
| First streamed token after generation request | 14.02 s | 4.54 s |
| Whole 21-token response | 20.24 s | 9.29 s |

The runtime downloaded about 664 MB of weight shards. Combined browser storage
was approximately 726 MB, including about 700.5 MB of IndexedDB model data.
These are observations from this device and test prompt, not performance promises.
Longer MAX-G prompts and answers take longer. Temperature zero did not make the
model follow every instruction correctly in the benchmark.

The offline test unloaded the engine, disabled network access, reloaded the page,
loaded the cached model and completed another streamed response. It covered the
actual UI/service-worker shell, pinned CDN runtime, model assets and GPU execution.
A startup CSP issue found by this real test was fixed: the pinned CDN is permitted
in `worker-src` for WebLLM’s runtime requirements.

A separate end-to-end test loaded the actual app, disabled speech and web-first,
clicked **Load local AI**, and pressed Enter after typing `Hello`. The model
streamed “How lovely to meet you!”: first visible word in 7.34 seconds, completed
in 9.08 seconds. Cached model loading plus initial UI setup took 13.16 seconds.
Six successive text updates were observed without model network requests. A brief
partial protocol bracket seen in the test was subsequently hidden in the renderer.
A focused Stop timing check measured 37 ms to deliver the click and 1.51 seconds
until the app displayed Stopped and released the active task. A slower initial
Playwright polling result was measurement overhead, not the actual cancellation
time. Loading-progress text is cleared when the model unloads.
The dedicated short greeting prompt also fixed an unnecessary search request
produced by the small model under the broader factual-research instructions.

## What was simulated or remains device-dependent

The 44 UI checks used explicit weather JSON and local speech fixtures. They did
not use a real microphone or make sound. No claim is made that microphone input,
voice quality or all eight languages work on every Mac/iPhone. Preview an installed
local voice and test on-device dictation on each target device. The browser rejects
unsupported local dictation rather than using cloud recognition.

The live Worker test used the actual `worker.js`, Cloudflare HTMLRewriter and a
rate-limit binding in a local Miniflare runtime with internet access. It is not a
production-edge load test. A real result mixed a current page title with an older
version in its snippet, demonstrating why search snippets cannot guarantee truth.
Provider bot challenges, HTML changes and free-plan quotas remain possible.

Safari/iPhone hardware inference, Home Screen installation, your live domain,
production Worker origin policy, and deployment certificates need checks after
deployment. Browser-native file picker permission varies by browser. Generated
source was not compiled with iOS, macOS, Windows or Android SDKs. Office exporters
produce basic valid documents, not native-app-equivalent layout fidelity.

## Preserved desktop archive

`desktop/MAX-G-desktop-source.zip` contains 87 source entries and has this SHA-256:

```text
55313fe906036763841733212338cc155151d60b858cf483588172fcb9461f29
```

The copied archive and its pre-existing source package match byte for byte. No
runtime data directories, model cache, Python virtual environment or `.env` files
are included. The installed Python application was not modified during this build.
Its native workflows are not executed by the static PWA; see the capability map in
`README.md`.
