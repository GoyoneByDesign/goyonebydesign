import {RELEASE_VERSION, RELEASE_BUILD} from './release-version.js';

export function installedDisplay(nav=globalThis.navigator, match=globalThis.matchMedia?.bind(globalThis)) {
  return Boolean(nav?.standalone || match?.('(display-mode: standalone)').matches || match?.('(display-mode: window-controls-overlay)').matches);
}

export function releaseSummary(value) {
  if (!value || value.schema !== 1 || typeof value.version!=='string' || !/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value.version)
      || !Number.isSafeInteger(value.build) || value.build < 1 || value.build > 1000000)
    throw Error('The website has not finished publishing a complete MAX-G release. Try again shortly.');
  return {version:value.version, build:value.build};
}

/** Coordinates UI updates only; it never clears personal data or model caches. */
export function createAppUpdates({desktop=false, request, beforeApply=async()=>{}, canCheck=()=>true,
  onChange=()=>{}, fetcher=globalThis.fetch?.bind(globalThis), sw=globalThis.navigator?.serviceWorker,
  reload=()=>globalThis.location.reload(), base=globalThis.location?.href || 'https://www.goyonebydesign.com/max-g/'}={}) {
  let registration, checking=null, applying=false, activationRequested=false, lastCheck=0;
  let state={version:RELEASE_VERSION, build:RELEASE_BUILD, phase:'idle', available:'',
    message:'Your iPhone, iPad, web and Mac apps use the same shared interface releases.'};
  const set=patch=>{state={...state,...patch};onChange({...state});return {...state};};
  const waiting=()=>{
    if(registration?.waiting) set({phase:'ready',message:'A MAX-G update is downloaded. Update when you are ready.'});
  };
  sw?.addEventListener('controllerchange',()=>{if(activationRequested&&!desktop){activationRequested=false;applying=false;reload();}});
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
    if(!canCheck()||(automatic&&Date.now()-lastCheck<30*60*1000))return {...state};
    lastCheck=Date.now();
    checking=(async()=>{
      set({phase:'checking',message:'Checking the shared MAX-G release…'});
      try {
        if(desktop){
          const result=await request('check');
          return set({available:result.available_version||'',phase:result.restart_required?'restart':result.available_build>RELEASE_BUILD?'ready':'current',
            message:result.restart_required?'Update prepared. Quit MAX-G and reopen it to finish.':result.available_build>RELEASE_BUILD?'A shared app update is available for this Mac.':'You have the current shared MAX-G release.'});
        }
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
        let release;
        try{
          const response=await fetcher(new URL('./release.json',base),{cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal});
          if(!response.ok)throw Error('The release check could not reach the website. Your installed app is still available.');
          const text=await response.text();if(text.length>160000)throw Error('The release information is too large.');
          release=releaseSummary(JSON.parse(text));
        } finally {clearTimeout(timer);}
        await registration?.update();
        if(registration?.waiting)return set({phase:'ready',available:release.version,message:'A MAX-G update is downloaded. Update when you are ready.'});
        if(release.build>RELEASE_BUILD)return set({phase:'checking',available:release.version,message:registration?'The new release is downloading. Keep MAX-G open for a moment.':'A new release is available. Reopen MAX-G online to finish installing its offline support.'});
        return set({phase:'current',message:`MAX-G ${RELEASE_VERSION} is current.`,available:''});
      } catch(error) {
        return set({phase:'error',message:error.name==='AbortError'?'The update check timed out. Try again when your connection improves.':error.message});
      }
    })().finally(()=>{checking=null;});
    return checking;
  }
  async function apply(){
    if(applying)return;
    if(state.phase!=='ready')throw Error('Check for an available update first.');
    applying=true;
    try{
      await beforeApply();
      if(desktop){
        set({phase:'applying',message:'Downloading and verifying the shared app. Your Mac tools and personal data stay in place…'});
        const result=await request('apply');
        if(!result.restart_required)throw Error('No newer release was prepared. Check for updates again.');
        return set({phase:'restart',message:'Update prepared. Quit MAX-G with Command–Q, then reopen its Dock icon to finish.'});
      }
      if(!registration?.waiting)throw Error('The downloaded update is no longer waiting. Check again.');
      set({phase:'applying',message:'Opening the updated MAX-G…'});
      activationRequested=true;
      registration.waiting.postMessage({type:'MAXG_ACTIVATE_UPDATE'});
      // If the OS suspends activation, never loop reload or discard user state.
      setTimeout(()=>{if(applying){applying=false;activationRequested=false;set({phase:'error',message:'Close and reopen MAX-G to finish applying the downloaded update.'});}},15000);
    }catch(error){applying=false;activationRequested=false;set({phase:state.phase==='ready'?'ready':'error',message:error.message});throw error;}
    finally{if(desktop)applying=false;}
  }
  return {attach,check,apply,get state(){return {...state};}};
}

export function renderUpdateSettings({manager,desktop=false,check,apply}){
  const section=document.createElement('section');section.className='update-settings';
  const heading=document.createElement('h3');heading.textContent='One MAX-G, across your devices';
  const version=document.createElement('p');version.className='release-version';version.textContent=`Shared app · ${RELEASE_VERSION} · build ${RELEASE_BUILD}`;
  const status=document.createElement('p');status.className='update-status';status.dataset.updateStatus='';status.setAttribute('role','status');status.textContent=manager.state.message;
  const actions=document.createElement('div');actions.className='update-actions';
  for(const [label,action,id]of [['Check for updates',check,'checkUpdatesBtn'],[desktop?'Download update':'Update & reopen',apply,'applyUpdateBtn']]){
    const button=document.createElement('button');button.type='button';button.className='button';button.id=id;button.textContent=label;
    button.disabled=id==='applyUpdateBtn'&&manager.state.phase!=='ready';button.addEventListener('click',action);actions.append(button);
  }
  const install=document.createElement('a');install.className='button';install.href=desktop?'https://www.goyonebydesign.com/max-g/install.html':'./install.html';install.textContent='Install on iPhone or iPad';install.target='_blank';install.rel='noopener';
  const details=document.createElement('p');details.textContent='Each device checks the same published release when MAX-G opens or returns to the foreground. Updates wait until you apply them or reopen the app. An internet connection is needed to download updates.';
  const data=document.createElement('p');data.className='muted';data.textContent='Chats, profile settings, permissions and downloaded voices stay on each device; they do not automatically sync. Mac automation and local voice cloning require the Mac companion. Updates to native Mac tools require a Mac installer.';
  section.append(heading,version,status,actions,install,details,data);return section;
}
