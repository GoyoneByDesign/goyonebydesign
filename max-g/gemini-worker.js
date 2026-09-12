/** Optional, authenticated Gemini support. Local MAX-G remains the default.
 * Google keys exist only in Worker secrets. This adapter forwards one question;
 * it never receives history, memories, attachments, tools, or a caller model.
 */
export const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const PUBLIC_ORIGINS = Object.freeze([
  'https://max-g.goyonebydesign.com',
  'https://www.goyonebydesign.com',
  'https://goyonebydesign.com',
]);
const SYSTEM = 'You provide optional Gemini support for MAX-G, a helpful companion made by GoyoneByDesign. Give a concise, kind, accurate answer in the language of the question. Be candid about uncertainty. This is a single question without conversation history. You have no live web access, device access, memories, or tools. Never claim to have searched, verified current events, accessed files, or performed actions. Ask for missing context when needed. Do not invent sources or links. Your response is labelled Gemini support by MAX-G. Keep the answer under 220 words.';
const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_RESPONSE_BYTES = 256 * 1024;
const TIMEOUT_MS = 30000;

class SupportError extends Error {
  constructor(code, message, status = 502) { super(message); this.code = code; this.status = status; }
}

function json(data, status, origin, extra = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache', Vary: 'Origin', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', ...extra,
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(data === null ? null : JSON.stringify(data), { status, headers });
}

function configured(env) {
  return {
    apiKey: typeof env.GEMINI_API_KEY === 'string' && /^[\x21-\x7e]{16,512}$/.test(env.GEMINI_API_KEY),
    accessToken: typeof env.MAXG_SUPPORT_TOKEN === 'string' && /^[A-Za-z0-9_-]{32,256}$/.test(env.MAXG_SUPPORT_TOKEN) && !env.MAXG_SUPPORT_TOKEN.startsWith('AIza'),
    freeTierConfirmed: env.GEMINI_FREE_TIER_CONFIRMED === 'true',
    rateLimit: typeof env.SEARCH_RATE_LIMIT?.limit === 'function',
  };
}

// Hash to equal-size buffers before the Workers native timing-safe comparison.
// Standard Web Crypto HMAC verification supplies the native comparison in Node
// tests and other runtimes where the Cloudflare extension is not available.
export async function verifySupportToken(provided, expected) {
  const encode = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encode.encode(provided)),
    crypto.subtle.digest('SHA-256', encode.encode(expected)),
  ]);
  if (typeof crypto.subtle.timingSafeEqual === 'function') return crypto.subtle.timingSafeEqual(a, b);
  const key = await crypto.subtle.importKey('raw', b, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  const signature = await crypto.subtle.sign('HMAC', key, b);
  return crypto.subtle.verify('HMAC', key, signature, a);
}

async function boundedJSON(owner, limit, signal, isRequest = false) {
  const tooLarge = () => new SupportError(isRequest ? 'SUPPORT_REQUEST_TOO_LARGE' : 'SUPPORT_RESPONSE_TOO_LARGE',
    isRequest ? 'Keep the question under 4,000 characters.' : 'Gemini returned an oversized response.', isRequest ? 413 : 502);
  const declared = Number(owner.headers.get('content-length'));
  const reader = owner.body?.getReader();
  if (!reader) throw new SupportError(isRequest ? 'SUPPORT_INVALID_REQUEST' : 'SUPPORT_RESPONSE_INVALID', 'An empty JSON body was received.', isRequest ? 400 : 502);
  // Abort also cancels a stalled body. Do not wait for a broken upstream's
  // cancellation promise; the enclosing deadline controls the response lifetime.
  const cancel = () => { reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0, text = '';
  try {
    if (signal.aborted) { cancel(); throw signal.reason; }
    if (Number.isFinite(declared) && declared > limit) { cancel(); throw tooLarge(); }
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) throw signal.reason;
      if (done) break;
      size += value.byteLength;
      if (size > limit) { cancel(); throw tooLarge(); }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    if (error instanceof SupportError || signal.aborted) throw error;
    throw new SupportError(isRequest ? 'SUPPORT_INVALID_REQUEST' : 'SUPPORT_RESPONSE_INVALID',
      isRequest ? 'Send a JSON object containing only a question.' : 'Gemini returned an unreadable response.', isRequest ? 400 : 502);
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

async function withDeadline(request, timeoutMs, work) {
  const controller = new AbortController();
  const aborted = new Promise((_, reject) => {
    controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true });
  });
  const abort = () => controller.abort(new SupportError('SUPPORT_CANCELLED', 'Gemini support was stopped.', 499));
  request.signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new SupportError('SUPPORT_TIMEOUT', 'Gemini support took too long. Try again later.', 504)), timeoutMs);
  try {
    if (request.signal.aborted) abort();
    if (controller.signal.aborted) return await aborted;
    return await Promise.race([work(controller.signal), aborted]);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', abort);
  }
}

function extractText(data) {
  if (data?.promptFeedback?.blockReason) throw new SupportError('SUPPORT_RESPONSE_BLOCKED', 'Gemini could not answer this question.', 422);
  const candidate = data?.candidates?.[0];
  const finish = candidate?.finishReason;
  if (candidate?.safetyRatings?.some(rating => rating?.blocked === true)) throw new SupportError('SUPPORT_RESPONSE_BLOCKED', 'Gemini could not answer this question.', 422);
  if (finish === 'MAX_TOKENS') throw new SupportError('SUPPORT_TRUNCATED', 'Gemini reached the short-answer limit. Try a shorter or more specific question.', 422);
  if (finish && finish !== 'STOP') throw new SupportError('SUPPORT_RESPONSE_BLOCKED', 'Gemini did not produce a complete answer. Try rephrasing the question.', 422);
  if (finish !== 'STOP' || !Array.isArray(candidate?.content?.parts)) throw new SupportError('SUPPORT_RESPONSE_INVALID', 'Gemini returned no complete text answer. Try again later.');
  const text = candidate.content.parts.filter(part => part?.thought !== true && typeof part?.text === 'string').map(part => part.text).join('').trim();
  if (!text) throw new SupportError('SUPPORT_EMPTY', 'Gemini returned no text answer. Try rephrasing the question.', 422);
  if (text.length > 12000) throw new SupportError('SUPPORT_RESPONSE_TOO_LARGE', 'Gemini returned an oversized answer.');
  return text;
}

/** Returns null for unrelated paths so the existing search handler can continue. */
export async function handleGemini(request, env = {}, { origins = PUBLIC_ORIGINS, fetcher = globalThis.fetch, timeoutMs = TIMEOUT_MS } = {}) {
  const url = new URL(request.url);
  if (!['/support', '/support/health'].includes(url.pathname)) return null;
  const origin = request.headers.get('Origin');
  // A caller may narrow this set, but cannot accidentally grant new origins.
  const allowed = new Set(origins);
  const allowedOrigin = PUBLIC_ORIGINS.includes(origin) && allowed.has(origin) ? origin : null;
  const health = url.pathname === '/support/health';
  if (!allowedOrigin && !(health && request.method === 'GET' && !request.headers.has('Origin'))) {
    return json({ error: 'SUPPORT_ORIGIN_DENIED', message: 'Open MAX-G on its hosted website to use Gemini support.' }, 403, null);
  }
  if (url.search) return json({ error: 'SUPPORT_INVALID_REQUEST', message: 'Query parameters are not supported. Send credentials in the authorization header.' }, 400, allowedOrigin);
  if (request.method === 'OPTIONS') {
    const method = request.headers.get('Access-Control-Request-Method');
    const headers = (request.headers.get('Access-Control-Request-Headers') || '').toLowerCase().split(',').map(v => v.trim()).filter(Boolean);
    if (method !== (health ? 'GET' : 'POST') || headers.some(v => !['accept', 'content-type', 'authorization'].includes(v))) {
      return json({ error: 'SUPPORT_PREFLIGHT_DENIED', message: 'This request method or header is not supported.' }, 403, allowedOrigin);
    }
    return json(null, 204, allowedOrigin, {
      'Access-Control-Allow-Methods': `${health ? 'GET' : 'POST'}, OPTIONS`,
      'Access-Control-Allow-Headers': 'Accept, Content-Type, Authorization', 'Access-Control-Max-Age': '600',
    });
  }
  if (request.method !== (health ? 'GET' : 'POST')) return json({ error: 'SUPPORT_METHOD_NOT_ALLOWED', message: health ? 'Use GET for status.' : 'Use POST to request Gemini support.' }, 405, allowedOrigin, { Allow: `${health ? 'GET' : 'POST'}, OPTIONS` });
  const config = configured(env);
  if (health) return json({ service: 'MAX-G Gemini Support', configured: config, ready: Object.values(config).every(Boolean), model: GEMINI_MODEL, provider: 'Gemini', cloud: true, upstream: 'not-tested' }, 200, allowedOrigin);
  try {
    if (!config.apiKey || !config.accessToken) throw new SupportError('SUPPORT_NOT_CONFIGURED', 'The owner needs to configure Gemini support in Cloudflare first.', 503);
    if (!config.freeTierConfirmed) throw new SupportError('SUPPORT_FREE_TIER_REQUIRED', 'Gemini support is paused until the owner verifies an eligible Free project with no billing.', 503);
    if (!config.rateLimit) throw new SupportError('SUPPORT_RATE_LIMIT_UNAVAILABLE', 'Gemini support is paused because its rate limiter is unavailable.', 503);
    const auth = request.headers.get('Authorization') || '';
    const supplied = /^Bearer ([A-Za-z0-9_-]{1,256})$/i.exec(auth)?.[1] || '';
    const text = await withDeadline(request, timeoutMs, async (signal) => {
      if (!await verifySupportToken(supplied, env.MAXG_SUPPORT_TOKEN)) throw new SupportError('SUPPORT_UNAUTHORIZED', 'Enter the MAX-G support access token in Settings. Do not enter a Google API key.', 401);
      if (!/^application\/json(?:\s*;.*)?$/i.test(request.headers.get('Content-Type') || '')) throw new SupportError('SUPPORT_MEDIA_TYPE', 'Send the question as application/json.', 415);
      const body = await boundedJSON(request, MAX_REQUEST_BYTES, signal, true);
      if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).length !== 1 || typeof body.question !== 'string' ||
          body.question.length > 4000 || !body.question.trim() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(body.question)) {
        throw new SupportError('SUPPORT_INVALID_REQUEST', 'Send only a question of 1–4,000 characters. History, files, tools, and model overrides are not accepted.', 400);
      }
      const allowance = await env.SEARCH_RATE_LIMIT.limit({ key: 'gemini-support' });
      if (!allowance?.success) throw new SupportError('SUPPORT_RATE_LIMITED', 'Gemini support is busy. Wait a minute before trying again.', 429);
      if (signal.aborted) throw signal.reason;
      const response = await fetcher(GEMINI_ENDPOINT, {
        method: 'POST', redirect: 'error', signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: 'user', parts: [{ text: body.question.trim() }] }],
          generationConfig: { temperature: 0, candidateCount: 1, maxOutputTokens: 512 },
        }),
      });
      if (!response.ok) {
        // Do not surface upstream errors: they may contain keys or request data.
        response.body?.cancel().catch(() => {});
        if (response.status === 429) throw new SupportError('SUPPORT_QUOTA_EXHAUSTED', 'Gemini’s free quota is currently unavailable. MAX-G will not retry or upgrade to a paid plan.', 429);
        if ([401, 403].includes(response.status)) throw new SupportError('SUPPORT_PROVIDER_ACCESS', 'Google did not authorize the configured Free project. The owner should check its API key and eligibility.', 503);
        if (response.status === 404) throw new SupportError('SUPPORT_MODEL_UNAVAILABLE', 'This Gemini model is unavailable for the configured project. MAX-G will not switch models automatically.', 503);
        throw new SupportError('SUPPORT_UPSTREAM_UNAVAILABLE', 'Gemini support is temporarily unavailable. Continue using local MAX-G.', 502);
      }
      if (!/^application\/json(?:\s*;.*)?$/i.test(response.headers.get('Content-Type') || '')) {
        response.body?.cancel().catch(() => {});
        throw new SupportError('SUPPORT_RESPONSE_INVALID', 'Gemini returned an unsupported response.');
      }
      return extractText(await boundedJSON(response, MAX_RESPONSE_BYTES, signal));
    });
    return json({ text, model: GEMINI_MODEL, provider: 'Gemini', cloud: true }, 200, allowedOrigin);
  } catch (error) {
    const known = error instanceof SupportError;
    const status = known ? error.status : 502;
    return json({ error: known ? error.code : 'SUPPORT_UNAVAILABLE', message: known ? error.message : 'Gemini support could not connect. Continue using local MAX-G.' }, status, allowedOrigin,
      status === 429 ? { 'Retry-After': '60' } : status === 401 ? { 'WWW-Authenticate': 'Bearer realm="MAX-G support"' } : {});
  }
}
