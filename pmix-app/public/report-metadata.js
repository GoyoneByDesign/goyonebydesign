(function(root){
  'use strict';
  const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
  const iso=(y,m,d)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const valid=d=>/^20\d{2}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
  function dates(text){
    text=String(text||'').replace(/\\_/g,'_');
    const pair=text.match(/(?<!\d)(20\d{2}-\d{2}-\d{2})[\s_–—/]+(?:to[\s_]+)?(20\d{2}-\d{2}-\d{2})(?!\d)/i);
    if(pair)return valid(pair[1])&&valid(pair[2])&&pair[1]<=pair[2]?{start:pair[1],end:pair[2]}:{start:'',end:'',invalid:true};
    const compact=text.match(/\b(20\d{2})(?:-(20\d{2}))?\s*-\s*(\d{2})(\d{2})_(\d{2})(\d{2})(?!\d)/);
    if(compact){const start=iso(compact[1],compact[3],compact[4]),end=iso(compact[2]||compact[1],compact[5],compact[6]);return valid(start)&&valid(end)&&start<=end?{start,end}:{start:'',end:'',invalid:true};}
    const slash=[...text.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2}|\d{2})\b/g)].map(m=>iso(m[3].length===2?'20'+m[3]:m[3],+m[1],+m[2]));
    if(slash.length===2&&slash.every(valid)&&slash[0]<=slash[1])return {start:slash[0],end:slash[1]};
    const month=text.match(new RegExp('\\b('+months.join('|')+'|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\\s+(20\\d{2})\\b','i'));
    if(month){const m=months.findIndex(x=>x.startsWith(month[1].toLowerCase()))+1,y=+month[2];return {start:iso(y,m,1),end:iso(y,m,new Date(Date.UTC(y,m,0)).getUTCDate())};}
    return {start:'',end:''};
  }
  function headerText(text){return String(text||'').replace(/&"[^"]*"|&\d+|&[LCRBIDTZFPNSUA]/g,' ').split(/Printed/i)[0].trim();}
  function read(name,content=''){
    const a=dates(name),b=dates(content),warnings=[];let range=b.start?b:a;
    if(a.invalid||b.invalid){warnings.push('An invalid date range was found. Confirm the reporting dates.');range={start:'',end:''};}
    if(a.start&&b.start&&(a.start!==b.start||a.end!==b.end)){warnings.push('Date conflict: filename says '+a.start+' to '+a.end+'; report says '+b.start+' to '+b.end+'. Confirm the correct range.');range={start:'',end:''};}
    const text=String(name)+' '+content;
    const scope=String(name).replace(/\.(xlsx|csv|tsv|pdf)$/i,'')+' '+content;
    const partName=String(name).replace(/^(?:[A-Z]{2}(?:[-, ]+[A-Z]{2})*)\s*-\s*(?=PMIX|Net Sales)/i,'');
    const namedParts=[...partName.replace(/\.(xlsx|csv|tsv|pdf)$/i,'').matchAll(/(?:[ _-])(BK|LN|DN)(?=[ _-]|$)/g)].map(m=>m[1]);
    if(/lunch/i.test(scope))namedParts.push('LN');if(/dinner/i.test(scope))namedParts.push('DN');
    const part=/day part|all day/i.test(scope)||new Set(namedParts).size>1?'ALL':namedParts[0]||(/(?:4\s*PM|16:00).*?(?:CLOS|11:59)/i.test(scope)?'DN':/11\s*AM.*?3:59/i.test(scope)?'LN':/(?:OPEN|4\s*AM).*?10:59/i.test(scope)?'BK':'ALL');
    const store=root.PMIX?.storeCode(content)||root.PMIX?.storeCode(name)||'';
    const channelNames=[[/carry[ -]?out|\bC\/O\b|to[ -]?go/i,'CO'],[/dine[ -]?in|dining room/i,'DI'],[/doordash/i,'DD'],[/catering/i,'CT'],[/online order/i,'OO'],[/drive[ -]?thru/i,'DT']].filter(([re])=>re.test(text)).map(([,code])=>code);
    return {...range,part,store,channel:channelNames.length===1?channelNames[0]:'ALL',reportType:/net[\s_-]*sales|revenue[\s_-]*center/i.test(text)?'netSales':'quantity',warnings,metadataSource:b.start?'Report header':a.start?'Filename':'Confirm details'};
  }
  const shortDate=d=>valid(d)?`${d.slice(5,7)}/${d.slice(8,10)}/${d.slice(2,4)}`:d;
  const range=s=>String(s||'').replace(/20\d{2}-\d{2}-\d{2}/g,shortDate).replace(/ \/ /g,' – ');
  function title({metric='quantity',comparison=false,groups=[],special='all',parts=[],stores=[],view='items'}={}){
    let subject=metric==='both'?'PMIX & NET SALES':metric==='netSales'?'NET SALES':special==='bb'?'BB PMIX':groups.length===1?(/breakfast burrito/i.test(groups[0])?'BB PMIX':groups[0].replace(/to go bev/i,'DRINKS').toUpperCase()+' PMIX'):'PMIX FULL';
    if(subject.length>35)subject=metric==='netSales'?'NET SALES':'PMIX';
    const suffix=comparison?'COMPARISON':view==='channels'?'BY DINING OPTION':parts.length===1?parts[0]:'';
    return subject+(suffix?' · '+suffix:'')+(stores.length===1?' · '+stores[0]:'');
  }
  function filename(report,options={}){
    const codes=(root.PMIX?.STORES||[]).map(s=>s[0]),selected=new Set(report.columns?.filter(c=>c.store).map(c=>c.store)||report.stores),stores=codes.filter(c=>selected.has(c));
    const {metric='quantity',special='all',groups=[],parts=[],view='items',itemKeys=[],search=''}=options;
    const cap=s=>String(s).replace(/\b\w+\b/g,w=>['BB','PMIX'].includes(w.toUpperCase())?w.toUpperCase():w[0].toUpperCase()+w.slice(1).toLowerCase());
    let subject=metric==='netSales'?'Net Sales':metric==='both'?'PMIX & Net Sales':special==='bb'?'PMIX BB':groups.length===1?'PMIX '+(/breakfast burrito/i.test(groups[0])?'BB':cap(groups[0].replace(/to go bev(?:erages)?/i,'Drinks'))):special!=='all'||itemKeys.length||search?'PMIX Selected':'PMIX Full';
    if(view==='modifiers')subject='PMIX Modifiers';if(parts.length===1)subject+=' '+parts[0];if(report.comparison)subject+=' VS';
    const intervals=[];if(!report.comparison&&!report.sourceComparison){const p=dates(report.period);if(p.start)intervals.push(p);}if(!intervals.length)for(const b of report.batches||[]){if(valid(b.start)&&valid(b.end)&&!intervals.some(p=>p.start===b.start&&p.end===b.end))intervals.push({start:b.start,end:b.end});}
    intervals.sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end));const years=[...new Set(intervals.flatMap(p=>[p.start.slice(0,4),p.end.slice(0,4)]))].sort(),year=years.length>1?years[0]+'-'+years.at(-1):years[0]||'',md=d=>d.slice(5).replace('-',''),ranges=intervals.map(p=>md(p.start)+'_'+md(p.end)).join(report.comparison?' vs ':' + ');
    return [(stores.length?stores:report.stores).join('-'),subject+(year?' '+year:''),ranges||'Undated'].join(' - ').replace(/[<>:"/\\|?*\x00-\x1F]/g,'-');
  }
  root.PMIX_METADATA={read,dates,valid,headerText,shortDate,range,title,filename};
})(typeof window!=='undefined'?window:globalThis);
