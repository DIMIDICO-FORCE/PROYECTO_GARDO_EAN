'use strict';
const routes = { colombia:'/modulos/internacional/?modulo=colombia#ean-general', internacional:'/modulos/internacional/?modulo=internacional#mercado-internacional', mexico:'/modulos/mexico/#/oportunidades' };
const descriptions={colombia:'Panorama general EAN y análisis de fortalezas: matrícula, captación, graduados y posición frente a la competencia.',internacional:'Comprender cómo funciona la oferta internacional: programas, modalidades, precios, captación, pedagogía y títulos.',mexico:'Oportunidades de expansión: programas virtuales EAN, demanda observada, territorios y público potencial en México.',conclusiones:'Síntesis neutral de resultados, conclusiones, aportes y límites del estudio documental.'};
function currentRoute(frame, fallback) {
  try { const href = frame.contentWindow.location.href; return href.startsWith(location.origin + '/') ? href : fallback; }
  catch { return fallback; }
}
function selectModule(id) {
  const synthesis=id==='conclusiones';
  if(synthesis) id='mexico';
  if (id==='ean') id='colombia';
  if (!Object.hasOwn(routes,id)) id = 'colombia';
  document.querySelectorAll('[data-module]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.module === id)));
  if (!document.getElementById('module-' + id)) {
    const frame = document.createElement('iframe');
    frame.id = 'module-' + id;
    frame.title = {colombia:'Módulo 1: Colombia y posición competitiva EAN',internacional:'Módulo 2: oferta internacional y modelos pedagógicos',mexico:'Módulo 3: oportunidades de expansión EAN hacia México',conclusiones:'Módulo 4: conclusiones y límites del estudio'}[id];
    frame.src = synthesis?'/modulos/mexico/#/sintesis':routes[id];
    document.querySelector('main').append(frame);
  }
  for (const name of Object.keys(routes)) {
    const frame = document.getElementById('module-' + name);
    if (!frame) continue;
    frame.hidden = name !== id;
  }
  const activeFrame = document.getElementById('module-' + id);
  if(synthesis) activeFrame.src='/modulos/mexico/#/sintesis';
  document.getElementById('abrir-modulo').href = currentRoute(activeFrame, routes[id]);
  document.getElementById('module-purpose').textContent=descriptions[id];
  if (location.hash !== '#' + id) history.replaceState(null,'','#' + id);
}
document.querySelector('nav').addEventListener('click', event => { const button = event.target.closest('[data-module]'); if (button) selectModule(button.dataset.module); });
window.addEventListener('hashchange', () => selectModule(location.hash.slice(1)));
document.getElementById('abrir-modulo').addEventListener('click', () => {
  const frame = [...document.querySelectorAll('iframe')].find(frame => !frame.hidden);
  if (frame?.getAttribute('src')) document.getElementById('abrir-modulo').href = currentRoute(frame,frame.src);
});
selectModule(location.hash.slice(1));
