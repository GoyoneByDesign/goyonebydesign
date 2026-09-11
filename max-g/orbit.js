/** Orbit appearance is decorative local UI. It never requests weather, infers feelings, or runs tools. */
export const ORBIT_DEFAULTS=Object.freeze({intensity:'gentle',season:'auto',birthday:'',funny:true,weather:true});
export const ORBIT_SEASONS=Object.freeze({auto:'Seasonal, automatically',none:'Everyday Orbit',halloween:'Halloween',christmas:'Christmas',newyear:'New Year',valentine:'Valentine’s Day',stpatrick:'St. Patrick’s Day',birthday:'Birthday'});
const MOODS=new Set(['neutral','happy','joyful','sad','embarrassed','surprised','excited','thoughtful','confused','concerned','proud','playful','sleepy','frustrated','affectionate','listening','thinking','curious']);
const STATES=new Set(['idle','thinking','listening','speaking']);
const LIGHT_MOODS=new Set(['neutral','happy','joyful','proud','playful','affectionate','curious']);
const WEATHER_LIFETIME=10*60*1000;
const SVG_NS='http://www.w3.org/2000/svg';
const attached=new WeakMap();

export function validBirthday(value){
  if(typeof value!=='string'||!/^\d{2}-\d{2}$/.test(value))return false;
  const [month,day]=value.split('-').map(Number);
  return month>=1&&month<=12&&day>=1&&day<=[31,29,31,30,31,30,31,31,30,31,30,31][month-1];
}

export function normalizeOrbitSettings(value){
  const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  return {intensity:['gentle','lively','off'].includes(input.intensity)?input.intensity:ORBIT_DEFAULTS.intensity,
    season:Object.hasOwn(ORBIT_SEASONS,input.season)?input.season:ORBIT_DEFAULTS.season,
    birthday:validBirthday(input.birthday)?input.birthday:'',
    funny:typeof input.funny==='boolean'?input.funny:ORBIT_DEFAULTS.funny,
    weather:typeof input.weather==='boolean'?input.weather:ORBIT_DEFAULTS.weather};
}

/** Uses the device's local calendar; birthday takes priority over seasonal windows. */
export function seasonForDate(settings,date=new Date()){
  const config=normalizeOrbitSettings(settings);
  if(config.season!=='auto')return config.season;
  if(!(date instanceof Date)||!Number.isFinite(date.getTime()))return 'none';
  const month=date.getMonth()+1,day=date.getDate(),key=`${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  if(config.birthday&&config.birthday===key)return 'birthday';
  if(month===10&&day>=24)return 'halloween';
  if(month===12&&day>=12&&day<=26)return 'christmas';
  if(month===12&&day>=27||month===1&&day<=3)return 'newyear';
  if(month===2&&day>=12&&day<=14)return 'valentine';
  if(month===3&&day>=15&&day<=17)return 'stpatrick';
  return 'none';
}

/** Only structured Open-Meteo result metadata supplied by the caller is accepted. */
export function weatherAppearance(value){
  if(!value||typeof value!=='object'||value.source!=='open-meteo'||!Number.isInteger(value.code))return null;
  const code=value.code;
  let kind=null;
  if([0,1].includes(code))kind='sun';
  else if([2,3].includes(code))kind='cloud';
  else if([45,48].includes(code))kind='fog';
  else if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))kind='rain';
  else if([71,73,75,77,85,86].includes(code))kind='snow';
  else if([95,96,99].includes(code))kind='storm';
  return kind?{kind,code,label:typeof value.label==='string'?value.label.replace(/[\u0000-\u001f]/g,' ').slice(0,140):''}:null;
}

const star=(x,y,size=8)=>`<path d="M${x} ${y-size}l${size*.28} ${size*.72} ${size*.72} ${size*.28}-${size*.72} ${size*.28}-${size*.28} ${size*.72}-${size*.28}-${size*.72}-${size*.72}-${size*.28} ${size*.72}-${size*.28}z"/>`;
const SEASON_ART={
  none:'',
  halloween:'<g class="orbit-hat"><path d="M144 70 197 9 226 61" fill="#493761" stroke="#a294cc" stroke-width="2.5" stroke-linejoin="round"/><path d="m177 44 40 9 8 12-59-8z" fill="#f4aa52"/><ellipse cx="185" cy="69" rx="63" ry="10" fill="#332849" stroke="#a294cc" stroke-width="2.5"/><rect x="187" y="50" width="13" height="10" rx="2" fill="#62422b" stroke="#ffcc7d" stroke-width="2"/></g><g class="orbit-float" fill="#ffd092">'+star(292,78,7)+'</g>',
  christmas:'<g class="orbit-hat"><path d="M148 66c4-25 26-51 51-52 31-1 50 15 48 37-9-12-23-15-29-6l10 24" fill="#d94f62" stroke="#ffbcc1" stroke-width="2.5"/><path d="M146 63q41-12 82 1l2 17q-44-11-85-2z" fill="#f6f4ec" stroke="#dce7ed" stroke-width="2"/><circle cx="247" cy="52" r="13" fill="#fff8ee" stroke="#dae5ed" stroke-width="2"/></g><g class="orbit-float" fill="#e8ffff">'+star(295,83,6)+'</g>',
  newyear:'<g class="orbit-hat"><path d="m151 67 41-56 32 59z" fill="#7c66c4" stroke="#eee1ff" stroke-width="2.5"/><path d="m164 47 49 1m-38-16 29 1" stroke="#f6cf77" stroke-width="6"/><ellipse cx="187" cy="70" rx="43" ry="7" fill="#f3c975"/><circle cx="193" cy="11" r="6" fill="#fff0af"/></g><g class="orbit-celebrate" fill="#ffe29d">'+star(100,94,8)+star(297,76,10)+star(284,117,5)+'</g>',
  birthday:'<g class="orbit-hat"><path d="m151 69 37-59 38 59z" fill="#ec8eae" stroke="#ffe2df" stroke-width="2.5"/><path d="m167 44 46 7m-57 9 27-43" stroke="#ffdf8a" stroke-width="5"/><ellipse cx="188" cy="70" rx="43" ry="7" fill="#fae3b2"/><circle cx="188" cy="11" r="8" fill="#bdeef0"/></g><g class="orbit-celebrate" fill="#efd0ff">'+star(104,99,8)+star(291,85,9)+'</g>',
  valentine:'<g class="orbit-heart orbit-float"><path d="M291 98c-37-22-25-47-8-39 5 2 8 7 8 7s7-12 17-8c21 8 11 28-17 40z" fill="#f39cb5" stroke="#ffdae2" stroke-width="2.5"/><path d="m280 67-5 5" stroke="#fff0f0" stroke-width="3" stroke-linecap="round"/></g><g fill="#ffc8dc">'+star(112,93,6)+'</g>',
  stpatrick:'<g class="orbit-hat"><path d="m151 64-5-43q41-11 81 0l-5 44" fill="#358871" stroke="#a6e5bc" stroke-width="2.5"/><path d="m151 50 73 0-2 16h-70z" fill="#203f39"/><rect x="180" y="49" width="21" height="17" rx="3" fill="none" stroke="#edcc7b" stroke-width="4"/><ellipse cx="186" cy="71" rx="56" ry="10" fill="#3e9b7c" stroke="#a6e5bc" stroke-width="2.5"/></g><g transform="translate(289 89)"><g class="orbit-float" fill="#a1e3b3"><circle cx="-6" cy="-4" r="7"/><circle cx="6" cy="-4" r="7"/><circle cx="0" cy="-13" r="7"/><path d="M0 0q-3 12 4 17" fill="none" stroke="#a1e3b3" stroke-width="3"/></g></g>',
};
const umbrella='<g class="orbit-umbrella"><path d="M88 86v81q0 16 13 13 8-2 8-11" fill="none" stroke="#f6d68a" stroke-width="5" stroke-linecap="round"/><path d="M29 86a59 48 0 0 1 118 0q-15-13-30 0-15-13-29 0-15-13-30 0-15-13-29 0z" fill="#e3af59" stroke="#ffe3a3" stroke-width="2.5"/><path d="M88 38q-25 20-30 48m30-48q26 18 29 48" fill="none" stroke="#ffe3a3" stroke-width="2"/><path d="M88 32v6" stroke="#ffe3a3" stroke-width="4" stroke-linecap="round"/></g>';
const rain='<g class="orbit-rain" stroke="#90dce9" stroke-width="3" stroke-linecap="round"><path d="m37 111-4 9m105-13-4 9m-66 78-4 9"/></g>';
const cloud='<g class="orbit-cloud orbit-float"><path d="M264 75c-11-17 4-32 20-27 7-18 38-15 40 6 26-4 33 27 12 32h-62q-10-1-10-11z" fill="#c3d8e8" stroke="#eaf8ff" stroke-width="2.5"/></g>';
const WEATHER_ART={
  sun:'<g class="orbit-sun"><circle cx="302" cy="68" r="19" fill="#f4cf7a" stroke="#ffe9a9" stroke-width="2.5"/><path d="M302 36v-7m0 78v-7m32-32h7m-78 0h7m10-22-5-5m49 49 5 5m-5-49 5-5m-49 49-5 5" fill="none" stroke="#ffe3a3" stroke-width="3.5" stroke-linecap="round"/></g>',
  cloud,
  fog:'<g class="orbit-float" fill="none" stroke="#c7dce8" stroke-width="5" stroke-linecap="round" opacity=".85"><path d="M58 95h51M44 110h72M55 125h40"/></g>',
  rain:umbrella+rain,
  snow:'<g class="orbit-snow" fill="none" stroke="#d8f6ff" stroke-width="2.5" stroke-linecap="round"><path d="M86 66v26m-11-20 22 14m-22 0 22-14M298 99v24m-10-18 20 12m-20 0 20-12M77 185v18m-8-14 16 10m-16 0 16-10"/></g><path d="M112 243q85 23 176-3" fill="none" stroke="#edfaff" stroke-width="5" stroke-linecap="round" opacity=".7"/>',
  storm:umbrella+rain+'<path d="m312 104-10 18h10l-7 15 23-22h-13l9-11z" fill="#efd79b" stroke="#fff0be" stroke-width="1.5"/>',
};

/** Enhance the existing SVG globe; preserve its original eyes, hoop, moods and accessible status. */
export function attachOrbit(element,{settings=ORBIT_DEFAULTS,motion=true,now=()=>Date.now()}={}){
  if(!element?.querySelector('.orb-art'))throw new TypeError('Attach Orbit to the existing globe element.');
  attached.get(element)?.dispose();
  const document=element.ownerDocument,window=document.defaultView;
  let config=normalizeOrbitSettings(settings),enabled=motion!==false,visible=true,disposed=false,weather=null,weatherUntil=0;
  let seasonal='',weatherKey='',jokeIndex=0,nextJoke=now()+45000,timer=null,jokeTimer=null;
  const originalLabel=element.getAttribute('aria-label');
  const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const accessories=document.createElementNS(SVG_NS,'svg');accessories.setAttribute('viewBox','0 0 400 320');accessories.setAttribute('aria-hidden','true');accessories.classList.add('orbit-accessories');
  const seasonLayer=document.createElementNS(SVG_NS,'g'),weatherLayer=document.createElementNS(SVG_NS,'g');
  seasonLayer.classList.add('orbit-season-layer');weatherLayer.classList.add('orbit-weather-layer');accessories.append(seasonLayer,weatherLayer);element.append(accessories);element.classList.add('orbit-enhanced');
  const reduced=()=>!enabled||config.intensity==='off'||media?.matches===true;
  const running=()=>!disposed&&!document.hidden&&visible&&!reduced();
  function stopJoke(){if(jokeTimer!==null)window.clearTimeout(jokeTimer);jokeTimer=null;delete element.dataset.orbitJoke;}
  function playFunny(){
    if(!running()||!config.funny||element.dataset.state!=='idle'||!LIGHT_MOODS.has(element.dataset.emotion||'neutral'))return false;
    stopJoke();element.dataset.orbitJoke=['wink','peek','tilt'][jokeIndex++%3];jokeTimer=window.setTimeout(stopJoke,2400);nextJoke=now()+(config.intensity==='lively'?55000:85000);return true;
  }
  function render(){
    if(disposed)return;
    if(weather&&now()>=weatherUntil)weather=null;
    const season=seasonForDate(config,new Date(now())),kind=config.weather&&weather?weather.kind:'none';
    if(season!==seasonal){seasonal=season;seasonLayer.innerHTML=SEASON_ART[season]||'';}
    if(kind!==weatherKey){weatherKey=kind;weatherLayer.innerHTML=WEATHER_ART[kind]||'';}
    element.dataset.orbitSeason=season;element.dataset.orbitWeather=kind;
    element.dataset.orbitMotion=reduced()?'off':config.intensity;element.dataset.orbitRunning=String(running());
    const look=season==='none'?'':` ${ORBIT_SEASONS[season]} accessories.`;
    const condition=kind==='none'?'':` ${kind} decoration from returned weather data${weather.label?' for '+weather.label:''}.`;
    element.setAttribute('aria-label',(originalLabel||'MAX-G, a globe with expressive eyes and an orbiting hoop.')+look+condition);
    if(!running())stopJoke();
  }
  function schedule(){
    if(timer!==null)window.clearTimeout(timer);timer=null;render();
    if(disposed||document.hidden||!visible)return;
    // One coarse timer; SVG animation stays in CSS and performs no frame-by-frame JS layout.
    const untilJoke=running()&&config.funny?Math.max(1000,nextJoke-now()):3600000;
    const untilWeather=weather?Math.max(1000,weatherUntil-now()):3600000;
    timer=window.setTimeout(()=>{if(now()>=nextJoke){if(!playFunny())nextJoke=now()+30000;}schedule();},Math.min(untilJoke,untilWeather,3600000));
  }
  function setMood(state='idle',emotion){
    if(disposed)return;
    element.dataset.state=STATES.has(state)?state:'idle';if(MOODS.has(emotion))element.dataset.emotion=emotion;
    if(element.dataset.state!=='idle'||!LIGHT_MOODS.has(element.dataset.emotion))stopJoke();schedule();
  }
  function setConfig(value,{motion:nextMotion=enabled}={}){config=normalizeOrbitSettings(value);enabled=nextMotion!==false;if(!config.funny)stopJoke();schedule();return {...config};}
  function setWeather(value){weather=weatherAppearance(value);weatherUntil=weather?now()+WEATHER_LIFETIME:0;schedule();return weather?{...weather}:null;}
  const visibility=()=>schedule();document.addEventListener('visibilitychange',visibility);
  if(media?.addEventListener)media.addEventListener('change',visibility);else media?.addListener?.(visibility);
  const observer=window.IntersectionObserver?new window.IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;schedule();},{threshold:0}):null;observer?.observe(element);
  const controller={setMood,setConfig,setWeather,clearWeather:()=>setWeather(null),playFunny,
    get snapshot(){return {settings:{...config},season:seasonal,weather:weatherKey,running:running(),reducedMotion:reduced()};},
    dispose(){if(disposed)return;disposed=true;if(timer!==null)window.clearTimeout(timer);stopJoke();observer?.disconnect();document.removeEventListener('visibilitychange',visibility);if(media?.removeEventListener)media.removeEventListener('change',visibility);else media?.removeListener?.(visibility);accessories.remove();element.classList.remove('orbit-enhanced');for(const key of ['orbitSeason','orbitWeather','orbitMotion','orbitRunning'])delete element.dataset[key];if(originalLabel===null)element.removeAttribute('aria-label');else element.setAttribute('aria-label',originalLabel);attached.delete(element);}};
  attached.set(element,controller);schedule();return controller;
}

/** Standalone settings fieldset. The caller persists settings and updates the controller. */
export function renderOrbitSettings({settings=ORBIT_DEFAULTS,onChange=()=>{},onPreview}={}){
  let config=normalizeOrbitSettings(settings);
  const node=(tag,text='',className='')=>{const item=document.createElement(tag);item.textContent=text;if(className)item.className=className;return item;};
  const panel=node('fieldset','','orbit-settings');panel.append(node('legend','Orbit’s look & movement'));
  const error=node('p','','orbit-setting-error');error.hidden=true;error.setAttribute('role','status');
  function change(key,value){config=normalizeOrbitSettings({...config,[key]:value});error.hidden=true;Promise.resolve().then(()=>onChange({...config})).catch(problem=>{error.textContent=problem?.message||'This appearance setting could not be saved.';error.hidden=false;});}
  function select(label,key,options){const wrap=node('label','','field'),control=node('select');wrap.append(node('span',label));control.setAttribute('aria-label',label);for(const [value,text]of Object.entries(options)){const option=node('option',text);option.value=value;control.append(option);}control.value=config[key];control.addEventListener('change',()=>change(key,control.value));wrap.append(control);panel.append(wrap);}
  function toggle(label,key){const wrap=node('label','','toggle-row'),control=node('input');control.type='checkbox';control.checked=config[key];control.setAttribute('aria-label',label);control.addEventListener('change',()=>change(key,control.checked));wrap.append(control,node('span',label));panel.append(wrap);}
  select('Orbit animation','intensity',{gentle:'Gentle · recommended',lively:'A little livelier',off:'Still'});
  select('Seasonal style','season',ORBIT_SEASONS);
  const birthday=node('label','','field'),date=node('input');birthday.append(node('span','Birthday (month-day)'));date.type='text';date.inputMode='numeric';date.placeholder='MM-DD';date.maxLength=5;date.value=config.birthday;date.setAttribute('aria-label','Birthday (month-day)');date.addEventListener('change',()=>{const value=date.value.trim();date.setCustomValidity(value&&!validBirthday(value)?'Use a valid month and day, such as 07-24. Leave blank to disable.':'');if(!date.reportValidity())return;change('birthday',value);});birthday.append(date);panel.append(birthday);
  toggle('Occasional playful expressions','funny');toggle('React to returned weather','weather');
  const note=node('p','Birthday needs only a month and day. Automatic styles use your device’s calendar. Weather accessories appear only after a real weather lookup and fade away after ten minutes. Reduced-motion preferences always take priority.','orbit-settings-note');panel.append(note);
  if(onPreview){const preview=node('button','Preview a little wink','button button-small');preview.type='button';preview.addEventListener('click',()=>onPreview());panel.append(preview);}
  panel.append(error);return panel;
}
