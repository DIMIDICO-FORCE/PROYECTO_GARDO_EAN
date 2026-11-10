(function(){
 'use strict';
 const international=new URLSearchParams(location.search).get('modulo')==='internacional',moduleName=international?'REFERENTES INTERNACIONALES':'COLOMBIA · POSICIÓN EAN';
 const sidebar=document.querySelector('.sidebar'),main=document.querySelector('.main');
 const brand=document.querySelector('.brand');if(brand)brand.innerHTML=`<img class="ean-institutional-logo" src="/ean-logo.png" alt="Universidad Ean"><span><b>${international?'EAN · REFERENTES INTERNACIONALES':'EAN · COLOMBIA'}</b><small>${international?'Oferta internacional y modelos académicos':'Mercado colombiano y posición EAN'}</small></span>`;
 const caption=document.createElement('p');caption.className='radar-caption';caption.textContent=international?'02 · REFERENTES INTERNACIONALES':'01 · COLOMBIA';sidebar?.querySelector('.nav')?.before(caption);
 const navIcons={
  'ean-general':'<path d="M3 3v18h18M7 14l4-4 4 3 5-7"/>',
  'ean-fortalezas':'<path d="M8 3h8v6a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v5m-4 3h8m-4-3v3"/>',
  'mercado-internacional':'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z"/>',
  'resumen':'<path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4V4Zm9 3a3 3 0 0 1 3-3h5v15h-4a4 4 0 0 0-4 2"/>',
  'ean-pedagogia':'<path d="m2 9 10-5 10 5-10 5L2 9Zm4 2v6a10 10 0 0 0 12 0v-6m4-2v7"/>',
  'fuentes-modulo':'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  'sintesis-colombia':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8m-8 4h6"/>',
  'sintesis-internacional':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8m-8 4h6"/>'
 };
 function bindNavIcons(){sidebar?.querySelectorAll('.nav a').forEach(link=>{
  const paths=navIcons[link.hash.slice(1)];if(!paths||link.querySelector('.radar-nav-icon'))return;
  link.insertAdjacentHTML('afterbegin',`<svg class="radar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`);
 });}
 bindNavIcons();
 const foot=document.querySelector('.sidebar-foot');if(foot)foot.textContent='EAN · Evidencia documentada';
 const mobile=document.createElement('div');mobile.className='radar-mobile';mobile.innerHTML=`<button type="button" aria-expanded="false" aria-controls="radar-sidebar">☰ Menú</button><strong>${moduleName}</strong>`;main?.prepend(mobile);
 const overlay=document.createElement('button');overlay.type='button';overlay.className='radar-overlay';overlay.setAttribute('aria-label','Cerrar navegación');document.body.append(overlay);if(sidebar)sidebar.id='radar-sidebar';
 overlay.tabIndex=-1;
 const menuButton=mobile.querySelector('button'),compact=window.matchMedia('(max-width:940px)');let beforeOverflow='';
 const closeButton=document.createElement('button');closeButton.type='button';closeButton.className='radar-nav-close';closeButton.textContent='Cerrar menú';closeButton.setAttribute('aria-label','Cerrar menú del módulo');sidebar?.prepend(closeButton);
 if(main){main.id='contenido-radar';main.tabIndex=-1;}
 const skip=document.createElement('a');skip.className='radar-skip';skip.href='#contenido-radar';skip.textContent='Saltar al contenido';skip.addEventListener('click',event=>{event.preventDefault();main?.focus();});document.body.prepend(skip);
 function menu(open){
  const wasOpen=sidebar?.classList.contains('abierto');open=Boolean(open&&compact.matches);
  sidebar?.classList.toggle('abierto',open);overlay.classList.toggle('abierto',open);menuButton.setAttribute('aria-expanded',String(open));
  if(sidebar){sidebar.inert=compact.matches&&!open;if(compact.matches&&!open)sidebar.setAttribute('aria-hidden','true');else sidebar.removeAttribute('aria-hidden');}
  if(main)main.inert=open;
  if(open&&!wasOpen){beforeOverflow=document.body.style.overflow;document.body.style.overflow='hidden';closeButton.focus();}
  if(!open&&wasOpen){document.body.style.overflow=beforeOverflow;if(compact.matches)menuButton.focus({preventScroll:true});}
 }
 closeButton.addEventListener('click',()=>menu(false));compact.addEventListener('change',()=>menu(false));menu(false);
 document.addEventListener('keydown',event=>{
  if(event.key!=='Tab'||!compact.matches||!sidebar?.classList.contains('abierto'))return;
  const items=[...sidebar.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length),first=items[0],last=items[items.length-1];
  if(!first)return;
  if(event.shiftKey&&(document.activeElement===first||!sidebar.contains(document.activeElement))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(document.activeElement===last||!sidebar.contains(document.activeElement))){event.preventDefault();first.focus();}
 });
 mobile.querySelector('button').addEventListener('click',()=>menu(!sidebar?.classList.contains('abierto')));overlay.addEventListener('click',()=>menu(false));sidebar?.querySelector('.nav')?.addEventListener('click',()=>menu(false));
 const explanations={
  'Participación en la selección':'Parte del indicador seleccionado que corresponde a la EAN, dividida por el total del mismo portafolio, modalidad y sector.',
  'Variación semestral EAN':'Cambio frente al semestre anterior disponible. Es diferente del crecimiento anual, que compara el mismo semestre entre años.',
  'Primer curso EAN':'Nuevos ingresos al programa en el semestre indicado. Mide captación académica, no ventas en dinero.',
  'Matriculados EAN':'Estudiantes de todas las cohortes en el corte indicado. No se suman los semestres como personas únicas.',
  'Matrícula EAN':'Estudiantes matriculados en el corte indicado. Describe tamaño académico, no ventas ni personas únicas entre semestres.',
  'Nuevos ingresos EAN':'Primer curso: personas que ingresan al programa en ese corte. Sirve para estudiar captación; no mide ingresos en dinero.',
  'Graduados EAN':'Titulaciones reportadas durante ambos semestres del año. No es una tasa de graduación: para eso se necesita seguir una cohorte.',
  'Programas con registros':'Denominaciones históricas con actividad en la base, agrupadas por nivel. Pueden superar las carreras del portafolio publicado hoy.',
  'Volumen del mercado':'Suma del indicador en el universo seleccionado. Revisa año, nivel, modalidad y sector antes de comparar con otro gráfico.',
  'Posición general EAN':'Puesto de la EAN entre nombres institucionales, con toda la oferta del nivel y modalidad elegidos. Cambia al modificar filtros.',
  'Participación EAN':'Porcentaje del volumen seleccionado que corresponde a la EAN. Numerador: EAN; denominador: total del mismo universo.',
  'Cambio anual EAN':'Cambio porcentual frente al mismo corte del año anterior y con los mismos filtros. No compara semestres diferentes.',
  'Cambio anual de EAN y mercado':'Compara la variación de la EAN y del mercado observado frente al mismo corte del año anterior, con el indicador, nivel, modalidad y sector seleccionados.',
  'Posición en oferta afín':'Ranking entre instituciones que reportan carreras relacionadas con el portafolio EAN seleccionado, agrupadas por código SNIES. No es el mismo universo del ranking general.',
  'Graduados: EAN frente a la competencia':'Compara titulaciones del año y nivel elegidos. Un mayor número de graduados no demuestra por sí solo mejor calidad ni mayor rentabilidad.',
  'Dónde se concentra el mercado académico':'El mapa ubica la oferta reportada por el programa. Para virtualidad, la sede registrada no permite deducir dónde viven los estudiantes.',
  'ean-pares':'Por denominación se buscan nombres y afinidades temáticas. Por campo CINE se utiliza la clasificación oficial. Son universos diferentes, no homologaciones aprobadas.',
  'ean-sector':'Permite comparar solo privadas, solo oficiales o ambas. Una posición solo tiene sentido dentro del sector y portafolio indicados.',
  'ean-indicador':'Captación usa primer curso; tamaño usa matrícula total. No son la misma medida ni se interpretan como ventas.',
  'mg-nivel':'El panorama empieza con todos los niveles. Selecciona Universitario para comparar pregrado; los posgrados se estudian por separado.',
  'mg-modalidad':'Virtual, a distancia e híbrida son categorías diferentes en el origen. El filtro conserva esa distinción.',
  'ean-semestre':'Un corte semestral describe una observación. No sumes matrícula de los dos semestres como si fueran personas diferentes.',
  'co-capa':'El volumen territorial es la ubicación de oferta en los registros, no la residencia ni el número de compradores potenciales.'
 };
 const tooltip=document.createElement('div');tooltip.id='tooltip-estudio';tooltip.className='tooltip-estudio';tooltip.role='tooltip';tooltip.hidden=true;document.body.append(tooltip);let active=null,pinned=false;
 function close(){if(active)active.removeAttribute('aria-describedby');active=null;pinned=false;tooltip.hidden=true;}
 function show(button){if(active!==button&&active)active.removeAttribute('aria-describedby');active=button;tooltip.textContent=button.dataset.explanation;tooltip.hidden=false;button.setAttribute('aria-describedby',tooltip.id);const r=button.getBoundingClientRect(),width=tooltip.offsetWidth,height=tooltip.offsetHeight;tooltip.style.left=Math.max(12,Math.min(r.left,innerWidth-width-12))+'px';tooltip.style.top=(r.bottom+height+16<innerHeight?r.bottom+9:Math.max(12,r.top-height-9))+'px';}
 function bind(){bindNavIcons();document.querySelectorAll('.ean-stat>span').forEach(el=>{const label=el.dataset.helpLabel||el.textContent.trim();if(!el.dataset.helpLabel)el.dataset.helpLabel=label;const key=label.replace(/ · \d{4}-\d$/,'');if(explanations[key]&&!el.querySelector('.ayuda-dato'))attach(el,label,explanations[key]);});for(const [id,text] of Object.entries(explanations)){const input=document.getElementById(id),label=input?.closest('label');if(label&&!label.querySelector('.ayuda-dato')){const title=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());const button=make(input.getAttribute('aria-label')||title?.textContent||id,text);if(title){if(!input.hasAttribute('aria-label'))input.setAttribute('aria-label',title.textContent.trim());const heading=document.createElement('span');heading.className='filter-help-label';heading.textContent=title.textContent.trim();title.replaceWith(heading);heading.append(button);}else input.before(button);}}}
 function make(label,text){const b=document.createElement('button');b.type='button';b.className='ayuda-dato';b.textContent='i';b.setAttribute('aria-label','Ayuda: '+label.trim());b.dataset.explanation=text;return b;}
 function attach(el,label,text){el.append(make(label,text));}
 document.addEventListener('pointerover',e=>{const b=e.target.closest('.ayuda-dato');if(b&&!pinned)show(b);});document.addEventListener('pointerout',e=>{if(e.target.closest('.ayuda-dato')&&!pinned)close();});document.addEventListener('focusin',e=>{const b=e.target.closest('.ayuda-dato');if(b)show(b);});document.addEventListener('focusout',()=>{if(!pinned)close();});document.addEventListener('click',e=>{const b=e.target.closest('.ayuda-dato');if(b){e.preventDefault();if(active===b&&pinned)close();else{show(b);pinned=true;}}else close();});document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();menu(false);}});window.addEventListener('scroll',close,true);window.addEventListener('resize',close);
 new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});bind();
})();

(function(){for(const [id,label] of Object.entries({eur:'Pesos colombianos por euro',mxn:'Pesos colombianos por peso mexicano',usd:'Pesos colombianos por dólar estadounidense',gbp:'Pesos colombianos por libra esterlina',search:'Buscar institución o programa internacional'})){document.getElementById(id)?.setAttribute('aria-label',label);}})();
