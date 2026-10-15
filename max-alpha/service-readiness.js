/** Hosted setup metadata only. These functions never request an AI answer. */
import {cloudflareHealth} from './cloudflare-ai.js';
import {geminiHealth} from './gemini.js';
export async function checkAIServiceReadiness({signal,cloudflare=cloudflareHealth,gemini=geminiHealth}={}){
  if(signal?.aborted)throw new DOMException('Stopped.','AbortError');
  const providers=['Cloudflare Workers AI','Gemini support'];
  const results=await Promise.allSettled([cloudflare({signal}),gemini({signal})]);
  if(signal?.aborted)throw new DOMException('Stopped.','AbortError');
  return results.map((result,index)=>result.status==='fulfilled'?{
    provider:providers[index],ready:result.value.ready===true,model:String(result.value.model||'Not reported').slice(0,120),
    detail:result.value.ready===true?'Hosted setup reports ready. An AI answer has not been tested.':'Hosted setup needs attention. An AI answer has not been tested.'
  }:{provider:providers[index],ready:false,model:'Not reported',detail:String(result.reason?.message||'Setup status is unavailable.').slice(0,400)});
}
