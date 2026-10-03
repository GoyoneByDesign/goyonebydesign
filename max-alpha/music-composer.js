/** Original, seeded miniature scores and bounded local synthesis. No recordings or network. */
const VERSION=1,TEMPO=96,BEAT=60/TEMPO,BEATS=24,DURATION=16,LEAD=.04,TAU=Math.PI*2;
const SEED_MAX=0xffffffff;
const choose=(random,values)=>values[Math.floor(random()*values.length)];
const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
const frequency=midi=>440*2**((midi-69)/12);
const rounded=value=>Math.round(value*100000)/100000;

export const COMPOSITION_INFO=Object.freeze({version:VERSION,tempo:TEMPO,beats:BEATS,duration:DURATION});

/** Only these two small values cross the renderer boundary; supplied event arrays are never trusted. */
export function normalizePerformanceRequest(input) {
  if(!input||typeof input!=='object'||Array.isArray(input)||!['dance','sing'].includes(input.kind))
    throw new TypeError('Choose a dance or singing performance.');
  if(!Number.isInteger(input.seed)||input.seed<0||input.seed>SEED_MAX)
    throw new RangeError('A performance seed must be an unsigned 32-bit integer.');
  return Object.freeze({kind:input.kind,seed:input.seed});
}

function generator(seed) {
  let value=seed>>>0;
  return ()=>{
    value=(value+0x6d2b79f5)>>>0;
    let mixed=Math.imul(value^(value>>>15),value|1);
    mixed^=mixed+Math.imul(mixed^(mixed>>>7),mixed|61);
    return ((mixed^(mixed>>>14))>>>0)/4294967296;
  };
}

function signature(events) {
  let hash=2166136261;
  for(const event of events) {
    const text=[event.instrument,event.time,event.duration,event.midi,event.velocity,event.variant,event.word||''].join('|');
    for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}

/** All sung words are monosyllables available in the optional local vocal bank. */
export const SONG_WORDS=Object.freeze(('we rise shine glow fly move groove dream light night sky stars heart bright new day way feel free keep go flow beat with the a in on to my your our this that can let through blue brave true high all joy love spark start moon sun').split(' '));
const lyricLine=random=>choose(random,[
  ()=>['we',choose(random,['rise','shine','glow','fly']),'with','the',choose(random,['sun','moon','stars']),'we','feel',choose(random,['free','high'])],
  ()=>['let',choose(random,['your','our','my']),choose(random,['bright','brave','true']),'heart',choose(random,['shine','glow']),'through','the',choose(random,['night','sky'])],
  ()=>['we',choose(random,['move','groove','flow']),'to','the','beat','we','feel',choose(random,['free','high'])],
  ()=>['this',choose(random,['new','bright']),choose(random,['day','night']),'can','light','a',choose(random,['new','bright']),choose(random,['dream','spark'])],
  ()=>['keep',choose(random,['your','our','my']),'dream','in','the','sky','we',choose(random,['rise','shine','fly'])],
  ()=>['our',choose(random,['light','spark','heart']),'can','shine','we',choose(random,['rise','flow']),'through','night'],
  ()=>['we',choose(random,['rise','move','fly']),'we',choose(random,['shine','glow','groove']),'we','feel','the','beat'],
  ()=>['let',choose(random,['love','joy']),'light','the','way','we','feel',choose(random,['free','high'])]
])();

/** Compose six bars at 96 BPM: a brief groove, three vocal phrases, and a natural release. */
export function composePerformance(input) {
  const {kind,seed}=normalizePerformanceRequest(input),random=generator(seed),events=[];
  const key=choose(random,[48,50,52]),minor=random()<.65;
  const scale=minor?[0,3,5,7,10,12]:[0,2,4,7,9,12];
  const progression=choose(random,minor?[[0,8,3,10,8,0],[0,3,8,10,3,0],[0,10,8,3,10,0]]:[[0,9,5,7,5,0],[0,5,9,7,5,0]]);
  const swing=.09+random()*.065,kit=Math.floor(random()*4),tone=Math.floor(random()*4);
  const backing=kind==='sing'?.42:1;
  const add=(instrument,beat,length,midi,velocity,variant=0,word)=>{
    const event={instrument,time:rounded(LEAD+beat*BEAT),duration:rounded(length*BEAT),midi,velocity:rounded(velocity),variant};
    if(word)event.word=word;
    events.push(Object.freeze(event));
  };
  const kickPatterns=[[0,5.5,8,14],[0,6,8,11.5],[0,3.5,8,10,14],[0,6,10.5,14],[0,7,8,14.5]];
  const bassPatterns=[[0,1.5,2.5,3.5],[0,.75,2,3.25],[0,1.75,2.75,3.5],[0,1.5,2.25,3.75]];
  const kickPattern=choose(random,kickPatterns),bassPattern=choose(random,bassPatterns);
  for(let bar=0;bar<6;bar++) {
    const downbeat=bar*4,root=key+progression[bar],last=bar===5;
    for(const [index,step] of kickPattern.entries()) {
      if(last&&step>10)continue;
      const offset=index&&bar%2===1&&random()<.22?.25:0;
      add('kick',downbeat+step/4+offset,.55,root-12,(index? .69:.9)*backing,kit);
    }
    for(const step of [1,3]) {
      add('snare',downbeat+step+.018,.34,0,.67*backing,kit);
      if(random()<.45)add('clap',downbeat+step+.035,.29,0,.2*backing,kit);
    }
    if(bar===1||bar===3)add('snare',downbeat+2.75+(.02*random()),.18,0,.17*backing,kit);
    for(let hat=0;hat<8;hat++) {
      const offbeat=hat%2===1,open=hat===7&&bar%2===1&&!last;
      if(last&&hat>5)continue;
      add(open?'open-hat':'hat',downbeat+hat/2+(offbeat?swing/2:0),open?.38:.12,0,(offbeat?.32:.43)*backing*(.87+random()*.18),kit);
      if(hat===5&&bar%2===1&&random()<.7)add('hat',downbeat+hat/2+.25,.09,0,.19*backing,kit);
    }
    for(let note=0;note<bassPattern.length;note++) {
      if(last&&note>1)continue;
      const interval=note===0?0:choose(random,[0,0,7,12]);
      const duration=last&&note===1?1.65:choose(random,[.48,.66,.78]);
      add('bass',downbeat+bassPattern[note],duration,root-12+interval,(note===0?.44:.34)*backing,tone);
    }
    const chordMinor=minor?progression[bar]===0:progression[bar]===9;
    const chord=[0,chordMinor?3:4,7,chordMinor?10:11];
    const chordBeat=choose(random,[0,.5,1.5]),chordLength=choose(random,[1.75,2.4,2.9]);
    for(let n=0;n<chord.length;n++)add('keys',downbeat+chordBeat+n*.013,chordLength,root+12+chord[n],.095*backing,tone);
    if(!last&&bar%2===0)for(const interval of chord.slice(0,3))add('keys',downbeat+3.25,.46,root+12+interval,.052*backing,tone);
  }

  const lyrics=[];
  // A small motif is developed and answered instead of choosing unrelated notes at random.
  const motif=Array.from({length:8},(_,index)=>index===0?choose(random,[0,2,3]):choose(random,[-2,-1,0,1,2]));
  let degree=motif[0];
  for(let phrase=0;phrase<3;phrase++) {
    const words=lyricLine(random);lyrics.push(words.join(' '));
    for(let index=0;index<8;index++) {
      degree=index===0?(phrase===0?motif[0]:choose(random,[0,2,3])):clamp(degree+motif[index]+(phrase===1&&random()<.35?choose(random,[-1,1]):0),0,5);
      if(phrase===2&&index===7)degree=0;
      const beat=phrase*8+index;
      if(kind==='sing') {
        const late=index%2===1?swing*.65:0;
        add('vocal',beat+late,index===7?.91:.87-late,key+scale[degree],.76+random()*.13,tone,words[index]);
      }else if(index%2===0||random()<.28) {
        add('lead',beat+(index%2?swing:0),choose(random,[.35,.48,.68]),key+12+scale[degree],.085,tone);
      }
    }
  }
  events.sort((a,b)=>a.time-b.time||a.instrument.localeCompare(b.instrument));
  const title=`${choose(random,['Moonlit','Bright','Velvet','Golden','Blue','Skyward','Starlight','Midnight','Electric','Little','Open','Sunrise'])} ${choose(random,kind==='dance'?['Orbit','Bounce','Steps','Groove','Flow','Motion']:['Spark','Wish','Daydream','Journey','Glow','Hello'])}`;
  return Object.freeze({version:VERSION,kind,seed,id:`maxg-${kind}-${seed.toString(16).padStart(8,'0')}`,
    signature:signature(events),title,tempo:TEMPO,duration:DURATION,beats:BEATS,key,mode:minor?'minor':'major',
    description:kind==='dance'?'An original hip-hop instrumental, composed and synthesized on this device.':'An original short song composed on this device; its built-in fallback melody is a synthesized wordless hum.',
    lyrics:kind==='sing'?Object.freeze(lyrics):null,events:Object.freeze(events)});
}

function envelope(time,duration,attack=.008,release=.04) {
  return Math.sin(Math.PI/2*clamp(time/attack,0,1))**2*Math.sin(Math.PI/2*clamp((duration-time)/release,0,1))**2;
}

function addEvent(samples,event,rate,random) {
  const start=Math.round(event.time*rate),length=Math.min(Math.ceil(event.duration*rate),samples.length-start);
  if(length<=0)return;
  const base=frequency(event.midi),instrument=event.instrument,variant=event.variant;
  let phase=0,previousNoise=0,filteredNoise=0;
  const vocalWeights=instrument==='vocal'?Array.from({length:14},(_,index)=>{
    const harmonic=index+1,hz=base*harmonic;
    return (.65*Math.exp(-.5*((hz-(340+variant*42))/180)**2)+.28*Math.exp(-.5*((hz-(980+variant*65))/240)**2)
      +.09*Math.exp(-.5*((hz-2350)/350)**2)+.19/harmonic)/harmonic;
  }):null;
  const vocalNormalization=vocalWeights?.reduce((sum,value)=>sum+value,0)||1;
  for(let frame=0;frame<length;frame++) {
    const t=frame/rate,duration=length/rate;
    let value=0;
    if(instrument==='kick') {
      const end=43+variant*3,initial=115+variant*8;
      phase=TAU*(end*t+(initial-end)*(1-Math.exp(-t*37))/37);
      value=Math.sin(phase)*Math.exp(-t*13.5)*.89;
      value+=(random()*2-1)*Math.exp(-t*370)*.095;
      value*=envelope(t,duration,.002,.025);
    }else if(instrument==='snare'||instrument==='clap') {
      const noise=random()*2-1;
      filteredNoise=.35*filteredNoise+.65*noise;
      const high=filteredNoise-previousNoise*.32;previousNoise=filteredNoise;
      if(instrument==='snare')value=(high*.75+Math.sin(TAU*(170+variant*17)*t)*.22)*Math.exp(-t*25);
      else {
        for(const offset of [0,.012,.027])if(t>=offset)value+=high*.27*Math.exp(-(t-offset)*45);
      }
      value*=envelope(t,duration,.0015,.025);
    }else if(instrument==='hat'||instrument==='open-hat') {
      const noise=random()*2-1,high=(noise-previousNoise)*.5;previousNoise=noise;
      const decay=instrument==='hat'?65:18;
      value=(high*.48+Math.sin(TAU*Math.min(6200+variant*350,rate*.39)*t)*.045)*Math.exp(-t*decay)*envelope(t,duration,.0008,.018);
    }else if(instrument==='bass') {
      phase=TAU*base*t;
      value=(Math.sin(phase)+.2*Math.sin(phase*2)+.06*Math.sin(phase*3))*.6;
      value*=envelope(t,duration,.009,.09)*(.83+.17*Math.exp(-t*6));
    }else if(instrument==='keys'||instrument==='lead') {
      phase=TAU*base*t;
      value=(Math.sin(phase)+.2*Math.sin(phase*2+.01*Math.sin(TAU*2*t))+.07*Math.sin(phase*3))*.67;
      value*=Math.exp(-t*(instrument==='keys'?2.6:4.8))*envelope(t,duration,.006,.06);
    }else if(instrument==='vocal') {
      const vibrato=9*Math.min(1,t/.16)*Math.sin(TAU*(4.6+variant*.25)*t),scoop=-24*Math.exp(-t*40);
      phase+=TAU*base*2**((vibrato+scoop)/1200)/rate;
      for(let harmonic=1;harmonic<=vocalWeights.length;harmonic++)value+=Math.sin(phase*harmonic)*vocalWeights[harmonic-1];
      value=value/vocalNormalization*.57;
      filteredNoise=.87*filteredNoise+.13*(random()*2-1);
      value+=filteredNoise*.014;
      value*=envelope(t,duration,.027,.07)*(1-.045*Math.cos(TAU*2.1*t));
    }
    samples[start+frame]+=value*event.velocity;
  }
}

/** Regenerate the bounded canonical score; callers cannot inject events or arbitrarily large audio. */
export function renderComposition(composition,sampleRate=24000,{vocal=true}={}) {
  if(!Number.isInteger(sampleRate)||sampleRate<16000||sampleRate>48000)
    throw new RangeError('Use a sample rate between 16 and 48 kHz.');
  if(typeof vocal!=='boolean')throw new TypeError('The vocal option must be a boolean.');
  const score=composePerformance(composition),samples=new Float32Array(Math.ceil(score.duration*sampleRate));
  const noise=generator(score.seed^0xa8f236d1);
  for(const event of score.events)if(vocal||event.instrument!=='vocal')addEvent(samples,event,sampleRate,noise);
  const dry=samples.slice();
  for(const [delay,gain] of [[.081,.058],[.173,.038],[.291,.021]]) {
    const offset=Math.round(delay*sampleRate);
    for(let frame=offset;frame<samples.length;frame++)samples[frame]+=dry[frame-offset]*gain;
  }
  let peak=0;
  for(let frame=0;frame<samples.length;frame++) {
    const fade=envelope(frame/sampleRate,score.duration,.012,.12);
    samples[frame]=Math.tanh(samples[frame]*1.05)*fade;
    peak=Math.max(peak,Math.abs(samples[frame]));
  }
  const gain=peak>.68?.68/peak:1;
  for(let frame=0;frame<samples.length;frame++)samples[frame]*=gain;
  return samples;
}
