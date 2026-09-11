# Shopping and call verification

The final synthetic UI run passed **45 checks with no uncaught JavaScript errors** on September 11, 2026. It used the actual MAX-G frontend, companion HTTP server, permission and approval policy, and Playwright browser implementation. A local fixture supplied the merchant page; the local model, OAuth/account providers, voice, and native Mac actions were test adapters. No personal account was opened, no real order was placed, and no real call was made.

| Area | Verified behavior |
|---|---|
| Companion upgrade | A helper without shopping protocol 1 displays a clear update/restart message and cannot launch a shopping browser. |
| Shopping request | Merchant shortcuts render, the list and budget reach the isolated browser, and a natural-language shopping command opens and prefills the controls without placing an order. |
| Cart preparation | A local-model fixture proposes an actual Playwright click. The click waits for a cart-preparation attestation and a separate immutable server approval. The bounded loop pauses at checkout. |
| Final review | The exact items, fulfillment details, masked payment method, total, and currency appear before the final submission. A currency-assumption warning appears in the cart and both purchase dialogs. |
| Total and cart changes | A mismatched review total, estimated-only total, conflicting totals, and an over-budget total cannot complete the approval flow. A price changed after approval causes the server to reject the commit before clicking the merchant. |
| Cancellation and repeats | Canceling final approval leaves the fixture merchant untouched. One approved final action makes exactly one fixture click; repeating the server commit is rejected. Observe retains the purchase-attempt lock. Starting another transaction requires a deliberate acknowledgment. |
| Calls | Both the shopping call button and an Enter-submitted exact-number call command require review. Canceling either produces no native call dispatch. |
| Mobile layout | The shopping page has no horizontal overflow at 390 × 844. Long order and approval dialogs remain inside the viewport and scroll. Desktop and mobile screenshots were visually inspected. |

The [included receipt](verification/shopping-ui.json) records hashes of the tested
frontend and companion source files. Selected fixture screenshots are included in
`verification/`; the full test harness remains in `work/shopping-ui-test` in the
development workspace. They are development evidence, not a live merchant order.

The complete release verification also passed:

- **109 JavaScript tests**, including the real Miniflare worker integration, with no skips.
- **130 Python tests**, with `MAXG_BROWSER_INTEGRATION=1`, including six actual Chromium fixture tests, with no skips.
- **44 existing PWA UI checks** and **14 storage/reset UI checks**, confirming those behaviors remain intact.
- A production companion **1.2.0 / shopping protocol 1** startup and graceful shutdown check.

The previous WebLLM/GPU verification baseline was retained; this release did not repeat the GPU model-inference run. Shopping UI proposals used a deterministic local-model fixture so checkout checks could validate the action flow without depending on model wording or inference speed.

## Run the included automated tests

From the `max-g-web` folder after running the setup launcher:

```sh
source companion/.venv/bin/activate
MAXG_BROWSER_INTEGRATION=1 python -m unittest discover -s companion/tests -p 'test_*.py'
npm test
```

The integration flag allows localhost only in the synthetic test constructor. The production companion continues to restrict its workflow browser to public websites. The included browser tests cover actual fixture controls, checkout review, stale page state, and an uncertain click outcome; the uncertain outcome remains locked instead of being retried automatically. A default Python run skips six browser integration cases, and a default `npm test` run skips one optional worker integration case; those optional integration cases were explicitly enabled for the full release verification above.

## What these checks do not establish

Passing fixture tests does not verify every retailer, delivery service, payment provider, language, Mac configuration, or network condition. Merchant logins, anti-bot checks, regional availability, dynamic checkout pages, fees, and unsupported payment frames may require manual completion. The price parser supports a bounded set of labels and amount formats. A bare `$` or `¥` does not independently identify billing currency; the user must check the merchant's currency, and MAX-G does not convert exchange rates.

An accepted browser click is not proof of an accepted order or a successful charge. The purchase lock protects the current companion process; it does not provide merchant-side idempotency after a restart or reset. Check order history before any retry following an uncertain result. Calls remain native-app handoffs; MAX-G does not verify a connected call or handle a telephone conversation. See [SHOPPING.md](SHOPPING.md) for setup and the supported workflow.
