/* Extensión del radar existente: no sustituye sus filtros, gráficos ni catálogo. */
(async function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const number = value => value === null || value === undefined ? 'N/D' : value.toLocaleString('es-CO');
  const download = (name, content, type) => { const url=URL.createObjectURL(new Blob([content],{type})); const a=document.createElement('a'); a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); };
  const csv = records => records.map(record=>record.map(value=>{let s=String(value??'N/D');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(';')).join('\r\n');
  function showView(){
    const modulo=new URLSearchParams(location.search).get('modulo');
    const allowed=modulo==='colombia'?['general','colombia','soporte','sintesis-colombia']:modulo==='internacional'?['modelos','internacional','pedagogia','soporte','sintesis-internacional']:null;
    let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{hash='ean-posicion';}
    let target=document.getElementById(hash||'ean-posicion');
    let view=target?.closest('[data-radar-view]')?.dataset.radarView||'colombia';
    if(allowed&&!allowed.includes(view)){view=allowed[0];target=document.getElementById(view==='general'?'ean-general':view==='colombia'?'ean-posicion':view==='modelos'?'mercado-internacional':'resumen');history.replaceState(null,'','#'+target.id);}
    document.querySelectorAll('[data-radar-view]').forEach(el=>el.hidden=el.dataset.radarView!==view);
    document.querySelectorAll('.nav a').forEach(link=>{const section=document.getElementById(link.hash.slice(1));const linkView=section?.closest('[data-radar-view]')?.dataset.radarView;link.hidden=Boolean(allowed&&!allowed.includes(linkView));const active=linkView===view;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    requestAnimationFrame(()=>{target?.scrollIntoView({block:'start'});if(view==='internacional'&&typeof fitTable==='function')fitTable();});
  }
  window.addEventListener('hashchange',showView);showView();
  try {
    const [catalog, coverage, pedagogy, series, history] = await Promise.all(['catalogo-ean','cobertura-programas','pedagogia','competencia-colombia','historico-colombia'].map(async name=>{const response=await fetch('/api/'+name);if(!response.ok)throw Error(name);return response.json();}));
    let comparison = [],marketResult=null;
    const territorio=ColombiaMercado.create();
    const internationalModule=new URLSearchParams(location.search).get('modulo')==='internacional';
    const scopedCatalog=internationalModule?catalog.filter(p=>p.ofertas.some(o=>o.modalidad==='Virtual')):catalog;
    $('ean-programa').insertAdjacentHTML('beforeend',scopedCatalog.map(p=>`<option value="${escape(p.id)}">${escape(p.nombre)}</option>`).join(''));
    if($('ean-internacional-programa')){
      $('ean-internacional-programa').insertAdjacentHTML('beforeend',catalog.filter(p=>p.ofertas.some(o=>o.modalidad==='Virtual')).map(p=>`<option value="${escape(p.id)}">${escape(p.nombre)}</option>`).join(''));
      $('ean-internacional-programa').addEventListener('change',event=>{$('ean-programa').value=event.target.value;$('ean-programa').dispatchEvent(new Event('change'));});
    }
    const modes=[...new Set(catalog.flatMap(p=>p.ofertas.map(o=>o.modalidad)))];
    $('ean-modalidad').insertAdjacentHTML('beforeend',modes.map(m=>`<option>${escape(m)}</option>`).join(''));
    const selected = () => scopedCatalog.filter(p=>$('ean-programa').value==='__TODOS__'||p.id===$('ean-programa').value);
    const concepts = () => coverage.filter(c=>selected().some(p=>p.id===c.programa_id)).flatMap(c=>[c.nombre,...c.conceptos_busqueda]).map(normalize);
    const matches = (text, terms) => terms.some(term=>normalize(text).includes(term));
    let activeTerms=concepts();
    window.eanPermiteFila = row => $('ean-alcance')?.value==='antecedente' || (row.c==='Pregrado' && matches(row.p,activeTerms));
    function refreshRadar() {
      if(typeof render==='function')render();
      if(typeof updateSummary==='function')updateSummary();
      if(typeof rows!=='undefined') {
        const subset=rows.filter(window.eanPermiteFila);
        $('countPrograms').textContent=number(subset.length);
        $('countUniversities').textContent=number(new Set(subset.map(r=>r.u)).size);
        $('countPostgrad').textContent=number(subset.filter(r=>r.c!=='Pregrado').length);
      }
    }
    function paintNational() {
      const programs=selected(),mode=$('ean-modalidad').value,semester=$('ean-semestre').value;
      const offers=programs.flatMap(p=>p.ofertas.filter(o=>mode==='Todas'||o.modalidad===mode).map(o=>({...o,programa:p.nombre})));
      const terms=concepts();
      activeTerms=terms;
      const metric=$('ean-indicador').value,period='2025-'+semester;
      marketResult=EanCompetition.market(series,programs,{modalidad:mode,comparacion:$('ean-pares').value,sector:$('ean-sector').value,indicador:metric,periodo:period,conceptos:terms});
      comparison=marketResult.rows.sort((a,b)=>b.valor-a.valor);
      const codes=new Set(offers.map(o=>o.snies).filter(Boolean));
      const total=marketResult.total,own=marketResult.own?.valor??null;
      const metrics=['matricula','primer_curso','inscritos'].map(metric=>{
        const stats=programs.map(p=>EanDomain.stats(p,mode,semester,metric));
        const present=stats.filter(s=>s.valor!==null);
        return {value:present.length?present.reduce((s,r)=>s+r.valor,0):null,count:stats.reduce((s,r)=>s+r.ofertas_con_dato,0)};
      });
      const pct=n=>n===null?'Sin base comparable':n.toLocaleString('es-CO',{maximumFractionDigits:1})+' %';
      const label=metric==='primer_curso'?'Primer curso EAN':'Matriculados EAN';
      $('ean-kpis').innerHTML=`<div class="ean-stat is-ean"><span>Posición en oferta afín</span><strong>${marketResult.own?'#'+marketResult.own.posicion:'Sin observación'}</strong><small>entre ${marketResult.ranking.length} IES por código SNIES · carreras relacionadas</small></div><div class="ean-stat"><span>${label} · ${period}</span><strong>${own===null?"Sin registro EAN":number(own)}</strong><small>${metric==='primer_curso'?'Nuevos ingresos reportados':'Estudiantes de todas las cohortes'}</small></div><div class="ean-stat"><span>Participación en la selección</span><strong>${pct(marketResult.participacion)}</strong><small>${number(total)} ${metric==='primer_curso'?'de primer curso':'matriculados'} en el universo</small></div><div class="ean-stat"><span>Variación semestral EAN</span><strong>${marketResult.variacion===null?(marketResult.periodo_previo?'Sin base comparable':'Sin corte previo'):(marketResult.variacion>0?'+':'')+pct(marketResult.variacion)}</strong><small>${marketResult.periodo_previo?'frente a '+marketResult.periodo_previo:'Primer corte disponible'} · no variación anual</small></div>`;
      $('ean-perimetro').textContent=`${programs.length===1?programs[0].nombre:'Portafolio relacionado con los '+programs.length+' pregrados EAN'} · ${mode==='Todas'?'Todas las modalidades EAN':mode} · sector ${$('ean-sector').value||'privado y oficial'} · ${$('ean-pares').value==='nombre'?'denominaciones y conceptos afines':'mismos campos CINE'} · Colombia. Ranking de oferta relacionada, no posición institucional general; cada competidor aporta solo sus programas que cumplen el cruce seleccionado.`;
      $('ean-cobertura-metricas').innerHTML='<p class="sub">Cobertura de códigos EAN en '+period+': '+metrics.map((m,i)=>`${['matrícula','primer curso','inscritos'][i]} ${number(m.value)} (${m.count}/${offers.length} ofertas con dato)`).join(' · ')+'. Los programas sin dato no se completan con cero.</p>';
      EanCompetitionCharts.render(marketResult,{periodo:period,indicador:metric,indexed:$('ean-escala').value==='indice'});
      territorio.update({programs,modalidad:mode,sector:$('ean-sector').value,periodo:period,comparacion:$('ean-pares').value,conceptos:terms});
      const historical=EanCompetition.historical(history,{modalidad:mode,sector:$('ean-sector').value,indicador:metric,semestre:semester});
      const historyScale=$('ean-historico-escala').value;
      EanCompetitionCharts.renderTrend(historical,{indicador:metric,target:'historico',semestre:semester,scale:historyScale});
      $('ean-historico-scope').textContent=`Todo el pregrado universitario histórico · semestre ${semester} de cada año · ${mode} · sector ${$('ean-sector').value||'privado y oficial'} · ${metric==='primer_curso'?'Primer curso':'Matrícula'} · ${historyScale==='indice'?'2021 = 100':historyScale==='anual'?'Cambio frente al mismo semestre del año anterior; 2021 sin base previa':'Volumen por semestre'}. Los líderes se eligen por volumen de 2025. El programa y CINE seleccionados arriba no se aplican al histórico.`;
      $('ean-historico-insights').innerHTML=`<div class="ean-history-summary"><div><span class="eyebrow">Mercado · 2025-${semester}</span><p><b>${number(historical.total)}</b> ${metric==='primer_curso'?'nuevos ingresos':'matriculados'} en ${historical.ranking.length} nombres institucionales.</p></div><div><span class="eyebrow">Concentración</span><p>Los cinco líderes reúnen <b>${pct(historical.concentracion)}</b> del volumen.</p></div><div><span class="eyebrow">EAN frente a 2024</span><p>${historical.own?`<b>${pct(historical.variacion)}</b> interanual · posición institucional <b>#${historical.own.posicion}</b> · ${number(historical.own.valor)} estudiantes.`:'Sin observación EAN en este sector o modalidad.'}</p></div><small>Las variaciones de la leyenda comparan los volúmenes 2025 y 2021. El universo histórico difiere del ranking por portafolio actual.</small></div>`;
      $('ean-exportar-historico').onclick=()=>download('historico-institucional-2021-2025.csv','\ufeff'+csv([['Institución','Sector','Modalidad','Año','Semestre','Indicador','Valor','Procedencia'],...history.filas.filter(r=>r.indicador===metric&&String(r.semestre)===semester&&(mode==='Todas'||r.modalidad===mode)&&(!$('ean-sector').value||r.sector===$('ean-sector').value)).map(r=>[r.institucion,r.sector,r.modalidad,r.ano,r.semestre,r.indicador,r.valor,history.archivo])]),'text/csv;charset=utf-8');
      const leader=marketResult.ranking[0];
      $('ean-lectura').innerHTML=leader?`<div><span class="eyebrow">Lectura de la selección</span><p><b>${escape(leader.nombre)}</b> lidera con <b>${number(leader.valor)}</b> ${metric==='primer_curso'?'estudiantes de primer curso':'matriculados'}. ${marketResult.own?`La EAN ocupa la posición <b>${marketResult.own.posicion}</b> y representa <b>${pct(marketResult.participacion)}</b> del universo.`:'La EAN no tiene observaciones en el indicador y sector seleccionados.'}</p></div><p class="sub">${series.unidad}. El ranking compara volumen observado; no mide calidad académica, facturación ni utilidad.</p>`:'<p>No hay observaciones comparables con estos filtros. La ausencia de registros no demuestra ausencia de demanda.</p>';
      $('ean-ficha').innerHTML=programs.length===1?`<h3>${escape(programs[0].nombre)}</h3><div class="ean-offers">${offers.map(o=>`<article class="ean-offer"><strong>${escape(o.modalidad)}</strong><p>SNIES ${escape(o.snies||'no identificado en ficha')} · ${o.duracion_semestres??'N/D'} semestres · ${o.creditos??'N/D'} créditos</p><p>${o.tarifa_cop===null?'Tarifa no documentada':'COP '+number(o.tarifa_cop)} · año ${o.tarifa_ano??'no identificado'}</p><small>${escape(o.cobertura_snies)}. ${escape((o.discrepancias||[]).map(d=>d.detalle).join(' '))}</small><p><a href="${escape(o.fuente)}" target="_blank" rel="noopener">Ficha institucional ↗</a></p></article>`).join('')||'<p>Este pregrado no tiene oferta publicada en la modalidad seleccionada.</p>'}</div>`:`<p class="ean-note">${programs.length} denominaciones y ${offers.length} ofertas por modalidad. La matrícula corresponde a los códigos del portafolio publicado con observaciones en 2025; excluye códigos históricos fuera del catálogo actual. Oferta publicada no garantiza apertura de admisiones. No se imputa cero a programas sin observaciones.</p>`;
      $('ean-detalle-metrica').textContent=metric==='primer_curso'?'Primer curso':'Matriculados';
      $('ean-universo').textContent=`${comparison.length} registros de ${period}, sector ${$('ean-sector').value||'privado y oficial'}. Se muestran hasta 150 filas; el CSV incluye todas. Las coincidencias por nombre o campo no establecen equivalencia curricular.`;
      $('ean-pares-rows').innerHTML=comparison.slice(0,150).map(r=>`<tr class="${r.institucion_codigo==='2812'&&codes.has(r.snies)?'ean-own':''}"><td><strong>${escape(r.institucion)}</strong><small>${escape(r.programa)} · SNIES ${escape(r.snies)}</small></td><td>${escape(r.modalidad)}</td><td>${escape(r.campo)} · ${escape(r.cine)}</td><td>${number(r.valor)}</td></tr>`).join('')||'<tr><td colspan="4">Sin observaciones comparables para esta selección. N/D.</td></tr>';
      refreshRadar();
    }
    function pedagogyRows() {return pedagogy.instituciones.filter(p=>(!$('ean-pedagogia-ambito').value||p.pais===$('ean-pedagogia-ambito').value)&&normalize(p.nombre).includes(normalize($('ean-pedagogia-buscar').value)));}
    function paintPedagogy() {
      $('ean-pedagogia-rows').innerHTML=pedagogyRows().map(p=>`<tr class="${p.id==='ean'?'ean-own':''}"><td><strong>${escape(p.nombre)}</strong><small>${escape(p.pais)} · ${escape(p.tipo)}</small></td>${pedagogy.dimensiones.map(key=>`<td>${escape(p[key]||'No documentado en esta revisión')}</td>`).join('')}<td>${p.fuentes.map(f=>`<a href="${escape(f.url)}" target="_blank" rel="noopener">Fuente institucional ↗</a><small>${escape(f.seccion)}</small>`).join('')}<small>Consulta: ${escape(pedagogy.consulta)}</small></td></tr>`).join('');
    }
    const evidence=[
      ['Introducción y contextualización','Sistema de inteligencia de mercado para priorizar oportunidades de expansión de los pregrados virtuales EAN hacia México. El producto organiza el diagnóstico nacional, los referentes internacionales y el estudio del mercado mexicano en tres módulos conectados.'],
      ['Formulación del problema, objetivos y alcance','Pregunta: ¿qué pregrados virtuales EAN presentan mejores condiciones para una posible expansión hacia México, considerando demanda observada, competencia, afinidad académica y características del público potencial? Objetivo: integrar y analizar evidencia trazable para apoyar la priorización de programas, territorios y segmentos. El diagnóstico colombiano contextualiza la posición EAN; México se limita a sus 12 pregrados virtuales documentados, incluido uno anunciado para 2027. La priorización no acredita apertura, homologación ni intención de matrícula medida.'],
      ['Marco teórico y antecedentes','Antecedentes: dos aplicativos CUN conservados, SNIES y fuentes institucionales. La matriz pedagógica reúne declaraciones documentadas. La revisión académica PRISMA, la literatura indexada y las referencias APA del artículo requieren trabajo posterior del proyecto.'],
      ['Metodología','Identificación de fuentes; normalización de códigos SNIES y modalidades; agregación por corte semestral; cruces de denominación separados de afinidad temática; revisión documental y pruebas de contratos. No se suman semestres como personas únicas, no se imputan ceros a datos ausentes y no se multiplican proporciones marginales para inventar compradores.'],
      ['Resultados',`${catalog.length} denominaciones EAN, ${catalog.reduce((s,p)=>s+p.ofertas.length,0)} ofertas por modalidad y ${pedagogy.instituciones.length} instituciones en la matriz pedagógica. El observatorio conserva territorio, finanzas, vivienda, perfiles, ANUIES, precios, fuentes y análisis legal; incorpora fichas por pregrado y una síntesis de oportunidades de investigación con reglas explícitas.`],
      ['Análisis y discusión','La comparación nacional depende del campo CINE, modalidad, periodo y denominación. La base mexicana es un subconjunto del antecedente, no un censo nacional completo. Matrícula no equivale a intención de compra; coincidencia de nombre no equivale a homologación curricular. Las recomendaciones deben contrastarse con expertos.'],
      ['Conclusiones y aportes','Aporte implementado: tres módulos conectan mercado colombiano, modelos internacionales y oportunidades de investigación en México, preservando los dos aplicativos antecedentes. Pendiente de validación académica: utilidad con usuarios, revisión curricular de candidatos y conclusiones por objetivo; no se presentan como resultados ya obtenidos.'],
      ['Modelo de producción y proyección nacional e internacional','Producto local de consulta en solo lectura, con datos derivados y copias de trabajo separadas de los originales. Siguiente validación: responsables de portafolio, costos reales de operación, actualización de fuentes, condiciones de admisión de extranjeros y reconocimiento de títulos. La ruta de proyección se seleccionará con el equipo y los requisitos de la guía; no se presume patentabilidad ni viabilidad financiera.'],
      ['Uso del producto','Recorrido de consulta: diagnosticar la posición EAN, comprender los modelos internacionales y seleccionar un pregrado para contrastar referentes, demanda observada, público propuesto y condiciones económicas de México. La ficha exportada conserva la evidencia y sus límites.']
    ];
    $('ean-expediente').innerHTML=evidence.map(([title,body])=>`<details class="ean-expediente"><summary>${escape(title)}</summary><p>${escape(body)}</p></details>`).join('');
    $('ean-exportar-expediente').onclick=()=>download('expediente-producto-ean.json',JSON.stringify({consulta:pedagogy.consulta,estructura:evidence.map(([titulo,evidencia])=>({titulo,evidencia})),portafolio:catalog,matriz_pedagogica:pedagogy},null,2),'application/json');
    $('ean-exportar-nacional').onclick=()=>download('comparacion-ean-snies-2025-'+$('ean-semestre').value+'.csv','\ufeff'+csv([['Institución','Código institución','Programa','SNIES','Modalidad','CINE','Periodo',$('ean-indicador').value],...comparison.map(r=>[r.institucion,r.institucion_codigo,r.programa,r.snies,r.modalidad,r.cine,r.ano+'-'+r.semestre,r.valor])]),'text/csv;charset=utf-8');
    $('ean-exportar-ranking').onclick=()=>download('ranking-ean-colombia.csv','\ufeff'+csv([['Posición','Código IES','Institución','Sector','Indicador','Periodo','Valor','2025-1','2025-2'],...marketResult.ranking.map(r=>[r.posicion,r.id,r.nombre,r.sector,$('ean-indicador').value,'2025-'+$('ean-semestre').value,r.valor,r.valores['2025-1']??null,r.valores['2025-2']??null])]),'text/csv;charset=utf-8');
    $('ean-exportar-pedagogia').onclick=()=>download('matriz-pedagogica-ean.csv','\ufeff'+csv([['Institución','País',...pedagogy.dimensiones,'Fuentes','Fecha'],...pedagogyRows().map(p=>[p.nombre,p.pais,...pedagogy.dimensiones.map(key=>p[key]||'No documentado en esta revisión'),p.fuentes.map(f=>f.url).join(' | '),pedagogy.consulta])]),'text/csv;charset=utf-8');
    ['ean-programa','ean-modalidad','ean-semestre','ean-pares','ean-sector','ean-indicador','ean-escala','ean-historico-escala'].forEach(id=>$(id).addEventListener('change',paintNational));
    $('ean-alcance').addEventListener('change',refreshRadar);
    ['ean-pedagogia-ambito','ean-pedagogia-buscar'].forEach(id=>$(id).addEventListener('input',paintPedagogy));
    $('ean-status').textContent='Fuentes cargadas · oferta consultada 03 nov 2026 · SNIES 2025 · comparación por programa, modalidad y semestre';
    $('ean-status').classList.add('is-ready');
    paintNational();paintPedagogy();showView();
  } catch(error) {
    $('ean-status').textContent='No fue posible cargar la extensión EAN. Recarga el módulo o revisa el servidor y las fuentes.';
    console.error('Carga EAN:',error);
  }
})();
