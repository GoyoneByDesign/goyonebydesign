import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const apps=JSON.parse(fs.readFileSync(new URL('../apps/catalog.json',import.meta.url)));
const code=fs.readFileSync(new URL('../apps/apps.js',import.meta.url),'utf8');
function harness(hash=''){
  const element=(dataset={})=>({dataset,hidden:false,value:'',textContent:'',handlers:{},attributes:{},addEventListener(type,fn){this.handlers[type]=fn;},setAttribute(k,v){this.attributes[k]=v;}});
  const cards=apps.map(a=>({...element({search:[a.name,a.category,...(a.aliases||[])].join(' '),development:String(a.development),downloadable:String(Object.keys(a.downloads).length>0)}),id:a.id}));
  const search=element(),results=element(),empty=element();
  const filters=['all','downloads','development'].map(filter=>element({filter}));
  const icons=apps.map(()=>element());
  const previews=apps.filter(a=>a.screen).map(a=>element({image:`assets/${a.screen}`,caption:a.caption}));
  const img=element(),caption=element();
  const dialog={...element(),open:false,querySelector:s=>s==='img'?img:caption,showModal(){this.open=true;},close(){this.open=false;},getBoundingClientRect:()=>({left:10,right:100,top:10,bottom:100})};
  const singles={'#search':search,'#results':results,'#empty':empty,'#preview':dialog};
  const lists={'.app-card':cards,'[data-filter]':filters,'.icon-wall a':icons,'[data-image]':previews};
  const location={hash};
  vm.runInNewContext(code,{location,document:{querySelector:s=>singles[s],querySelectorAll:s=>lists[s]}});
  return {cards,search,results,empty,filters,icons,previews,dialog,img,location,visible:()=>cards.filter(c=>!c.hidden),clickFilter:name=>filters.find(f=>f.dataset.filter===name).handlers.click()};
}
test('filters use actual download and development fields',()=>{
  const h=harness();h.clickFilter('downloads');assert.equal(h.visible().length,3);h.clickFilter('development');assert.equal(h.visible().length,6);h.clickFilter('all');assert.equal(h.visible().length,9);
});
test('old SavvyKin search finds JustMyPick; empty results recover',()=>{
  const h=harness();h.search.value=' SAVVYKIN ';h.search.handlers.input();assert.deepEqual(h.visible().map(x=>x.id),['justmypick']);assert.equal(h.results.textContent,'1 application');h.search.value='does-not-exist';h.search.handlers.input();assert.equal(h.visible().length,0);assert.equal(h.empty.hidden,false);h.search.value='';h.search.handlers.input();assert.equal(h.visible().length,9);
});
test('icon navigation resets stale search and filters',()=>{
  const h=harness();h.clickFilter('downloads');h.search.value='not found';h.search.handlers.input();h.icons[0].handlers.click();assert.equal(h.search.value,'');assert.equal(h.visible().length,9);assert.equal(h.filters[0].attributes['aria-pressed'],'true');
});
test('legacy app anchors retain their destination',()=>{
  assert.equal(harness('#savvykin').location.hash,'justmypick');assert.equal(harness('#max-g').location.hash,'max-alpha');assert.equal(harness('#boardroom').location.hash,'#boardroom');
});
test('preview can reopen and backdrop dismiss without changing source',()=>{
  const h=harness();h.previews[0].handlers.click();assert.equal(h.dialog.open,true);assert.equal(h.img.src,h.previews[0].dataset.image);h.dialog.handlers.click({target:h.dialog,clientX:0,clientY:0});assert.equal(h.dialog.open,false);h.previews[1].handlers.click();assert.equal(h.dialog.open,true);assert.equal(h.img.alt,h.previews[1].dataset.caption);
});
