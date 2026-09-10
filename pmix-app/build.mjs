import fs from 'node:fs';
if(!fs.existsSync('public/vendor/pdfjs/pdf.min.mjs'))await import('./prepare-assets.mjs');
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist/server',{recursive:true});fs.cpSync('public','dist/client',{recursive:true});fs.cpSync('src/worker.mjs','dist/server/index.js');fs.cpSync('src/build-info.mjs','dist/server/build-info.mjs');fs.mkdirSync('dist/.openai',{recursive:true});fs.cpSync('.openai/hosting.json','dist/.openai/hosting.json');fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
fs.mkdirSync('dist/client/vendor/max',{recursive:true});for(const name of ['transformers.web.min.js','ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm'])fs.cpSync('node_modules/@huggingface/transformers/dist/'+name,'dist/client/vendor/max/'+name);fs.cpSync('node_modules/@huggingface/transformers/LICENSE','dist/client/vendor/max/LICENSE');
console.log('Built PMIX client, private Worker, MAX on-device runtime, and memory migrations.');

fs.mkdirSync('dist/client/vendor/math',{recursive:true});fs.cpSync('node_modules/mathjs/lib/browser/math.js','dist/client/vendor/math/math.js');fs.cpSync('node_modules/mathjs/LICENSE','dist/client/vendor/math/LICENSE');
