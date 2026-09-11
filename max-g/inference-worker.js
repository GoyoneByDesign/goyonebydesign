// Dedicated compute worker; sw.js is responsible only for the offline UI shell.
import { WebWorkerMLCEngineHandler } from 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/+esm';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = event => handler.onmessage(event);
