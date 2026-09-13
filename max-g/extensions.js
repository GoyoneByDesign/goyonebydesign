/** Curated tools for the installed Mac. All outputs are data, never executable UI. */
export const EXTENSION_OPERATIONS = Object.freeze(['status','configure','math','document','memory/list','memory/save','memory/search','memory/delete','memory/clear','code','github']);
export function extensionCommand(value) {
  const text=String(value).trim();
  let match=text.match(/^(?:\/math\s+|calculate:\s*)(.{1,500})$/is);
  if(match)return {operation:'math',body:{expression:match[1].trim(),operation:'calculate',variable:'x'}};
  match=text.match(/^(solve|simplify|differentiate|integrate)\s+(.{1,500})$/is);
  if(match&&/^[a-z\d\s+*/^=().,\-]+$/i.test(match[2])&&/[\d+*/^=()\-]/.test(match[2]))return {operation:'math',body:{operation:match[1].toLowerCase(),expression:match[2].trim(),variable:'x'}};
  match=text.match(/^(?:remember:|\/remember\s)([\s\S]{1,3000})$/i);
  if(match)return {operation:'memory/save',body:{title:match[1].trim().slice(0,100),text:match[1].trim(),source:'Michael · direct chat request'}};
  match=text.match(/^(?:search memory:|\/recall\s)([\s\S]{1,500})$/i);
  if(match)return {operation:'memory/search',body:{query:match[1].trim(),limit:3}};
  return null;
}
export function knowledgeContext(result) {
  if(!Array.isArray(result?.results))return '';
  return result.results.slice(0,3).map(item=>`${String(item.title||'Saved note').slice(0,100)}: ${String(item.text||'').slice(0,600)}`).join('\n').slice(0,1400);
}
export function extensionReply(command,result) {
  if(command.operation==='memory/save')return 'Saved in your Mac’s searchable knowledge. Manage or delete it in Settings → Extensions.';
  if(command.operation==='memory/search')return knowledgeContext(result)||'No matching saved knowledge was found.';
  return String(result.text||'The extension finished without a text result.');
}
export async function documentPayload(file,{signal}={}) {
  if(signal?.aborted)throw new DOMException('Stopped.','AbortError');
  if(!file||typeof file.name!=='string'||/[\\/\x00-\x1f]/.test(file.name)||file.name.length>160||!Number.isSafeInteger(file.size)||file.size<1||file.size>8*1024*1024)throw Error('Choose a file from 1 byte to 8 MB with a plain filename.');
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(signal?.aborted)throw new DOMException('Stopped.','AbortError');
  if(bytes.length!==file.size)throw Error('The file changed while it was being read. Choose it again.');
  let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
  return {name:file.name,data_b64:btoa(binary)};
}
const el=(tag,text='',className='')=>{const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;};
function field(label,{value='',type='text',options}={}) {
  const wrap=el('label','','ext-field'),name=el('span',label);
  const input=el(options?'select':type==='textarea'?'textarea':'input');
  if(options)for(const [v,t]of options){const option=el('option',t);option.value=v;input.append(option);}
  else if(type!=='textarea')input.type=type;
  if(type!=='file')input.value=options&&!value?options[0][0]:value;
  if(type==='textarea')input.rows=5;
  wrap.append(name,input);return {wrap,input};
}

export function renderExtensions({enabled,request,signal,permission,onAttach=()=>{},onResult=()=>{}}) {
  const root=el('div','','extensions-panel');root.append(el('h3','Your MAX-G extensions'),el('p','Free tools selected for your creative and app-building work. Local tools load only when used.','muted'));
  if(!enabled){root.append(el('p','Open the installed MAX-G app on your Mac to use these local extensions. This website keeps its existing browser, file and account features.'));return root;}
  const status=el('p','Checking installed tools…','muted');status.setAttribute('role','status');root.append(status);
  const cards=el('div','','ext-cards');root.append(cards);
  const output=el('pre','','ext-output');output.setAttribute('aria-live','polite');
  let busy=false;
  const verify=()=>{if(signal?.aborted)throw new DOMException('Stopped.','AbortError');};
  async function call(operation,body={}){verify();const result=await request(operation,body,{signal});verify();return result;}
  const run=async action=>{if(busy||signal?.aborted)return;busy=true;root.setAttribute('aria-busy','true');try{await action();}catch(error){if(!signal?.aborted)status.textContent=error.message;}finally{busy=false;root.removeAttribute('aria-busy');}};
  const button=(label,action)=>{const button=el('button',label,'button');button.type='button';button.onclick=()=>run(action);return button;};
  function section(title,description){const area=el('section','','ext-section');area.append(el('h4',title),el('p',description,'muted'));root.append(area);return area;}
  async function refresh(){const data=await call('status');cards.replaceChildren();for(const item of data.extensions){const row=el('div','','ext-card'),toggle=field(item.name,{type:'checkbox'});toggle.input.checked=item.enabled;toggle.input.disabled=!item.available;toggle.input.onchange=()=>{const checked=toggle.input.checked;if(busy){toggle.input.checked=!checked;return;}run(async()=>{try{await call('configure',{id:item.id,enabled:checked});await refresh();status.textContent=`${item.name} ${checked?'enabled':'disabled'}. Saved.`;}catch(error){toggle.input.checked=!checked;throw error;}});};row.append(toggle.wrap,el('p',item.description),el('small',`${item.local?'On this Mac':'Internet'} · ${item.detail}`));cards.append(row);}status.textContent=`${data.extensions.filter(x=>x.available&&x.enabled).length} extensions enabled · ${data.memory.count} saved knowledge items.`;}
  const math=section('Exact math','Try x^2 - 4 = 0 with Solve. Use * for multiplication. Variables default to x.');
  const operation=field('Operation',{options:[['calculate','Calculate'],['simplify','Simplify'],['solve','Solve'],['differentiate','Differentiate'],['integrate','Integrate']]}),expression=field('Expression',{value:'x^2 - 4 = 0'});operation.input.value='solve';
  math.append(operation.wrap,expression.wrap,button('Calculate',async()=>{const result=await call('math',{operation:operation.input.value,expression:expression.input.value,variable:'x'});output.textContent=result.text;status.textContent='Calculated locally with SymPy.';}));
  const documents=section('Read a document or image','Choose a PDF, Word, Excel, PowerPoint, text file, or image up to 8 MB. Only the selected file is read. Extraction limits and OCR mistakes may affect the result.');
  const file=field('Choose file',{type:'file'});file.input.accept='.pdf,.docx,.xlsx,.pptx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp,.tif,.tiff,.bmp';
  const language=field('Image OCR language',{options:[['eng','English'],['fil','Tagalog / Filipino'],['spa','Spanish'],['chi_sim','Chinese · simplified'],['jpn','Japanese'],['ita','Italian'],['rus','Russian'],['kor','Korean']]});
  let extracted=null;
  documents.append(file.wrap,language.wrap,button('Read selected file',async()=>{await permission('files',{picked:true});verify();const payload=await documentPayload(file.input.files[0],{signal});status.textContent='Reading on this Mac…';extracted=await call('document',{...payload,language:language.input.value});output.textContent=extracted.text;status.textContent=[`Read ${extracted.name}.`,extracted.truncated?'Some content was shortened.':'',...(extracted.warnings||[])].filter(Boolean).join(' ');}),button('Attach extracted text to chat',async()=>{if(!extracted?.text)throw Error('Read a file first.');onAttach({name:extracted.name+'.txt',text:extracted.text});status.textContent='Attached. Close Settings and type your question.';}),button('Save extracted text to knowledge',async()=>{if(!extracted?.text)throw Error('Read a file first.');await permission('files',{picked:true});await call('memory/save',{title:extracted.name,text:extracted.text.slice(0,100000),source:'Selected local document'});await refresh();await listMemory();status.textContent='Document text saved locally.';}));
  const memory=section('Searchable knowledge','Save only what you want MAX-G to retain. Relevant excerpts can be used in local replies when Memory & data → Use relevant notes is enabled. Turning this extension off preserves its saved items.');
  const title=field('Note title'),note=field('Note text',{type:'textarea'}),query=field('Search your knowledge');
  const memoryItems=el('div','','ext-memory');
  async function listMemory(){const data=await call('memory/list');memoryItems.replaceChildren();for(const item of data.items){const row=el('div','','ext-memory-row');row.append(el('span',item.title),button('Delete',async()=>{if(!confirm(`Delete “${item.title}” from MAX-G’s local knowledge?`))return;await call('memory/delete',{id:item.id});await listMemory();await refresh();}));memoryItems.append(row);}if(!data.items.length)memoryItems.append(el('p','No saved knowledge yet.'));}
  memory.append(title.wrap,note.wrap,button('Save note',async()=>{await permission('files');await call('memory/save',{title:title.input.value,text:note.input.value,source:'Owner note'});note.input.value='';await listMemory();await refresh();}),query.wrap,button('Search knowledge',async()=>{const result=await call('memory/search',{query:query.input.value,limit:5});output.textContent=result.results.map(x=>`${x.title}\n${x.text}`).join('\n\n')||'No matches.';}),button('Show saved items',listMemory),memoryItems,button('Clear saved knowledge',async()=>{if(!confirm('Erase all items saved by the searchable knowledge extension? Original files and your other chat history are kept.'))return;await call('memory/clear');await listMemory();await refresh();}));
  const code=section('Check code','Checks Python or JSON syntax. Your code is never executed. A syntax check does not establish that a program is correct.');
  const filename=field('Filename',{value:'app.py'}),source=field('Source code',{type:'textarea'});
  code.append(filename.wrap,source.wrap,button('Check syntax',async()=>{const result=await call('code',{name:filename.input.value,text:source.input.value});output.textContent=result.text;status.textContent=result.ok?'Syntax check passed.':'Review the reported syntax issues.';}));
  const github=section('Research a public GitHub repository','Fetch public project details and its README. This shares only the repository name with GitHub. Private repositories and account changes require a separate authorized account connection.');
  const repo=field('Repository · owner/name',{value:'microsoft/playwright'});
  github.append(repo.wrap,button('Read public repository',async()=>{await permission('internet');const result=await call('github',{repository:repo.input.value});output.textContent=result.text;onResult(result);status.textContent='Public repository retrieved. README contents are reference material.';}));
  root.append(el('h4','Tool result'),output);
  root.append(el('p','Chat shortcuts: solve x^2 - 4 = 0 · /math 25*12 · remember: my project uses Python · search memory: project','muted'));
  run(refresh);return root;
}
