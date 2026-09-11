// WebLLM is loaded only after the user requests a model download/load.
// Verified against the published 0.2.85 API, not an unversioned CDN alias.
export const WEBLLM_URL = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/+esm';
export const DEFAULT_MODEL = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
export const COMPATIBILITY_MODEL = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
export const MODELS = Object.freeze([
  { id: DEFAULT_MODEL, label: 'Llama 3.2 · 1B · fast', shaderF16: true, memoryMB: 879 },
  { id: COMPATIBILITY_MODEL, label: 'Llama 3.2 · 1B · GPU compatibility', shaderF16: false, memoryMB: 1129 },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 · 3B · more memory', shaderF16: true, memoryMB: 2264 },
]);
export const CONTEXT_TOKENS = 4096;
export const OUTPUT_TOKENS = 384;

const encoder = new TextEncoder();
const abortError = () => new DOMException('Operation stopped.', 'AbortError');
const bytes = text => encoder.encode(text).byteLength;

function cutBytes(text, budget, tail = false) {
  const chars = Array.from(String(text));
  let n = 0;
  let result = '';
  const iterable = tail ? chars.reverse() : chars;
  for (const char of iterable) {
    n += bytes(char);
    if (n > budget) break;
    result = tail ? char + result : result + char;
  }
  return result;
}

/** Byte bounds are deliberately conservative for multilingual BPE tokenization.
 * Reserve generation and chat-template space. Keep system instructions and the
 * latest user turn; drop older pairs before shortening current evidence.
 */
export function boundedMessages(input, maxTokens = OUTPUT_TOKENS) {
  if (!Array.isArray(input)) throw new TypeError('Messages must be an array.');
  const valid = input.filter(m => m && ['system', 'user', 'assistant'].includes(m.role)
    && typeof m.content === 'string').map(m => ({ role: m.role, content: m.content }));
  const latest = valid.findLastIndex(m => m.role === 'user');
  if (latest < 0) throw new Error('A user message is required.');
  const budget = CONTEXT_TOKENS - maxTokens - 256;
  const system = valid.find(m => m.role === 'system');
  const result = [];
  let remaining = budget;
  if (system) {
    const content = cutBytes(system.content, Math.min(850, Math.floor(budget * 0.55)));
    result.push({ role: 'system', content });
    remaining -= bytes(content);
  }
  const current = { role: 'user', content: cutBytes(valid[latest].content, remaining) };
  remaining -= bytes(current.content);
  const history = [];
  for (let i = latest - 1; i >= 1 && history.length < 4; i--) {
    if (valid[i].role !== 'assistant' || valid[i - 1].role !== 'user') continue;
    const pair = [valid[i - 1], valid[i]];
    const size = bytes(pair[0].content) + bytes(pair[1].content) + 32;
    if (size > remaining) break;
    history.unshift(...pair);
    remaining -= size;
    i--;
  }
  result.push(...history, current);
  return { messages: result, truncated: JSON.stringify(result) !== JSON.stringify(valid), promptBytes: budget - remaining };
}

export async function checkWebGPU(nav = globalThis.navigator, secure = globalThis.isSecureContext) {
  if (!secure) return { supported: false, reason: 'Open MAX-G over HTTPS or localhost to use WebGPU.' };
  if (!nav?.gpu?.requestAdapter) return { supported: false, reason: 'WebGPU is unavailable, so the local chat model cannot run in this browser. Try a supported browser with graphics acceleration enabled. Safari needs a supported macOS/iOS version.' };
  try {
    const adapter = await timed(nav.gpu.requestAdapter({ powerPreference: 'high-performance' }), 10000, 'GPU capability check timed out. Reload MAX-G or try a supported browser.');
    if (!adapter) return { supported: false, reason: 'This browser could not obtain a WebGPU adapter. Check browser graphics acceleration and device support.' };
    return {
      supported: true,
      shaderF16: adapter.features.has('shader-f16'),
      maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
      reason: 'WebGPU is available. Actual model loading also depends on available GPU memory.',
    };
  } catch (error) {
    return { supported: false, reason: `WebGPU could not start: ${error.message || String(error)}` };
  }
}

/** Compatibility is selected before library/model download. f32 is still GPU
 * inference and uses more memory; it is not a CPU or low-memory fallback.
 * An explicit larger model is never silently replaced with a smaller one.
 */
export function selectCompatibleModel(requestedModelId, gpu) {
  const requested = MODELS.find(model => model.id === requestedModelId);
  if (!requested) throw new Error('Choose one of MAX-G’s supported local models.');
  if (!gpu?.supported) throw new Error(gpu?.reason || 'WebGPU is unavailable. This browser cannot run the local chat model.');
  if (requested.shaderF16 && !gpu.shaderF16) {
    if (requestedModelId !== DEFAULT_MODEL) throw new Error('This GPU cannot run the selected 3B model because shader-f16 is unavailable. Choose the 1B model in Settings to use GPU compatibility mode.');
    return { requestedModelId, modelId: COMPATIBILITY_MODEL, adapted: true,
      reason: 'Using the 1B GPU compatibility model because this device does not support shader-f16. It still runs locally on this device’s GPU and may use more memory.' };
  }
  return { requestedModelId, modelId: requestedModelId, adapted: false, reason: '' };
}

function timed(promise, milliseconds, message, signal) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      fn(value);
    };
    const onAbort = () => finish(reject, abortError());
    if (signal?.aborted) return onAbort();
    signal?.addEventListener('abort', onAbort, { once: true });
    timer = setTimeout(() => finish(reject, new Error(message)), milliseconds);
    Promise.resolve(promise).then(v => finish(resolve, v), e => finish(reject, e));
  });
}

export function makeAppConfig(module) {
  const model_list = MODELS.map(({ id }) => {
    const record = module.prebuiltAppConfig.model_list.find(model => model.model_id === id);
    if (!record) throw new Error(`The pinned WebLLM release does not include ${id}.`);
    return { ...record, overrides: { ...record.overrides, context_window_size: CONTEXT_TOKENS } };
  });
  return { ...module.prebuiltAppConfig, model_list, cacheBackend: 'indexeddb' };
}

/** One GPU model and one generation at a time. Epochs reject late worker replies
 * after Stop, unload, reset, or a model change. No cloud inference fallback.
 */
export class MaxGEngine {
  constructor({ onState = () => {}, importModule = () => import(WEBLLM_URL),
    workerFactory = () => new Worker(new URL('./inference-worker.js', import.meta.url), { type: 'module', name: 'MAX-G local inference' }),
    navigator = globalThis.navigator, secure = globalThis.isSecureContext } = {}) {
    this._importModule = importModule;
    this._workerFactory = workerFactory;
    this._navigator = navigator;
    this._secure = secure;
    this._onState = onState;
    this._epoch = 0;
    this._worker = null;
    this._engine = null;
    this._controller = null;
    this._module = null;
    this._loading = false;
    this._busy = false;
    this._modelId = null;
    this._requestedModelId = null;
    this._selection = null;
    this._failure = null;
    this._cacheClear = null;
  }

  get ready() { return Boolean(this._engine && !this._loading); }
  get busy() { return this._busy || this._loading; }
  get modelId() { return this._modelId; }
  get requestedModelId() { return this._requestedModelId || this._modelId; }
  get selection() { return this._selection ? { ...this._selection } : null; }
  readyFor(modelId) { return this.ready && (this.requestedModelId === modelId || this._modelId === modelId); }
  _state(status, detail = {}) { this._onState({ status, modelId: this._modelId, requestedModelId: this.requestedModelId, selection: this.selection, ...detail }); }

  async load(modelId = DEFAULT_MODEL, { onProgress = () => {}, signal } = {}) {
    const model = MODELS.find(item => item.id === modelId);
    if (!model) throw new Error('Choose one of MAX-G’s supported local models.');
    if (signal?.aborted) throw abortError();
    while (this._cacheClear) await timed(this._cacheClear, 120000, 'Model cache removal is still running.', signal);
    if (this.ready && this._modelId === modelId) {
      // A person can explicitly select a compatibility model that is already
      // loaded, without unloading the same GPU weights to change its label.
      this._requestedModelId = modelId;
      this._selection = { requestedModelId: modelId, modelId, adapted: false, reason: '' };
      return this;
    }
    if (this.ready && this.requestedModelId === modelId) return this;
    await this.unload();
    const epoch = ++this._epoch;
    const controller = new AbortController();
    this._controller = controller;
    this._loading = true;
    this._modelId = modelId;
    this._requestedModelId = modelId;
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
    const assertCurrent = () => { if (controller.signal.aborted || epoch !== this._epoch) throw abortError(); };
    try {
      this._state('checking');
      const gpu = await timed(checkWebGPU(this._navigator, this._secure), 15000, 'GPU capability check timed out.', controller.signal);
      assertCurrent();
      const selection = selectCompatibleModel(modelId, gpu);
      this._selection = selection;
      modelId = selection.modelId;
      this._modelId = modelId;
      this._state('loading');
      assertCurrent();
      if (selection.adapted) onProgress({ progress: 0, text: selection.reason, modelId, requestedModelId: this._requestedModelId });
      assertCurrent();
      const module = this._module || await timed(this._importModule(), 45000, 'The WebLLM library did not load. Connect once to cache it for offline use.', controller.signal);
      assertCurrent();
      this._module = module;
      const appConfig = makeAppConfig(module);
      const worker = this._workerFactory();
      this._worker = worker;
      this._failure = new Promise((_, reject) => {
        worker.addEventListener('error', event => reject(new Error(event.message || 'The inference worker stopped unexpectedly. Reload the model.')));
        worker.addEventListener('messageerror', () => reject(new Error('The inference worker returned an unreadable message. Reload the model.')));
      });
      // A worker failure may occur between requests. Its race always has a handler.
      this._failure.catch(error => {
        if (epoch === this._epoch && !this._loading && !this._busy) {
          void this.unload();
          this._state('error', { message: error.message || String(error) });
        }
      });
      const engine = await timed(Promise.race([
        module.CreateWebWorkerMLCEngine(worker, modelId, {
          appConfig, logLevel: 'ERROR',
          initProgressCallback: report => {
            if (epoch !== this._epoch || controller.signal.aborted) return;
            onProgress({ ...report, progress: Math.max(0, Math.min(1, Number(report.progress) || 0)) });
          },
        }, { context_window_size: CONTEXT_TOKENS, temperature: 0 }),
        this._failure,
      ]), 15 * 60 * 1000, 'Model loading timed out. Stop, check storage/network, and retry.', controller.signal);
      assertCurrent();
      this._engine = engine;
      this._loading = false;
      this._controller = null;
      this._state('ready');
      return this;
    } catch (error) {
      if (epoch === this._epoch) {
        await this.unload();
        this._state(error.name === 'AbortError' ? 'unloaded' : 'error', { message: error.message || String(error) });
      }
      throw error;
    } finally {
      signal?.removeEventListener('abort', cancel);
    }
  }

  async stream(input, { onToken = () => {}, onUsage = () => {}, signal, maxTokens = OUTPUT_TOKENS } = {}) {
    if (signal?.aborted) throw abortError();
    if (!this.ready) throw new Error('Load a local model first.');
    if (this._busy) throw new Error('MAX-G is already answering. Stop or wait before sending another request.');
    const outputLimit = Math.max(32, Math.min(1024, Math.floor(Number(maxTokens) || OUTPUT_TOKENS)));
    const bounded = boundedMessages(input, outputLimit);
    const engine = this._engine;
    const epoch = this._epoch;
    const controller = new AbortController();
    this._controller = controller;
    this._busy = true;
    const stop = () => this.stop();
    signal?.addEventListener('abort', stop, { once: true });
    let pending = null;
    let text = '';
    let usage = null;
    let finishReason = null;
    try {
      this._state('generating', { contextTrimmed: bounded.truncated });
      pending = engine.chat.completions.create({
        messages: bounded.messages, temperature: 0.0, top_p: 1,
        max_tokens: outputLimit, stream: true, stream_options: { include_usage: true },
      });
      const chunks = await timed(Promise.race([pending, this._failure]), 120000, 'The local model took too long to start. Try a shorter request or the 1B model.', controller.signal);
      const iterator = chunks[Symbol.asyncIterator]();
      for (;;) {
        pending = iterator.next();
        const { value: chunk, done } = await timed(Promise.race([pending, this._failure]), 90000, 'The local model stopped producing tokens. Reload it and retry.', controller.signal);
        if (controller.signal.aborted || epoch !== this._epoch) throw abortError();
        if (done) break;
        const token = chunk.choices?.[0]?.delta?.content || '';
        if (typeof chunk.choices?.[0]?.finish_reason === 'string') finishReason = chunk.choices[0].finish_reason;
        if (token) { text += token; onToken(token, text); }
        if (chunk.usage) { usage = chunk.usage; onUsage(usage); }
      }
      return { text, usage, contextTrimmed: bounded.truncated, finishReason };
    } catch (error) {
      if (epoch === this._epoch) {
        try {
          engine.interruptGenerate();
          if (pending) await timed(pending, 1500, 'Generation did not stop.');
          await timed(engine.resetChat(), 1500, 'Chat reset did not finish.');
        } catch { await this.unload(); }
      }
      throw error;
    } finally {
      signal?.removeEventListener('abort', stop);
      if (epoch === this._epoch) {
        this._busy = false;
        this._controller = null;
        this._state(this.ready ? 'ready' : 'unloaded');
      }
    }
  }

  stop() {
    this._controller?.abort();
    if (this._engine) {
      try { this._engine.interruptGenerate(); } catch { /* unload remains available */ }
    }
  }

  async unload() {
    ++this._epoch;
    this._controller?.abort();
    // Terminating this dedicated worker also cancels outstanding downloads and
    // frees GPU resources, including a worker still inside initialization.
    this._worker?.terminate();
    this._worker = null;
    this._engine = null;
    this._controller = null;
    this._failure = null;
    this._busy = false;
    this._loading = false;
    this._modelId = null;
    this._requestedModelId = null;
    this._selection = null;
    this._state('unloaded');
  }

  async clearCache(modelId) {
    if (modelId && !MODELS.some(model => model.id === modelId)) throw new Error('Unknown local model.');
    while (this._cacheClear) await this._cacheClear;
    const removal = (async () => {
      await this.unload();
      const module = this._module || await timed(this._importModule(), 45000, 'Connect once to load WebLLM’s model cache manager.');
      this._module = module;
      const config = makeAppConfig(module);
      for (const id of modelId ? [modelId] : MODELS.map(model => model.id)) {
        await module.deleteModelAllInfoInCache(id, config);
      }
      this._state('cache-cleared');
    })();
    this._cacheClear = removal;
    try { await removal; }
    finally { if (this._cacheClear === removal) this._cacheClear = null; }
  }
}
