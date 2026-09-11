# Publish MAX-G

The existing GoyoneByDesign website supports MAX-G at
`https://www.goyonebydesign.com/max-g/`. Its main navigation and footer link to
this separate app folder. The existing `www` DNS record already serves the site,
so this path needs no additional DNS record. The repository is
`GoyoneByDesign/goyonebydesign`, with the app under `max-g/`.

Website files never include the companion’s private data, recordings, models or
installed Python environments. Each browser keeps its own local profile. A web
address does not synchronize or remotely expose your Mac’s tools. Natural browser
voices and local chat work on a compatible device after their model downloads;
cloning and Mac controls require the companion on that device. Public search still
needs either that companion or a configured deployed search Worker. Places, nearby
lookup and weather use direct public data APIs and need no Worker URL; see
[Location setup and coverage](LOCATIONS.md).

For the optional Worker, include `https://www.goyonebydesign.com` in
`ALLOWED_ORIGINS`; the path `/max-g/` is not part of an origin. The default
`wrangler.toml` now includes both the website and optional app subdomain.

## Optional separate max-g.goyonebydesign.com subdomain

The browser runs MAX-G’s language model locally through WebLLM. GitHub Pages serves the app files; the separate Cloudflare Worker requests public DuckDuckGo search results. No paid AI API or inference server is used. Live search is an online service and therefore cannot operate completely offline.

The existing website above already hosts MAX-G. The following steps are only for a separate repository/subdomain deployment; that optional repository, Worker and DNS configuration have not been provisioned. Your connected GitHub account is **GoyoneByDesign**; these steps use it as the repository owner. The remaining value is the **Worker URL returned by Cloudflare**. If you choose a different organization, use that owner’s GitHub Pages hostname instead. These are deployment settings; the application code is complete.

For account and native-device tools added in 1.1, install the local Mac companion
using [CONNECTORS.md](CONNECTORS.md). GitHub Pages continues to host only the static
app; never publish `companion/private/`, browser profiles or virtual environments.

## 1. Check the device and install development tools

Use a browser with working WebGPU over HTTPS or localhost. MAX-G checks GPU availability before loading its model; GPU support depends on the browser, operating system, and hardware. On an Intel Mac, start with the 1B model and the compatibility model if half-precision GPU support is unavailable. WebLLM is a WebGPU inference engine; this package does not claim a CPU-only model fallback. [WebLLM documentation](https://webllm.mlc.ai/docs/)

Install Node.js 22 or newer if it is missing:

```sh
brew install node
node --version
npm --version
```

Open Terminal in the `max-g-web` folder containing `index.html`, `app.js`, `worker.js`, and `wrangler.toml`. This is a static application: no frontend build command and no Ollama installation are needed for the web edition.

Run the built-in checks:

```sh
npm test
```

The optional Worker runtime test is skipped unless `MAXG_MINIFLARE_MODULE` points to an installed Miniflare module. The unit tests need only Node.js.

## 2. Try the app locally

For the simplest Mac setup with web search, use **Setup MAX-G Companion.command**
once, then **Start MAX-G Companion.command**. Leave the optional Worker URL blank;
version 1.3.1 searches through the paired local companion. No Cloudflare deployment
is needed for this route. See [LOCAL-SEARCH.md](LOCAL-SEARCH.md).

The following static-server plus Worker workflow is an alternative for developing
and publishing the standalone hosted PWA.

In one Terminal window:

```sh
npm run serve
```

Open `http://127.0.0.1:8765/`. Do not double-click `index.html`: `file://` does not provide the app’s service worker environment.

In a second Terminal window, in the same folder:

```sh
npm exec --yes --package=wrangler@4.131.0 -- wrangler dev --env dev --port 8787
```

This runs the Worker locally; it does not publish anything. Its search requests still go to DuckDuckGo. The supplied `dev` environment allows `http://127.0.0.1:8765`, `http://localhost:8765`, and their port-8766 companion equivalents. In MAX-G’s settings, set the search proxy base URL to `http://127.0.0.1:8787`.

Wrangler 4.131.0 is pinned for repeatable deployment and requires Node.js 22 or newer. Update deliberately and re-run the checks when changing versions. [Cloudflare’s Wrangler installation guide](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

## 3. Deploy the search Worker

Create or sign in to a Cloudflare account and keep the **Workers Free** plan selected. No custom Worker domain, paid search key, Workers AI binding, database, or subscription is required.

The supplied `wrangler.toml` has:

- Worker name: `max-g-search`.
- Entry point: `worker.js`.
- Production allowed origin: `https://max-g.goyonebydesign.com`, `https://www.goyonebydesign.com` and `https://goyonebydesign.com`.
- A `SEARCH_RATE_LIMIT` binding: 24 searches per minute, shared across visitors within each Cloudflare location.
- Application observability and Wrangler usage metrics disabled.

The rate-limit namespace `4101` must be unique within your Cloudflare account unless you intend to share its counters with another Worker. Change it to another positive integer if already used; `4102` is the separate local development namespace. The limit is an abuse control, not an exact global usage meter. [Cloudflare rate-limiting API](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

Validate the configuration without publishing, then sign in and deploy:

```sh
npm exec --yes --package=wrangler@4.131.0 -- wrangler deploy --dry-run --env=""
npm exec --yes --package=wrangler@4.131.0 -- wrangler login
npm exec --yes --package=wrangler@4.131.0 -- wrangler deploy --env=""
```

The empty `--env=""` explicitly selects the production configuration; do not deploy `--env dev` for the public app. Cloudflare prints your actual address, shaped like `https://max-g-search.YOUR_WORKERS_SUBDOMAIN.workers.dev`. Copy **that actual address** into MAX-G’s search proxy setting on every device where you use MAX-G. Enter only the base URL, without `/search` or a query string. The setting is local to that browser; it is not synced through GitHub.

You can check the deployed endpoint from Terminal after substituting your actual Worker address:

```sh
curl --get 'https://max-g-search.YOUR_WORKERS_SUBDOMAIN.workers.dev/search' \
  --header 'Origin: https://max-g.goyonebydesign.com' \
  --data-urlencode 'q=Python official documentation'
```

A successful response has this contract:

```json
{
  "results": [{"title": "Page title", "url": "https://docs.python.org/3/", "snippet": "Visible search excerpt."}],
  "provider": "DuckDuckGo",
  "sourceprovider": "DuckDuckGo HTML",
  "timestamp": "2026-09-11T12:00:00.000Z"
}
```

The example describes the JSON format; actual results and time are fetched at request time. Errors are non-200 responses containing `error` and `message`. A bot challenge is reported as `SEARCH_BLOCKED`; the app must show that search is unavailable rather than pretend to have searched.

## 4. Create the GitHub repository

Create a **new, empty, public** GitHub repository named `max-g-web`. Public repositories can use GitHub Pages on GitHub Free. Do not initialize it with a README because this folder already contains the complete source. [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages)

From the `max-g-web` folder, run the following using your connected account:

```sh
git init -b main
git add .
git commit -m "Publish MAX-G browser app"
git remote add origin https://github.com/goyonebydesign/max-g-web.git
git push -u origin main
```

Use GitHub’s normal sign-in flow for Git operations. Never put account passwords, access tokens, private chats, model caches, desktop `data/` files, or `.env` files in the public repository. The packaged desktop source is separate from the browser runtime; consult `README.md` for the capability mapping.

On GitHub, open the repository and choose **Settings → Pages**:

1. Under **Build and deployment**, select **Deploy from a branch**.
2. Select branch **main** and folder **/(root)**, then **Save**.
3. Under **Custom domain**, enter **max-g.goyonebydesign.com**, then **Save**.

The included `.nojekyll` prevents Jekyll processing. The included `CNAME` file contains exactly:

```text
max-g.goyonebydesign.com
```

For a branch-based Pages site, GitHub uses that `CNAME` file together with the repository’s domain setting. [GitHub custom-domain setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

## 5. Add this DNS CNAME record

At the DNS provider for **goyonebydesign.com**, add:

| DNS field | Value |
| --- | --- |
| Type | `CNAME` |
| Name / Host | `max-g` |
| Target / Value | `goyonebydesign.github.io` |
| TTL | `Auto` or `3600` seconds |

**The target must use the actual GitHub account or organization that owns the repository.** The target above is exact for your connected **GoyoneByDesign** account. For example, if the repository owner is `michael-example`, the target is `michael-example.github.io`. Do not include `https://`, `/max-g-web`, or the Cloudflare Worker URL in the CNAME target. GitHub requires the account’s `github.io` domain, without the repository name. [GitHub’s subdomain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

If your DNS interface requires a fully qualified record name, use `max-g.goyonebydesign.com` instead of `max-g`. Replace only conflicting A/AAAA/CNAME records for that exact `max-g` host; leave the main website’s records intact. If Cloudflare is your DNS provider, start with **DNS only** for this record while GitHub validates the domain and provisions HTTPS.

Check propagation:

```sh
dig +short CNAME max-g.goyonebydesign.com
```

It should return your actual account’s `github.io.` hostname. Return to GitHub’s Pages settings after its DNS check succeeds and enable **Enforce HTTPS** when available. Certificate provisioning can take up to 24 hours. Open `https://max-g.goyonebydesign.com/` once HTTPS is ready. [GitHub HTTPS setup](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)

If you also want to test the temporary `https://goyonebydesign.github.io/max-g-web/` address, append its **origin only** to the Worker’s production setting and redeploy:

```toml
[vars]
ALLOWED_ORIGINS = "https://max-g.goyonebydesign.com,https://www.goyonebydesign.com,https://goyonebydesign.github.io"
```

This origin matches your connected account. Do not add a wildcard or a URL path. You can remove the temporary origin after the custom domain works.

## 6. Install and verify MAX-G

Open the HTTPS site, configure the actual search Worker URL, and load the 1B model. The first model load downloads substantial model files; a progress indicator shows this work. Generation streams after initialization and prompt processing. Temperature `0.0` makes decoding more repeatable; it does not guarantee correct answers or eliminate hallucinations.

- **Mac:** In a supported Chrome or Edge browser, use the install control in the address bar/menu. Safari versions that support web apps offer **File → Add to Dock**.
- **iPhone/iPad:** Open the site in Safari, use **Share → Add to Home Screen**, then launch the saved icon. Where Safari offers **Open as Web App**, enable it. Actual model inference still requires supported WebGPU and enough memory on that device.
- **Voice:** Choose a voice and use the voice preview button first. The browser may require an initial click/tap before audio can play. Allow microphone access only when enabling voice input. Available voices and local speech-recognition support depend on the OS/browser; see the app’s settings and `README.md`.

Before relying on offline use, complete this check on each device:

1. Visit the app online and wait for the model to finish loading.
2. Send a short message and verify that a local answer streams.
3. Reload once while online so the installed service worker controls the page.
4. Use browser developer tools’ offline mode, or temporarily disable the device’s connection yourself.
5. Reload. The cached UI should open. Test local chat with the cached model; live search and weather should clearly report unavailable.
6. Restore the connection and verify a fresh web answer with source links.

Browser storage can be evicted when space is low or site data is cleared. An installed icon is not a guarantee that the model is cached forever. The app requests storage persistence where supported and offers model unload/cache controls. Offline startup also requires the downloaded WebLLM runtime and model assets, not just the HTML shell. [WebLLM documentation](https://webllm.mlc.ai/docs/)

## 7. Updates, limits, and troubleshooting

For frontend changes, update the service worker’s cache version when changing cached assets, then commit and push. Existing open windows may need a reload to adopt the new version. Keep the `CNAME` file and `.nojekyll` in the repository.

```sh
git add .
git commit -m "Update MAX-G"
git push
```

For Worker changes, run the tests and the pinned `wrangler deploy --env=""` command again. GitHub Pages cannot execute `worker.js`: the Worker must be deployed separately.

| Symptom | What to check |
| --- | --- |
| UI loads, but search says unconfigured | Save your actual `workers.dev` base URL in MAX-G settings. |
| `ORIGIN_DENIED` / browser CORS error | Match the exact browser origin in `ALLOWED_ORIGINS`; redeploy the Worker. Local ports are part of the origin. |
| `RATE_LIMIT_UNAVAILABLE` | Deploy with the supplied Wrangler file so `SEARCH_RATE_LIMIT` is bound. |
| `RATE_LIMITED` | Wait one minute. The supplied budget is shared per Cloudflare location. |
| `SEARCH_BLOCKED` | DuckDuckGo requested verification or blocked the Worker. Open DuckDuckGo directly or retry later; do not bypass its challenge. |
| `SEARCH_FORMAT_CHANGED` | Review DuckDuckGo’s current HTML, update the bounded parser, and re-run tests. There is no guaranteed stable HTML search API here. |
| Worker 1027 / 1102 | Check Cloudflare’s free request/CPU limits. A free endpoint is not unlimited. |
| No WebGPU / model loading failure | Use a supported browser/OS, enable normal graphics acceleration, close heavy tabs, and try the 1B compatibility model. Do not force unsupported GPU flags. |
| Offline UI works but model does not | Reconnect, finish a successful model load, and repeat the offline check. Site storage may have been evicted. |
| No sound | Select an installed voice, click voice preview, and check browser/system mute and output device. |

Cloudflare currently documents **100,000 requests/day** and **10 ms CPU time per invocation** on Workers Free. Stay on the Free plan to avoid opting into paid usage. The rate binding reduces bursts but does not guarantee availability under abuse or enforce a global daily quota. [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [pricing](https://developers.cloudflare.com/workers/platform/pricing/)

The adapter forwards only the search query to a fixed DuckDuckGo endpoint, returns up to six text snippets, and never fetches arbitrary result pages. It does not store queries in a database/cache or emit application query logs. Cloudflare and DuckDuckGo necessarily process online requests. CORS is a browser access control, **not user authentication**; non-browser clients can forge an Origin header. This public free service is not suitable as a private authenticated gateway without adding a real authentication design.

Search snippets are incomplete third-party material, not proof of truth. The app treats them as references and links their sources. DuckDuckGo makes no guarantee of accuracy, completeness, or uninterrupted availability. This implementation handles challenges and failures explicitly; it does not promise unrestricted access, bypass website restrictions, or guarantee 100% accuracy. [DuckDuckGo terms](https://duckduckgo.com/terms)
