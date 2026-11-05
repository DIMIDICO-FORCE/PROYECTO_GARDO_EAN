(function(){
 'use strict';
 const key='ean-tema';
 function saved(){try{return localStorage.getItem(key)||localStorage.getItem('mx2027-tema')||'dark';}catch{return 'dark';}}
 function apply(value,broadcast=true){
  const theme=value==='light'?'light':'dark';document.documentElement.dataset.theme=theme;
  try{localStorage.setItem(key,theme);localStorage.setItem('mx2027-tema',theme);}catch{}
  document.querySelectorAll('[data-theme-toggle]').forEach(b=>{const label='Cambiar a tema '+(theme==='dark'?'claro':'oscuro');const shape=theme==='dark'?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>':'<path d="M20.9 13.1A9 9 0 0 1 10.9 3.1 9 9 0 1 0 20.9 13.1Z"/>';b.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shape+'</svg><span>'+label+'</span>';b.setAttribute('aria-label',label);});
  if(broadcast){document.querySelectorAll('iframe').forEach(f=>f.contentWindow?.postMessage({type:'ean-theme',theme},location.origin));if(parent!==window)parent.postMessage({type:'ean-theme',theme},location.origin);}
 }
 apply(saved(),false);
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='ean-theme')apply(e.data.theme,false);});
 window.addEventListener('storage',e=>{if(e.key===key)apply(e.newValue,false);});
 function start(){
  if(!document.querySelector('[data-theme-toggle]')){const sidebar=document.querySelector('.sidebar');if(sidebar){const b=document.createElement('button');b.type='button';b.dataset.themeToggle='';b.className='theme-toggle';sidebar.insertBefore(b,sidebar.querySelector('.sidebar-foot'));}}
  document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.addEventListener('click',()=>apply(document.documentElement.dataset.theme==='dark'?'light':'dark')));
  apply(saved(),false);
  new MutationObserver(()=>document.querySelectorAll('iframe:not([data-theme-bound])').forEach(f=>{f.dataset.themeBound='true';f.addEventListener('load',()=>f.contentWindow?.postMessage({type:'ean-theme',theme:saved()},location.origin));})).observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
