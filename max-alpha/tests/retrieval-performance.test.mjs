import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {documentContext} from '../document-context.js';
test('smaller-set scoring preserves 24 build228 golden outputs across query, file and budget sizes',()=>{
 const fixtures=JSON.parse(fs.readFileSync(new URL('./retrieval-golden.json',import.meta.url),'utf8'));
 for(const {i,sha256} of fixtures){const text=Array.from({length:150},(_,n)=>`Record ${n}: policy${n%17} revenue${n%11} deadline${n%7} 返品期限 三十日.\n`).join('');const query=Array.from({length:i*13+1},(_,n)=>`policy${n} revenue${n} 返品期限`).join(' ');const files=Array.from({length:i%6+1},(_,n)=>({name:'Synthetic '+n,text}));assert.equal(createHash('sha256').update(documentContext(files,query,120+i*230)).digest('hex'),sha256,`fixture ${i}`);}
});
