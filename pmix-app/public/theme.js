// Dashboard navigation only; report calculations and export formatting are independent.
(function(){
  'use strict';
  const nav=document.getElementById('dashboardNav'),toggle=document.getElementById('menuToggle');
  const links=[...document.querySelectorAll('[data-section]')];
  function closeMenu(){nav.classList.remove('nav-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');}
  function selectSection(id){for(const link of links){if(link.dataset.section===id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}
  toggle.addEventListener('click',()=>{const open=!nav.classList.contains('nav-open');nav.classList.toggle('nav-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
  for(const link of links)link.addEventListener('click',()=>{const id=link.dataset.section,target=document.getElementById(id);if(target?.tagName==='DETAILS')target.open=true;selectSection(id);closeMenu();if(matchMedia('(max-width:800px)').matches&&target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('nav-open')){closeMenu();toggle.focus();}});
  document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!toggle.contains(e.target))closeMenu();});
  const current=location.hash.slice(1);selectSection(links.some(l=>l.dataset.section===current)?current:'sourceSection');
  window.addEventListener('hashchange',()=>selectSection(location.hash.slice(1)));
})();
