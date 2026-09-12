(function(root){
  'use strict';
  const P=root.PMIX, clean=v=>P.clean(v?.text??v), key=v=>clean(v).toLowerCase();
  const labels={all:'All levels',items:'Items',groups:'Menu groups',menus:'Menus',modifiers:'Modifiers',open:'Open items',percent:'Percentage breakdown',requests:'Special requests',total:'Total sales'};
  const descriptions={items:'Item totals across menus. They overlap All levels.',groups:'Category and subgroup totals. Subgroups are already included in category totals.',menus:'Menu totals. These summarize the items already in All levels.',modifiers:'Modifier occurrences and charges. These are not extra sold items.',open:'Open-item quantities and net amounts. All levels already contains these rows.',percent:'Rounded percentages for reference. They cannot supply quantities or net sales.',requests:'Special-request occurrences. These are not extra sold items or dining options.',total:'Control totals for quantity, gross, net and tax. These are not additional sales.'};
  const metrics=['qty sold','gross item amt','discount amt','refund amt','net item amt','tax amt'];
  const id=()=> 'toast-'+Math.random().toString(36).slice(2);
  function table(sheet){const rows=sheet.rows.map(r=>r.map(clean)),h=rows[0]?.map(key)||[];return {h,rows:rows.slice(1).filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]||''])))};}
  function role(h){const has=s=>h.includes(s);if(has('type')&&h.some(x=>x.startsWith('% of ')))return 'percent';if(!has('qty sold')||!has('net item amt'))return null;if(has('type')&&has('item, open item'))return 'all';if(has('special request'))return 'requests';if(has('modifier'))return 'modifiers';if(has('open item'))return 'open';if(has('item'))return 'items';if(has('menu group'))return 'groups';if(has('menu'))return 'menus';if(has('gross item amt')&&has('tax amt'))return 'total';return null;}
  const labelField={items:'item',groups:'menu group',menus:'menu',modifiers:'modifier',open:'open item',requests:'special request'};
  function number(row,k){const n=k==='qty sold'?P.qty(row[k]):P.money(row[k]);if(n===null)throw Error('Missing '+k+' in a Toast control or detail row.');return n;}
  function sum(rows,k){if(!rows.length)return 0;return rows.reduce((n,r)=>n+number(r,k),0);}
  function same(a,b,k,message){const tolerance=k==='qty sold'?1e-6:.011;if(Math.abs(a-b)>tolerance)throw Error(message+' ('+k+': '+a.toFixed(k==='qty sold'?3:2)+' vs '+b.toFixed(k==='qty sold'?3:2)+').');}
  function shared(a,b){return metrics.filter(k=>Object.hasOwn(a,k)&&Object.hasOwn(b,k));}
  function checkTotal(actual,expected,message){for(const k of shared(actual[0]||{},expected))same(sum(actual,k),number(expected,k),k,message);}
  function detailRows(doc){return doc.csv.rows.filter(r=>['menuitem','openitem'].includes(key(r.type)));}
  function parse(sheets,name,detailed){
    if(sheets.length!==1)return null;
    const t=table(sheets[0]),r=role(t.h);if(!r)return null;
    const csv={role:r,...t};
    if(r==='all'){
      const doc=detailed(sheets[0]);doc.csv=csv;
      // Parent item amounts already include their child modifier charges in this layout.
      const parents=detailRows(doc),total=t.rows.find(r=>!r.type&&!r.menu&&!r['item, open item']);
      if(total){for(const k of metrics.filter(k=>k!=='qty sold'&&t.h.includes(k)))same(sum(parents,k),number(total,k),k,'All levels parent amounts differ from its overall control');}
      const requests=t.rows.filter(r=>key(r.type)==='specialrequest');
      if(total&&requests.length&&Math.abs(number(total,'qty sold')-doc.total-sum(requests,'qty sold'))<1e-6)doc.warnings.push('This All levels overall quantity also includes unsized special requests. PMIX uses menuItem + openItem quantities; requests are not additional sold items.');
      doc.netTotal=sum(parents,'net item amt');doc.controlText+=total?' Net item amounts match the file control.':' No overall net-amount control is present.';
      doc.csv.baseControl=doc.controlText;doc.sourceFormat='toast-item-detail';return doc;
    }
    const doc={id:id(),name,kind:'toastReference',csv,menus:[],part:'ALL',complete:false,start:'',end:'',store:'',warnings:[],use:'pending',sourceFormat:'toast-'+r};
    Object.assign(doc,root.PMIX_METADATA.read(name));doc.warnings.push(descriptions[r]);
    if(r==='percent'){
      for(const row of t.rows)for(const h of t.h.filter(k=>k.startsWith('% of ')))if(row[h]&&P.money(row[h])===null)throw Error('Invalid percentage in '+name+'.');
    }else{
      const field=labelField[r],data=field?t.rows.filter(x=>x[field]):t.rows;
      if(!data.length)throw Error('No '+labels[r]+' rows found.');
      for(const row of data)for(const k of metrics.filter(k=>t.h.includes(k)))number(row,k);
      if(r==='total'&&data.length!==1)throw Error('Total sales must contain exactly one control row.');
      const control=field?t.rows.find(x=>!x[field]):t.rows[0];
      if(control&&['items','open','modifiers','requests'].includes(r))checkTotal(data,control,labels[r]+' rows differ from its control');
      doc.total=control?number(control,'qty sold'):sum(data,'qty sold');doc.netTotal=control?number(control,'net item amt'):sum(data,'net item amt');
    }
    return doc;
  }
  function map(rows,identity,columns){const out=new Map();for(const row of rows){const k=identity(row);if(!out.has(k))out.set(k,Object.fromEntries(columns.map(c=>[c,0])));for(const c of columns)out.get(k)[c]+=number(row,c);}return out;}
  function compareRows(actual,expected,actualId,expectedId,name){
    const cols=shared(actual[0]||{},expected[0]||{}),a=map(actual,actualId,cols),b=map(expected,expectedId,cols);
    for(const k of new Set([...a.keys(),...b.keys()])){
      if(!a.has(k)||!b.has(k))throw Error(name+' contains a different item/group identity. Check that these files have the same location, dates and filters.');
      for(const c of cols)same(a.get(k)[c],b.get(k)[c],c,name+' differs from All levels');
    }
  }
  const join=(r,fields)=>JSON.stringify(fields.map(k=>key(r[k])));
  function check(source,ref){
    if(source?.csv?.role!=='all')throw Error('Choose an All levels source for these checks.');
    for(const k of ['start','end','store'])if(ref[k]&&source[k]&&ref[k]!==source[k])throw Error(ref.name+' has different '+k+' metadata.');
    const a=source.csv.rows,parents=detailRows(source),r=ref.csv.role,rows=ref.csv.rows,field=labelField[r],data=field?rows.filter(x=>x[field]):rows,typed=types=>a.filter(x=>types.includes(key(x.type)));
    if(r==='total')checkTotal(parents,rows[0],ref.name+' differs from parent item totals');
    else if(r==='items')compareRows(typed(['menuitem']),data,x=>key(x['item, open item']),x=>key(x.item),ref.name);
    else if(r==='open')compareRows(typed(['openitem']),data,x=>x.itemguid||key(x['item, open item']),x=>x.itemguid||key(x['open item']),ref.name);
    else if(r==='menus')compareRows(typed(['menuitem','openitem','giftcard']),data,x=>key(x.menu),x=>key(x.menu),ref.name);
    else if(r==='groups'){
      const all=typed(['menuitem','openitem','giftcard']);
      compareRows(all,data.filter(x=>!x.subgroup),x=>key(x['menu group']),x=>key(x['menu group']),ref.name);
      compareRows(all.filter(x=>x.subgroup),data.filter(x=>x.subgroup),x=>join(x,['menu group','subgroup']),x=>join(x,['menu group','subgroup']),ref.name+' subgroups');
    }else if(r==='modifiers'||r==='requests'){
      const actual=typed(r==='modifiers'?['modifier','sizedmodifier']:['specialrequest','sizedspecialrequest']);
      compareRows(actual,data,x=>join({...x,label:x['modifiers, special requests']},['size modifier','label']),x=>join({...x,label:x[field]},['size modifier','label']),ref.name);
    }else if(r==='percent'){
      const fields=['type','menu','menu group','subgroup','item, open item','size modifier','modifiers, special requests'],normalize=x=>({...x,subgroup:x.subgroup||x['sub groups'],['item, open item']:x['item, open item']||x['item / open item']});
      const identities=new Map();for(const x of a.filter(x=>x.type||x.menu)){const k=join(normalize(x),fields);identities.set(k,(identities.get(k)||0)+1);}
      for(const x of rows){const k=join(normalize(x),fields);if(!identities.get(k))throw Error(ref.name+' has different row identities from All levels.');identities.set(k,identities.get(k)-1);}
      if([...identities.values()].some(Boolean))throw Error(ref.name+' does not cover the same rows as All levels.');
      return 'Row identities checked; percentages remain reference only.';
    }
    return 'Matched '+labels[r]+' quantities and source amounts.';
  }
  function prepare(docs){
    const sources=docs.filter(d=>d.csv?.role==='all');for(const d of sources){d.supportingFiles=[];d.csvAudit=[];d.controlText=d.csv.baseControl;}
    for(const d of docs.filter(d=>d.kind==='toastReference')){
      if(d.use==='ignore')continue;
      if(d.use==='source'){
        if(sources.some(s=>s.store&&s.store===d.store&&s.start===d.start&&s.end===d.end&&s.part===d.part))throw Error(d.name+' overlaps All levels for this scope. Use it as a check to avoid counting the same sales twice.');
        continue;
      }
      const source=sources.find(s=>s.id===d.checkWith);if(d.use!=='check'||!source)throw Error('Choose how to use '+d.name+': check it against All levels, use a supported standalone source, or keep it in History only.');
      d.checkText=check(source,d);source.csvAudit.push(labels[d.csv.role]+': '+d.checkText);source.supportingFiles.push({hash:d.hash,name:d.name,historyId:d.historyId});
      if(d.csv.role==='total'){source.reconciled=true;source.complete=true;}
    }
    for(const d of sources)if(d.csvAudit.length)d.controlText+=' Checked '+d.csvAudit.length+' related files without adding their totals again.';
    return docs.filter(d=>d.kind!=='toastReference'||d.use==='source');
  }
  function sourceBatches(doc,common){
    if(doc.kind!=='toastReference')return null;
    if(doc.use!=='source')return [];
    if(!['items','open','total'].includes(doc.csv.role))throw Error('This summary cannot supply item-level sales. Upload All levels.');
    if(!P.STORES.some(([c])=>c===doc.store))throw Error('Choose a location for '+doc.name+'.');
    const role=doc.csv.role,field=labelField[role],data=field?doc.csv.rows.filter(r=>r[field]):doc.csv.rows,store=doc.store;
    const rows=data.map((r,i)=>({kind:'item',group:role==='total'?'Sales summary':'',item:role==='total'?'Net sales · all items':r[field],values:{[store]:role==='total'?null:number(r,'qty sold')},netSales:{[store]:number(r,'net item amt')},sourceRow:i+2}));
    // Distinct item IDs may share a displayed name. Preserve the explicit identity in the group.
    const names=new Map();for(const r of rows)names.set(key(r.item),(names.get(key(r.item))||0)+1);
    rows.forEach((r,i)=>{if(names.get(key(r.item))>1)r.group='Item '+(data[i].masterid||data[i].itemguid||String(i+1));});
    return [{...common,id:doc.id+'-source',channel:doc.channel||'ALL',stores:[store],rows,zeroForMissing:!!doc.complete,meta:{fileImport:true,csvRole:role,wholeScope:true,...(role==='total'?{metricOnly:'netSales'}:{})}}];
  }
  function listPanel(docs,box,{el,guard,render}){
    const sources=docs.filter(d=>d.csv?.role==='all'),refs=docs.filter(d=>d.kind==='toastReference');
    if(sources.length!==1||!refs.length)return;
    const panel=el('div',undefined,'import-card toast-set'),button=el('button','Confirm same scope and check files','secondary');
    panel.append(el('h3','Related Toast CSV files'),el('p','Use All levels for the report and the other CSVs to check it. Confirm that these files cover the same location, dates and Toast filters. Enter the location and dates on All levels below.'));
    button.dataset.toastCheckSet='true';button.onclick=guard(()=>{for(const d of refs){d.use='check';d.checkWith=sources[0].id;}try{prepare(docs);}finally{render();}});
    panel.append(button);box.append(panel);
  }
  function panel(doc,card,docs,{el,select,field,render,guard}){
    if(doc.kind!=='toastReference')return false;
    card.append(el('p',labels[doc.csv.role]+' · '+doc.csv.rows.length+' source rows','source-check'),el('p',descriptions[doc.csv.role],'muted'));
    const choices=[['pending','Choose how to use this file'],...docs.filter(d=>d.csv?.role==='all').map(d=>['check:'+d.id,'Check against '+d.name])];
    if(['items','open','total'].includes(doc.csv.role))choices.push(['source',doc.csv.role==='total'?'Use as net-sales summary source':'Use as standalone item source']);
    choices.push(['ignore','Keep in History only']);
    select(card,'File role',choices,doc.use==='check'?'check:'+doc.checkWith:doc.use,value=>{doc.use=value.startsWith('check:')?'check':value;doc.checkWith=value.startsWith('check:')?value.slice(6):'';doc.checkText='';render();});
    if(doc.use==='source'){
      const fields=el('div',undefined,'fields');
      select(fields,'Location',[['','Choose location'],...P.STORES.map(([c,n])=>[c,c+' '+n])],doc.store,v=>doc.store=v);
      field(fields,'Start date','date',doc.start,v=>doc.start=v);field(fields,'End date','date',doc.end,v=>doc.end=v);
      select(fields,'Source day-part scope',[['ALL','As exported / no time detail'],['BK','BK Breakfast export'],['LN','LN Lunch export'],['DN','DN Dinner export']],doc.part,v=>doc.part=v);
      select(fields,'Dining option in source',Object.entries(P.CHANNELS).map(([c,n])=>[c,c==='ALL'?'Combined / unspecified':c+' '+n]),doc.channel||'ALL',v=>doc.channel=v);
      card.append(fields,el('p','This source has no menu/dining breakdown or item-to-modifier links. Only fields actually present can be reported.','muted'));
      const label=el('label'),c=el('input');c.type='checkbox';c.checked=!!doc.complete;c.onchange=()=>doc.complete=c.checked;label.append(c,document.createTextNode('This source includes all its item rows; an absent item means zero.'));card.append(label);
    }else if(doc.use==='check'){
      const button=el('button','Check this file','secondary');button.onclick=guard(()=>{doc.checkText=check(docs.find(d=>d.id===doc.checkWith),doc);render();});card.append(button);
    }
    if(doc.checkText)card.append(el('p',doc.checkText,'source-check'));
    if(doc.netTotal!=null)card.append(el('p',doc.total.toLocaleString('en-US')+' source quantity · '+doc.netTotal.toLocaleString('en-US',{style:'currency',currency:'USD'})+' source net amount. Summaries are not added again.','muted'));
    return true;
  }
  root.PMIX_TOAST_CSV={parse,prepare,check,sourceBatches,listPanel,panel,labels,descriptions};
})(typeof window!=='undefined'?window:globalThis);
