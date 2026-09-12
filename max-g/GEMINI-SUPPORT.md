# Optional Gemini support for MAX-G

MAX-G keeps local Llama as its default reasoning engine. The optional **Ask Gemini** action sends one question through Michael's Cloudflare Worker to Google. It does not send the conversation, memories, profile, attachments, microphone recordings, or account credentials. Gemini support is labelled in the conversation. It does not run automatically after a local error or during hourly study.

## Free tier and privacy

As checked on September 12, 2026, Google's [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite) lists free input/output usage for `gemini-3.5-flash-lite`, subject to project eligibility and quotas. The paid tier also exists. A Gemini app subscription does not determine this API project's billing tier. Check the **API project**, not the consumer Gemini app subscription.

Google's [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) depend on project and tier. Free access is limited and is not guaranteed for every account, region, or future date. The Worker does not upgrade plans, switch models, add Google Search grounding, or retry inference requests. Google Search grounding is not included in the selected model's free API tier; MAX-G's separate DuckDuckGo search continues through Cloudflare.

Google's [terms](https://ai.google.dev/gemini-api/terms) allow submitted content and generated responses from unpaid services to be used to improve products, with regional differences described in those terms. Use this option for non-sensitive questions. It is cloud processing by Google and Cloudflare, so it does not operate offline. Local MAX-G remains available on a device with the model downloaded and a supported GPU.

## Activate using Cloudflare secrets

1. Open [Google AI Studio API keys](https://aistudio.google.com/api-keys). Choose a project explicitly showing **Free** and verify it has no linked billing account or paid-tier upgrade. Review that project's quota and region eligibility. Create or use a key restricted to the Gemini/Generative Language API where Google offers API restrictions. Do not turn on billing for this setup.
2. Open the **max-g-search** Worker in Cloudflare, then **Settings → Variables and Secrets**. Add **Secret** `GEMINI_API_KEY` and enter the Google key directly in that protected field. Never paste it into MAX-G, a chat conversation, GitHub, a frontend JavaScript file, or a URL.
3. Generate a separate, random MAX-G access token. On macOS this copies a 64-character token to the clipboard without printing it:

   ```sh
   openssl rand -hex 32 | pbcopy
   ```

   Store it in your password manager. Add it to the Worker as **Secret** `MAXG_SUPPORT_TOKEN`. This is a different credential from the Google key. It must be 32–256 characters using letters, numbers, hyphens, or underscores. A reset code or Google API key is not a suitable token. Anyone holding this token can consume the support quota.
4. Only after verifying step 1, add a **Text** variable `GEMINI_FREE_TIER_CONFIRMED` with the exact value `true`. This records the owner's verification. It cannot detect later changes to Google's billing or pricing. If the project changes to a paid tier, remove this variable or set it to `false` before using Gemini support.
5. Keep the existing `SEARCH_RATE_LIMIT` binding. Gemini uses the distinct shared key `gemini-support`; search uses its existing key. The configured binding limits each key to 24 requests per minute at each Cloudflare location. This is not a global billing cap or a substitute for Google quotas.
6. Save/deploy the updated Worker configuration. `gateway-worker.js` is the deploy entrypoint and imports both `worker.js` and `gemini-worker.js`; deploy the complete project with Wrangler, or use its correctly bundled build in Cloudflare's editor. No secret values belong in `wrangler.toml` or the bundle.
7. Open [MAX-G](https://www.goyonebydesign.com/max-g/), then **Settings → Connection → Optional Gemini support**. Enter only the separate MAX-G support access token and choose **Use for this session**. The browser keeps the token in memory for this tab only; it is not exported or saved in the profile database. Re-enter it after closing, reloading, or leaving the app.
8. Choose **Check Gemini setup** first. It calls `/support/health` without invoking Google. Once ready, type a short, non-sensitive question, choose **Ask Gemini**, review the exact text, and press **Send to Gemini**. A labelled response confirms actual inference worked. A ready status alone does not test the key with Google or verify billing.

This route accepts only the three existing production website origins. It does not grant local launcher origins, new device permissions, access to email, or access to Google Drive. Use the hosted website on your supported device. Browser origin filtering complements the access token; it is not account authentication by itself.

## Disable or rotate

Choose **Forget access token** in MAX-G to stop using it on that device. Remove `GEMINI_FREE_TIER_CONFIRMED` or set it to `false` in Cloudflare to pause it for every device. Delete/revoke the Google API key if it is no longer needed. Rotate `MAXG_SUPPORT_TOKEN` in Cloudflare if it was exposed; other sessions will then need the new token. Search and local inference do not depend on these settings.

## Request contract and limits

- `GET /support/health` returns public configuration booleans, `ready`, model/provider, and `upstream: "not-tested"`. It does not reveal credentials or make an inference request.
- `POST /support` requires `Content-Type: application/json` and `Authorization: Bearer <MAX-G access token>`. The only accepted body is `{ "question": "..." }`, limited to 4,000 characters and 16 KiB encoded JSON.
- The Worker sends one text question plus a fixed MAX-G support instruction to the official [generateContent API](https://ai.google.dev/api/generate-content), using fixed model `gemini-3.5-flash-lite`, one candidate, temperature 0, and at most 512 output tokens. Temperature 0 does not guarantee accuracy. There are no tools, attachments, history, custom endpoints, or caller-selected models.
- A 30-second deadline covers parsing, authorization, rate limiting, fetch, and body reading. Google responses are bounded to 256 KiB. Internal thoughts, provider metadata, and partial/blocked responses are not passed to the UI.
- Successful JSON is `{ "text": "...", "model": "gemini-3.5-flash-lite", "provider": "Gemini", "cloud": true }`. Errors use fixed `{ "error": "SUPPORT_...", "message": "..." }` messages; raw Google errors and secrets are never returned or logged by this adapter.
- The adapter does not write application query logs or store questions. Cloudflare platform observability and Google's service handling remain subject to their respective configuration and terms.

## Troubleshooting

| Message / code | Meaning and action |
| --- | --- |
| `SUPPORT_NOT_CONFIGURED` | The owner has not added both required secrets, or the token format is invalid. |
| `SUPPORT_FREE_TIER_REQUIRED` | The explicit Free-project verification switch is absent. Verify the project before enabling it. |
| `SUPPORT_UNAUTHORIZED` | The session token is missing, incorrect, or was rotated. Enter the MAX-G token, not the Google key. |
| `SUPPORT_QUOTA_EXHAUSTED` | Google rejected the request for quota. Wait for availability; MAX-G will not switch to paid usage. |
| `SUPPORT_PROVIDER_ACCESS` | Google rejected the configured project's credentials or eligibility. Check that project in AI Studio. |
| `SUPPORT_MODEL_UNAVAILABLE` | The fixed model is unavailable to the project. Review current official model availability; no automatic model switch occurs. |
| `SUPPORT_TRUNCATED` | The short-answer limit was reached. Ask a narrower question. No partial answer is shown as complete. |
| `SUPPORT_TIMEOUT` | The request exceeded its deadline. Continue locally or explicitly try again later. |
| `SUPPORT_ORIGIN_DENIED` | Open the hosted MAX-G website. This endpoint does not allow the local Mac launcher. |

## Development checks

```sh
node --test tests/gemini-worker.test.mjs
MAXG_MINIFLARE_MODULE=/absolute/path/to/miniflare/dist/src/index.js node --test tests/gemini-worker-runtime.test.mjs
```

The tests use fake keys and mocked inference. The optional integration test executes the actual Cloudflare Workers runtime, including its native [timing-safe token comparison](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/#timingsafeequal). Only an owner-configured deployment can verify real Gemini inference and account eligibility.
