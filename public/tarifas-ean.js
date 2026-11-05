(async function(){
 if(new URLSearchParams(location.search).get('modulo')==='internacional')return;
 const parent=document.getElementById('ean-general');if(!parent)return;
 const section=document.createElement('section');section.className='card section';section.setAttribute('aria-label','Tarifas públicas del portafolio EAN');parent.append(section);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cop=n=>Number(n).toLocaleString('es-CO')+' COP';
 try{const response=await fetch('/api/tarifas-ean-publicas');if(!response.ok)throw Error('Tarifas no disponibles');const d=await response.json();
 section.innerHTML='<h2>Portafolio EAN y precios publicados</h2><p>Tarifas consultadas en las fichas oficiales el '+esc(d.consulta)+'. La tabla cubre 22 pregrados y 32 ofertas por modalidad, incluidos 12 virtuales. Los precios conservan el año de tarifa de la ficha y no se actualizan al año de inicio de clases por inferencia.</p><label>Modalidad de las tarifas <select id="tarifas-modalidad"><option>Todas</option><option>Virtual</option><option>Presencial</option></select></label><div class="ean-table-wrap"><table><thead><tr><th>Programa</th><th>Modalidad</th><th>Tarifa publicada</th><th>Carga de referencia</th><th>Fuente</th></tr></thead><tbody id="tarifas-filas"></tbody></table></div><p>La carga publicada explica el precio semestral de referencia; el valor cambia con los créditos matriculados. Los descuentos dependen de condiciones. No se calcula rentabilidad a partir de la matrícula académica.</p>';
 const select=section.querySelector('select'),body=section.querySelector('tbody');
 function paint(){body.innerHTML=d.registros.filter(r=>select.value==='Todas'||r.modalidad===select.value).map(r=>'<tr><th scope="row">'+esc(r.programa)+'</th><td>'+esc(r.modalidad)+'</td><td><b>'+cop(r.importe_cop)+'</b><br>Tarifa '+(r.ano_tarifa||'sin año expreso')+'</td><td>'+(r.creditos_referencia?r.creditos_referencia+' créditos':'No expresada')+'</td><td><a href="'+esc(r.fuente)+'" target="_blank" rel="noopener">Ficha oficial EAN ↗</a><br>Consulta '+esc(r.consulta)+'</td></tr>').join('');}select.addEventListener('change',paint);paint();
 }catch{section.textContent='No fue posible cargar las tarifas públicas EAN. Consulta las fichas enlazadas en Fuentes Colombia.';}
})();
