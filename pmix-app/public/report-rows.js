(function(root){
'use strict';
const sum=values=>values.length&&values.every(Number.isFinite)?values.reduce((a,b)=>a+b,0):null;
const metricGroup=r=>r.item.includes('Net sales')?'sales':r.item.includes('Qty')?'qty':r.format==='currency'?'sales':'qty';
function totals(report,rows,label,kind,group){
 const groups=new Map();for(const r of rows){const key=metricGroup(r)+'|'+(r.metric||'');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
 const aggregates=new Map();for(const [key,rs]of groups)aggregates.set(key,{values:report.stores.map((_,i)=>sum(rs.map(r=>r.values[i]))),total:sum(rs.map(r=>r.total))});
 const out=[];for(const [key,rs]of groups){const r=rs[0],m=metricGroup(r),a=aggregates.get(key),values=[...a.values];let total=a.total;
  const ratio=(p,c)=>p==null||c==null||p===0?null:(p-c)/p;
  if(r.metric==='VAR'){const p=aggregates.get(m+'|Previous'),c=aggregates.get(m+'|Current');for(let i=0;i<values.length;i++)values[i]=ratio(p?.values[i],c?.values[i]);total=ratio(p?.total,c?.total);}
  for(let i=0;i<values.length;i++){const column=report.columns?.[i];if(column?.variance)values[i]=ratio(values[column.variance[0]],values[column.variance[1]]);}
  out.push({kind,group,item:label+(report.extended?(m==='sales'?' · Net sales':' · Qty'):'')+(r.metric?' · '+r.metric:''),metric:r.metric,format:r.format||report.format,values,total,summaryGroup:group,summaryMetric:m});
 }return out;
}
// Presentation never changes source identities or calculated values.
const acronyms=new Set(['BB','PMIX','MG','CO','DI','DD','CT','HH','BK','LN','DN','DIFF','VAR','AR','AS','CH','FX','HN','LS','MN','SP','VN','KSK','ONL','WI','CI','DT']);
function titleCase(value){return String(value||'').replace(/[A-Za-z]+(?:['’][A-Za-z]+)?/g,word=>acronyms.has(word.toUpperCase())?word.toUpperCase():/[a-z]/.test(word)&&/[A-Z]/.test(word)?word:word[0].toUpperCase()+word.slice(1).toLowerCase());}
function hierarchy(group){const labels=Object.values(root.PMIX?.CHANNELS||{}),parts=String(group||'Items').split(' / '),known=labels.find(label=>label.toLowerCase()===parts[0].toLowerCase());return known?{dining:known,category:parts.slice(1).join(' / ')}:{dining:'',category:group||'Items'};}
function present(report){return {...report,omitTotal:!!report.omitTotal||report.stores.length===1};}
function columnLabel(report,index){return report.stores.length===1?(report.extended?'VALUE':report.format==='currency'||report.rows.every(r=>r.format==='currency')?'NET SALES':'QTY'):report.stores[index];}
function headerTitle(report,title){const code=report.stores.length===1&&report.stores[0];return code&&!String(title).split(/[^A-Za-z0-9]+/).includes(code)?title+' · '+code:title;}
function label(row){if(row.level==='dining')return String(row.item).toUpperCase();if(row.kind==='total')return row.item;return titleCase(row.displayLabel??row.item);}
function rows(report,options={}){
 const groups=new Map();for(const row of report.rows){const group=row.group||'Items';if(!groups.has(group))groups.set(group,[]);groups.get(group).push(row);}
 const grand=(report.footerRows||[{item:'GRAND TOTAL',values:report.totals,total:report.total,format:report.format}]).map(r=>({...r,kind:'total'})),out=[];let dining='';
 if(options.grandTotals==='top')out.push(...grand);
 for(const [group,items]of groups){const scope=hierarchy(group);if(scope.dining&&scope.dining!==dining&&(scope.category||options.categoryTotals!=='top'))out.push({kind:'group',level:'dining',item:scope.dining,group,newSection:true});dining=scope.dining;
  const category=scope.category||scope.dining||group,level=scope.category||!scope.dining?'category':'dining',summary=totals(report,items,category+' TOTAL','subtotal',group).map(r=>({...r,level})),heading={kind:'group',level,item:category,group,newSection:true};
  if(options.categoryTotals==='top')out.push(...summary.map((r,i)=>({...r,item:r.item.replace(' TOTAL',''),newSection:i===0})));else if(scope.category||!scope.dining)out.push(heading);
  out.push(...items.map(r=>({...r,kind:'item'})));if(options.categoryTotals==='bottom')out.push(...summary);
 }
 if(options.grandTotals!=='top')out.push(...grand);return out;
}

root.PMIX_ROWS={rows,totals,metricGroup,present,hierarchy,label,titleCase,columnLabel,headerTitle};
})(typeof window!=='undefined'?window:globalThis);
