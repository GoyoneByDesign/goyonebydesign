import test from 'node:test';
import assert from 'node:assert/strict';
import {renderFinance} from '../finance.js';
class Element {
 constructor(tag){this.tag=tag;this.textContent='';this.children=[];this.style={};this.attrs={};}
 append(...items){this.children.push(...items);}
 replaceChildren(...items){this.children=items;}
 setAttribute(name,value){this.attrs[name]=value;}
}
function fixture({mutateBeforeReject=false}={}){
 const old=globalThis.document;globalThis.document={createElement:tag=>new Element(tag)};
 const panel=new Element('div'),messages=[];let fail=false,calls=0;
 let data={month:'2026-10',income:100000,essentials:0,savings:0,enjoyment:0,bills:[{id:'original',name:'Power',category:'Electricity',due:'2026-10-30',amount:10000,notes:'retain me'}]};
 renderFinance(panel,{getData:()=>data,onSave:async next=>{calls++;if(mutateBeforeReject)data=next;if(fail)throw Error('storage full');data=next;},onExport(){},toast:text=>messages.push(text)});
 const nodes=(node=panel)=>[node,...node.children.flatMap(child=>nodes(child))];
 return {get data(){return data;},get calls(){return calls;},messages,set fail(value){fail=value;},button:label=>nodes().find(node=>node.tag==='button'&&node.textContent===label),input:label=>nodes().find(node=>node.attrs['aria-label']===label),restore(){globalThis.document=old;}};
}
test('failed renamed bill edit retries the same identity without duplicating amounts',async()=>{
 const f=fixture();try{
 await f.button('Edit Power').onclick();f.input('Provider or bill name').value='New Power';f.input('Current bill (USD)').value='125.00';
 f.fail=true;await f.button('Save bill changes').onclick();assert.equal(f.data.bills.length,1);assert.equal(f.data.bills[0].name,'Power');assert.equal(f.input('Provider or bill name').value,'New Power');assert.equal(f.messages.at(-1),'storage full');
 f.fail=false;await f.button('Save bill changes').onclick();assert.equal(f.data.bills.length,1);assert.equal(f.data.bills[0].id,'original');assert.equal(f.data.bills[0].name,'New Power');assert.equal(f.data.bills[0].amount,12500);assert.equal(f.data.bills[0].notes,'retain me');assert.ok(f.button('Add bill'));assert.equal(f.calls,2);
 }finally{f.restore();}
});

for(const renamed of [false,true])test(`in-tab failed persistence retains edited bill identity on retry (${renamed?'renamed':'same name'})`,async()=>{
 const f=fixture({mutateBeforeReject:true});try{
 await f.button('Edit Power').onclick();f.input('Provider or bill name').value=renamed?'New Power':'Power';f.input('Current bill (USD)').value='125.00';
 f.fail=true;await f.button('Save bill changes').onclick();assert.equal(f.data.bills.length,1);assert.equal(f.data.bills[0].id,'original');assert.equal(f.data.bills[0].amount,12500);assert.equal(f.messages.at(-1),'storage full');
 f.input('Current bill (USD)').value='130.00';f.fail=false;await f.button('Save bill changes').onclick();assert.equal(f.data.bills.length,1);assert.equal(f.data.bills[0].id,'original');assert.equal(f.data.bills[0].amount,13000);assert.equal(f.data.bills[0].name,renamed?'New Power':'Power');assert.equal(f.data.bills[0].notes,'retain me');assert.ok(f.button('Add bill'));assert.equal(f.calls,2);
 }finally{f.restore();}
});
