const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('full preview UI renders after open, reuses PDF on reopen/download, updates filters, and does not build hidden thumbnails',async()=>{
 const dom=new JSDOM(fs.readFileSync('public/index.html','utf8'),{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{},set:()=>true});
 let builds=0,downloads=0;const report={rows:[{item:'Coffee',values:[2],total:2}],stores:['FX'],batches:[{stores:['FX']}],period:'2026-08-19 / 2026-08-25'};
 const meta={title:'PMIX Full',filename:'FX - PMIX Full 2026 - 0819_0825',paperSize:'letter',orientation:'portrait'},current={report,meta};
 w.PMIX_CURRENT=()=>current;w.PMIX_METADATA={range:x=>x};w.PMIX_IO={makePdf:async()=>{builds++;return new w.Uint8Array([37,80,68,70]);},download:async()=>downloads++};
 w.PMIX_FORMATS={list:[{format:{id:'compact',name:'Compact ledger',paperSize:'letter',orientation:'portrait'}}],subscribe:()=>{},connect:()=>{}};
 w.PMIX_REPORT_FONTS={ready:Promise.resolve(),description:()=>''};w.PMIX_STUDIO={refresh:()=>w.document.dispatchEvent(new w.CustomEvent('pmix:report-updated'))};
 w.testPdfJs={GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:1,destroy:async()=>{},getPage:async()=>({getViewport:({scale})=>({width:612*scale,height:792*scale}),render:()=>({promise:Promise.resolve(),cancel:()=>{}})})})})};
 try{w.eval(fs.readFileSync('public/report-render-cache.js','utf8'));w.eval(fs.readFileSync('public/studio.js','utf8').replace("import('./vendor/pdfjs/pdf.min.mjs')","Promise.resolve(testPdfJs)"));await tick();assert.equal(builds,0);
 w.PMIX_PREVIEW.open();await tick();assert.equal(builds,1);assert.match(w.document.querySelector('.preview-status').textContent,/1 page/);assert.equal(w.document.querySelector('.document-preview').hidden,false);
 w.PMIX_STUDIO.refresh();w.PMIX_PREVIEW.open();await tick();assert.equal(builds,1);const download=[...w.document.querySelectorAll('.preview-toolbar button')].find(b=>b.textContent==='Download PDF');await download.onclick();assert.equal(downloads,1);assert.equal(builds,1);
 current.report={...report,rows:[{item:'Coffee',values:[9],total:9}]};w.PMIX_STUDIO.refresh();await new Promise(resolve=>setTimeout(resolve,220));assert.equal(builds,2);assert.equal(download.disabled,false);
 w.PMIX_PREVIEW.back();await new Promise(resolve=>setTimeout(resolve,950));assert.equal(builds,2);assert.equal(w.document.querySelector('.document-preview').hidden,true);
 }finally{w.close();}
});
