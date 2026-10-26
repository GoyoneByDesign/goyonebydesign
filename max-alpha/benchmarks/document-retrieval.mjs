import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
if(!process.argv[2])throw new Error('Usage: node benchmarks/document-retrieval.mjs /absolute/path/to/build228-document-context.mjs');
const {documentContext:before}=await import(pathToFileURL(process.argv[2]).href);
import {documentContext as after} from '../document-context.js';
const cases=[['English short',('Menu policy refund deadline revenue operations breakfast lunch dinner.\n').repeat(1800),'refund deadline'],['Japanese long',('返品期限は三十日です。営業方針と品質基準を確認してください。\n').repeat(4000),('返品期限 営業方針 品質基準 確認してください ').repeat(100)],['Long diverse query',Array.from({length:8000},(_,i)=>`policy${i} revenue${i} deadline${i}\n`).join(''),Array.from({length:1000},(_,i)=>`policy${i} revenue${i}`).join(' ')]];
const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];
for(const [name,text,query] of cases){const files=Array.from({length:6},(_,i)=>({name:'Synthetic'+i,text:text.slice(0,120000)}));const results={name};for(const [label,fn]of [['before',before],['after',after]]){let start=performance.now();const out=fn(files,query,6000);results[label+'ColdMs']=performance.now()-start;const times=[];for(let i=0;i<35;i++){start=performance.now();fn(files,query,6000);times.push(performance.now()-start);}results[label+'WarmMedianMs']=median(times);results[label+'Output']=out;}results.identical=results.beforeOutput===results.afterOutput;delete results.beforeOutput;delete results.afterOutput;results.warmSpeedup=results.beforeWarmMedianMs/results.afterWarmMedianMs;console.log(JSON.stringify(results));}
