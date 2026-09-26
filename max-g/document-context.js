/** Small, offline excerpt retrieval. Documents remain untrusted reference data. */
const cached = new WeakMap();
const stop = new Set('a an and are as at be by can do does for from how i in is it me my of on or please that the this to what when where which with you your'.split(' '));
const words = value => [...String(value).toLowerCase().matchAll(/[\p{L}\p{N}_]{2,}/gu)].map(x => x[0]).filter(x => !stop.has(x));
function chunks(file) {
  if (cached.has(file)) return cached.get(file);
  const result = []; let text = '', first = 1, last = 1;
  const flush = () => { if (text.trim()) result.push({text:text.trim(), first, last, terms:new Set(words(text))}); text=''; };
  String(file.text || '').slice(0,120000).split('\n').forEach((line, index) => {
    for (let offset=0; offset<Math.max(1,line.length); offset+=520) {
      const part=line.slice(offset,offset+520);
      if(text.length+part.length>650)flush();
      if(!text)first=index+1;
      last=index+1;text+=part+'\n';
    }
  }); flush(); cached.set(file,result); return result;
}
export function documentContext(files, query, maxChars=1700) {
  if(!Number.isFinite(maxChars)||maxChars<120)return '';
  const selected=files.slice(0,6).filter(f=>f&&typeof f==='object'&&typeof f.text==='string');
  if(!selected.length)return '';
  const terms=new Set(words(String(query).slice(0,24000)));
  const budget=Math.floor((Math.min(6000,maxChars)-70)/selected.length);
  const sections=selected.map(file=>{
    const candidates=chunks(file).map((chunk,index)=>({...chunk,index,score:[...terms].reduce((n,t)=>n+(chunk.terms.has(t)?1:0),0)}));
    candidates.sort((a,b)=>b.score-a.score||a.index-b.index);
    const name=String(file.name||'Document').replace(/[\r\n]/g,' ').slice(0,80);
    let result=`File: ${name}\n`;
    for(const c of candidates){
      const label=`Lines ${c.first}–${c.last}:\n`,room=budget-result.length-label.length-6;
      if(room<30)break;
      let start=0;
      if(c.text.length>room&&c.score){
        const positions=[...terms].filter(t=>c.terms.has(t)).map(t=>c.text.toLowerCase().indexOf(t)).filter(n=>n>=0);
        const firstMatch=Math.min(...positions);
        if(firstMatch>=room-40)start=Math.max(0,firstMatch-Math.floor(room/3));
      }
      const excerpt=c.text.slice(start,start+room);
      result+=label+(start?'[…] ':'')+excerpt+(start+room<c.text.length?' […]':'')+'\n';
    }
    return result;
  });
  return ('Selected excerpts only; other document sections may be omitted.\n'+sections.join('\n')).slice(0,maxChars);
}
