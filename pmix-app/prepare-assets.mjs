import fs from 'node:fs';import path from 'node:path';import {gzipSync}from 'node:zlib';
const root='public/vendor';fs.mkdirSync(root,{recursive:true});
const copy=(a,b)=>{fs.mkdirSync(path.dirname(b),{recursive:true});fs.cpSync(a,b,{recursive:true});};
copy('node_modules/pdf-lib/dist/pdf-lib.min.js',root+'/pdf-lib.min.js');copy('node_modules/pdf-lib/LICENSE.md',root+'/pdf-lib-LICENSE.md');
for(const f of ['pdf.min.mjs','pdf.worker.min.mjs'])copy('node_modules/pdfjs-dist/legacy/build/'+f,root+'/pdfjs/'+f);for(const f of ['standard_fonts','wasm','LICENSE'])copy('node_modules/pdfjs-dist/'+f,root+'/pdfjs/'+f);
for(const f of ['tesseract.min.js','worker.min.js'])copy('node_modules/tesseract.js/dist/'+f,root+'/ocr/'+f);
for(const f of fs.readdirSync('node_modules/tesseract.js-core').filter(f=>f.includes('.wasm')))copy('node_modules/tesseract.js-core/'+f,root+'/ocr/core/'+f);
const lang=root+'/ocr/lang/eng.traineddata.gz';if(!fs.existsSync(lang)){const r=await fetch('https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/eng.traineddata');if(!r.ok)throw Error('English OCR data download failed');fs.mkdirSync(path.dirname(lang),{recursive:true});fs.writeFileSync(lang,gzipSync(Buffer.from(await r.arrayBuffer())));}
console.log('PDF and OCR assets ready.');
