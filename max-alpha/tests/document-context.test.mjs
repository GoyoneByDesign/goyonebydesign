import test from 'node:test';
import assert from 'node:assert/strict';
import {documentContext} from '../document-context.js';

test('changed text on the same file object invalidates excerpts',()=>{
 const file={name:'Policy',text:'Refund deadline is 10 days.'};
 assert.match(documentContext([file],'refund'),/10 days/);
 file.text='Refund deadline is 30 days.';
 const result=documentContext([file],'refund');
 assert.match(result,/30 days/);assert.doesNotMatch(result,/10 days/);
});
test('Chinese phrase inside an unspaced sentence is retrieved over unrelated opening',()=>{
 const file={name:'政策',text:'普通说明内容。'.repeat(100)+'\n本店退款期限为三十天。'};
 assert.match(documentContext([file],'退款期限',250),/退款期限为三十天/);
});
test('Japanese phrase inside an unspaced sentence is retrieved',()=>{
 const file={name:'規約',text:'一般的な説明です。'.repeat(100)+'\n返品期限は三十日です。'};
 assert.match(documentContext([file],'返品期限',250),/返品期限は三十日/);
});
test('compatibility-normalized terms match full-width source',()=>{
 const file={name:'Manual',text:'Opening summary. '.repeat(60)+'\nＡＬＣＯＨＯＬ total is 6260.'};
 assert.match(documentContext([file],'alcohol',250),/ＡＬＣＯＨＯＬ/);
});
test('long lines retain their source line numbers and relevant match',()=>{
 const file={name:'Spec',text:'Header\n'+'unrelated '.repeat(130)+'important deadline November 3'};
 const result=documentContext([file],'deadline',250);
 assert.match(result,/Lines 2–2/);assert.match(result,/deadline November 3/);
});
test('invalid input and low budgets return safely',()=>{
 for(const files of [null,undefined,{},'bad'])assert.equal(documentContext(files,'q'),'');
 for(const cap of [NaN,Infinity,-2,119])assert.equal(documentContext([{text:'hello'}],'hello',cap),'');
});
test('deterministic bounded output retains file labels and excerpt warning',()=>{
 const files=Array.from({length:6},(_,i)=>({name:`File ${i}`,text:'Revenue forecast '+String(i)+' '+ 'detail '.repeat(400)}));
 const a=documentContext(files,'revenue',1700);assert.equal(a,documentContext(files,'revenue',1700));assert.ok(a.length<=1700);
 assert.match(a,/Selected excerpts only/);for(let i=0;i<6;i++)assert.match(a,new RegExp(`File ${i}`));
});
test('no matching query preserves deterministic opening excerpts, not fabricated evidence',()=>{
 const file={name:'Instructions\ninjected',text:'Opening data\nLater data'};
 const result=documentContext([file],'unmatched',300);assert.match(result,/Opening data/);assert.doesNotMatch(result,/File: Instructions\ninjected/);
});
test('only first six files are eligible and no file is mutated',()=>{
 const files=Array.from({length:7},(_,i)=>Object.freeze({name:`File ${i}`,text:`Value ${i}`}));
 assert.doesNotMatch(documentContext(files,'value',4000),/File 6/);
});
