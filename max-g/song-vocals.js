/** Original, locally synthesized male syllables sung with pitch-synchronous DSP.
 * No microphone, voice clone, remote inference, or speech engine is used here.
 */
export const VOCAL_BANK_URL=new URL('./assets/song/male-syllables-v1.json',import.meta.url);
export const SONG_WORDS=Object.freeze('we rise shine glow fly move groove dream light night sky stars heart bright new day way feel free keep go flow beat with the a in on to my your our this that can let through blue brave true high all joy love spark start moon sun'.split(' '));
const banks=new WeakMap();
const failure=()=>new Error('The original singing samples are missing or invalid. Reload MAX-G online once, then try again.');

/** Decode only the small bundled PCM bank; callers must bound the JSON fetch. */
export function decodeVocalBank(input){
  if(input?.version!==1||input.sampleRate!==16000||input.voice!=='am_fenrir'||!input.words||Object.keys(input.words).length!==SONG_WORDS.length)throw failure();
  const words=new Map();let total=0;
  for(const word of SONG_WORDS){
    const data=input.words[word];
    if(!data||typeof data.pcm!=='string'||data.pcm.length<400||data.pcm.length>64000||!/^[A-Za-z0-9+/]*={0,2}$/.test(data.pcm)||!Array.isArray(data.marks)||data.marks.length<3||data.marks.length>350||!Array.isArray(data.vowel)||data.vowel.length!==2)throw failure();
    let bytes;try{bytes=atob(data.pcm);}catch{throw failure();}
    if(bytes.length%2||bytes.length<200||bytes.length>48000||(total+=bytes.length)>1800000)throw failure();
    const pcm=new Float32Array(bytes.length/2);
    for(let i=0;i<pcm.length;i++){const n=bytes.charCodeAt(i*2)|(bytes.charCodeAt(i*2+1)<<8);pcm[i]=(n>32767?n-65536:n)/32768;}
    let last=-1;
    for(const mark of data.marks){if(!Number.isInteger(mark)||mark<=last||mark<0||mark>=pcm.length)throw failure();last=mark;}
    const [start,end]=data.vowel;
    if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>pcm.length/16000)throw failure();
    words.set(word,{pcm,marks:Uint32Array.from(data.marks),start,end});
  }
  const bank=Object.freeze({sampleRate:16000,words:SONG_WORDS});banks.set(bank,words);return bank;
}

function nearest(marks,value){
  let lo=0,hi=marks.length-1;
  while(lo<hi){const mid=(lo+hi)>>>1;if(marks[mid]<value)lo=mid+1;else hi=mid;}
  return lo&&Math.abs(marks[lo-1]-value)<Math.abs(marks[lo]-value)?lo-1:lo;
}

function singWord(sample,note,sampleRate){
  const length=Math.ceil(note.duration*sampleRate),audio=new Float32Array(length),weights=new Float32Array(length);
  const sourceRate=16000,sourceDuration=sample.pcm.length/sourceRate;
  // Stretch the voiced centre while retaining the word's consonant boundaries.
  const scale=Math.min(1,note.duration/sourceDuration),start=sample.start*scale,tail=(sourceDuration-sample.end)*scale;
  const middle=Math.max(.01,note.duration-start-tail),frequency=440*2**((note.midi-69)/12);
  const mapTime=t=>t<start?t/scale:t>note.duration-tail?sample.end+(t-(note.duration-tail))/scale:sample.start+(t-start)/middle*(sample.end-sample.start);
  for(let pulse=0;pulse<length;){
    const t=pulse/sampleRate,index=nearest(sample.marks,mapTime(t)*sourceRate),center=sample.marks[index];
    const previous=sample.marks[Math.max(0,index-1)],next=sample.marks[Math.min(sample.marks.length-1,index+1)];
    const period=Math.max(40,Math.min(260,(next-previous)/(index===0||index===sample.marks.length-1?1:2)));
    const radius=Math.ceil(period*sampleRate/sourceRate);
    for(let offset=-radius;offset<=radius;offset++){
      const output=Math.round(pulse)+offset;if(output<0||output>=length)continue;
      const source=center+offset*sourceRate/sampleRate,left=Math.floor(source);
      if(left<0||left+1>=sample.pcm.length)continue;
      const mix=source-left,window=.5+.5*Math.cos(Math.PI*offset/radius);
      audio[output]+=(sample.pcm[left]*(1-mix)+sample.pcm[left+1]*mix)*window;weights[output]+=window;
    }
    const vibrato=t>.17?.12*Math.sin(2*Math.PI*5.1*t)*Math.min(1,(t-.17)*7):0;
    pulse+=sampleRate/(frequency*2**(vibrato/12));
  }
  let peak=0;
  for(let i=0;i<length;i++){
    const fade=Math.min(1,i/(sampleRate*.008),(length-1-i)/(sampleRate*.035));
    audio[i]=weights[i]>.035?audio[i]/Math.max(.35,weights[i])*fade:0;peak=Math.max(peak,Math.abs(audio[i]));
  }
  const gain=(peak>.01?.68/peak:0)*note.velocity;
  for(let i=0;i<length;i++)audio[i]*=gain;
  return audio;
}

/** Render at most 48 bounded notes into a maximum 20-second local PCM buffer. */
export function renderSongVocals(composition,bank,{sampleRate=24000}={}){
  const words=banks.get(bank);
  if(!words)throw failure();
  if(!Number.isInteger(sampleRate)||sampleRate<16000||sampleRate>48000||composition?.kind!=='sing'||!Number.isFinite(composition.duration)||composition.duration<1||composition.duration>20||!Array.isArray(composition.events)||composition.events.length>1000)throw new Error('Invalid original song.');
  const notes=composition.events.filter(event=>event.instrument==='vocal');
  if(!notes.length||notes.length>48)throw new Error('The original song has no supported words.');
  for(const note of notes){
    if(!words.has(note.word)||!Number.isFinite(note.time)||note.time<0||!Number.isFinite(note.duration)||note.duration<.15||note.duration>1.5||note.time+note.duration>composition.duration||!Number.isFinite(note.midi)||note.midi<40||note.midi>76||!Number.isFinite(note.velocity)||note.velocity<0||note.velocity>1)throw new Error('Invalid original song syllable.');
  }
  const audio=new Float32Array(Math.ceil(composition.duration*sampleRate));
  for(const note of notes){
    const samples=singWord(words.get(note.word),note,sampleRate),offset=Math.round(note.time*sampleRate);
    for(let i=0;i<samples.length&&offset+i<audio.length;i++)audio[offset+i]+=samples[i];
  }
  for(let i=0;i<audio.length;i++)audio[i]=Math.max(-.92,Math.min(.92,audio[i]));
  return audio;
}
