const legacyAnchors={'#max-g':'max-alpha','#savvykin':'justmypick'};
if(legacyAnchors[location.hash])location.hash=legacyAnchors[location.hash];
const cards=[...document.querySelectorAll('.app-card')];
const search=document.querySelector('#search');
let filter='all';
function update(){let count=0;for(const card of cards){const match=card.dataset.search.toLowerCase().includes(search.value.trim().toLowerCase());const ready=card.dataset.downloadable==='true';const developing=card.dataset.development==='true';card.hidden=!(match&&(filter==='all'||(filter==='downloads'&&ready)||(filter==='development'&&developing)));if(!card.hidden)count++;}document.querySelector('#results').textContent=`${count} application${count===1?'':'s'}`;document.querySelector('#empty').hidden=count!==0;}
search.addEventListener('input',update);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();}));
document.querySelectorAll('.icon-wall a').forEach(a=>a.addEventListener('click',()=>{filter='all';search.value='';document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));update();}));
const dialog=document.querySelector('#preview');
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{dialog.querySelector('img').src=button.dataset.image;dialog.querySelector('img').alt=button.dataset.caption;dialog.querySelector('p').textContent=button.dataset.caption;dialog.showModal();}));
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});

// Public download navigation, 2026-11-11. Keep installation warnings in the path.
// This allowlist deliberately excludes private workspace and source destinations.
const publicAppActions={
  statusping:{href:'/apps/install.html#statusping',label:'StatusPing Android test download & instructions'},
  view4real:{href:'/apps/install.html#view4real',label:'View4Real Windows test download & instructions'},
  justmypick:{href:'/apps/install.html#justmypick',label:'JustMyPick Android test download & instructions'},
  'max-alpha':{href:'/max-alpha/',label:'Open MAX-ALPHA browser app'}
};
function addPublicAppActions(){
  for(const card of cards){
    const action=publicAppActions[card.id];
    const body=card.querySelector('.card-body');
    if(!action||!body||body.querySelector('[data-public-app-action]'))continue;
    const paragraph=document.createElement('p');
    paragraph.dataset.publicAppAction='true';
    const link=document.createElement('a');
    link.href=action.href;
    link.textContent=action.label;
    paragraph.append(link);
    body.prepend(paragraph);
  }
  const results=document.querySelector('#results');
  if(results&&!document.querySelector('[data-download-navigation-history]')){
    const paragraph=document.createElement('p');
    paragraph.className='result-count';
    paragraph.dataset.downloadNavigationHistory='true';
    const link=document.createElement('a');
    link.href='/apps/download-history.html';
    link.textContent='Download navigation update history';
    paragraph.append(link);
    results.after(paragraph);
  }
}
addPublicAppActions();
