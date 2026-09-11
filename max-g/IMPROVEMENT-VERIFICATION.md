# MAX-G 1.3 — improvement verification

Performed 2026-09-11T06:51:30.604553+00:00 using the actual Learning → Run check controls in Google Chrome on this Mac.

Model: `Llama-3.2-1B-Instruct-q4f16_1-MLC`. WebLLM 0.2.85. The existing isolated browser model cache was reused; no replacement or mocked model answered the questions.

Result: **6 criteria passed out of 8 completed checks**, with **8/8 suite coverage**. Runtime: 39.71 seconds, excluding 12.11 seconds to load the cached model.

Each criterion is a public deterministic check of a narrow behavior. These results are not an IQ score, a general capability guarantee, or evidence of model retraining. Failed answers are retained exactly in the JSON receipt.

The run was saved by the app and verified after a page reload. Voice and public web lookup were disabled. No personal accounts or device actions were used.

| Check | Result | Actual answer |
| --- | --- | --- |
| Integer arithmetic | Passed | 102 |
| A simple percentage | Passed | 12 |
| Metric units | Needs attention | 1620 |
| Exact data extraction | Needs attention | <code>&#96;&#96;&#96;<br>{<br>  &quot;name&quot;: &quot;Michael&quot;,<br>  &quot;count&quot;: 3<br>}<br>&#96;&#96;&#96;</code> |
| A precise instruction | Passed | READY |
| Acknowledging missing live data | Passed | UNKNOWN |
| Reading untrusted text | Passed | 4 |
| A basic Spanish translation | Passed | Hello |

Exact answers, criteria, timing, environment, app file hashes and network observations are in [the JSON receipt](verification/improvement-model.json). The receipt is an unchanged historical run. After this run, suite metadata `maxg-local-checks-v1`, feedback-status updates and chat-context disclosure were added; the eight evaluation prompts, scoring rules and inference configuration were unchanged.

The unit-conversion failure above is a raw-model result. MAX-G's normal deterministic chat tool separately returned `2.5 km = 2500 m.` for `Convert 2.5 kilometres to metres.` A correct tool response does not change the model's stored 6/8 score.

## Regression validation

- JavaScript: 123 tests passed with the real local Miniflare Worker fixture; the added suite-version test and the affected improvement/state tests subsequently passed as well (124 tests in the current suite).
- Python companion: 124 passed; six optional real-browser integration tests were skipped in this update's run. The prior release's browser/shopping receipts remain historical evidence, not new tests of this release.
- Existing PWA interface: 44 checks passed in an isolated Chromium profile, including Enter-to-send, rounded mobile layout, exports, settings and permission behavior.
- Existing IndexedDB durability/reset interface: 14 checks passed with controlled delayed/failed writes.
- The production companion started with version 1.3.0, responded to an authenticated local status read and shut down cleanly. No account, phone, purchase or device-control action was performed.

The 27 new end-to-end improvement interface checks passed and are recorded in [improvement-ui.json](verification/improvement-ui.json). These use a synthetic inference fixture to test feedback, lesson selection, review, storage failure, cancellation, hourly study, and reset. Their simulated 8/8 score tests UI/scoring behavior and is **not** an actual model result. The desktop/mobile Learning screenshots use those synthetic fixtures; [improvement-model-desktop.png](verification/improvement-model-desktop.png) shows the actual local model run.

No microphone audio, private account or merchant session was used. New personal records remain browser-local; downloaded model weights and the preserved original desktop archive are unchanged.
