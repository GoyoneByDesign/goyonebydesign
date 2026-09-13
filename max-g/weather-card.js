// Display-only forecast data. Never persist a device position or provider URL here.
const MODES=new Set(['current','today','tomorrow','week','hourly']);
const CODES=new Set([0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99]);
const finite=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max?value:null;
const text=(value,max)=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max):'';
function date(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';
  const parsed=new Date(value+'T12:00:00Z');
  return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value?value:'';
}
function localTime(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)||!date(value.slice(0,10)))return '';
  return +value.slice(11,13)<24&&+value.slice(14,16)<60&&(!value.slice(17)||+value.slice(17)<60)?value.slice(0,16):'';
}
function timezone(value){try{const zone=text(value,64);if(!zone)return '';new Intl.DateTimeFormat('en-US',{timeZone:zone}).format();return zone;}catch{return '';}}

export function validateWeatherCard(raw){
  if(!raw||typeof raw!=='object'||raw.version!==1||!['us','metric'].includes(raw.units)||!MODES.has(raw.mode))return null;
  const us=raw.units==='us',location=text(raw.location,180),zone=timezone(raw.timezone),updatedAt=localTime(raw.updatedAt);
  if(!location||!zone||!updatedAt)return null;
  // Derive labels from the validated unit system, rejecting a contradictory payload.
  const temperatureUnit=us?'°F':'°C',windSpeedUnit=us?'mph':'km/h',precipitationUnit=us?'inch':'mm';
  if(raw.temperatureUnit!==temperatureUnit||raw.windSpeedUnit!==windSpeedUnit||raw.precipitationUnit!==precipitationUnit)return null;
  const temperature=value=>finite(value,us?-148:-100,us?176:80);
  const wind=value=>finite(value,0,us?400:650);
  const code=value=>CODES.has(value)?value:null;
  let current=null;
  if(raw.current&&typeof raw.current==='object')current={temperature:temperature(raw.current.temperature),feelsLike:temperature(raw.current.feelsLike),windSpeed:wind(raw.current.windSpeed),code:code(raw.current.code),isDay:raw.current.isDay===true||raw.current.isDay===1?true:raw.current.isDay===false||raw.current.isDay===0?false:null};
  const daily=(Array.isArray(raw.daily)?raw.daily:[]).slice(0,7).filter(item=>item&&date(item.date)).map(item=>{let high=temperature(item.high),low=temperature(item.low);if(high!==null&&low!==null&&high<low)high=low=null;return {date:date(item.date),high,low,code:code(item.code),precipitationProbability:finite(item.precipitationProbability,0,100)};});
  const hourly=(Array.isArray(raw.hourly)?raw.hourly:[]).slice(0,24).filter(item=>item&&localTime(item.time)).map(item=>({time:localTime(item.time),temperature:temperature(item.temperature),code:code(item.code),precipitationProbability:finite(item.precipitationProbability,0,100),windSpeed:wind(item.windSpeed),isDay:item.isDay===true||item.isDay===1?true:item.isDay===false||item.isDay===0?false:null}));
  if(!current&&daily.length===0&&hourly.length===0)return null;
  return {version:1,units:raw.units,temperatureUnit,windSpeedUnit,precipitationUnit,location,mode:raw.mode,timezone:zone,updatedAt,current,daily,hourly};
}

export function weatherCondition(sample,units='us'){
  const code=sample?.code;
  if(!CODES.has(code))return {kind:'unknown',label:'Conditions unavailable'};
  if([95,96,99].includes(code))return {kind:'storm',label:'Thunderstorms'};
  if([71,73,75,77,85,86].includes(code))return {kind:'snow',label:'Snow'};
  if([56,57,66,67].includes(code))return {kind:'rain',label:'Freezing rain'};
  if([51,53,55].includes(code))return {kind:'rain',label:'Drizzle'};
  if([61,63,65,80,81,82].includes(code))return {kind:'rain',label:'Rain'};
  if([45,48].includes(code))return {kind:'fog',label:'Fog'};
  const wind=sample?.windSpeed,temperature=sample?.temperature;
  if(typeof wind==='number'&&wind>=(units==='us'?20:32))return {kind:'wind',label:code===3?'Cloudy & windy':'Windy'};
  if(typeof temperature==='number'&&temperature<=(units==='us'?45:7))return {kind:'chilly',label:code===3?'Cloudy & chilly':'Chilly'};
  if(code===3)return {kind:'cloud',label:'Overcast'};
  if(code===2)return {kind:sample?.isDay===false?'partly-night':sample?.isDay===true?'partly':'cloud',label:'Partly cloudy'};
  return sample?.isDay===false?{kind:'moon',label:code===1?'Mostly clear':'Clear night'}:sample?.isDay===true?{kind:'sun',label:code===1?'Mostly sunny':'Sunny'}:{kind:'clear',label:code===1?'Mostly clear':'Clear'};
}
function el(tag,className,content){const node=document.createElement(tag);if(className)node.className=className;if(content!==undefined)node.textContent=content;return node;}
function svgEl(tag,attrs={}){const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,String(value));return node;}
function weatherArt(kind){
  const svg=svgEl('svg',{viewBox:'0 0 96 80',class:'weather-art','aria-hidden':'true',focusable:'false'});
  const path=(d,className)=>svgEl('path',{d,class:className,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'});
  const cloud=()=>path('M23 49h46c13 0 15-20 1-23-3-14-23-16-30-4-14-5-24 9-17 17-8 0-9 10 0 10Z','weather-cloud');
  const sun=()=>{const group=svgEl('g',{class:'weather-sun'});group.append(svgEl('circle',{cx:48,cy:35,r:13,class:'weather-sun-core'}),path('M48 10V5M48 65v-5M23 35h-5M78 35h-5M30 17l-4-4M66 53l4 4M30 53l-4 4M66 17l4-4','weather-sun-rays'));return group;};
  if(kind==='sun'||kind==='partly'){svg.append(sun());if(kind==='partly')svg.append(cloud());}
  else if(kind==='moon'||kind==='partly-night'){svg.append(path('M61 15a25 25 0 1 0 14 42A27 27 0 0 1 61 15Z','weather-moon'));if(kind==='partly-night')svg.append(cloud());}
  else if(kind==='clear')svg.append(svgEl('circle',{cx:48,cy:37,r:20,fill:'none',class:'weather-unknown'}));
  else if(['cloud','rain','snow','storm','fog'].includes(kind)){
    svg.append(cloud());
    if(kind==='rain'||kind==='storm')for(let i=0;i<3;i++)svg.append(path(`M${31+i*17} 57l-4 10`,'weather-drop weather-drop-'+i));
    if(kind==='snow')for(let i=0;i<3;i++)svg.append(svgEl('circle',{cx:29+i*19,cy:61,r:2.5,class:'weather-flake weather-flake-'+i}));
    if(kind==='storm')svg.append(path('m53 40-10 17h10l-7 14','weather-lightning'));
    if(kind==='fog')svg.append(path('M24 58h49M31 67h34','weather-fog'));
  }else if(kind==='wind'){
    svg.append(path('M13 27h49c18 0 16-20 5-15M20 41h57c14 0 13 19 1 17M11 55h31c13 0 13 17 4 17','weather-wind'));
  }else if(kind==='chilly'){
    svg.append(path('M48 13v51M26 26l44 26M26 52l44-26M42 18l6 6 6-6M42 59l6-6 6 6M28 34l9-3-2-9M61 55l-2-10 9-2M29 44l8 3-2 9M61 22l-2 9 9 3','weather-chill'));
  }else svg.append(path('M35 28c0-17 29-17 29 0 0 12-16 9-16 22M48 62v1','weather-unknown'));
  return svg;
}
function clock(value,us){const h=+value.slice(11,13),m=value.slice(14,16);return us?`${h%12||12}${m==='00'?'':':'+m} ${h>=12?'PM':'AM'}`:`${String(h).padStart(2,'0')}:${m}`;}
function dayName(value){return new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));}
function monthDay(value){return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(value.slice(0,10)+'T12:00:00Z'));}
const number=value=>value===null?'—':String(Math.round(value));
const temp=(value,unit)=>value===null?'—':`${number(value)}${unit}`;
function stat(label,value){const node=el('div','weather-stat');node.append(el('span','weather-stat-label',label),el('strong','weather-stat-value',value));return node;}
function hourlyTiles(rows,data){
  const list=el('ol','weather-hours');list.setAttribute('aria-label','Hourly forecast');
  for(const row of rows){const condition=weatherCondition(row,data.units);const tile=el('li','weather-hour');const time=el('time','weather-hour-time',clock(row.time,data.units==='us'));time.dateTime=row.time;time.title=row.time.slice(0,10)+' · '+data.timezone;const art=weatherArt(condition.kind);art.classList.add('weather-art-small');const probability=row.precipitationProbability===null?'—':`${number(row.precipitationProbability)}%`;tile.append(time,art,el('strong','weather-hour-temp',temp(row.temperature,data.temperatureUnit)),el('span','weather-hour-rain',probability));tile.setAttribute('aria-label',`${clock(row.time,data.units==='us')}, ${temp(row.temperature,data.temperatureUnit)}, ${condition.label}, precipitation chance ${probability}`);list.append(tile);}
  return list;
}

export function renderWeatherCard(raw,{motion=true,weatherEffects=true}={}){
  const data=validateWeatherCard(raw);if(!data)return null;
  const card=el('section','weather-card');card.setAttribute('aria-label',`Weather for ${data.location}`);card.dataset.mode=data.mode;
  card.dataset.animate=String(Boolean(motion&&weatherEffects));
  const future=data.mode==='tomorrow',day=data.daily[0],sample=future?{temperature:day?.high,code:day?.code,isDay:true}:data.current;
  const condition=weatherCondition(sample,data.units);card.dataset.condition=condition.kind;
  const head=el('header','weather-heading'),heading=el('h3','weather-location',data.location),meta=el('p','weather-updated');
  const time=el('time','',clock(data.updatedAt,data.units==='us'));time.dateTime=data.updatedAt;
  meta.append(monthDay(data.updatedAt),' · ',time,' local');meta.title=`Updated ${data.updatedAt.slice(0,10)} · ${data.timezone}`;head.append(heading,meta);card.append(head);
  if(data.mode!=='week'){
  const main=el('div','weather-now'),reading=el('div','weather-reading'),mainTemp=future?day?.high??null:data.current?.temperature??null;
  reading.append(el('span','weather-period',future?'Tomorrow · high':data.mode==='week'?'Now · week ahead':'Now'),el('strong','weather-temperature',temp(mainTemp,data.temperatureUnit)));
  const description=el('div','weather-description');description.append(el('strong','weather-condition',condition.label));
  if(future)description.append(el('span','weather-feels',`Low ${temp(day?.low??null,data.temperatureUnit)}`));
  else description.append(el('span','weather-feels',data.current?.feelsLike===null||data.current?.feelsLike===undefined?'Feels like unavailable':`Feels like ${temp(data.current.feelsLike,data.temperatureUnit)}`));
  main.append(reading,description,weatherArt(condition.kind));card.append(main);
  const stats=el('div','weather-stats');
  if(!future)stats.append(stat('High / low',`${temp(day?.high??null,data.temperatureUnit)} / ${temp(day?.low??null,data.temperatureUnit)}`));
  stats.append(stat(future?'Max precipitation chance':'Precipitation chance',day?.precipitationProbability===null||day?.precipitationProbability===undefined?'Unavailable':`${number(day.precipitationProbability)}%`));
  if(!future)stats.append(stat('Wind',data.current?.windSpeed===null||data.current?.windSpeed===undefined?'Unavailable':`${number(data.current.windSpeed)} ${data.windSpeedUnit}`));
  if(future&&day)stats.append(stat('Forecast date',`${dayName(day.date)} ${day.date.slice(5).replace('-','/')}`));card.append(stats);
  }
  if(data.mode==='week'){
    card.append(el('div','weather-section-label',`${data.daily.length}-day forecast · high / low · precipitation %`));
    const week=el('ol','weather-week');week.setAttribute('aria-label','Daily forecast');
    for(const row of data.daily){const item=el('li','weather-day'),label=el('time','weather-day-name');label.append(el('span','',dayName(row.date)),el('small','weather-day-date',row.date.slice(5).replace('-','/')));label.dateTime=row.date;label.title=row.date;const weather=weatherCondition({code:row.code},data.units);const art=weatherArt(weather.kind);art.classList.add('weather-art-small');item.append(label,art,el('span','weather-day-condition',weather.label),el('strong','weather-day-range',`${temp(row.high,data.temperatureUnit)} / ${temp(row.low,data.temperatureUnit)}`),el('span','weather-day-rain',row.precipitationProbability===null?'—':number(row.precipitationProbability)+'%'));week.append(item);}card.append(week);
  }else if(data.hourly.length){
    card.append(el('div','weather-section-label',future?'Tomorrow by hour':'Coming hours · precipitation %'),hourlyTiles(data.hourly.slice(0,6),data));
    if(data.hourly.length>6){const more=el('details','weather-more');more.append(el('summary','',`Next ${data.hourly.length-6} hours`),hourlyTiles(data.hourly.slice(6),data));card.append(more);}
  }else card.append(el('p','weather-unavailable','Hourly forecast unavailable for this update.'));
  return card;
}
