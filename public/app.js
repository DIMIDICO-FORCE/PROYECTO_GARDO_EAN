'use strict';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = value => value == null ? 'N/D' : new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value);
const decimal = value => value == null ? 'N/D' : new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(value);
const norm = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const link = (url, label) => /^https?:\/\//.test(url || '') ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>` : esc(label);
const metric = (name, value, note) => `<div class="metric"><label>${esc(name)}</label><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`;
let data, view = 'colombia', selected = 'ingenieria-de-sistemas', state = '', expanded = false;
let exportRows = [], exportName = '';

async function load() {
  try {
    const names = ['catalogo-ean','cobertura-programas','nacional-2025','mexico-academico','mexico-contexto','auditoria','resumen'];
    const values = await Promise.all(names.map(async name => { const r = await fetch('/api/' + name); if (!r.ok) throw Error('No se pudo cargar ' + name); return r.json(); }));
    data = Object.fromEntries(names.map((name, i) => [name, values[i]]));
    if (!data['catalogo-ean'].some(p => p.id === selected)) selected = data['catalogo-ean'][0].id;
    $('estado').hidden = true; $('app').hidden = false;
    updateModes(); renderPrograms(); render();
  } catch (error) { $('estado').textContent = error.message + '. Reinicia el servidor o ejecuta npm run data.'; }
}

function program() { return data['catalogo-ean'].find(p => p.id === selected); }
function updateModes() {
  const old = $('modalidad').value;
  $('modalidad').innerHTML = ['Todas', ...program().ofertas.map(o => o.modalidad)].map(m => `<option>${esc(m)}</option>`).join('');
  if ([...$('modalidad').options].some(o => o.value === old)) $('modalidad').value = old;
}
function renderPrograms() {
  const query = norm($('buscar').value.trim());
  const list = data['catalogo-ean'].filter(p => norm(p.nombre).includes(query));
  $('cantidad').textContent = `${list.length}/${data.resumen.programas}`;
  $('programas').innerHTML = list.length ? list.map(p => `<button data-program="${esc(p.id)}" class="${p.id === selected ? 'selected' : ''}" aria-pressed="${p.id === selected}">${esc(p.nombre)}</button>`).join('') : '<p class="empty">No se encontraron programas.</p>';
}
function render() {
  const p = program(), mode = $('modalidad').value, semester = $('semestre').value;
  document.querySelectorAll('[data-view]').forEach(b => { b.classList.toggle('active', b.dataset.view === view); b.setAttribute('aria-current', b.dataset.view === view ? 'page' : 'false'); });
  $('modulo').textContent = view === 'colombia' ? 'MÓDULO 01 / POSICIÓN COMPETITIVA' : view === 'mexico' ? 'MÓDULO 02 / EXPLORACIÓN DE OPORTUNIDADES' : 'TRAZABILIDAD / COBERTURA COMPLETA';
  $('titulo').textContent = view === 'fuentes' ? 'La evidencia detrás del análisis' : p.nombre;
  $('subtitulo').textContent = view === 'colombia' ? 'Oferta publicada EAN y comparación exploratoria con programas del mismo campo académico.' : view === 'mexico' ? 'Oferta mexicana candidata y contexto territorial. Las correspondencias académicas requieren validación.' : 'Catálogo, procedencia, controles de datos y pendientes de investigación.';
  $('ficha').href = p.fuente; $('ficha').hidden = view === 'fuentes';
  document.querySelector('.filters').hidden = view !== 'colombia';
  $('scope').textContent = view === 'colombia' ? 'Universitario · Colombia · SNIES 2025' : 'ANUIES 2025–2026 · Contexto con periodos propios';
  $('vista').innerHTML = view === 'colombia' ? colombia(p, mode, semester) : view === 'mexico' ? mexico(p) : sources();
  const exportButton = $('exportar'); if (exportButton) exportButton.addEventListener('click', exportCSV);
  const expandButton = $('ampliar'); if (expandButton) expandButton.addEventListener('click', () => { expanded = !expanded; render(); });
  const stateSelect = $('entidad'); if (stateSelect) stateSelect.addEventListener('change', () => { state = stateSelect.value; expanded = false; render(); });
}
function colombia(p, mode, semester) {
  const { stats, nationalPeers } = window.EanDomain;
  const total = stats(p, mode, semester, 'matricula'), first = stats(p, mode, semester, 'primer_curso'), enrolled = stats(p, mode, semester, 'inscritos');
  const peers = nationalPeers(p, mode, semester, data['nacional-2025']);
  const cov = data['cobertura-programas'].find(x => x.programa_id === p.id);
  exportRows = peers.rows.map(r => ({institucion:r.institucion, snies:r.snies, programa:r.programa, modalidad:r.modalidad, campo:r.campo, ano:r.ano, semestre:r.semestre, matricula:r.valor}));
  exportName = p.id + '-colombia-2025-' + semester;
  const offerHtml = p.ofertas.filter(o => mode === 'Todas' || o.modalidad === mode).map(o => `<div class="offer"><div><b>${esc(o.modalidad)}</b> <span class="tag">SNIES ${esc(o.snies || 'por verificar')}</span><small>${o.duracion_semestres ? `${num(o.duracion_semestres)} semestres` : 'Duración en semestres por verificar'} · ${o.creditos ? num(o.creditos) + ' créditos' : 'Créditos N/D'}</small><small>Inicio publicado: ${esc(o.inicio_publicado || 'Consultar ficha')}</small>${o.discrepancias ? '<span class="tag warn">Duración distinta entre fuentes oficiales</span>' : ''}</div><div class="offer-price"><b>${o.tarifa_cop ? '$' + num(o.tarifa_cop) : 'N/D'}</b><small>COP / ${esc(o.tarifa_unidad)}</small><small>${o.tarifa_ano ? 'Tarifa ' + o.tarifa_ano : 'Año tarifario sin identificar'}</small></div></div>`).join('');
  const semValues = ['1','2'].map(s => stats(p, mode, s, 'matricula').valor), max = Math.max(...semValues.filter(x => x !== null), 1);
  const chart = semValues.every(x => x === null) ? '<p class="empty">Sin matrícula identificada para este programa en los archivos 2025. No equivale a cero.</p>' : semValues.map((v, i) => `<div class="chart-row"><span>2025-${i + 1}</span>${v === null ? '<span>Sin dato</span>' : `<progress max="${max}" value="${v}" aria-label="Matrícula 2025-${i + 1}: ${num(v)}"></progress>`}<b class="num">${num(v)}</b></div>`).join('');
  const rows = (expanded ? peers.rows : peers.rows.slice(0, 40)).map(r => `<tr class="${r.institucion_codigo === '2812' && peers.ownCodes.has(r.snies) ? 'own' : ''}"><td>${esc(r.institucion)}<small>${esc(r.programa)} · SNIES ${esc(r.snies)}</small></td><td>${esc(r.modalidad)}</td><td>${esc(r.campo)}</td><td class="num">${num(r.valor)}</td></tr>`).join('');
  const datumNote = item => item.valor === null ? 'Sin dato identificado; no es cero' : `${item.parcial ? 'Cobertura parcial · ' : ''}2025-${semester} · ${mode === 'Todas' ? 'modalidades seleccionadas' : mode}`;
  return `<div class="metrics">${metric('Matrícula reportada', num(total.valor), datumNote(total))}${metric('Primer curso', num(first.valor), datumNote(first))}${metric('Inscritos, detalle de programa', num(enrolled.valor), datumNote(enrolled))}${metric('Participación en campo seleccionado', peers.participacion === null ? 'N/D' : decimal(peers.participacion) + '%', 'Programa EAN / matrícula del universo filtrado')}</div>
    ${total.valor === null ? '<div class="notice">La ficha de oferta está incluida, pero no se identificaron observaciones del programa en SNIES 2025. Se conserva la ausencia como N/D.</div>' : ''}
    <div class="split"><section class="panel"><h2>Oferta académica publicada</h2><p class="desc">Información de la ficha institucional. Aplican condiciones de apertura y matrícula.</p>${offerHtml}<p class="footnote">${link(p.fuente, 'Consultar ficha y condiciones')} · Consulta 03 nov 2026. El año de la tarifa se conserva aunque el inicio anunciado sea 2027.</p></section><section class="panel"><h2>Matrícula por semestre</h2><p class="desc">Comparación de dos cortes de 2025, sin sumar estudiantes únicos anuales.</p>${chart}</section></div>
    <section class="panel"><div class="panel-head"><div><h2>Programas del mismo campo y modalidad</h2><p class="desc">${peers.rows.length ? `${num(peers.rows.length)} registros agregados · ${num(peers.total)} matrículas en el universo seleccionado.` : 'Universo de comparación no disponible con los datos y filtros actuales.'}</p></div><button class="outline" id="exportar" ${peers.rows.length ? '' : 'disabled'}>Exportar comparación CSV</button></div><div class="notice info">Mismo campo CINE detallado, nivel universitario, modalidad y semestre. Esta selección identifica pares exploratorios; no demuestra equivalencia curricular. La fila verde identifica el programa EAN seleccionado.</div>${rows ? `<div class="table-wrap"><table><thead><tr><th>Institución y programa</th><th>Modalidad</th><th>Campo CINE</th><th class="num">Matrícula 2025-${semester}</th></tr></thead><tbody>${rows}</tbody></table></div>${peers.rows.length > 40 ? `<p class="footnote">Mostrando ${expanded ? peers.rows.length : 40} de ${peers.rows.length}. <button id="ampliar" class="outline">${expanded ? 'Ver primeras 40 filas' : 'Ver todas las filas'}</button></p>` : ''}` : '<p class="empty">No hay campo histórico identificado que permita construir este universo de comparación.</p>'}<p class="footnote">La participación corresponde a este conjunto de campos y modalidades; no es una cuota de toda la educación superior colombiana.</p></section>
    <section class="panel"><h2>Competencia internacional: antecedentes recuperados</h2><p class="desc">${cov.internacional_candidatos.length} candidatos por concepto en el radar anterior. Sus fichas y pertinencia deben verificarse antes de aprobar comparaciones.</p>${cov.internacional_candidatos.length ? `<div class="table-wrap"><table><thead><tr><th>Institución</th><th>Programa candidato</th><th>Fuente antecedente</th></tr></thead><tbody>${cov.internacional_candidatos.map(r => `<tr><td>${esc(r.institucion)}</td><td>${esc(r.programa)}</td><td>${link(r.fuente_url, r.fuente_url ? 'Abrir referencia' : 'Ver radar original')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Sin candidatos recuperados con las reglas actuales. Ampliar la investigación documental.</p>'}<p class="footnote">Las estimaciones de tarifas del proyecto anterior no se presentan como precios oficiales actuales.</p></section>
    <section class="panel"><span class="tag warn">Investigación pendiente</span><h2>Comparación de modelos pedagógicos</h2><p class="desc">Se incorporarán dimensiones de tutoría, autonomía, evaluación, proyectos, flexibilidad, emprendimiento y sostenibilidad. Cada afirmación deberá enlazar un documento y su alcance institucional o por programa.</p></section>`;
}
function mexico(p) {
  const cov = data['cobertura-programas'].find(x => x.programa_id === p.id), ids = new Set(cov.mexico_candidatos_ids);
  const context = data['mexico-contexto'];
  const candidates = data['mexico-academico'].filter(r => ids.has(r.id) && (!state || norm(r.entidad) === norm(state)));
  const entities = context.entidades;
  const entity = entities.find(e => norm(e.entidad) === norm(state));
  const housing = entity ? context.vivienda.find(v => v.cve_ent === entity.cve_ent) : null;
  const options = entities.map(e => `<option value="${esc(e.entidad)}" ${e.entidad === state ? 'selected' : ''}>${esc(e.entidad)}</option>`).join('');
  exportRows = candidates.map(r => ({ institucion:r.institucion, programa:r.programa_original, entidad:r.entidad, modalidad:r.modalidad, periodo:r.periodo, matricula:r.matricula_total, nuevo_ingreso:r.nuevo_ingreso_total, fuente:r.fuente_url, estado:'Candidato sin validación curricular' }));
  exportName = p.id + '-mexico-candidatos';
  const rows = (expanded ? candidates : candidates.slice(0,40)).map(r => `<tr><td>${esc(r.institucion)}<small>${esc(r.programa_original)}</small></td><td>${esc(r.entidad)}</td><td>${esc(r.modalidad)}</td><td class="num">${num(r.matricula_total)}</td><td class="num">${num(r.nuevo_ingreso_total)}</td></tr>`).join('');
  return `<div class="notice">Exploración de fuentes disponibles. “No escolarizada” es la categoría mexicana de origen y no demuestra modalidad 100 % virtual. La matrícula corresponde a ubicación del plantel y no a residencia del estudiante ni a demanda EAN.</div>
    <div class="inline-select"><label for="entidad">Entidad federativa</label><select id="entidad"><option value="">Todas · mostrar cobertura académica</option>${options}</select></div>
    <div class="metrics">${metric('Registros académicos candidatos', num(candidates.length), 'Subconjunto ANUIES 2025–2026')}${metric('Instituciones encontradas', num(new Set(candidates.map(r => r.institucion)).size), 'En los candidatos y territorio seleccionados')}${metric('Entidades con candidatos', num(new Set(candidates.map(r => r.entidad)).size), 'Ubicación del plantel')}${metric('Validación de correspondencias', 'Pendiente', 'Se requiere revisión académica')}</div>
    <section class="panel"><h2>Contexto económico y territorial</h2><p class="desc">Datos importados del proyecto antecedente; sus cálculos de microdatos requieren una nueva auditoría.</p>${entity ? `<h3>${esc(entity.entidad)}</h3><div class="state-context"><div><small>Ingreso promedio del hogar · ENIGH 2024</small><strong>$${num(entity.ingreso_hogar_mensual_2024_mxn)}</strong><small>MXN mensuales por hogar</small></div><div><small>Gasto promedio del hogar · ENIGH 2024</small><strong>$${num(entity.gasto_hogar_mensual_2024_mxn)}</strong><small>MXN mensuales por hogar</small></div><div><small>Hogares con internet · ENDUTIH 2025</small><strong>${decimal(entity.hogares_internet_2025_pct)}%</strong><small>Ámbito estatal</small></div><div><small>Renta mediana · ENIGH 2024</small><strong>$${num(housing?.renta_mensual_mediana_mxn)}</strong><small>MXN mensuales · viviendas rentadas con monto positivo</small></div></div><p class="footnote">Población proyectada CONAPO 2027: ${num(entity.poblacion_2027)}. Proyección, no conteo observado. Estos valores agregados no determinan por sí solos la capacidad de pago de una persona.</p>` : '<p class="empty">Selecciona una entidad para consultar ingresos, gastos, conectividad y vivienda en su ámbito estatal.</p>'}</section>
    <section class="panel"><div class="panel-head"><div><h2>Oferta mexicana recuperada por concepto</h2><p class="desc">Conceptos de búsqueda: ${esc(cov.conceptos_busqueda.join(' · '))}. Clasificación: candidatos pendientes de revisión.</p></div><button id="exportar" class="outline" ${candidates.length ? '' : 'disabled'}>Exportar candidatos CSV</button></div>${rows ? `<div class="table-wrap"><table><thead><tr><th>Institución / programa</th><th>Entidad</th><th>Modalidad de origen</th><th class="num">Matrícula</th><th class="num">Nuevo ingreso</th></tr></thead><tbody>${rows}</tbody></table></div>${candidates.length > 40 ? `<p class="footnote">Mostrando ${expanded ? candidates.length : 40} de ${candidates.length}. <button class="outline" id="ampliar">${expanded ? 'Ver primeras 40 filas' : 'Ver todas las filas'}</button></p>` : ''}` : '<p class="empty">No se recuperaron candidatos en este subconjunto con los filtros actuales. No significa que no exista oferta en México.</p>'}<p class="footnote">Fuente antecedente: ${link('https://anuario.anuies.mx/', 'ANUIES')} · Periodo 2025–2026. No se suman los candidatos de distintos programas EAN como mercados independientes.</p></section>
    <section class="panel"><h2>Ficha de oportunidad: evidencia que falta completar</h2><ul class="text-list"><li>Validar la correspondencia curricular y las condiciones de oferta para cada programa EAN.</li><li>Completar precios mexicanos actuales con unidad, fecha y condiciones comparables.</li><li>Integrar públicos y economía familiar sin trasladar promedios estatales a personas concretas.</li><li>Validar los criterios de priorización antes de recomendar un territorio o prometer resultados comerciales.</li></ul><p class="footnote">Modalidades publicadas del programa EAN: ${esc(p.ofertas.map(o => o.modalidad).join(' / '))}. No se equiparan automáticamente con la modalidad mexicana.</p></section>`;
}
function sources() {
  const audit = data.auditoria, cov = data['cobertura-programas'];
  exportRows = cov.map(p => ({ programa:p.nombre, modalidades:p.modalidades.join(' / '), ofertas:p.ofertas_publicadas, ofertas_con_datos_2025:p.ofertas_con_datos_2025, candidatos_mexico:p.mexico_candidatos_ids.length, candidatos_radar:p.internacional_candidatos.length, pedagogia:p.pedagogia }));
  exportName = 'cobertura-pregrados-ean';
  return `<div class="metrics">${metric('Pregrados identificados', num(data.resumen.programas), 'Fichas institucionales; incluye oferta anunciada')}${metric('Ofertas por modalidad', num(data.resumen.ofertas), 'Una carrera puede tener dos modalidades')}${metric('Ofertas con datos SNIES 2025', num(data.resumen.ofertas_con_datos_2025), 'El resto se conserva como N/D')}${metric('Fuentes estadísticas SNIES', '3', 'Matrícula · primer curso · inscritos')}</div>
    <section class="panel"><div class="panel-head"><div><h2>Cobertura por programa</h2><p class="desc">Catálogo completo identificado en las fuentes consultadas. Candidatos no equivalen a correspondencias aprobadas.</p></div><button id="exportar" class="outline">Exportar cobertura CSV</button></div><div class="table-wrap"><table><thead><tr><th>Programa</th><th>Modalidades</th><th class="num">Ofertas con datos 2025</th><th class="num">Filas candidatas México</th><th class="num">Antecedentes radar</th></tr></thead><tbody>${cov.map(p => `<tr><td>${esc(p.nombre)}</td><td>${esc(p.modalidades.join(' / '))}</td><td class="num">${p.ofertas_con_datos_2025}/${p.ofertas_publicadas}</td><td class="num">${p.mexico_candidatos_ids.length}</td><td class="num">${p.internacional_candidatos.length}</td></tr>`).join('')}</tbody></table></div></section>
    <div class="split"><section class="panel"><h2>Controles ejecutados</h2><ul class="text-list">${audit.controles.map(c => `<li>${esc(c.indicador)}: ${num(c.filas)} filas leídas; ${num(c.duplicados_exactos)} duplicados exactos. Ancho de filas y valores numéricos validados.</li>`).join('')}<li>Identificación EAN mediante código institucional 2812.</li><li>Se excluyen posgrados y agregados institucionales sin nivel universitario del análisis de pregrados.</li><li>Huellas SHA-256 para archivos fuente y bases antecedentes.</li></ul><p class="footnote">Estos controles no sustituyen la auditoría de llaves de negocio ni la revisión metodológica completa.</p></section><section class="panel"><h2>Excepciones que conservamos visibles</h2><ul class="text-list">${audit.excepciones_snies.map(x => `<li>SNIES ${esc(x.snies)} · ${esc(x.nombre)}: histórico sin correspondencia en el catálogo actual. No se fusiona automáticamente.</li>`).join('')}${audit.discrepancias_web.map(x => `<li>${esc(x.programa)}${x.modalidad ? ' · ' + esc(x.modalidad) : ''}: ${x.ficha ? `duración ficha ${x.ficha} / inscripciones ${x.inscripciones}. ` : ''}${esc(x.detalle)}</li>`).join('')}</ul></section></div>
    <section class="panel"><h2>Fuentes y límites de interpretación</h2><ul class="source-list"><li>${link('https://universidadean.edu.co/pregrados','Catálogo principal EAN')} y fichas individuales descargadas el 03 nov 2026.</li><li>${link('https://inscripcion.universidadean.edu.co/pregrados/','Página de inscripciones EAN')}: anuncia 20 carreras; se extrajeron ${audit.bloques_inscripciones_extraidos} bloques de programa. Las diferencias se registran.</li><li>Tres CSV aportados de SNIES 2025; se conserva el nombre y la huella de cada original. Su procedencia web exacta y diccionario deben completarse.</li><li>SQLite del proyecto México: ${num(data.resumen.mexico_filas)} registros ANUIES en el subconjunto académico; contexto ENIGH, ENDUTIH y CONAPO importado del antecedente.</li><li>Radar internacional: ${num(data.resumen.radar_pregrados_extraidos)} registros de pregrado extraídos estáticamente, sin ejecutar su código ni validar nuevamente las ofertas extranjeras.</li></ul><ul class="text-list">${data.resumen.limites.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
}
function exportCSV() {
  if (!exportRows.length) return;
  const columns = Object.keys(exportRows[0]);
  const cell = v => { let value = String(v ?? ''); if (/^[=+@-]/.test(value)) value = "'" + value; return '"' + value.replaceAll('"','""') + '"'; };
  const csv = '\uFEFF' + [columns, ...exportRows.map(r => columns.map(c => r[c]))].map(r => r.map(cell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = exportName + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.querySelector('nav').addEventListener('click', event => { const b = event.target.closest('[data-view]'); if (!b || !data) return; view = b.dataset.view; expanded = false; render(); });
$('programas').addEventListener('click', event => { const b = event.target.closest('[data-program]'); if (!b || !data) return; selected = b.dataset.program; expanded = false; updateModes(); renderPrograms(); render(); });
$('buscar').addEventListener('input', () => { if (data) renderPrograms(); });
$('modalidad').addEventListener('change', () => { expanded = false; render(); });
$('semestre').addEventListener('change', () => { expanded = false; render(); });
load();
