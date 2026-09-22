/** MAX-G Cloudflare gateway. Public search and optional authenticated Gemini
 * support share a deployment, while retaining separate request data paths.
 */
import searchWorker, {allowedOrigins} from './worker.js';
import {handleGemini} from './gemini-worker.js';
import {handleNews} from './news-worker.js';
import {handleCloudflareAI} from './cloudflare-ai-worker.js';

export default {
  async fetch(request, env = {}, ctx) {
    const path = new URL(request.url).pathname;
    if (path === '/ai' || path === '/ai/health') return handleCloudflareAI(request, env);
    if (path === '/news') return handleNews(request, env);
    if (path === '/support' || path === '/support/health') {
      return handleGemini(request, env, {origins: allowedOrigins(env)});
    }
    return searchWorker.fetch(request, env, ctx);
  },
};
