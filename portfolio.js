const dialog=document.querySelector('#story');
const openButton=document.querySelector('#open-story');
openButton.addEventListener('click',()=>{dialog.showModal();document.body.style.overflow='hidden';});
document.querySelector('#close-story').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';openButton.focus();});

const appFilters=document.querySelectorAll('[data-app-filter]');const appCards=document.querySelectorAll('.app-project');appFilters.forEach(button=>button.addEventListener('click',()=>{const selected=button.dataset.appFilter;appFilters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));let count=0;appCards.forEach(card=>{const show=selected==='all'||card.dataset.category===selected;card.hidden=!show;if(show)count++;});document.querySelector('#app-count').textContent=selected==='all'?'Showing all '+count+' projects':'Showing '+count+' '+(count===1?'project':'projects');}));

const form=document.querySelector('#contactForm');
if(form){form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const button=form.querySelector('[type="submit"]'),note=document.querySelector('#formNote');if(button.disabled)return;if(form.elements.namedItem('_gotcha').value)return;button.disabled=true;note.textContent='Sending your message…';note.className='formNote';try{const response=await fetch(form.action,{method:'POST',headers:{Accept:'application/json'},body:new FormData(form)});if(!response.ok)throw new Error('Message not sent');form.reset();note.textContent='Message sent. Thank you for getting in touch.';note.className='formNote is-good';}catch{note.textContent='Your message could not be sent. Please try again or email admin@goyonebydesign.com.';note.className='formNote is-bad';}finally{button.disabled=false;}});}
