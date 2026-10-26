import {documentContext} from './document-context.js';
export const CAPABILITIES=Object.freeze([
 {name:'Cloud conversation',state:'Configured in source',detail:'An existing Cloudflare/Qwen adapter is included. This page does not inspect your selected provider, access token, quota, or connection. A real reply is a separate check.'},
 {name:'Selected-file excerpts',state:'Automated module tests passed',detail:'Bounded lexical retrieval preserves file labels and line ranges. This does not prove model grounding or full-document review. Attachments remain in the existing local-AI path.'},
 {name:'Cloud file analysis',state:'Unavailable in this release',detail:'No new private-file upload or cloud document service is enabled.'},
 {name:'Coding workspace',state:'Requires installed Mac edition',detail:'Existing local coding proposals require that edition and its local model. Proposals are not proof that code ran, built, or passed tests.'},
 {name:'Email, cloud files and browser tools',state:'Requires separately paired helper',detail:'Existing connectors use the local Mac helper and explicit scoped permissions. This browser page has not verified a connection and does not grant access.'},
 {name:'Tasks while this window is closed',state:'Unavailable as a durable cloud service',detail:'Existing study scheduling requires a visible tab and ready local model. This update does not add a cloud task runner.'},
 {name:'Voice and on-device AI',state:'Device-dependent; not checked here',detail:'Existing device/setup checks are separate. No model download, microphone access or device action runs here.'}
].map(Object.freeze));
export const SMOKE_CHECKS=Object.freeze([
 {id:'reply',title:'Basic response',prompt:'Reply with READY.',expected:'READY. This establishes only a basic response.'},
 {id:'instruction',title:'Instruction following',prompt:'Return exactly these three words in this order, separated by commas, with no other text: clear, concise, factual',expected:'clear, concise, factual'},
 {id:'arithmetic',title:'Simple arithmetic',prompt:'What is 17 times 23? Reply with the number only.',expected:'391. One correct answer is not a general reasoning benchmark.'},
 {id:'grounding',title:'Synthetic supplied-text grounding',prompt:'Use only this fictional policy: Store A opens at 09:00. Store B opens at 10:30. Closing times are not provided. What time does Store B close? If not provided, say Not provided.',expected:'Not provided. This uses harmless text in chat, not file uploads.'}
].map(Object.freeze));
export function reportSmokeCheck(id,outcome){
 if(!SMOKE_CHECKS.some(x=>x.id===id))throw new Error('Unknown check.');
 if(!['passed','failed','not-run'].includes(outcome))throw new Error('Choose a valid result.');
 return Object.freeze({id,outcome,evidence:outcome==='not-run'?'Not run':'User-reported; not independently verified'});
}
/** Pure synthetic check: no inference, account, storage, network, or private files. */
export function runSyntheticCheck(){
 const file={name:'Synthetic policy',text:'The fictional deadline is 10 days.'};
 const first=documentContext([file],'deadline');
 file.text='The fictional deadline is 30 days.';
 const second=documentContext([file],'deadline');
 const checks=[first.includes('10 days'),second.includes('30 days'),!second.includes('10 days'),second.includes('Synthetic policy')];
 return {passed:checks.every(Boolean),checks:checks.length,scope:'Synthetic excerpt refresh only; no AI request or private file access'};
}
