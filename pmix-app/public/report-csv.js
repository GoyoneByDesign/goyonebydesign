(function(root){
  'use strict';
  function csv(report,meta){
    const text=value=>{let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const encode=value=>typeof value==='number'&&Number.isFinite(value)?String(value):text(value==null?'n.a.':value);
    const headers=['Row type','Report title','Date / filters','Category','Item / revenue center','Number format',...report.stores,'TOTAL'];
    const rows=[headers.map(text).join(',')];
    for(const row of [...report.rows.map(r=>({...r,type:'Detail'})),...(report.footerRows||[{item:'GRAND TOTAL',values:report.totals,total:report.total,format:report.format}]).map(r=>({...r,type:'Grand total'}))])rows.push([row.type,meta.title,meta.subtitle,row.group||'',row.item,row.format||report.format||'quantity',...row.values,row.total].map(encode).join(','));
    return '\uFEFF'+rows.join('\r\n')+'\r\n';
  }
  root.PMIX_CSV={csv};
})(typeof window!=='undefined'?window:globalThis);
