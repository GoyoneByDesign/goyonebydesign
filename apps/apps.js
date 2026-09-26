const cards=[...document.querySelectorAll('.app-card')];
const search=document.querySelector('#search');
let filter='all';
function update(){let count=0;for(const card of cards){const match=card.dataset.search.toLowerCase().includes(search.value.trim().toLowerCase());const ready=card.dataset.downloadable==='true';const developing=card.querySelector('.status').textContent==='In development';card.hidden=!(match&&(filter==='all'||(filter==='downloads'&&ready)||(filter==='development'&&developing)));if(!card.hidden)count++;}document.querySelector('#results').textContent=`${count} application${count===1?'':'s'}`;document.querySelector('#empty').hidden=count!==0;}
search.addEventListener('input',update);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();}));
document.querySelectorAll('.icon-wall a').forEach(a=>a.addEventListener('click',()=>{filter='all';search.value='';document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));update();}));
const dialog=document.querySelector('#preview');
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{dialog.querySelector('img').src=button.dataset.image;dialog.querySelector('img').alt=button.dataset.caption;dialog.querySelector('p').textContent=button.dataset.caption;dialog.showModal();}));
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
