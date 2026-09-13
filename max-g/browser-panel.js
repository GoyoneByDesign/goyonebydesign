/** Visible workspace for the Mac companion's separate Playwright browser. */
import {observationTargets} from './connectors.js';

const make=(tag,text='',className='')=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;};

export function createBrowserPanel({workspace,toast=()=>{},runTask=action=>action(),onShow=()=>{},onConnect=()=>{}}){
  const panel=make('aside','','browser-workspace');panel.id='browserWorkspace';panel.hidden=true;panel.setAttribute('aria-label','MAX-G browser task');
  const toggle=make('button','Browser task','button button-small browser-workspace-toggle');toggle.type='button';toggle.id='browserTaskBtn';toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded','false');
  const header=make('header','','browser-workspace-header');
  const heading=make('div');heading.append(make('span','WORK WITH MAX-G','browser-eyebrow'),make('h2','Browser task'));
  const close=make('button','×','icon-button');close.type='button';close.setAttribute('aria-label','Hide browser side panel');header.append(heading,close);
  const content=make('div','','browser-workspace-content');
  const introduction=make('p','Watch the current page while MAX-G helps with forms and applications.','browser-note');
  const connection=make('p','','browser-connection');
  function field(label,tag='input'){
    const wrap=make('label','','browser-field'),input=make(tag);wrap.append(make('span',label),input);input.setAttribute('aria-label',label);return {wrap,input};
  }
  const address=field('Website address');address.input.type='url';address.input.placeholder='https://…';address.input.autocomplete='url';address.input.spellcheck=false;
  const goal=field('What should MAX-G do?','textarea');goal.input.rows=3;goal.input.placeholder='Fill the contact form with the details I provide…';goal.input.maxLength=1200;
  const controls=make('div','','browser-actions');
  const run=(action)=>Promise.resolve().then(()=>runTask(action)).catch(error=>{if(error.name!=='AbortError')toast(error.message||String(error));});
  function action(label,fn,{secondary=false}={}){const b=make('button',label,`button button-small${secondary?' secondary':''}`);b.type='button';b.addEventListener('click',()=>run(fn));return b;}
  const values=()=>({url:address.input.value.trim(),goal:goal.input.value.trim(),steps:5});
  const start=action('Open & start',()=>workspace.start(values()));start.id='browserStartBtn';
  const resume=action('Continue',()=>workspace.start({...values(),continueTask:true}),{secondary:true});resume.id='browserContinueBtn';
  const stop=make('button','Stop task','button button-small secondary');stop.type='button';stop.addEventListener('click',()=>workspace.stop());stop.id='browserStopBtn';controls.append(start,resume,stop);
  const status=make('p','','browser-task-status');status.id='browserTaskStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const stage=make('section','','browser-preview');
  const title=make('h3','Your browser will appear here'),pageURL=make('p','','browser-current-url');
  const image=make('img');image.alt='Latest view of MAX-G’s automation browser. Form values are hidden in this preview.';image.hidden=true;image.decoding='async';
  const previewNote=make('p','The live website opens in its own browser window. This panel shows its latest view.','browser-note');
  const navigation=make('div','','browser-actions');
  const refresh=action('Refresh view',()=>workspace.observe(),{secondary:true});
  const focus=action('Show browser',()=>workspace.observe({focus:true}),{secondary:true});
  const back=action('Back',()=>workspace.back(),{secondary:true});navigation.append(refresh,focus,back);stage.append(title,pageURL,image,previewNote,navigation);
  const manual=make('details','','browser-manual');manual.append(make('summary','Page controls & attachments'));
  const target=field('Page control','select'),value=field('Value to enter');value.input.autocomplete='off';
  const selectButtons=make('div','','browser-actions');
  const manualAction=action=>workspace.act({action,target:target.input.value,value:value.input.value});
  const fill=action('Fill',()=>manualAction('fill'));
  const select=action('Select',()=>manualAction('select'),{secondary:true});
  const press=action('Review click',()=>manualAction('press'),{secondary:true});selectButtons.append(fill,select,press);
  const file=field('Attach a file to this control');file.input.type='file';
  const upload=action('Review upload',async()=>{if(!file.input.files?.length)throw new Error('Choose a file first.');try{return await workspace.act({action:'upload',target:target.input.value,files:[...file.input.files]});}finally{file.input.value='';}});
  manual.append(target.wrap,value.wrap,selectButtons,file.wrap,upload);
  const readable=make('details','','browser-readable');readable.append(make('summary','Readable page text'));const text=make('p');readable.append(text);
  const activity=make('section','','browser-task-log');activity.append(make('h3','Task activity'));const log=make('ol');activity.append(log);
  const footer=make('div','','browser-workspace-footer');
  const settings=action('Access & connections',()=>onConnect(),{secondary:true});
  const end=action('Close browser',()=>workspace.close(),{secondary:true});footer.append(settings,end);
  const handoff=make('p','MAX-G uses the access level you chose. Review actions when prompted; complete passwords and CAPTCHA checks in the browser.','browser-note');
  content.append(introduction,connection,address.wrap,goal.wrap,controls,status,stage,manual,readable,activity,handoff,footer);panel.append(header,content);
  document.querySelector('.main-content').append(panel);document.querySelector('.topbar-actions').prepend(toggle);
  let opened=false,lastRevision='',state=workspace.snapshot;
  const primary=[start,resume,refresh,focus,back,fill,select,press,upload,end];
  function render(next){
    if(state?.paired&&!next.paired){address.input.value='';goal.input.value='';value.input.value='';file.input.value='';}
    state=next;panel.dataset.phase=next.phase;panel.setAttribute('aria-busy',String(next.busy));
    connection.textContent=next.paired?'Connected to the Mac companion':'Browser automation needs the installed MAX-G app or a paired Mac companion.';
    status.textContent=next.message;stop.disabled=!next.busy;
    for(const button of primary)button.disabled=next.busy||!next.paired;
    for(const button of [resume,refresh,focus,back,fill,select,press,upload,end])button.disabled||=!next.observation;
    address.input.disabled=goal.input.disabled=next.busy;
    const obs=next.observation,revision=obs?.revision||'';
    title.textContent=obs?.title||'Your browser will appear here';pageURL.textContent=obs?.url||'';
    const data=obs?.preview?.data_url;
    if(typeof data==='string'&&data.length<=710000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(data)){
      if(image.getAttribute('src')!==data)image.src=data;image.hidden=false;
    }else{image.removeAttribute('src');image.hidden=true;}
    previewNote.textContent=obs?.preview?.message||'The live website opens in its own browser window. This panel shows its latest view.';
    text.textContent=String(obs?.text||'No readable page loaded.');
    if(revision!==lastRevision){
      lastRevision=revision;const selected=target.input.selectedOptions[0]?.textContent;target.input.replaceChildren();
      for(const control of observationTargets(obs)){
        const option=make('option',String(control.label||control.name||control.text||control.target));option.value=String(control.target??control.id??control.target_id);option.selected=option.textContent===selected;target.input.append(option);
      }
      value.input.value='';file.input.value='';if(obs?.url)address.input.value=obs.url;
    }
    const noTargets=!target.input.options.length;
    for(const b of [fill,select,press,upload])b.disabled||=noTargets;
    log.replaceChildren(...next.history.slice(-8).map(event=>make('li',event.message)));
    activity.hidden=!next.history.length;
  }
  function positionPanel(){const main=document.querySelector('.main-content'),dock=document.getElementById('liveOrbDock');if(main&&dock&&!dock.hidden)panel.style.setProperty('--browser-overlay-top',`${Math.ceil(dock.getBoundingClientRect().bottom-main.getBoundingClientRect().top+8)}px`);}
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(positionPanel);for(const el of [document.querySelector('.main-content'),document.getElementById('liveOrbDock')])if(el)observer.observe(el);}
  globalThis.addEventListener('resize',positionPanel);
  function show(value=true){opened=value;panel.hidden=!value;toggle.setAttribute('aria-expanded',String(value));document.body.classList.toggle('browser-workspace-open',value);if(value){onShow();positionPanel();requestAnimationFrame(()=>address.input.focus({preventScroll:true}));}else toggle.focus();}
  toggle.addEventListener('click',()=>show(!opened));close.addEventListener('click',()=>show(false));
  panel.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]')){event.preventDefault();show(false);}});
  workspace.subscribe(render);
  return {
    show,
    prepare(task={}){show();if(task.url)address.input.value=task.url;if(task.mode!=='panel'&&task.goal)goal.input.value=task.goal;if(!task.url&&!state.observation)address.input.focus();},
    async start(task){this.prepare(task);return runTask(()=>workspace.start({url:task.url||address.input.value,goal:task.goal||'',steps:5}));},
    clear(){value.input.value='';goal.input.value='';address.input.value='';file.input.value='';show(false);},
  };
}
