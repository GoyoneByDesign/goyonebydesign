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
function rows(report,options={}){
 const groups=new Map();for(const row of report.rows){const group=row.group||'Items';if(!groups.has(group))groups.set(group,[]);groups.get(group).push(row);}
 const grand=(report.footerRows||[{item:'GRAND TOTAL',values:report.totals,total:report.total,format:report.format}]).map(r=>({...r,kind:'total'})),out=[];
 if(options.grandTotals==='top')out.push(...grand);
 for(const [group,items]of groups){const summary=totals(report,items,group+' TOTAL','subtotal',group),heading={kind:'group',item:group,newSection:true};if(options.categoryTotals==='top')out.push(...summary.map((r,i)=>({...r,item:r.item.replace(' TOTAL',''),newSection:i===0})));else out.push(heading);out.push(...items.map(r=>({...r,kind:'item'})));if(options.categoryTotals==='bottom')out.push(...summary);}
 if(options.grandTotals!=='top')out.push(...grand);return out;
}
root.PMIX_ROWS={rows,totals,metricGroup};
})(typeof window!=='undefined'?window:globalThis);
