(function(root){
  'use strict';
  const P=root.PMIX,M=root.PMIX_METADATA;
  const flat=rows=>rows.map(r=>r.map(c=>P.clean(c?.text??c)));
  const uid=()=> 'report-'+Math.random().toString(36).slice(2);
  const revenue=[['CO','Carry-Out'],['OO','Online Order'],['DD','DoorDash'],['DI','Dining Room'],['BAR','Bar'],['CT','Catering']];
  const money=s=>{s=P.clean(s).replace(/\$/g,'').trim();return /^[-–—]$/.test(s)?0:P.money(s);};
  function periodForYear(text,year){
    const compact=text.match(/\b(\d{2})(\d{2})\s*[-–_]\s*(\d{2})(\d{2})\b/);
    if(compact){const start=`${year}-${compact[1]}-${compact[2]}`,end=`${year}-${compact[3]}-${compact[4]}`;if(M.valid(start)&&M.valid(end)&&start<=end)return {start,end};}
    const months='January February March April May June July August September October November December'.split(' '),re=new RegExp('('+months.join('|')+')\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*[-–]\\s*('+months.join('|')+')\\s+(\\d{1,2})','i'),m=text.match(re);
    if(m){const d=(month,day)=>`${year}-${String(months.findIndex(x=>x.toLowerCase()===month.toLowerCase())+1).padStart(2,'0')}-${day.padStart(2,'0')}`;const start=d(m[1],m[2]),end=d(m[3],m[4]);if(M.valid(start)&&M.valid(end)&&start<=end)return {start,end};}
    const range=M.dates(text);return range.start&&range.start.startsWith(year)&&range.end.startsWith(year)?range:{start:'',end:''};
  }
  function salesDoc(name,year,rows,range,warnings=[]){
    const stores=P.STORES.map(x=>x[0]).filter(c=>rows.some(r=>Object.hasOwn(r.netSales,c)));
    return {id:uid(),kind:'revenue',name,reportType:'netSales',part:'ALL',channel:'ALL',menus:[],...range,complete:false,parsed:{stores,rows,meta:{metricOnly:'netSales',hasForms:true}},warnings,metadataSource:'Revenue-center table '+year};
  }
  function revenuePdf(pages,name){
    const docs=[];
    for(const page of pages){const lines=root.PMIX_PDF.lines(page.tokens),text=lines.map(l=>l.text).join('\n');if(!/net sales/i.test(text))continue;
      for(let i=0;i<lines.length;i++){const h=lines[i],year=h.text.match(/\b20\d{2}\b/)?.[0];if(!year||!/carry[ -]?out/i.test(h.text)||!/catering/i.test(h.text))continue;
        const heads=revenue.map(([code,label])=>{const patterns={CO:/carry[ -]?out/i,OO:/online order/i,DD:/doordash/i,DI:/dining room|dine[ -]?in/i,BAR:/^bar$/i,CT:/catering/i};const t=h.tokens.find(t=>patterns[code].test(t.text));return t?{code,label,x:t.x+t.w/2}:null;});
        const totalHead=h.tokens.find(t=>/store total/i.test(t.text));if(heads.some(t=>!t)||!totalHead)continue;
        const cols=[...heads,{code:'TOTAL',x:totalHead.x+totalHead.w/2}],gap=cols[1].x-cols[0].x;
        const rows=heads.map(c=>({kind:'item',item:c.label,group:'Revenue centers',channel:c.code,values:{},netSales:{},page:page.number,sourceRow:i+1})),warnings=[];let controls=null;
        for(let j=i+1;j<lines.length;j++){const line=lines[j],first=line.tokens[0],store=P.STORES.find(x=>x[0]===P.clean(first?.text))?.[0],isTotal=/^TOTAL$/i.test(P.clean(first?.text));if(!store&&!isTotal){if(rows.some(r=>Object.keys(r.netSales).length))break;continue;}
          const vals=cols.map((c,k)=>{const lo=k?(cols[k-1].x+c.x)/2:c.x-gap/2,hi=cols[k+1]?(c.x+cols[k+1].x)/2:c.x+gap/2;const words=line.tokens.filter(t=>t.x+t.w/2>=lo&&t.x+t.w/2<hi).map(t=>t.text).join(' ');return money(words);});
          if(isTotal){controls=vals;break;}if(rows.some(r=>Object.hasOwn(r.netSales,store)))throw Error('Repeated revenue-center row for '+store+' in '+year+'.');
          rows.forEach((r,k)=>{r.values[store]=null;r.netSales[store]=vals[k];});
          if(vals.every(v=>v!=null)&&Math.abs(vals.slice(0,-1).reduce((a,b)=>a+b,0)-vals.at(-1))>.025)warnings.push(store+' revenue centers differ from its printed store total. Review before importing.');
        }
        if(!rows.some(r=>Object.keys(r.netSales).length))continue;
        if(controls){for(let k=0;k<rows.length;k++){const values=Object.values(rows[k].netSales);if(values.every(v=>v!=null)&&controls[k]!=null&&Math.abs(values.reduce((a,b)=>a+b,0)-controls[k])>.025)warnings.push(rows[k].item+' differs from its printed total. Review before importing.');}}
        const doc=salesDoc(name,year,rows,periodForYear(name+' '+text,year),warnings);doc.isPdf=true;doc.reviewed=false;doc.warnings.push('Review recognized net sales against the original PDF. Store totals and lowest/highest summaries are control information and are not added again.');docs.push(doc);
      }
    }
    return docs.length?{kind:'bundle',docs}:null;
  }
  function pdfMeta(pages,name){
    const first=root.PMIX_PDF.lines(pages[0].tokens),header=first.slice(0,5).filter(l=>!/Printed/i.test(l.text)).map(l=>l.text).join(' '),meta=M.read(name,header),all=first.filter((l,i)=>i<3||/Printed|https?:|\(MG/i.test(l.text)).map(l=>l.text).join(' ');
    if(!meta.start){const years=[...new Set(all.match(/\b20\d{2}\b/g)||[])];if(years.length===1){const range=periodForYear(name+' '+header,years[0]);if(range.start){Object.assign(meta,range);if(!header.includes(years[0]))meta.warnings.push('The dates omit a year in the report heading. '+years[0]+' was found elsewhere in this document; confirm the year before importing.');}}}
    return meta;
  }
  function pdfDoc(name,meta,rows,channel,stores){return {id:uid(),kind:'aggregate',name,...meta,reportType:rows.some(r=>Object.values(r.netSales||{}).some(v=>v!=null))?'both':'quantity',parsed:{rows,stores,meta:{hasForms:false,pdf:true}},channel:channel||'ALL',menus:[],isPdf:true,reviewed:false,complete:false,warnings:[...meta.warnings,'Review recognized quantities and net sales. Printed totals and derived DIFF/VAR columns are excluded from source data.']};}
  function productPdf(pages,name){
    const meta=pdfMeta(pages,name),docs=[],allLines=pages.flatMap(p=>root.PMIX_PDF.lines(p.tokens).map(l=>({...l,page:p.number}))),text=allLines.map(l=>l.text).join('\n');
    // Location comparison with distinct QTY and net-sales columns. Derived columns are never imported.
    if(/\b(?:CH|FX|AR|AS|BK|HN|LS|MN|SP|VN)\s+QTY\b/.test(text)&&/NSALES|NET SALES/.test(text)){
      let group='',columns=[],rows=[];
      for(const original of allLines){const l={...original,tokens:original.tokens.flatMap(t=>{const matches=[...t.text.matchAll(/(AR|AS|BK|CH|FX|HN|LS|MN|SP|VN)\s+(QTY|NSALES|NET SALES)/g)];return matches.length<2?[t]:matches.map((m,i)=>{const end=matches[i+1]?.index||t.text.length;return {...t,text:m[0],x:t.x+t.w*m.index/t.text.length,w:t.w*(end-m.index)/t.text.length};});})};const h=l.tokens.filter(t=>/^(AR|AS|BK|CH|FX|HN|LS|MN|SP|VN)\s+(QTY|NSALES|NET SALES)$/i.test(t.text));
        if(h.length>=4){columns=l.tokens.filter(t=>/QTY|NSALES|NET SALES|^DIFF$|^VAR$/i.test(t.text)).map(t=>({x:t.x+t.w/2,match:t.text.match(/^(AR|AS|BK|CH|FX|HN|LS|MN|SP|VN)\s+(QTY|NSALES|NET SALES)$/i)}));continue;}
        if(!columns.length||/Printed|https?:|\bPage\b|\(MG/i.test(l.text))continue;
        const gap=columns[1].x-columns[0].x,left=columns[0].x-gap/2,label=l.tokens.filter(t=>t.x+t.w/2<left).map(t=>t.text).join(' ').trim();if(!label)continue;
        if(/^(TOTAL|GRAND TOTAL|GRD TTL)\b/.test(label))continue;
        const values={},netSales={};let count=0;
        for(let k=0;k<columns.length;k++){const c=columns[k];if(!c.match)continue;const lo=k?(columns[k-1].x+c.x)/2:left,hi=columns[k+1]?(c.x+columns[k+1].x)/2:c.x+gap/2;const cell=l.tokens.filter(t=>t.x+t.w/2>=lo&&t.x+t.w/2<hi).map(t=>t.text).join(' ');if(!cell)continue;const value=c.match[2].toUpperCase()==='QTY'?P.qty(cell):money(cell);(c.match[2].toUpperCase()==='QTY'?values:netSales)[c.match[1].toUpperCase()]=value;if(value!=null)count++;}
        if(!count){if(!/PMIX|CH VS FX|^\d/.test(label))group=label;continue;}rows.push({kind:'item',item:label,group,values,netSales,page:l.page,sourceRow:rows.length+1});
      }
      if(rows.length){const stores=P.STORES.map(x=>x[0]).filter(c=>rows.some(r=>Object.hasOwn(r.values,c)));return {kind:'bundle',docs:[pdfDoc(name,meta,rows,/drive[ -]?thru/i.test(text)?'DT':'ALL',stores)]};}
    }
    // Repeating QTY/NET subcolumns beneath location headings (e.g. beverage sizes by dining option).
    if(/QTY\s+NET\s+QTY\s+NET/.test(text)){
      const storesLine=allLines.find(l=>l.tokens.filter(t=>P.STORES.some(s=>s[0]===t.text)).length>=2);if(!storesLine)return null;
      const stores=storesLine.tokens.filter(t=>P.STORES.some(s=>s[0]===t.text)).sort((a,b)=>a.x-b.x).map(t=>t.text);let columns=[],channel='ALL';const groups=new Map(),title=(allLines.find(l=>/PMIX/i.test(l.text))?.text||'Beverages').replace(/\s+PMIX.*$/i,'').trim();
      for(const l of allLines){if(/QTY\s+NET\s+QTY\s+NET/.test(l.text)){const metrics=l.tokens.filter(t=>/^(QTY|NET)$/i.test(t.text));if(metrics.length<stores.length*2)throw Error('Quantity/net-sales subcolumns could not be matched. Review the original export.');columns=metrics.map((t,i)=>({x:t.x+t.w/2,store:stores[Math.floor(i/2)],metric:t.text.toUpperCase()}));channel=P.channelCode(l.tokens[0]?.text)||'ALL';continue;}
        if(!columns.length||/Printed|https?:|\bPage\b|\(MG|^TEMP|^High|^Low/.test(l.text))continue;const gap=columns[1].x-columns[0].x,left=columns[0].x-gap/2,label=l.tokens.filter(t=>t.x+t.w/2<left).map(t=>t.text).join(' ').trim();if(!label||/^(TTL|TOTAL|GRD TTL|GRAND TOTAL)\b/.test(label))continue;
        if(!/\d+\s*oz\b|^Small$|^Medium$|^Large$/i.test(label))continue;
        const values={},netSales={};for(let k=0;k<columns.length;k++){const c=columns[k];if(!c.store)continue;const lo=k?(columns[k-1].x+c.x)/2:left,hi=columns[k+1]?(c.x+columns[k+1].x)/2:c.x+gap/2,cell=l.tokens.filter(t=>t.x+t.w/2>=lo&&t.x+t.w/2<hi).map(t=>t.text).join(' ');(c.metric==='QTY'?values:netSales)[c.store]=c.metric==='QTY'?P.qty(cell):money(cell);}
        if(!groups.has(channel))groups.set(channel,[]);groups.get(channel).push({kind:'item',item:title+' · '+label,group:title,values,netSales,page:l.page,sourceRow:groups.get(channel).length+1});
      }
      if(groups.size)return {kind:'bundle',docs:[...groups].map(([channel,rows])=>pdfDoc(name,meta,rows,channel,stores))};
    }
    // Category quantity tables whose rows are dining options, followed by derived summaries.
    if(/SALSA QTY/.test(text)&&/BB QTY/.test(text)){
      let category='',heads=[];const grouped=new Map();
      for(const l of allLines){const locations=l.tokens.filter(t=>P.STORES.some(s=>s[0]===t.text));if(locations.length>=2){category=/SALSA QTY/.test(l.text)?'Salsa packets':/BB QTY/.test(l.text)?'Breakfast Burritos':'';heads=locations.map(t=>({code:t.text,x:t.x+t.w/2}));continue;}if(!category||heads.length<2)continue;
        const gap=heads[1].x-heads[0].x,left=heads[0].x-gap/2,label=l.tokens.filter(t=>t.x+t.w/2<left).map(t=>t.text).join(' ').trim(),channel=P.channelCode(label);if(!channel)continue;const values={};for(let i=0;i<heads.length;i++){const c=heads[i],cell=l.tokens.filter(t=>t.x+t.w/2>=c.x-gap/2&&t.x+t.w/2<c.x+gap/2).map(t=>t.text).join(' ');values[c.code]=P.qty(cell);}if(!grouped.has(channel))grouped.set(channel,[]);grouped.get(channel).push({kind:'item',group:category,item:category+' · category total',values,page:l.page,sourceRow:grouped.get(channel).length+1});
      }
      if(grouped.size)return {kind:'bundle',docs:[...grouped].map(([channel,rows])=>pdfDoc(name,meta,rows,channel,heads.map(h=>h.code)))};
    }
    return null;
  }
  function revenueSheet(sheet,name){
    const raw=flat(sheet.rows),hi=raw.findIndex(r=>r.some(x=>/^net[ _-]?sales(?: amount)?$/i.test(x))&&r.some(x=>/^(store|location)$/i.test(x)));if(hi<0)return null;
    const h=raw[hi],col=re=>h.findIndex(x=>re.test(x)),si=col(/^(store|location)$/i),ni=col(/^net[ _-]?sales(?: amount)?$/i),ci=col(/^(revenue center|dining option|channel|category)$/i),qi=col(/^(quantity|qty|qty sold|item qty)$/i);if(ci<0||qi>=0)return null;
    const starti=col(/^(start|start date)$/i),endi=col(/^(end|end date)$/i),base=M.read(name,M.headerText(sheet.header)),groups=new Map();
    for(const [index,row]of raw.slice(hi+1).entries()){if(!row.some(Boolean)||/^(total|grand total)$/i.test(row[si]))continue;const store=P.storeCode(row[si]);if(!store)throw Error('Unknown location in net-sales row '+(hi+index+2));const start=starti<0?base.start:row[starti],end=endi<0?base.end:row[endi],key=start+'|'+end;
      if(!groups.has(key))groups.set(key,new Map());const map=groups.get(key),label=row[ci],channel=P.channelCode(label)||'OTHER';if(!label)throw Error('Missing revenue center in row '+(hi+index+2));if(!map.has(label))map.set(label,{kind:'item',item:label,group:'Revenue centers',channel,values:{},netSales:{},sourceRow:hi+index+2});const item=map.get(label);if(Object.hasOwn(item.netSales,store))throw Error('Repeated location/revenue-center row. Use separate files or explicit start/end dates for each period.');item.values[store]=null;item.netSales[store]=money(row[ni]);
    }
    return [...groups].map(([key,map])=>{const [start,end]=key.split('|');return salesDoc(name,start.slice(0,4),[...map.values()],{start,end},base.warnings);});
  }
  function printRows(sheet){const areas=[...String(sheet.printArea||'').matchAll(/\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)/g)];if(!areas.length)return sheet.rows;return sheet.rows.filter((row,i)=>areas.some(a=>(sheet.rowNumbers?.[i]||i+1)>=+a[2]&&(sheet.rowNumbers?.[i]||i+1)<=+a[4])).map(row=>row.slice(0,Math.max(...areas.map(a=>[...a[3]].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)))));}
  function dayPartSheets(sheets,name){
    if(!/day[ -]?part/i.test(name+' '+sheets.map(s=>s.header).join(' ')))return null;
    const candidates=sheets.filter(s=>!s.hidden&&P.storeCode(s.name)&&flat(s.rows).some(r=>r.includes('CO')&&r.includes('DI')&&r.includes('DD')));if(!candidates.length)return null;
    const chosen=new Map();for(const s of candidates){const store=P.storeCode(s.name);if(!chosen.has(store)||s.rows.some(r=>P.clean(r[1]?.text??r[1])==='PL'))chosen.set(store,s);}
    const docs=[];
    for(const [store,sheet]of chosen){const raw=flat(printRows(sheet)),hi=raw.findIndex(r=>r.includes('CO')&&r.includes('DI')&&r.includes('DD')),columns=raw[hi].map((x,index)=>({channel:P.channelCode(x),index})).filter(c=>c.channel),meta=M.read(name,M.headerText(sheet.header)),map=new Map();let item='',part='',parent=null;
      for(let i=hi+1;i<raw.length;i++){const r=raw[i],label=r.slice(0,Math.min(...columns.map(c=>c.index))).filter(Boolean).join(' ');if(!label)continue;if(/^(total|ttl|grand total)\b/i.test(label)){item='';part='';parent=null;continue;}
        if(!['BK','LN','DN','PL','ML'].includes(label)){item=label;part='';parent=null;continue;}
        if(!item)continue;
        const isForm=['PL','ML'].includes(label)||(label==='BK'&&part==='BK');
        if(isForm){if(parent)for(const c of columns){const row=parent[c.channel];row.forms[store]=row.forms[store]||{BK:null,PL:null,ML:null};row.forms[store][label]=P.qty(r[c.index]);}continue;}
        part=label;parent={};for(const c of columns){const key=part+'|'+c.channel;if(!map.has(key))map.set(key,[]);const row={kind:'item',group:'Breakfast Burritos',item,menu:P.CHANNELS[c.channel],values:{[store]:P.qty(r[c.index])},forms:{},sourceRow:i+1};map.get(key).push(row);parent[c.channel]=row;}
      }
      for(const [key,rows]of map){const [part,channel]=key.split('|');for(const row of rows){const f=row.forms[store];if(f&&f.PL!=null&&f.ML!=null){const basket=P.basket(row.values[store],f.PL,f.ML);if(f.BK!=null&&basket!==f.BK)throw Error(row.item+': Basket, Platter and Meal do not reconcile.');f.BK=basket;}}
        docs.push({id:uid(),kind:'aggregate',name,sourceSheet:sheet.name+' · '+part+' · '+channel,parsed:{stores:[store],rows,meta:{hasForms:true}},menus:[],...meta,part,channel,store,complete:false,warnings:[...meta.warnings,'Read actual BK/LN/DN rows. Parent item totals and duplicate day-part sheets are not added again. Serving BK means Basket only beneath a day-part total.']});}
    }return docs;
  }
  function parse(sheets,name){
    const sales=sheets.flatMap(s=>revenueSheet(s,name)||[]);if(sales.length)return {kind:'bundle',docs:sales};
    const daypart=dayPartSheets(sheets,name);if(daypart)return {kind:'bundle',docs:daypart};
    const scoped=sheets.filter(s=>!s.hidden&&/^(CO|DI|DIN|DD|CT|HH)$/i.test(s.name));if(scoped.length<2)return null;
    const docs=scoped.map(sheet=>{
      const meta=M.read(name,M.headerText(sheet.header)),rows=printRows(sheet).map(r=>r.map(c=>typeof c==='object'?{...c}: {text:c}));
      // These workbooks distinguish subtotal bands from item rows by bold category labels.
      // Only treat a bold numeric row as a category when a non-bold item follows it.
      for(let i=0;i<rows.length-1;i++)if(rows[i][0]?.bold&&rows[i+1][0]?.text&&!rows[i+1][0]?.bold)rows[i][0].group=true;
      const parsed=P.matrixFromRows(rows);let menu=P.CHANNELS[P.channelCode(sheet.name)];for(const r of parsed.rows){if(r.kind==='group'&&Object.values(r.values).every(v=>v==null))menu=r.item;r.menu=menu;if(r.group&&r.group!==menu)r.group=menu+' / '+r.group;}return {id:uid(),kind:'aggregate',name,sourceSheet:sheet.name,sheet:sheet.name,parsed,menus:[],channel:P.channelCode(sheet.name),complete:false,...meta,warnings:[...meta.warnings,'Read '+sheet.name+' as '+P.CHANNELS[P.channelCode(sheet.name)]+'. ORIG and other summary tabs are excluded. Category subtotals and cells outside the defined print area are not counted as items.']};
    });
    return {kind:'bundle',docs};
  }
  function batches(doc,common){
    if(doc.kind!=='revenue')return null;
    const out=[];for(const row of doc.parsed.rows.filter(r=>r.kind==='item')){const stores=doc.parsed.stores.filter(c=>Object.hasOwn(row.netSales,c));out.push({...common,id:doc.id+'-'+out.length,channel:row.channel||'OTHER',stores,rows:[{...row,values:{...row.values},netSales:{...row.netSales}}],meta:{metricOnly:'netSales',hasForms:true,fileImport:true}});}return out;
  }
  root.PMIX_IMPORTS={parse,pdfMeta,productPdf,revenuePdf,revenueSheet,periodForYear,batches};
})(typeof window!=='undefined'?window:globalThis);
