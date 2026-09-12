const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),fixture=require('./fixtures/toast-csv-fixture.cjs');
function setup(){const c={console};c.window=c;vm.createContext(c);for(const f of ['core','timed','report-metadata','report-imports','dining','toast-csv','files'])vm.runInContext(fs.readFileSync('public/'+f+'.js','utf8'),c);return c;}
function read(c){return Object.entries(fixture()).map(([name,text])=>{const d=c.PMIX_FILES.parse([{name:'CSV',rows:c.PMIX.csv(text)}],name);d.hash=name;d.historyId='archive-'+name;return d;});}
test('nine Toast views reconcile without adding summary, modifier, request, subgroup or gift-card amounts twice',()=>{
 const c=setup(),docs=read(c),source=docs[0];assert.equal(source.total,11);assert.equal(source.netTotal,55);assert.equal(source.start,'');assert.equal(source.store,'');assert.throws(()=>c.PMIX_FILES.batches(source),/date/);
 assert.throws(()=>c.PMIX_TOAST_CSV.prepare(docs),/Choose how/);
 for(const d of docs.slice(1)){d.use='check';d.checkWith=source.id;}
 Object.assign(source,{store:'FX',start:'2026-08-19',end:'2026-08-25',complete:true});
 const data=c.PMIX_TOAST_CSV.prepare(docs);assert.equal(data.length,1);assert.equal(source.csvAudit.length,8);assert.equal(source.supportingFiles.length,8);
 const bs=c.PMIX_FILES.batches(source);assert.equal(c.PMIX.report(bs,{stores:['FX']}).total,11);assert.equal(c.PMIX.report(bs,{stores:['FX'],metric:'netSales'}).total,55);
 assert.equal(c.PMIX.report(bs,{stores:['FX'],metric:'netSales',channels:['DI']}).total,22);
 assert.equal(bs[0].supportingFiles.length,8);
});
test('same grand total with wrong item amounts, missing control values and mismatched scope are rejected',()=>{
 const c=setup(),docs=read(c),source=docs[0],items=docs.find(d=>d.csv.role==='items');items.csv.rows[1]['net item amt']='52';assert.throws(()=>c.PMIX_TOAST_CSV.check(source,items),/differs/);
 items.csv.rows[1]['net item amt']='';assert.throws(()=>c.PMIX_TOAST_CSV.check(source,items),/Missing/);
 const total=docs.find(d=>d.csv.role==='total');source.store='FX';total.store='CH';assert.throws(()=>c.PMIX_TOAST_CSV.check(source,total),/different store/);
});
test('standalone Items and Total sales keep supplied net amounts, require scope, and never allocate totals to items',()=>{
 const c=setup(),docs=read(c),item=docs.find(d=>d.csv.role==='items'),total=docs.find(d=>d.csv.role==='total');
 for(const d of [item,total])Object.assign(d,{use:'source',store:'CH',start:'2026-08-19',end:'2026-08-25'});
 const bs=c.PMIX_FILES.batches(item);assert.equal(c.PMIX.report(bs,{stores:['CH']}).total,10);assert.equal(c.PMIX.report(bs,{stores:['CH'],metric:'netSales'}).total,53);assert.ok(!bs[0].rows[0].forms);
 const sales=c.PMIX_FILES.batches(total);assert.equal(c.PMIX.report(sales,{stores:['CH']}).total,null);assert.equal(c.PMIX.report(sales,{stores:['CH'],metric:'netSales'}).total,55);
 const percent=docs.find(d=>d.csv.role==='percent');Object.assign(percent,{use:'source',store:'CH',start:item.start,end:item.end});assert.throws(()=>c.PMIX_FILES.batches(percent),/cannot supply/);
});
test('All levels net control mismatches fail before import',()=>{
 const c=setup(),text=fixture()['All levels.csv'].replace('"22"','"23"');assert.throws(()=>c.PMIX_FILES.parse([{name:'CSV',rows:c.PMIX.csv(text)}],'All levels.csv'),/amounts differ/);
});
