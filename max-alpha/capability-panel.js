import {CAPABILITIES,SMOKE_CHECKS,reportSmokeCheck,runSyntheticCheck} from './capability-status.js';
import {RELEASE_VERSION,RELEASE_BUILD} from './release-version.js';
const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
document.getElementById('version').textContent=`Browser ${RELEASE_VERSION} · Build ${RELEASE_BUILD}`;
for(const item of CAPABILITIES){const card=el('article'),heading=el('h3',item.name),state=el('p',item.state);state.className='state';card.append(heading,state,el('p',item.detail));document.getElementById('capabilities').append(card);}
const resets=[];
for(const check of SMOKE_CHECKS){
 const card=el('article'),label=el('label','Prompt to select and send manually'),prompt=el('textarea');prompt.id=`prompt-${check.id}`;prompt.readOnly=true;prompt.rows=4;prompt.value=check.prompt;label.htmlFor=prompt.id;
 const resultLabel=el('label','Your reported result'),select=el('select');select.id=`result-${check.id}`;resultLabel.htmlFor=select.id;
 for(const [value,text] of [['not-run','Not run'],['passed','I checked: passed'],['failed','I checked: failed']]){const option=el('option',text);option.value=value;select.append(option);}
 const status=el('p','Not run');status.setAttribute('role','status');select.addEventListener('change',()=>{const report=reportSmokeCheck(check.id,select.value);status.textContent=`${report.evidence}${report.outcome==='not-run'?'':': '+report.outcome}`;});
 resets.push(()=>{select.value='not-run';status.textContent='Not run';});card.append(el('h3',check.title),label,prompt,el('p','Expected: '+check.expected),resultLabel,select,status);document.getElementById('smoke-checks').append(card);
}
document.getElementById('synthetic').addEventListener('click',()=>{const target=document.getElementById('synthetic-result');try{const result=runSyntheticCheck();target.textContent=`Automated module check ${result.passed?'passed':'failed'} (${result.checks} assertions). ${result.scope}.`;}catch{target.textContent='Automated module check failed. No AI request was made.';}});
document.getElementById('reset').addEventListener('click',()=>{resets.forEach(reset=>reset());document.getElementById('synthetic-result').textContent='Not run in this page.';document.getElementById('reset-result').textContent='Reported results and synthetic check display reset. App data and settings were not changed.';});
