/** Explicit, one-question cloud support. No model fallback, secret storage or retries. */
import {BUILTIN_SEARCH_URL} from './tools.js';

export const GEMINI_SUPPORT_URL=BUILTIN_SEARCH_URL+'/support';
export const GEMINI_MAX_QUESTION=4000;
const MAX_RESPONSE=256*1024;
const MAX_TIMEOUT=45000;
export class GeminiSupportError extends Error{
  constructor(code,message){super(message);this.name='GeminiSupportError';this.code=code;}
}
function fail(code,message){return new GeminiSupportError(code,message);}
export function validateSupportToken(raw){
  const token=typeof raw==='string'?raw.trim():'';
  if(token.startsWith('AIza'))throw fail('INVALID_TOKEN','Use the MAX-G support access token, not your Google API key. Google API keys belong only in Cloudflare secrets.');
  if(!/^[A-Za-z0-9_-]{32,256}$/.test(token))throw fail('INVALID_TOKEN','Enter your MAX-G support access token: 32–256 letters, numbers, underscores or hyphens. It is separate from your Google API key.');
  return token;
}
export function validateSupportQuestion(raw){
  if(typeof raw!=='string'||!raw.trim())throw fail('INVALID_QUESTION','Type a question to send to Gemini.');
  if(raw.trim().length>GEMINI_MAX_QUESTION)throw fail('INVALID_QUESTION',`Keep this question within ${GEMINI_MAX_QUESTION.toLocaleString()} characters.`);
  return raw.trim();
}
function responseError(status,payload){
  const code=String(payload?.error||payload?.code||'').slice(0,80);
  if(status===404)return fail('SUPPORT_NOT_CONFIGURED','Gemini support has not been deployed on MAX-G’s Cloudflare Worker yet. Local MAX-G and web search remain available.');
  if(code==='SUPPORT_ORIGIN_DENIED'||code==='SUPPORT_PREFLIGHT_DENIED')return fail(code,'This MAX-G address is not enabled for Gemini support. Open MAX-G on www.goyonebydesign.com.');
  if(code==='SUPPORT_PROVIDER_ACCESS')return fail(code,'Google did not allow this project to use Gemini support. The MAX-G owner needs to check the API key, region and project eligibility.');
  if(status===401||status===403||/TOKEN|UNAUTHORIZED|AUTH_REQUIRED/.test(code))return fail(code||'SUPPORT_UNAUTHORIZED','Gemini support needs a valid MAX-G support access token. Add it in Settings → Connection.');
  if(/CONFIGURED|SETUP|FREE_TIER|BILLING|CONFIGURATION/.test(code))return fail(code||'SUPPORT_NOT_CONFIGURED','Gemini support needs owner setup in Cloudflare: a Google API key, a separate support access token and a confirmed free-tier project.');
  if(status===429||/QUOTA|RATE_LIMIT/.test(code))return fail(code||'SUPPORT_RATE_LIMITED','Gemini’s free request limit or MAX-G’s shared request limit has been reached. Try later, or keep using local MAX-G. No automatic retry was made.');
  if(/BLOCKED|SAFETY|REFUSED/.test(code))return fail(code,'Gemini did not return an answer to this request. You can edit the question or use local MAX-G.');
  if(/TIMEOUT/.test(code))return fail(code,'Gemini support took too long. Your question has not been retried automatically.');
  return fail(code||'SUPPORT_UNAVAILABLE','Gemini support is temporarily unavailable. Local MAX-G is still available; no automatic retry was made.');
}
async function boundedJSON(response,signal){
  const length=Number(response.headers.get('content-length'));
  if(Number.isFinite(length)&&length>MAX_RESPONSE)throw fail('SUPPORT_RESPONSE_TOO_LARGE','Gemini support returned more data than this app can safely display.');
  if(!/\bapplication\/json\b/i.test(response.headers.get('content-type')||''))throw responseError(response.status===200?502:response.status);
  const reader=response.body?.getReader();
  if(!reader)throw fail('SUPPORT_INVALID_RESPONSE','Gemini support returned an empty response.');
  const cancel=()=>{reader.cancel().catch(()=>{});};
  signal.addEventListener('abort',cancel,{once:true});
  const decoder=new TextDecoder();let count=0,text='';
  try{
    for(;;){
      if(signal.aborted)throw signal.reason;
      const {done,value}=await reader.read();if(done)break;
      count+=value.byteLength;if(count>MAX_RESPONSE)throw fail('SUPPORT_RESPONSE_TOO_LARGE','Gemini support returned more data than this app can safely display.');
      text+=decoder.decode(value,{stream:true});
    }
    text+=decoder.decode();
    try{return JSON.parse(text);}catch{throw fail('SUPPORT_INVALID_RESPONSE','Gemini support returned an unreadable response.');}
  }finally{signal.removeEventListener('abort',cancel);cancel();}
}
async function request(path,{token,question,signal,fetchImpl=globalThis.fetch,timeoutMs=MAX_TIMEOUT}={}){
  if(signal?.aborted)throw new DOMException('Gemini support stopped.','AbortError');
  const controller=new AbortController();let timer,abortListener;
  const deadline=new Promise((_,reject)=>{
    abortListener=()=>{const error=new DOMException('Gemini support stopped.','AbortError');controller.abort(error);reject(error);};
    signal?.addEventListener('abort',abortListener,{once:true});
    timer=setTimeout(()=>{const error=fail('SUPPORT_TIMEOUT','Gemini support took too long. Your question has not been retried automatically.');controller.abort(error);reject(error);},Math.max(1,Math.min(MAX_TIMEOUT,Number(timeoutMs)||MAX_TIMEOUT)));
  });
  try{
    const operation=(async()=>{
      const response=await fetchImpl(GEMINI_SUPPORT_URL+path,{
        method:question===undefined?'GET':'POST',
        headers:question===undefined?{Accept:'application/json'}:{Accept:'application/json','Content-Type':'application/json',Authorization:'Bearer '+token},
        ...(question===undefined?{}:{body:JSON.stringify({question})}),
        signal:controller.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',redirect:'error'
      });
      if(response.status===404)throw responseError(404);
      const payload=await boundedJSON(response,controller.signal);
      if(!response.ok)throw responseError(response.status,payload);
      return payload;
    })();
    return await Promise.race([operation,deadline]);
  }catch(error){
    if(signal?.aborted)throw new DOMException('Gemini support stopped.','AbortError');
    if(error instanceof GeminiSupportError||error?.name==='AbortError')throw error;
    throw fail('SUPPORT_NETWORK_ERROR','Gemini support could not connect. Check this device’s internet connection. Your question was not retried automatically.');
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abortListener);controller.abort();}
}
export async function askGemini(raw,{token,signal,fetchImpl,timeoutMs}={}){
  const question=validateSupportQuestion(raw),accessToken=validateSupportToken(token);
  const payload=await request('',{question,token:accessToken,signal,fetchImpl,timeoutMs});
  if(payload?.provider!=='Gemini'||payload.cloud!==true||typeof payload.text!=='string'||!payload.text.trim()||typeof payload.model!=='string')throw fail('SUPPORT_INVALID_RESPONSE','Gemini support returned an incomplete response.');
  return {text:payload.text.trim(),model:payload.model.slice(0,120),provider:'Gemini',cloud:true};
}
export async function geminiHealth({signal,fetchImpl,timeoutMs}={}){
  const payload=await request('/health',{signal,fetchImpl,timeoutMs});
  if(payload?.provider!=='Gemini'||payload.cloud!==true||typeof payload.ready!=='boolean')throw fail('SUPPORT_INVALID_RESPONSE','Gemini support returned an unreadable setup status.');
  return {ready:payload.ready,model:String(payload.model||'Gemini').slice(0,120),provider:'Gemini',cloud:true,configured:payload.configured||{},upstream:'not-tested'};
}
