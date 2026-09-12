(function(root){
  'use strict';
  // One PDF build at a time. While it runs, keep only the newest requested view.
  function create(build){
    let active=null,pending=null,cached=null,epoch=0;
    function start(job){active=job;Promise.resolve().then(()=>build(job.input)).then(value=>{if(job.epoch===epoch)cached={key:job.key,value};job.resolve(value);},job.reject).finally(()=>{active=null;const next=pending;pending=null;if(next)start(next);});}
    function request(key,input){
      if(cached?.key===key)return Promise.resolve(cached.value);
      if(active?.key===key&&active.epoch===epoch){if(pending){pending.resolve(null);pending=null;}return active.promise;}
      if(pending?.key===key&&pending.epoch===epoch)return pending.promise;
      const job={key,input,epoch};job.promise=new Promise((resolve,reject)=>Object.assign(job,{resolve,reject}));
      if(active){if(pending)pending.resolve(null);pending=job;}else start(job);return job.promise;
    }
    function invalidate(){epoch++;cached=null;if(pending){pending.resolve(null);pending=null;}}
    return {request,invalidate};
  }
  root.PMIX_RENDER_CACHE={create};
  if(typeof module!=='undefined')module.exports=root.PMIX_RENDER_CACHE;
})(typeof window!=='undefined'?window:globalThis);
