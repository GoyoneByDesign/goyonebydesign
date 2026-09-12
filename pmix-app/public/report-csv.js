(function(root){
  'use strict';
  function csv(report,meta){
    const text=value=>{let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const encode=value=>typeof value==='number'&&Number.isFinite(value)?String(value):text(value==null?'n.a.':value);
    const headers=['Row type','Report title','Date / filters','Category','Item / revenue center','Number format',...report.stores.map((label,i)=>label+(report.columns?.[i]?.format==='percent'?' (ratio)':'')),...(report.omitTotal?[]:['TOTAL'])];
    const rows=[headers.map(text).join(',')];
    const data=root.PMIX_ROWS?root.PMIX_ROWS.rows(report,{...root.PMIX_FORMAT_CORE?.resolve(meta),...meta}).filter(r=>r.kind!=='group').map(r=>({...r,type:r.kind==='total'?'Grand total':r.kind==='subtotal'?'Category total':'Detail'})):[...report.rows.map(r=>({...r,type:'Detail'})),...(report.footerRows||[{item:'GRAND TOTAL',values:report.totals,total:report.total,format:report.format}]).map(r=>({...r,type:'Grand total'}))];for(const row of data)rows.push([row.type,meta.title,meta.subtitle,row.group||'',row.item,row.format||report.format||'quantity',...row.values,...(report.omitTotal?[]:[row.total])].map(encode).join(','));
    if(meta.legend?.length)rows.push(['Legend',meta.title,meta.subtitle,'',meta.legend.join(' · '),'text',...report.stores.map(()=>''),...(report.omitTotal?[]:[''])].map(text).join(','));return '\uFEFF'+rows.join('\r\n')+'\r\n';
  }
  root.PMIX_CSV={csv};
})(typeof window!=='undefined'?window:globalThis);
