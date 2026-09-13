/** Explicit installed-Mac engine. Browser WebLLM remains the hosted default. */
import {boundedMessages,OUTPUT_TOKENS} from './engine.js';

export const LOCAL_DEFAULT_MODEL='qwen3:4b-instruct-2507-q4_K_M';
export const LOCAL_MODELS=Object.freeze([
  {id:LOCAL_DEFAULT_MODEL,label:'Qwen3 · 4B Instruct · balanced CPU'},
  {id:'qwen2.5:3b',label:'Qwen 2.5 · 3B · faster CPU'},
  {id:'llama3.1',label:'Llama 3.1 · 8B · slower CPU'},
].map(Object.freeze));
export function isDesktopMode(value=globalThis.location?.href){
  try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)&&url.searchParams.get('desktop')==='1';}catch{return false;}
}
export function desktopDefaults(settings){
  if(LOCAL_MODELS.some(model=>model.id===settings.model))return settings;
  return {...settings,model:LOCAL_DEFAULT_MODEL,searchConnection:'companion',onlineFirst:false};
}
const abortError=()=>new DOMException('Operation stopped.','AbortError');

/** Authenticated transport is supplied by the paired helper, never by model text.
 * No model pulls, cloud fallback, browser GPU or remote library are used here.
 */
export class MaxGLocalEngine{
  constructor({request,onState=()=>{},enabled=isDesktopMode()}={}){
    this._request=request;this._onState=onState;this._enabled=enabled;this._epoch=0;
    this._modelId=null;this._ready=false;this._loading=false;this._busy=false;
    this._controller=null;this._requestId=null;this._cancelling=Promise.resolve();this._capability=null;
  }
  get ready(){return this._ready&&!this._loading;}
  get busy(){return this._busy||this._loading;}
  get modelId(){return this._modelId;}
  get requestedModelId(){return this._modelId;}
  get selection(){return this._modelId?{modelId:this._modelId,requestedModelId:this._modelId,adapted:false,reason:'Installed model running on this Mac’s CPU.'}:null;}
  get capability(){return this._capability?{...this._capability}:null;}
  readyFor(model){return this.ready&&this._modelId===model;}
  _state(status,detail={}){this._onState({status,modelId:this._modelId,requestedModelId:this._modelId,selection:this.selection,...detail});}
  async _call(operation,body={},options={}){
    if(!this._enabled)throw Error('Local Mac inference is available only in the installed desktop app.');
    if(typeof this._request!=='function')throw Error('The local Mac helper is unavailable. Reopen MAX-G.');
    return this._request(operation,body,options);
  }
  async check({signal}={}){
    const status=await this._call('status',{}, {signal});
    if(status?.enabled!==true||status.local_only!==true)throw Error('Local Mac inference is not enabled. Reopen the installed MAX-G app.');
    this._capability=status;
    return {supported:status.available===true,reason:status.message||'Installed Ollama models run on this Mac’s CPU. No WebGPU is required.'};
  }
  async load(model=LOCAL_DEFAULT_MODEL,{onProgress=()=>{},signal}={}){
    if(!LOCAL_MODELS.some(item=>item.id===model))throw Error('Choose an installed MAX-G CPU model.');
    if(signal?.aborted)throw abortError();
    if(this.readyFor(model))return this;
    if(this.busy)throw Error('MAX-G is busy. Stop or wait before loading another model.');
    const waitingEpoch=this._epoch;await this._cancelling;
    if(signal?.aborted||waitingEpoch!==this._epoch)throw abortError();
    if(this.busy)throw Error('MAX-G is busy. Stop or wait before loading another model.');
    const epoch=++this._epoch,controller=new AbortController(),cancel=()=>this.stop();
    this._controller=controller;this._loading=true;this._modelId=model;
    signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
    const current=()=>{if(controller.signal.aborted||epoch!==this._epoch)throw abortError();};
    try{
      this._state('checking');const support=await this.check({signal:controller.signal});current();
      if(!support.supported)throw Error(support.reason);
      if(!this._capability.models?.some(item=>(item.id||item.name)===model&&item.installed===true))throw Error('The selected model is not installed. Choose another CPU model in Settings. This app does not download models.');
      this._state('loading');onProgress({progress:0,text:'Loading installed weights on this Mac’s CPU…'});
      const result=await this._call('load',{model},{signal:controller.signal});current();
      if(result?.loaded!==true||result.model!==model)throw Error('The Mac helper did not confirm the selected model loaded.');
      this._ready=true;this._loading=false;onProgress({progress:1,text:'CPU model ready'});this._state('ready');return this;
    }catch(error){if(epoch===this._epoch){this._ready=false;this._modelId=null;this._loading=false;this._state(error.name==='AbortError'?'unloaded':'error',{message:error.message});}throw error;}
    finally{signal?.removeEventListener('abort',cancel);if(epoch===this._epoch)this._controller=null;}
  }
  async stream(input,{onToken=()=>{},onUsage=()=>{},signal,maxTokens=OUTPUT_TOKENS}={}){
    if(signal?.aborted)throw abortError();
    if(!this.ready)throw Error('Load an installed CPU model first.');
    if(this.busy)throw Error('MAX-G is already answering. Stop or wait before sending another request.');
    const waitingEpoch=this._epoch;await this._cancelling;
    if(signal?.aborted||waitingEpoch!==this._epoch)throw abortError();
    if(this.busy)throw Error('MAX-G is already answering. Stop or wait before sending another request.');
    if(!this.ready)throw Error('Load an installed CPU model first.');
    const limit=Math.max(32,Math.min(1024,Math.floor(Number(maxTokens)||OUTPUT_TOKENS))),bounded=boundedMessages(input,limit);
    const epoch=this._epoch,controller=new AbortController(),requestId=crypto.randomUUID(),stop=()=>this.stop();
    this._controller=controller;this._requestId=requestId;this._busy=true;
    signal?.addEventListener('abort',stop,{once:true});if(signal?.aborted)stop();
    let text='',final=null;
    const current=()=>{if(controller.signal.aborted||epoch!==this._epoch)throw abortError();};
    try{
      this._state('generating',{contextTrimmed:bounded.truncated});
      await this._call('chat',{model:this._modelId,messages:bounded.messages,max_tokens:limit,request_id:requestId},{signal:controller.signal,onChunk:chunk=>{
        current();if(chunk.error)throw Error(chunk.message||chunk.error?.message||String(chunk.error));
        if(final)throw Error('The local model returned data after its completion receipt.');
        if(typeof chunk.token==='string'){text+=chunk.token;onToken(chunk.token,text);}
        if(chunk.done===true){final=chunk;if(typeof chunk.text==='string')text=chunk.text;}
      }});current();
      if(!final)throw Error('The local model stopped without a completion receipt. Please retry.');
      if(final.model!==this._modelId)throw Error('The local model returned an unexpected model identity. Please reload it.');
      if(!text.trim())throw Error('The local model returned an empty answer. Please retry.');
      if(final.stats)onUsage(final.stats);
      return {text,usage:final.stats||null,contextTrimmed:bounded.truncated,finishReason:final.finishReason||'stop'};
    }catch(error){this._cancelRequest(requestId);throw error;}
    finally{signal?.removeEventListener('abort',stop);if(epoch===this._epoch){this._busy=false;this._controller=null;this._requestId=null;this._state(this.ready?'ready':'unloaded');}}
  }
  _cancelRequest(requestId){if(requestId)this._cancelling=this._call('cancel',{request_id:requestId}).catch(()=>{});}
  stop(){
    this._controller?.abort();
    if(this._requestId)this._cancelRequest(this._requestId);
    else if(this._loading)this._cancelling=this._call('unload',{}).catch(()=>{});
  }
  async unload(){
    this.stop();++this._epoch;this._ready=false;this._loading=false;this._busy=false;this._controller=null;this._requestId=null;this._modelId=null;
    await this._cancelling;await this._call('unload',{});this._state('unloaded');
  }
  async clearCache(){throw Error('Installed Ollama models are managed on this Mac. Use Unload CPU model to release memory; this app does not delete model files.');}
}
