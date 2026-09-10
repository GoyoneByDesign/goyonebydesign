(function(root) {
  'use strict';
  const STORES = [['AR','Arlington','South'],['AS','Ashburn','North'],['BK','Burke','South'],['CH','Chantilly','North'],['FX','Fairfax','South'],['HN','Herndon','North'],['LS','Leesburg','North'],['MN','Manassas','North'],['SP','Springfield','South'],['VN','Vienna','South']];
  const CHANNELS = {ALL:'All channels',CO:'Carry-Out',DI:'Dine-In',DD:'DoorDash',CT:'Catering',HH:'Happy Hour',UNMAPPED:'Unassigned dining option',OTHER:'Other'};
  const PARTS = {ALL:'All day',BK:'4:00 AM - 10:59 AM',LN:'11:00 AM - 3:59 PM',DN:'4:00 PM - 11:59 PM',UNASSIGNED:'12:00 AM - 3:59 AM'};
  const clean = v => String(v ?? '').replace(/\s+/g,' ').trim();
  function storeCode(v) { const s=clean(v); if (/commissary|office/i.test(s)) return null; return STORES.find(([c,n]) => s.toUpperCase()===c || new RegExp('\\b'+n+'\\b','i').test(s))?.[0] || null; }
  function channelCode(v) {const s=clean(v).toUpperCase().replace(/[\s_\/-]/g,''); return ({CO:'CO',CARRYOUT:'CO',TAKEOUT:'CO',DIN:'DI',DI:'DI',DINEIN:'DI',DD:'DD',DOORDASH:'DD',CT:'CT',CATERING:'CT',HH:'HH',HAPPYHOUR:'HH',ALL:'ALL',ALLCHANNELS:'ALL'})[s] || null;}
  function qty(v) { if (typeof v==='number') {if(!Number.isFinite(v)) throw Error('Quantity is not finite.');return v;} const s=clean(v); if(!s || /^[-–—]$/.test(s))return null; if(s.includes('%'))throw Error('Percentage found where item quantity was expected.'); const n=s.replace(/,/g,'').replace(/^\((.*)\)$/,'-$1');if(!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(n))throw Error('Invalid quantity: '+s);return Number(n); }
  function money(v){return qty(typeof v==='string'?v.replace(/[$]/g,''):v);}
  function dayPart(time) {const m=clean(time).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);if(!m)throw Error('Use restaurant-local HH:MM or HH:MM AM/PM.');let h=+m[1];const min=+m[2],sec=+(m[3]||0);if(m[4]){if(h<1||h>12)throw Error('Invalid time');h=h%12+(/pm/i.test(m[4])?12:0);}if(h>23||min>59||sec>59)throw Error('Invalid time');return h<4?'UNASSIGNED':h<11?'BK':h<16?'LN':'DN';}
  function csv(text, delimiter) {text=text.replace(/^\uFEFF/,'');delimiter=delimiter||(text.split(/\r?\n/)[0].includes('\t')?'\t':',');const out=[];let row=[],value='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(x=>x!==''))out.push(row);row=[];value='';}else value+=c;}if(quoted)throw Error('Unclosed quoted field.');if(value||row.length){row.push(value);out.push(row);}return out;}
  function matrixFromRows(raw, meta={}) {
    const cells=raw.map(r=>r.map(c=> typeof c==='object'&&c!==null ? c : {text:c}));
    const rows=cells.map(r=>r.map(c=>clean(c.text)));
    let header=-1,columns=[];
    for(let i=0;i<Math.min(rows.length,80);i++){
      const cs=[];for(let j=0;j<rows[i].length;j++){const code=storeCode(rows[i][j]);if(code)cs.push({index:j,code});}
      if(new Set(cs.map(c=>c.code)).size>=2){header=i;columns=cs;break;}
    }
    if(header<0)throw Error('No side-by-side location headings found. Import a Toast comparison CSV/XLSX, or paste a table with AR, AS, BK, CH, FX, HN, LS, MN, SP, VN headings.');
    let next=rows[header+1]||[], qtyHeader=next.some(v=>/^(item\s*)?qty$|^quantity$/i.test(v));
    if(qtyHeader){const selected=[];let owner=null;for(let j=0;j<Math.max(rows[header].length,next.length);j++){if(rows[header][j]) owner=storeCode(rows[header][j]); if(owner&&/^(item\s*)?qty$|^quantity$/i.test(next[j]))selected.push({index:j,code:owner});}columns=selected;}
    else if(next.some(v=>/^(BK|LN|DN|CO|DI|DD|CT|HH|PL|ML)$/.test(v))&&columns.length>2)throw Error('This sheet has multiple channel/day-part columns per store. Select a simple comparison sheet or import normalized CSV. Do not mix those columns as one quantity.');
    const codes=columns.map(c=>c.code);if(new Set(codes).size!==codes.length)throw Error('Duplicate store columns. Select one quantity per store and one day part/channel.');
    if(!columns.length)throw Error('Item Qty columns could not be matched to location headings.');
    const itemEnd=Math.min(...columns.map(c=>c.index));
    if(itemEnd===0)throw Error('No item-name column before the quantities.');
    let group='',output=[],warnings=[];
    const start=header+1+(qtyHeader?1:0);
    for(let i=start;i<rows.length;i++){
      const r=rows[i], label=r.slice(0,itemEnd).filter(Boolean).join(' / ');if(!label)continue;
      if(/^item$|^item name$|^menu item$/i.test(label))continue;
      if(columns.every(c=>storeCode(r[c.index])===c.code))continue;
      if(/^(LN|DN)$/.test(label))throw Error('Day-part detail rows detected. Import one day part at a time to avoid counting item totals and their children twice.');
      const values={};let numeric=0;for(const c of columns){try{values[c.code]=qty(r[c.index]);if(values[c.code]!==null)numeric++;}catch(e){throw Error('Source row '+(i+1)+' ('+label+'): '+e.message);}}
      if(!numeric){group=label;output.push({kind:'group',group:label,item:label,values,sourceRow:i+1});continue;}
      const kind=/^(grand\s+total|total|subtotal|ttl)(\b|$)/i.test(label)?'ignore':/^(BK|PL|ML)$/.test(label)?label:(cells[i][0]?.group||/^Breakfast Burritos$/i.test(label))?'group':'item';
      if(kind==='group')group=label;
      output.push({kind,group,item:label,values,sourceRow:i+1});
    }
    if(!output.some(r=>r.kind==='item'))throw Error('No numeric item rows found.');
    const missing=STORES.filter(([c])=>!codes.includes(c)).map(([c])=>c);
    if(missing.length)warnings.push('Missing stores: '+missing.join(', ')+'. They remain unavailable.');
    warnings.push('Review group/subtotal rows before saving. The parser cannot prove that every Toast group or page is expanded.');
    return {rows:output,stores:codes,warnings,meta};
  }
  function servingType(label){const s=clean(label);if(/^ML$|^Meal(?:\b|\s*-)/i.test(s))return 'ML';if(/^PL$|^Platter(?:\b|\s*-)/i.test(s))return 'PL';if(/^BK$|^Basket$/i.test(s))return 'BK';return null;}
  function basket(total,platter,meal){if([total,platter,meal].some(v=>v==null))return null;const b=total-platter-meal;if(b < -1e-9)throw Error('Platter + Meal exceeds item total. Check overlap and modifier mapping.');return Math.abs(b)<1e-9?0:b;}
  function hierarchyFromRows(raw,store){if(!STORES.some(x=>x[0]===store))throw Error('Choose the location for this detailed Product Mix capture.');const rows=raw.map(r=>r.map(c=>typeof c==='object'&&c!==null?c:{text:c}));let qi=-1,hi=-1;for(let i=0;i<Math.min(rows.length,40);i++){const j=rows[i].findIndex(c=>/^(qty sold|item qty|quantity|qty)$/i.test(clean(c.text)));if(j>=0){qi=j;hi=i;break;}}if(qi<0)throw Error('No Qty sold column found in the detailed report.');let group='',haveItem=false;const out=[];
    for(let i=hi+1;i<rows.length;i++){const r=rows[i],item=clean(r.slice(0,qi).map(c=>c.text).filter(Boolean).join(' / '));if(!item)continue;let v;try{v=qty(r[qi]?.text);}catch{continue;}const type=servingType(item);let kind;if(/^total$|^grand total$/i.test(item)){kind='ignore';haveItem=false;}else if(channelCode(item)||/^breakfast burritos$/i.test(item)){kind='group';group=item;haveItem=false;}else if(type){kind=type;}else if(/^BB\b/i.test(item)||['El Verde','Sausage Vegano'].includes(item)){kind='item';haveItem=true;}else kind=haveItem?'modifier':'group';out.push({kind,group,item,values:{[store]:v},sourceRow:i+1});}
    if(!out.length)throw Error('No product rows found.');return {rows:out,stores:[store],warnings:['Review every parent item and modifier row. Mark selected item totals as Item, serving modifiers as PL or ML, and all other modifiers as Modifier.'],meta:{detailed:true}};
  }
  function attachForms(rows,stores,complete){let item=null;for(const r of rows){if(r.kind==='item'){item=r;item.forms={};for(const c of stores)item.forms[c]={BK:null,PL:complete?0:null,ML:complete?0:null};}else if(['group','ignore'].includes(r.kind)){item=null;}else if(['BK','PL','ML'].includes(r.kind)&&item){for(const c of stores){const f=item.forms[c],v=r.values[c];if(v==null){f[r.kind]=null;f.invalid=true;}else f[r.kind]=(f[r.kind]??0)+v;}}}
    for(const r of rows.filter(x=>x.kind==='item'))for(const c of stores){const f=r.forms[c];if(f.invalid){f.BK=null;continue;}const derived=basket(r.values[c],f.PL,f.ML);if(f.BK!==null&&derived!==null&&Math.abs(f.BK-derived)>1e-9)throw Error(r.item+' '+c+': Basket + Platter + Meal does not match total.');if(f.BK===null)f.BK=derived;}
  }
  function normalized(raw){const rows=raw.map(r=>r.map(c=>clean(c?.text??c)));const h=rows[0].map(x=>x.toLowerCase().replace(/[_\s-]/g,''));const si=h.findIndex(x=>['store','location'].includes(x)),ii=h.findIndex(x=>['item','itemname'].includes(x)),qi=h.findIndex(x=>['quantity','qty','itemqty','qtysold'].includes(x));if(si<0||ii<0||qi<0)return null;const ni=h.findIndex(x=>['netsales','netsalesamount'].includes(x)),gi=h.findIndex(x=>['group','category','menugroup'].includes(x)),pi=h.indexOf('platter'),mi=h.indexOf('meal');const byKey=new Map(),stores=new Set(),seen=new Set();
    rows.slice(1).forEach((row,i)=>{const c=storeCode(row[si]);if(!c){if(/office|commissary/i.test(row[si]))return;throw Error('Unrecognized store on row '+(i+2));}stores.add(c);const item=row[ii],group=gi<0?'':row[gi];if(!item)throw Error('Missing item on row '+(i+2));const key=group+'\0'+item;if(seen.has(key+'\0'+c))throw Error('Duplicate item/store row '+(i+2)+'. Import aggregate quantities once per item and store.');seen.add(key+'\0'+c);if(!byKey.has(key))byKey.set(key,{kind:'item',group,item,values:{},netSales:{},forms:{},sourceRow:i+2});const r=byKey.get(key);r.values[c]=qty(row[qi]);r.netSales[c]=ni<0?null:money(row[ni]);if(pi>=0&&mi>=0){const PL=qty(row[pi]),ML=qty(row[mi]);r.forms[c]={PL,ML,BK:basket(r.values[c],PL,ML)};}});return {rows:[...byKey.values()],stores:[...stores],warnings:['Import one reporting period, channel, and day part per file. Blank store/item quantities remain unavailable.'],meta:{normalized:true,hasForms:pi>=0&&mi>=0}};
  }
  function validateBatch(batch, batches=[],replaceId=null) {
    if(!batch.start||!batch.end||batch.start>batch.end||!/^\d{4}-\d{2}-\d{2}$/.test(batch.start)||!/^\d{4}-\d{2}-\d{2}$/.test(batch.end))throw Error('Enter a valid source date range.');
    if(!CHANNELS[batch.channel]||!PARTS[batch.part])throw Error('Choose a source channel and day part.');
    if(!batch.confirmed)throw Error('Review the source scope and row types before saving.');
    const keys=new Set();for(const row of batch.rows.filter(x=>x.kind==='item')){const key=clean(row.group)+'\0'+clean(row.item)+(batch.meta?.toast?'\0'+clean(row.menu):'');if(keys.has(key))throw Error('Duplicate item in the same group: '+row.item+'. Use distinct group paths or remove the repeated row.');keys.add(key);}
    if(!keys.size)throw Error('There are no included item rows.');
    for(const b of batches){if(b.id===replaceId)continue;const period=batch.start<=b.end&&b.start<=batch.end;const stores=batch.stores.some(s=>b.stores.includes(s));const channel=batch.meta?.toast&&b.meta?.toast?batch.meta.sourceMenus.some(m=>b.meta.sourceMenus.includes(m)):batch.channel==='ALL'||b.channel==='ALL'||batch.channel===b.channel;const part=batch.part==='ALL'||b.part==='ALL'||batch.part===b.part;if(period&&stores&&channel&&part)throw Error('This overlaps an existing capture ('+b.label+'). Remove that capture before replacing it, or use a different period/channel/day part.');}
  }
  function report(batches,filter={}){
    const identity=r=>filter.combineNames?clean(r.item).toLowerCase():clean(r.group)+'\0'+clean(r.item);
    const chosen=filter.itemKeys?.map(k=>k.split('\0').at(-1).toLowerCase())||[];
    const stores=STORES.filter(x=>(!filter.region||filter.region==='All'||x[2]===filter.region)&&(!filter.stores||filter.stores.includes(x[0]))).map(x=>x[0]);
    if(!stores.length)throw Error('Choose at least one location.');
    let selected=batches.filter(b=>(!filter.period||b.start+' / '+b.end===filter.period)&&(!filter.channels?.length||filter.channels.includes(b.channel))&&(!filter.parts?.length||filter.parts.includes(b.part))&&(!filter.channel||filter.channel==='ALL_IMPORTED'||b.channel===filter.channel||(filter.channel==='DI_HH'&&(b.channel==='DI'||b.channel==='HH')))&&(!filter.part||filter.part==='ALL_IMPORTED'||b.part===filter.part));
    if(selected.some(b=>b.channel==='HH')&&selected.some(b=>b.channel==='DI')&&!selected.filter(b=>b.channel==='HH').every(b=>b.hhExclusive))throw Error('Confirm that the HH capture is not already included in DI before combining them.');
    if(filter.start||filter.end){const lo=filter.start||'0000-01-01',hi=filter.end||'9999-12-31';if(selected.some(b=>(b.start<lo&&b.end>=lo)||(b.end>hi&&b.start<=hi)))throw Error('The selected dates cut through an aggregated capture. Load timestamped records or a source report for that exact range.');selected=selected.filter(b=>b.start>=lo&&b.end<=hi);}
    if(filter.timeStart||filter.timeEnd)throw Error('Exact time filters require timestamped records. This source contains aggregated PMIX totals.');
    if(filter.channel==='DI_HH'&&(!selected.some(b=>b.channel==='DI')||!selected.some(b=>b.channel==='HH')))throw Error('DI + HH requires separate DI and HH captures for this period/day part.');
    if(filter.channel==='DI_HH'&&!selected.filter(b=>b.channel==='HH').every(b=>b.hhExclusive))throw Error('Confirm in the HH capture that Happy Hour is not already included in DI.');
    const periods=[...new Set(selected.map(b=>b.start+' / '+b.end))];if(periods.length>1)throw Error('Select one source date interval. Different intervals are not combined silently.');
    const byKey=new Map();
    for(const b of selected)for(const r of b.rows.filter(x=>x.kind==='item')){
      if(filter.groups?.length&&!filter.groups.includes(r.group))continue;
      if(filter.itemKeys?.length&&!(filter.combineNames?chosen.includes(clean(r.item).toLowerCase()):filter.itemKeys.includes(clean(r.group)+'\0'+clean(r.item))))continue;
      if(filter.menus?.length&&!filter.menus.includes(r.menu))continue;
      if(filter.special==='selected'&&!filter.itemKeys?.length)continue;
      if(filter.special==='lunch'&&!(filter.lunchKeys?.includes(clean(r.group)+'\0'+clean(r.item))||/lunch special|daily express lunch/i.test(r.group+' '+(r.menu||''))))continue;
      if(filter.special==='happy'&&!(filter.happyKeys?.includes(clean(r.group)+'\0'+clean(r.item))||/happy hour/i.test(r.group+' '+(r.menu||''))||b.channel==='HH'))continue;
      if((filter.bb||filter.special==='bb')&&!/\bBB\b|breakfast burrito/i.test(r.item+' '+r.group)&&!['El Verde','Sausage Vegano'].includes(r.item))continue;
      if(filter.search&&!clean(r.item+' '+r.group).toLowerCase().includes(filter.search.toLowerCase()))continue;
      const key=identity(r);if(!byKey.has(key))byKey.set(key,{group:r.group,item:r.item,values:{},unknown:new Set(),seen:new Set()});const t=byKey.get(key);
      for(const code of b.stores){const v=filter.metric==='netSales'?r.netSales?.[code]:r.values[code];t.seen.add(code);if(v==null)t.unknown.add(code);else t.values[code]=(t.values[code]||0)+v;}
    }
    // Complete exports establish a zero for an absent item within their source scope.
    for(const b of selected){const keys=new Set(b.rows.filter(x=>x.kind==='item').map(identity));for(const [key,t]of byKey)if(!keys.has(key))for(const c of b.stores){if(b.zeroForMissing){t.seen.add(c);t.values[c]=t.values[c]||0;}else t.unknown.add(c);}}
    const rows=[...byKey.values()].map(t=>{const values=stores.map(c=>t.unknown.has(c)||!t.seen.has(c)?null:t.values[c]??null);return {group:t.group,item:t.item,values,total:values.some(v=>v===null)?null:values.reduce((a,b)=>a+b,0)};});
    const totals=stores.map((c,i)=>rows.length&&rows.every(r=>r.values[i]!==null)?rows.reduce((s,r)=>s+r.values[i],0):null);
    return {combineNames:!!filter.combineNames,stores,rows,totals,total:totals.every(v=>v!==null)?totals.reduce((a,b)=>a+b,0):null,batches:selected,period:periods[0]||'',missing:stores.filter(c=>!selected.some(b=>b.stores.includes(c)))};
  }
  function formsReport(batches,filter,keys){const base=report(batches,filter);if(filter.metric==='netSales'){for(const r of base.rows){r.values=base.stores.map(()=>null);r.total=null;}base.totals=base.stores.map(()=>null);base.total=null;return base;}base.rows=base.rows.filter(r=>keys.includes(r.group+'\0'+r.item)).flatMap(r=>['BK','PL','ML'].map(type=>{const values=base.stores.map(c=>{let total=0,seen=false;for(const b of base.batches.filter(b=>b.stores.includes(c))){const items=b.rows.filter(x=>x.kind==='item'&&(filter.combineNames?clean(x.item).toLowerCase()===clean(r.item).toLowerCase():x.group+'\0'+x.item===r.group+'\0'+r.item)&&(!filter.groups?.length||filter.groups.includes(x.group))&&(!filter.menus?.length||filter.menus.includes(x.menu)));if(!items.length){if(b.zeroForMissing){seen=true;continue;}return null;}for(const item of items){const v=item.forms?.[c]?.[type];if(v==null)return null;total+=v;seen=true;}}return seen?total:null;});return {group:r.group,item:r.item+' - '+({BK:'BK Basket',PL:'PL Platter',ML:'ML Meal'})[type],values,total:values.every(v=>v!==null)?values.reduce((a,b)=>a+b,0):null};}));base.totals=base.stores.map((c,i)=>base.rows.length&&base.rows.every(r=>r.values[i]!==null)?base.rows.reduce((s,r)=>s+r.values[i],0):null);base.total=base.totals.every(v=>v!==null)?base.totals.reduce((a,b)=>a+b,0):null;return base;}
  const api={STORES,CHANNELS,PARTS,clean,storeCode,channelCode,qty,money,dayPart,csv,matrixFromRows,hierarchyFromRows,normalized,servingType,basket,attachForms,validateBatch,report,formsReport};root.PMIX=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
