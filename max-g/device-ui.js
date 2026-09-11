import {DEVICE_MODES,normalizeDeviceMode,deviceHints,devicePolicy,inspectDevice} from './device.js';
const el=(tag,text='',className='')=>{const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;};
const LABELS={ready:'Ready',available:'Available with this browser',setup:'Setup or check needed',blocked:'Access blocked',unavailable:'Unavailable here',offline:'Reported offline',unknown:'Not confirmed'};
export function renderDeviceSettings({getSettings,getRuntime,onSave,onOpen,signal}={}){
  const root=el('section','','device-panel');root.append(el('h3','MAX-G on this device'),el('p','MAX-G uses the processor, graphics, connection, storage and permissions of the device you are using. This check does not start recording, request GPS or download models.','muted'));
  const settings=getSettings(),label=el('label','','field'),select=el('select');select.setAttribute('aria-label','Device memory mode');
  for(const [value,title]of Object.entries(DEVICE_MODES)){const option=el('option',title);option.value=value;select.append(option);}select.value=normalizeDeviceMode(settings.deviceMode);label.append(el('span','Device memory mode'),select);
  const policyText=el('p',devicePolicy(select.value).detail,'device-note');select.onchange=()=>policyText.textContent=devicePolicy(select.value).detail;
  const save=el('button','Save device settings','button button-primary'),saveStatus=el('p','','device-save-status');save.type='button';saveStatus.setAttribute('role','status');
  save.onclick=async()=>{if(signal?.aborted||save.disabled)return;save.disabled=true;const value=select.value;try{if(await onSave(value)!==false&&!signal?.aborted)saveStatus.textContent='Device settings saved on this device.';}catch(error){if(!signal?.aborted)saveStatus.textContent=error.message;}finally{save.disabled=false;}};
  const refresh=el('button','Refresh device check','button');refresh.type='button';const status=el('p','','device-check-status');status.setAttribute('role','status');const facts=el('p','','device-facts'),list=el('div','','device-capabilities');
  root.append(label,policyText,save,saveStatus,refresh,status,facts,list,el('p','The same MAX-G interface is available from your web address. Profiles, conversations, saved places and permissions are stored separately on each device; there is no automatic account sync. Browser and OS capabilities can differ.','device-note'));
  let controller=null,revision=0;
  signal?.addEventListener('abort',()=>{revision++;controller?.abort();},{once:true});
  async function check(){
    if(signal?.aborted)return;controller?.abort();controller=new AbortController();const id=++revision;status.textContent='Checking this device…';refresh.disabled=true;
    try{
      const report=await inspectDevice({settings:getSettings(),runtime:getRuntime(),signal:controller.signal});
      if(signal?.aborted||id!==revision)return;
      const hints=report.hints;facts.textContent=`Browser reports: ${hints.cores===null?'processor count unavailable':hints.cores+' logical processors'} · ${hints.memoryGB===null?'memory estimate unavailable':'about '+hints.memoryGB+' GB memory'}. These are limited browser hints, not a speed benchmark.`+(hints.saveData?' Data Saver is enabled; load models when your connection allows.':'');
      list.replaceChildren();for(const item of report.rows){const card=el('article','','device-capability');card.dataset.capability=item.id;card.dataset.state=item.state;const heading=el('div','','device-capability-heading');heading.append(el('h4',item.label),el('span',LABELS[item.state],'device-badge'));card.append(heading,el('p',item.detail));if(item.action){const open=el('button',item.action==='connectors'?'Open Connections':'Open '+({general:'General',voice:'Voice Studio',locations:'Location & maps',permissions:'Permissions',connection:'Connection',memory:'Memory & data'}[item.action]),'text-button');open.type='button';open.onclick=()=>{if(!signal?.aborted)onOpen(item.action);};card.append(open);}list.append(card);}
      status.textContent='Device check complete. Features marked available may still need permission, setup or a test.';
    }catch(error){if(error.name!=='AbortError'&&!signal?.aborted&&id===revision)status.textContent=error.message;}
    finally{if(id===revision)refresh.disabled=false;}
  }
  refresh.onclick=check;void check();return root;
}
