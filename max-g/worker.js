/** MAX-G public search adapter. Deploy separately from GitHub Pages with Wrangler.
 * This is deliberately a single-provider search adapter, not an arbitrary URL proxy.
 * No chat history, source files, cookies, credentials, or model inference are sent here.
 */
const SEARCH_ENDPOINT = "https://html.duckduckgo.com/html/";
const DEFAULT_ORIGIN = "https://max-g.goyonebydesign.com,https://www.goyonebydesign.com,https://goyonebydesign.com";
const MAX_QUERY = 500;
const MAX_BYTES = 1024 * 1024;
const MAX_RESULTS = 6;
const TIMEOUT_MS = 12000;

export class SearchError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.name = "SearchError";
    this.code = code;
    this.status = status;
  }
}

export function allowedOrigins(env = {}) {
  const entries = String(env.ALLOWED_ORIGINS || DEFAULT_ORIGIN).split(",");
  return new Set(entries.flatMap((entry) => {
    try {
      const value = entry.trim();
      const url = new URL(value);
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      return value === url.origin && !url.username && !url.password &&
        (url.protocol === "https:" || (local && url.protocol === "http:"))
        ? [value] : [];
    } catch { return []; }
  }));
}

export function normalizeQuery(value) {
  if (typeof value !== "string" || value.length > MAX_QUERY || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new SearchError("INVALID_QUERY", "Enter a search query of 1–500 characters without control characters.", 400);
  }
  const query = value.replace(/\s+/gu, " ").trim();
  if (!query) throw new SearchError("INVALID_QUERY", "Enter a search query.", 400);
  return query;
}

// HTMLRewriter may deliver character references in text chunks. Decode once only;
// the browser must still render these strings with textContent, never innerHTML.
export function plainText(value, limit = 700) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return String(value).replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, code) => {
    if (code[0] !== "#") return entities[code.toLowerCase()] || match;
    const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : "";
  }).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/gu, " ").trim().slice(0, limit);
}

export function safeResultURL(href) {
  if (typeof href !== "string" || href.length > 8192) return null;
  try {
    let url = new URL(href, SEARCH_ENDPOINT);
    if (["duckduckgo.com", "www.duckduckgo.com", "html.duckduckgo.com"].includes(url.hostname) && url.pathname === "/l/") {
      const destination = url.searchParams.get("uddg");
      if (!destination) return null;
      url = new URL(destination);
    }
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    // Result destinations are links only: the Worker never resolves or fetches them.
    // Exclude IP literals and common local-only names, plus non-HTTPS schemes.
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") ||
        !host.includes(".") || /[:\[\]]/.test(host) || /^[\d.]+$/.test(host) ||
        /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host) ||
        host.endsWith(".home.arpa")) return null;
    url.hash = "";
    return url.href;
  } catch { return null; }
}

export async function readBounded(response, maxBytes = MAX_BYTES) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel();
    throw new SearchError("UPSTREAM_TOO_LARGE", "Search returned an oversized response.");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new SearchError("UPSTREAM_TOO_LARGE", "Search returned an oversized response.");
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}

export async function parseResults(html, Rewriter = globalThis.HTMLRewriter) {
  if (/anomaly-modal|anomaly\.js|challenge-form|id=["']challenge|bots use DuckDuckGo|select all squares/i.test(html)) {
    throw new SearchError("SEARCH_BLOCKED", "DuckDuckGo requested a browser verification. Search is temporarily unavailable; open DuckDuckGo directly or try later.", 503);
  }
  if (typeof Rewriter !== "function") throw new SearchError("PARSER_UNAVAILABLE", "The search parser requires the Cloudflare Workers runtime.", 503);
  const rows = [];
  const stack = [];
  let noResults = false;
  const rewriter = new Rewriter()
    .on(".result", {
      element(element) {
        const row = { title: "", snippet: "", url: null, ad: /(?:^|\s)result--ad(?:\s|$)/.test(element.getAttribute("class") || "") };
        stack.push(row);
        // Bounded response size caps the parser work; cap retained rows as well.
        if (rows.length < 30) rows.push(row);
        element.onEndTag(() => { if (stack.at(-1) === row) stack.pop(); });
      },
    })
    .on(".result__a", {
      element(element) {
        const row = stack.at(-1);
        if (row && !row.url) row.url = safeResultURL(element.getAttribute("href"));
      },
      text(chunk) {
        const row = stack.at(-1);
        if (row && row.title.length < 1200) row.title += chunk.text;
      },
    })
    .on(".result__snippet", {
      text(chunk) {
        const row = stack.at(-1);
        if (row && row.snippet.length < 2400) row.snippet += chunk.text;
      },
    })
    .on(".no-results", { element() { noResults = true; } });
  // Consume the transformed stream to run handlers; only extracted text survives.
  const transformed = rewriter.transform(new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }));
  await transformed.arrayBuffer();
  const seen = new Set();
  const results = rows.flatMap((row) => {
    const title = plainText(row.title, 220);
    if (row.ad || !row.url || !title || seen.has(row.url)) return [];
    seen.add(row.url);
    return [{ title, url: row.url, snippet: plainText(row.snippet, 700) }];
  }).slice(0, MAX_RESULTS);
  if (!results.length && !noResults) {
    throw new SearchError("SEARCH_FORMAT_CHANGED", "Search returned no readable results. Its page format may have changed or access may be blocked.", 503);
  }
  return results;
}

function json(value, status, origin, extra = {}) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    ...extra,
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(value === null ? null : JSON.stringify(value), { status, headers });
}

export function createHandler({ fetcher = globalThis.fetch, Rewriter = globalThis.HTMLRewriter, timeoutMs = TIMEOUT_MS } = {}) {
  return async function handle(request, env = {}) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowedOrigin = allowedOrigins(env).has(origin) ? origin : null;
    if (!allowedOrigin) return json({ error: "ORIGIN_DENIED", message: "This origin is not allowed to use MAX-G search." }, 403, null);
    if (url.pathname !== "/search") return json({ error: "NOT_FOUND", message: "Use /search?q=your+query." }, 404, allowedOrigin);
    if (request.method === "OPTIONS") {
      const method = request.headers.get("Access-Control-Request-Method");
      const requestedHeaders = (request.headers.get("Access-Control-Request-Headers") || "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);
      if (method !== "GET" || requestedHeaders.some((h) => !["accept", "content-type"].includes(h))) {
        return json({ error: "PREFLIGHT_DENIED", message: "Only GET search requests are supported." }, 403, allowedOrigin);
      }
      return json(null, 204, allowedOrigin, {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Accept, Content-Type",
        "Access-Control-Max-Age": "600",
      });
    }
    if (request.method !== "GET") return json({ error: "METHOD_NOT_ALLOWED", message: "Only GET is supported." }, 405, allowedOrigin, { Allow: "GET, OPTIONS" });
    try {
      if ([...url.searchParams.keys()].some((key) => key !== "q") || url.searchParams.getAll("q").length !== 1) {
        throw new SearchError("INVALID_QUERY", "Supply exactly one q parameter. Arbitrary proxy URLs are not supported.", 400);
      }
      const query = normalizeQuery(url.searchParams.get("q"));
      if (!env.SEARCH_RATE_LIMIT?.limit) throw new SearchError("RATE_LIMIT_UNAVAILABLE", "Configure the SEARCH_RATE_LIMIT binding before using search.", 503);
      const allowance = await env.SEARCH_RATE_LIMIT.limit({ key: "max-g-search" });
      if (!allowance.success) throw new SearchError("RATE_LIMITED", "Search is busy. Please wait a minute and try again.", 429);
      const controller = new AbortController();
      const abort = () => controller.abort();
      request.signal.addEventListener("abort", abort, { once: true });
      const timer = setTimeout(abort, timeoutMs);
      try {
        const upstream = new URL(SEARCH_ENDPOINT);
        upstream.searchParams.set("q", query);
        const response = await fetcher(upstream.href, {
          method: "GET", redirect: "manual", signal: controller.signal,
          headers: { Accept: "text/html", "User-Agent": "MAX-G-Search/1.0 (+https://max-g.goyonebydesign.com)", "Cache-Control": "no-cache" },
          cf: { cacheTtl: 0, cacheEverything: false },
        });
        if (response.status === 202 || [403, 429].includes(response.status)) {
          await response.body?.cancel();
          throw new SearchError("SEARCH_BLOCKED", "DuckDuckGo temporarily blocked automated search. Open DuckDuckGo directly or try later.", 503);
        }
        if (!response.ok || response.status >= 300) {
          await response.body?.cancel();
          throw new SearchError("UPSTREAM_ERROR", "The search provider is temporarily unavailable.");
        }
        if (!response.headers.get("content-type")?.toLowerCase().includes("text/html")) {
          await response.body?.cancel();
          throw new SearchError("UPSTREAM_FORMAT", "The search provider returned an unsupported response.");
        }
        const results = await parseResults(await readBounded(response), Rewriter);
        return json({ results, provider: "DuckDuckGo", sourceprovider: "DuckDuckGo HTML", timestamp: new Date().toISOString() }, 200, allowedOrigin);
      } catch (error) {
        if (controller.signal.aborted) throw new SearchError("SEARCH_TIMEOUT", "Search took too long. Please try again.", 504);
        throw error;
      } finally {
        clearTimeout(timer);
        request.signal.removeEventListener("abort", abort);
      }
    } catch (error) {
      const known = error instanceof SearchError;
      const status = known ? error.status : 502;
      return json({ error: known ? error.code : "SEARCH_UNAVAILABLE", message: known ? error.message : "Search could not connect. Please try again later." }, status, allowedOrigin,
        status === 429 ? { "Retry-After": "60" } : {});
    }
  };
}

export default { fetch: (request, env) => createHandler()(request, env) };
