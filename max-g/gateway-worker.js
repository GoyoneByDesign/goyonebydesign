/** MAX-G Cloudflare gateway. Public search and optional authenticated Gemini
 * support share a deployment, while retaining separate request data paths.
 */
import searchWorker, {allowedOrigins} from './worker.js';
import {handleGemini} from './gemini-worker.js';

export default {
  async fetch(request, env = {}, ctx) {
    const path = new URL(request.url).pathname;
    if (path === '/support' || path === '/support/health') {
      return handleGemini(request, env, {origins: allowedOrigins(env)});
    }
    return searchWorker.fetch(request, env, ctx);
  },
};
