# MAX-G Cloudflare and optional local Mac search

MAX-G 1.8.3 includes **https://max-g-search.michael-goyone.workers.dev** as its
default public search address. In **Settings → Connection**, use **MAX-G Cloudflare
(default)** under **Search connection** and leave the optional Worker URL blank.
No address needs to be copied on each phone, tablet or computer. Select **Test web
search** to check current availability; internet access, permission, shared free
limits and the search provider still apply. MAX-G’s AI replies run on the device.

The existing paired Mac companion remains an explicit alternative. Choose
**Paired Mac companion** under **Search connection**, leave the optional URL blank
and save settings. No Cloudflare account, paid AI API or hosted search proxy is
required for this local route. An explicit custom URL takes priority over either
selection. Clearing it restores the selected route. The shared production
Cloudflare Worker permits the GoyoneByDesign website origins, not local launcher
addresses. Use the companion route below on `localhost`/`127.0.0.1`, or open
[hosted MAX-G](https://www.goyonebydesign.com/max-g/) for Cloudflare search.

## Activate the update on Michael’s Mac

The updated source and its new dependency are already installed in the existing
folder on this Mac. The old running process must be restarted to load them:

1. Close the open MAX-G browser/app windows.
2. In the Terminal window running MAX-G, press **Control-C**.
3. Run the same Start command again:

   ```sh
   bash "/Users/user/Documents/Codex/2026-09-10/create-an-image-of-2/outputs/max-g-web/Start MAX-G Companion.command"
   ```

4. Use the newly opened MAX-G window. In **Settings → Connection**, choose
   **Paired Mac companion** under **Search connection**, keep
   **Cloudflare Worker URL (optional)** empty and select **Test web search**.
5. Keep **Check public web before factual answers** on and save the settings.
   Load the local AI model, then try a factual question.

If an old interface remains, close all MAX-G windows and reopen after the app
reports its update is ready. Existing conversations and notes do not need a reset.
Keep using the same browser and local address to retain that browser’s model cache.

For a fresh ZIP installation or an update on another Mac, run **Setup MAX-G
Companion.command** once before Start. The setup installs `truststore==0.10.4`
alongside Playwright. Keep the whole source folder together.

## What changed

- The saved **Paired Mac companion** choice with an empty Worker URL uses the
  authenticated companion for public search. The default choice uses Cloudflare.
- Local search uses Bing’s public RSS search endpoint. The optional Cloudflare
  Worker keeps the original DuckDuckGo route for hosted deployments.
- Search needs no email/cloud-account connection and never reads those accounts.
  Only the current query is sent; the full chat history, notes and attachments are
  not attached to a search request.
- Internet Ask/Allow/Deny still applies in MAX-G Settings. Hourly study can use the
  companion while MAX-G is open, visible, idle, paired and has a loaded model.
- Search transport verifies HTTPS using the Mac’s native certificate trust store.
  It does not disable verification or install new trusted root certificates.
- Results are limited to four public links with short excerpts. Provider errors,
  verification challenges, timeouts and missing evidence remain explicit errors.

Bing’s RSS feed states that it is for personal, non-commercial use. This built-in
route is intended for Michael’s personal companion; commercial deployment needs a
search provider licensed for that use.

The adapter uses a fixed public provider endpoint, authenticated loopback requests,
no query persistence, a 1 MB response limit, a 15-second request limit and a
24-query-per-minute local limit. It does not fetch arbitrary destination URLs or
follow provider redirects. Sources and snippets remain untrusted reference data.
The PWA service worker does not cache search responses.

The first direct DuckDuckGo probe was blocked by that provider. MAX-G does not
solve or bypass its challenge. An independent Bing RSS probe returned readable
public documentation results; the local route therefore uses Bing. Provider formats
and availability can change, so a successful connection test is useful after
updates or network changes. This is retrieval, not cloud model inference.

## If a different message appears

| Message | Next step |
|---|---|
| Pair with the companion | Start MAX-G with its Start launcher and use the paired window it opens. |
| Restart the companion | Stop the older process with Control-C, then rerun Start from the updated folder. |
| Certificate could not be verified | Check the Mac’s date/network certificate setup and rerun Setup. MAX-G will not bypass verification. |
| Provider blocked / unavailable | Try later or use the provider’s website directly. An unavailable search is not proof that Wi-Fi is disconnected. |
| No readable results | Try a more specific query; MAX-G will not invent evidence. |

For conversation without search, switch off **Check public web before factual
answers** and load the local model. Current facts still need retrieval; MAX-G can
report that it cannot verify them. Calculations use the built-in local tools, and
weather uses its separate online weather source.

The hosted PWA defaults to MAX-G’s included Cloudflare address. It can also use an
explicit custom Worker URL or a selected, reachable paired local companion where
the browser permits it. See [DEPLOYMENT.md](DEPLOYMENT.md) for that
optional setup. Native certificate integration follows the
[Truststore documentation](https://truststore.readthedocs.io/en/latest/).

## Historical local-route verification (1.3.1)

The 1.3.1 checks passed: 141 JavaScript tests, 166 Python tests (six optional
browser tests skipped), 44 PWA interface checks and 14 storage checks. The actual
companion entry point also started and shut down cleanly on an isolated test port.

Before Cloudflare became the default, with the Worker URL empty, **Test web search** retrieved four real Bing results in
1.11 seconds. A subsequent factual question retrieved four source links and the
cached local 1B model streamed a response. That complete response took 39.25 seconds;
search speed does not imply equally fast generation or perfect model accuracy.
The model's awkward wording is preserved in the
[live test receipt](verification/local-search-ui-live.json), alongside the request
and timing evidence. The test used no cloud AI API and did not access private
accounts or perform device actions. The existing MAX-G session was left running
so Michael can restart it when ready.
