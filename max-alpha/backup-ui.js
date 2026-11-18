import {BACKUP_LIMIT,backupSnapshot,parsePersonalBackup,previewPersonalRestore} from './backup.js';
/** Local file selection and review only. All rendered backup text uses textContent. */
export function showBackupRestore({getState,readBaseline,authorizeRead=async()=>{},apply,document=globalThis.document}){
 const el=(tag,text='')=>{const node=document.createElement(tag);node.textContent=text;return node;};
 const dialog=el('dialog'),title=el('h2','Restore personal data'),intro=el('p','Choose your private MAX-ALPHA JSON backup. This adds personal records without replacing existing ones. Conflicts and full storage stop the entire restore. No file is uploaded.');
 const warning=el('p','Device settings, permissions, credentials, provider connections, display choices and model downloads are not imported. New notes, saved workflows, personal memories and lessons are paused; schedules are restored disabled. Existing settings and records stay unchanged. Profile and budget fields are filled only where their current values are defaults.');
 const file=el('input');file.type='file';file.accept='.json,application/json';file.setAttribute('aria-label','Personal backup JSON file');
 const label=el('label'),consent=el('input');consent.type='checkbox';label.append(consent,el('span',' Enable chat saving here if needed to keep restored conversations.'));
 const review=el('button','Preview backup'),confirm=el('button','Confirm restore'),close=el('button','Cancel'),status=el('p'),list=el('ul');status.setAttribute('role','status');
 for(const button of [review,confirm,close])button.type='button';confirm.disabled=true;
 let epoch=0,preview=null,busy=false;
 const invalidate=()=>{epoch++;preview=null;confirm.disabled=true;list.replaceChildren();status.textContent='Preview the selected backup before restoring.';};
 file.onchange=invalidate;consent.onchange=invalidate;
 const remove=()=>{if(busy)return;epoch++;dialog.close();dialog.remove();};close.onclick=remove;
 dialog.addEventListener('cancel',event=>{event.preventDefault();remove();});
 review.onclick=async()=>{
  if(busy)return;invalidate();const attempt=epoch,selected=file.files?.[0];
  if(!selected){status.textContent='Choose a backup JSON file.';return;}
  if(selected.size>BACKUP_LIMIT){status.textContent='Choose a backup no larger than 12 MB.';return;}
  review.disabled=true;status.textContent='Reading local backup…';
  try{
   await authorizeRead();if(attempt!==epoch)return;
   const text=await selected.text();if(attempt!==epoch)return;
   const data=parsePersonalBackup(text),candidate=previewPersonalRestore(getState(),data,{saveChats:consent.checked});
   const baseline=await readBaseline();if(attempt!==epoch)return;if(backupSnapshot(getState())!==candidate.before)throw Error('Your data changed during preview. Preview again.');preview={...candidate,baseline};
   for(const change of preview.changes)list.append(el('li',change));
   status.textContent=preview.needsChatSaving?'Restored conversations need chat saving. Check the choice above and preview again.':preview.changes.length?'Review these additions, then confirm. Nothing has been imported yet.':'This backup adds no new records. Nothing changed.';
   confirm.disabled=preview.needsChatSaving||!preview.changes.length;
  }catch(error){if(attempt===epoch){preview=null;status.textContent=error.message;}}
  finally{review.disabled=false;}
 };
 confirm.onclick=async()=>{
  if(busy||!preview||confirm.disabled)return;busy=true;confirm.disabled=true;review.disabled=true;file.disabled=true;consent.disabled=true;close.disabled=true;
  status.textContent='Saving personal data locally…';
  try{await apply(preview);status.textContent='Personal data restored and saved on this device. Imported notes, workflows, memories and lessons remain paused; imported schedules are disabled. Review them before enabling. No accounts were connected.';preview=null;list.replaceChildren();close.textContent='Done';}
  catch(error){status.textContent=error.message;preview=null;}
  finally{busy=false;review.disabled=false;file.disabled=false;consent.disabled=false;close.disabled=false;}
 };
 dialog.append(title,intro,warning,file,label,review,list,status,confirm,close);document.body.append(dialog);dialog.showModal();return dialog;
}
