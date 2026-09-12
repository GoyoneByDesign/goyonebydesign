import {gunzipSync} from 'node:zlib';
import fs from 'node:fs';
if(!fs.existsSync('public/vendor/pdfjs/pdf.min.mjs'))await import('./prepare-assets.mjs');
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist/server',{recursive:true});fs.cpSync('public','dist/client',{recursive:true});fs.cpSync('src/worker.mjs','dist/server/index.js');fs.cpSync('src/create-api.mjs','dist/server/create-api.mjs');fs.cpSync('src/build-info.mjs','dist/server/build-info.mjs');fs.mkdirSync('dist/.openai',{recursive:true});fs.cpSync('.openai/hosting.json','dist/.openai/hosting.json');fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
fs.mkdirSync('dist/client/vendor/max',{recursive:true});for(const name of ['transformers.web.min.js','ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm'])fs.cpSync('node_modules/@huggingface/transformers/dist/'+name,'dist/client/vendor/max/'+name);fs.cpSync('node_modules/@huggingface/transformers/LICENSE','dist/client/vendor/max/LICENSE');
console.log('Built PMIX client, private Worker, MAX on-device runtime, and memory migrations.');

fs.mkdirSync('dist/client/vendor/math',{recursive:true});fs.cpSync('node_modules/mathjs/lib/browser/math.js','dist/client/vendor/math/math.js');fs.cpSync('node_modules/mathjs/LICENSE','dist/client/vendor/math/LICENSE');

const createRoot='dist/client/vendor/create';fs.mkdirSync(createRoot,{recursive:true});
for(const [from,to]of [['node_modules/docx/dist/index.iife.js','docx.js'],['node_modules/gifenc/dist/gifenc.esm.js','gifenc.js'],['node_modules/nerdamer/all.min.js','nerdamer.js'],['node_modules/@pdf-lib/fontkit/dist/fontkit.umd.min.js','fontkit.js']])fs.cpSync(from,createRoot+'/'+to);
fs.cpSync('node_modules/katex/dist',createRoot+'/katex',{recursive:true});
for(const [from,to]of [['node_modules/docx/LICENSE','docx-LICENSE'],['node_modules/gifenc/LICENSE.md','gifenc-LICENSE'],['node_modules/nerdamer/license.txt','nerdamer-LICENSE'],['node_modules/@pdf-lib/fontkit/README.md','fontkit-README'],['node_modules/katex/LICENSE','katex-LICENSE']])if(fs.existsSync(from))fs.cpSync(from,createRoot+'/'+to);

fs.writeFileSync(createRoot+'/DejaVuSans.ttf',gunzipSync(fs.readFileSync('public/fonts/DejaVuSans.ttf.gz')));

fs.writeFileSync('dist/server/formats-api.mjs',fs.readFileSync('src/formats-api.mjs','utf8').replace('../public/report-formats-core.js','./report-formats-core.js'));fs.cpSync('public/report-formats-core.js','dist/server/report-formats-core.js');

const sheetsRoot='dist/client/vendor/sheets';fs.mkdirSync(sheetsRoot,{recursive:true});for(const [from,to]of [['node_modules/jspreadsheet-ce/dist/index.js','jspreadsheet.js'],['node_modules/jspreadsheet-ce/dist/jspreadsheet.css','jspreadsheet.css'],['node_modules/jspreadsheet-ce/LICENSE','jspreadsheet-LICENSE'],['node_modules/jsuites/dist/jsuites.js','jsuites.js'],['node_modules/jsuites/dist/jsuites.css','jsuites.css'],['node_modules/jsuites/LICENSE','jsuites-LICENSE']])fs.cpSync(from,sheetsRoot+'/'+to);

for(const f of ['history-api.mjs','drive-api.mjs'])fs.cpSync('src/'+f,'dist/server/'+f);
