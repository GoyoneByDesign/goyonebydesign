import {RELEASE_VERSION, RELEASE_BUILD, RELEASE_DATE} from './release-version.js';

export function releaseDateLabel(value){
 const date=new Date(value);if(!value||!Number.isFinite(date.getTime()))return 'Date not recorded';
 const format=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'shortOffset'});
 return format.format(date)+' (America/New_York)';
}
export function workerMetadata(worker,timeoutMs=5000){
 return new Promise((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>{channel.port1.close();reject(Error('The downloaded worker could not confirm its version. Check for updates again.'));},timeoutMs);channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();const data=event.data;if(!data?.complete)return reject(Error('The update cache is incomplete. Keep your current app open and retry.'));try{resolve({...releaseSummary({...data,schema:1}),releasedAt:data.releasedAt});}catch(error){reject(error);}};try{worker.postMessage({type:'MAXG_UPDATE_METADATA'},[channel.port2]);}catch(error){clearTimeout(timer);channel.port1.close();reject(error);}});
}

export function installedDisplay(nav=globalThis.navigator, match=globalThis.matchMedia?.bind(globalThis)) {
  return Boolean(nav?.standalone || match?.('(display-mode: standalone)').matches || match?.('(display-mode: window-controls-overlay)').matches);
}

export function releaseSummary(value) {
  if (!value || value.schema !== 1 || typeof value.version!=='string' || !/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value.version)
      || !Number.isSafeInteger(value.build) || value.build < 1 || value.build > 1000000)
    throw Error('The website has not finished publishing a complete MAX-ALPHA release. Try again shortly.');
  return {version:value.version, build:value.build};
}

/** Coordinates UI updates only; it never clears personal data or model caches. */
export function createAppUpdates({desktop=false, request, beforeApply=async()=>{}, canCheck=()=>true,
  canAutomaticCheck=()=>false,
  onChange=()=>{}, getWorkerMetadata=workerMetadata, autoApply=false, canAutoApply=()=>false, fetcher=globalThis.fetch?.bind(globalThis), sw=globalThis.navigator?.serviceWorker,
  reload=()=>globalThis.location.reload(), base=globalThis.location?.href || 'https://www.goyonebydesign.com/max-alpha/'}={}) {
  let registration, checking=null, applying=false, activationRequested=false, lastCheck=0, automaticActivation=false, target=null, activationTimer;
  let state={version:RELEASE_VERSION, build:RELEASE_BUILD, releasedAt:RELEASE_DATE, phase:'idle', available:'',
    message:'Your iPhone, iPad, web and Mac apps use the same shared interface releases.'};
  const set=patch=>{state={...state,...patch};onChange({...state});return {...state};};
  const maybeAutoApply=()=>{
    if(automaticActivation&&autoApply&&!desktop&&canAutomaticCheck()&&canAutoApply())Promise.resolve().then(()=>{
      if(state.phase==='ready'&&canAutomaticCheck()&&canAutoApply())return apply({automatic:true});
    }).catch(()=>{}); // beforeApply preserves unsaved work; manual update remains available.
  };
  const waiting=()=>{
    if(registration?.waiting){set({phase:'ready',message:'A MAX-ALPHA update is downloaded. Update when you are ready.'});maybeAutoApply();}
  };
  sw?.addEventListener('controllerchange',async()=>{if(!activationRequested||desktop)return;activationRequested=false;clearTimeout(activationTimer);try{const active=await getWorkerMetadata(sw.controller);if(!target||active.build!==target.build||active.version!==target.version)throw Error('The activated release differs from the verified update. Keep this window open and retry.');applying=false;reload();}catch(error){applying=false;set({phase:'error',message:error.message});}});

  function attach(value) {
    registration=value;waiting();
    registration.addEventListener('updatefound',()=>{
      const worker=registration.installing;
      worker?.addEventListener('statechange',()=>{
        if(worker.state==='installed')waiting();
        else if(worker.state==='redundant'&&state.phase==='checking')
          set({phase:'error',message:'The new release could not finish downloading. Your current app is still available; try again.'});
      });
    });
  }
  async function check({automatic=false}={}) {
    if(checking)return checking;
    if(!canCheck()||(automatic&&(!canAutomaticCheck()||Date.now()-lastCheck<30*60*1000)))return {...state};
    lastCheck=Date.now();automaticActivation=automatic;
    checking=(async()=>{
      set({phase:'checking',message:'Checking the shared MAX-ALPHA release…'});
      try {
        if(desktop){
          const result=await request('check');
          if(automatic&&(!canAutomaticCheck()||!canCheck()))return set({phase:'idle',available:'',message:'Automatic update checks are paused. Your current app stays available.'});
          return set({available:result.available_version||'',phase:result.restart_required?'restart':result.available_build>RELEASE_BUILD?'ready':'current',
            message:result.restart_required?'Update prepared. Quit MAX-ALPHA and reopen it to finish.':result.available_build>RELEASE_BUILD?'A shared app update is available for this Mac.':'You have the current shared MAX-ALPHA release.'});
        }
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
        let release;
        try{
          const response=await fetcher(new URL('./release.json',base),{cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal});
          if(!response.ok)throw Error('The release check could not reach the website. Your installed app is still available.');
          const text=await response.text();if(text.length>160000)throw Error('The release information is too large.');
          release=releaseSummary(JSON.parse(text));target=release;
        } finally {clearTimeout(timer);}
        if(automatic&&(!canAutomaticCheck()||!canCheck()))return set({phase:'idle',available:'',message:'Automatic update checks are paused. Your current app stays available.'});
        if(release.build<RELEASE_BUILD||release.build===RELEASE_BUILD&&release.version!==RELEASE_VERSION)
          throw Error('The website release does not match your current app. Keep this window open and try again later.');
        await registration?.update();
        if(automatic&&(!canAutomaticCheck()||!canCheck()))return set({phase:'idle',available:'',message:'Automatic update checks are paused. Your current app stays available.'});
        if(registration?.waiting){const ready=set({phase:'ready',available:release.version,message:'A MAX-ALPHA update is downloaded. Update when you are ready.'});maybeAutoApply();return ready;}
        if(release.build>RELEASE_BUILD)return set({phase:'checking',available:release.version,message:registration?'The new release is downloading. Keep MAX-ALPHA open for a moment.':'A new release is available. Reopen MAX-ALPHA online to finish installing its offline support.'});
        return set({phase:'current',message:`MAX-ALPHA ${RELEASE_VERSION} is current.`,available:''});
      } catch(error) {
        return set({phase:'error',message:error.name==='AbortError'?'The update check timed out. Try again when your connection improves.':error.message});
      }
    })().finally(()=>{checking=null;});
    return checking;
  }
  async function apply({automatic=false}={}){
    if(applying)return;
    if(state.phase!=='ready')throw Error('Check for an available update first.');
    applying=true;
    try{
      await beforeApply();
      if(automatic&&(!canAutomaticCheck()||!canCheck()||!canAutoApply()))throw Error('Automatic updating is paused. The update is ready when you choose Update & reopen.');
      if(desktop){
        set({phase:'applying',message:'Downloading and verifying the shared app. Your Mac tools and personal data stay in place…'});
        const result=await request('apply');
        if(!result.restart_required)throw Error('No newer release was prepared. Check for updates again.');
        return set({phase:'restart',message:'Update prepared. Quit MAX-ALPHA with Command–Q, then reopen its Dock icon to finish.'});
      }
      if(!registration?.waiting)throw Error('The downloaded update is no longer waiting. Check again.');
      const verified=await getWorkerMetadata(registration.waiting);
      if(verified.build<=RELEASE_BUILD||target&&(verified.build!==target.build||verified.version!==target.version))throw Error('The waiting update does not match the expected newer release. Check for updates again.');
      target=verified;
      set({phase:'applying',available:verified.version,availableBuild:verified.build,availableDate:verified.releasedAt,message:`Installing verified version ${verified.version} · Build ${verified.build} · ${releaseDateLabel(verified.releasedAt)}. MAX-ALPHA will reopen automatically…`});
      activationRequested=true;
      registration.waiting.postMessage({type:'MAXG_ACTIVATE_UPDATE',version:target.version,build:target.build});
      // If the OS suspends activation, never loop reload or discard user state.
      activationTimer=setTimeout(()=>{if(applying){applying=false;activationRequested=false;set({phase:'error',message:'Close and reopen MAX-ALPHA to finish applying the downloaded update.'});}},15000);
    }catch(error){applying=false;activationRequested=false;set({phase:state.phase==='ready'?'ready':'error',message:error.message});throw error;}
    finally{if(desktop)applying=false;}
  }
  return {attach,check,apply,get state(){return {...state};}};
}

export function renderUpdateSettings({manager,desktop=false,check,apply,getAutomaticChecks=()=>false,setAutomaticChecks=async()=>{}}){
  const section=document.createElement('section');section.className='update-settings';
  const heading=document.createElement('h3');heading.textContent='One MAX-ALPHA, across your devices';
  const version=document.createElement('p');version.className='release-version';version.textContent=`Installed interface · Version ${RELEASE_VERSION} · Build ${RELEASE_BUILD} · Release prepared ${releaseDateLabel(RELEASE_DATE)}`;
  const status=document.createElement('p');status.className='update-status';status.dataset.updateStatus='';status.setAttribute('role','status');status.textContent=manager.state.message;
  const actions=document.createElement('div');actions.className='update-actions';
  const choice=document.createElement('label');choice.className='update-opt-in';
  const automatic=document.createElement('input');automatic.type='checkbox';automatic.checked=getAutomaticChecks()===true;
  automatic.addEventListener('change',async()=>{
    automatic.disabled=true;
    try { await setAutomaticChecks(automatic.checked); }
    catch { status.textContent='The update preference could not be saved. Try again.'; }
    finally { automatic.checked=getAutomaticChecks()===true;automatic.disabled=false; }
  });
  const choiceText=document.createElement('span');choiceText.textContent='Check for updates automatically when online';choice.append(automatic,choiceText);
  for(const [label,action,id]of [['Check for updates',check,'checkUpdatesBtn'],[desktop?'Download update':'Install complete update & reopen',apply,'applyUpdateBtn']]){
    const button=document.createElement('button');button.type='button';button.className='button';button.id=id;button.textContent=label;
    button.disabled=id==='applyUpdateBtn'&&manager.state.phase!=='ready';button.addEventListener('click',action);actions.append(button);
  }
  const install=document.createElement('a');install.className='button';install.href=desktop?'https://www.goyonebydesign.com/max-alpha/install.html':'./install.html';install.textContent='Install on iPhone or iPad';install.target='_blank';install.rel='noopener';
  const details=document.createElement('p');details.textContent='Automatic checks are off until you enable them on this device. They also need internet permission. Click Update available to install the complete verified web release and reopen automatically after your work is safely saved. Active work or unsaved drafts block installation rather than being discarded. A separately signed automatic installation channel is not configured for this release; existing web checks use HTTPS and file integrity checks. Your browser manages its own service-worker update lifecycle; this setting controls checks requested by MAX-ALPHA.';
  const data=document.createElement('p');data.className='muted';data.textContent='Chats, profile settings, permissions and downloaded voices stay on each device; they do not automatically sync. Mac automation and local voice cloning require the Mac companion. Updates to native Mac tools require a Mac installer.';
  const history=document.createElement('a');history.className='button';history.href=desktop?'https://www.goyonebydesign.com/apps/updates/#max-alpha':'./history.html';history.textContent='Version & update history';history.target='_blank';history.rel='noopener noreferrer';
  section.append(heading,version,status,choice,actions,install,history,details,data);return section;
}
