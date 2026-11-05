import React,{useMemo,useState} from 'react';
import {MapaMexico} from '@webrek/mx-geo/react';
import geo from './estados_mapa.json';
import {rankGranular} from './granular-data.js';
import {claveEntidad,resumenMapaEntidad} from './entidades-anuies.js';
import {convertirMxnCop,dineroCop,MXN_COP_REFERENCIA} from './shared/utils/cambio';

const fmt=n=>new Intl.NumberFormat('es-MX').format(n||0);
const csvCell=v=>`"${String(v??'').replaceAll('"','""')}"`;
const ALL='__TODOS__';
const METRICAS={nuevo_ingreso_total:{label:'Nuevo ingreso',field:'nuevos'},matricula_total:{label:'Matrícula',field:'matricula'},egresados_total:{label:'Egresados',field:'egresados'}};

export default function GranularANUIES({db,programa,onProgramaChange,initialEntidad=''}){
  const [entidad,setEntidad]=useState(initialEntidad);
  const [institucion,setInstitucion]=useState('');
  const [modalidad,setModalidad]=useState('');
  const [tipo,setTipo]=useState('Todas');
  const [orden,setOrden]=useState('nuevo_ingreso_total');
  const [metricaMapa,setMetricaMapa]=useState('nuevo_ingreso_total');
  const [busca,setBusca]=useState('');
  const norm=x=>String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().trim();
  const virtual=new Set((db.portafolio_cun||[]).filter(x=>x.vigencia==='PUBLICADA').map(x=>norm(x.programa_normalizado)));
  const programas=[...new Set((db.homologacion_programas_cun_mexico||[]).map(x=>x.programa_cun).filter(x=>virtual.has(norm(x))))].sort((a,b)=>a.localeCompare(b,'es'));
  const seleccionado=programas.includes(programa)?programa:ALL;
  const programasActivos=seleccionado===ALL?programas:[seleccionado];
  const raw=db.anuies_granular_2025_2026||[];
  const links=(db.anuies_cun_correspondencias||[]).filter(x=>programasActivos.includes(x.programa_cun)&&(tipo==='Todas'||x.tipo_coincidencia===tipo));
  const byId=new Map(links.map(x=>[x.anuies_id,x]));
  const q=busca.trim().toLocaleLowerCase('es');
  const selected=useMemo(()=>raw.filter(r=>byId.has(r.id)&&(!entidad||r.entidad===entidad)&&(!institucion||r.institucion===institucion)&&(!modalidad||r.modalidad===modalidad)&&(!q||r.programa_original.toLocaleLowerCase('es').includes(q))).map(r=>({...r,...byId.get(r.id)})),[raw,byId,entidad,institucion,modalidad,q]);
  const programIds=new Set(links.map(x=>x.anuies_id));
  const programRows=raw.filter(x=>programIds.has(x.id));
  const competencia=(db.competencia_cun_fuentes||[]).filter(x=>programasActivos.includes(x.programa_cun));
  const ranked=useMemo(()=>rankGranular(selected,'institucion'),[selected]);
  const states=useMemo(()=>rankGranular(selected,'entidad'),[selected]);
  const totals=selected.reduce((a,r)=>({matricula:a.matricula+r.matricula_total,nuevos:a.nuevos+r.nuevo_ingreso_total,egresados:a.egresados+r.egresados_total}),{matricula:0,nuevos:0,egresados:0});
  const institutes=[...new Set(programRows.map(x=>x.institucion))].sort((a,b)=>a.localeCompare(b,'es'));
  const modalidades=[...new Set(programRows.map(x=>x.modalidad))].sort();
  const sortRows=[...selected].sort((a,b)=>b[orden]-a[orden]||a.institucion.localeCompare(b.institucion,'es'));
  const byEntity=useMemo(()=>resumenMapaEntidad(selected),[selected]);
  const campoMapa=METRICAS[metricaMapa].field;
  const mapData=Object.fromEntries(geo.map(g=>[g.clave,byEntity[g.clave][campoMapa]||0]));
  function exportCsv(){
    const cols=['entidad','institucion','plantel','nivel','modalidad','campo_detallado','programa_original','tipo_coincidencia','matricula_total','nuevo_ingreso_total','egresados_total','periodo','unidad','fuente_url','fecha_consulta','exportacion_sha256','fila_excel'];
    const body=[cols.join(','),...sortRows.map(r=>cols.map(k=>csvCell(r[k])).join(','))].join('\r\n');
    const url=URL.createObjectURL(new Blob(['﻿'+body],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='anuies_cun_2025_2026_filtrado.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function clearFilters(){setEntidad('');setInstitucion('');setModalidad('');setTipo('Todas');setBusca('');setOrden('nuevo_ingreso_total');setMetricaMapa('nuevo_ingreso_total')}
  const universoTxt=seleccionado===ALL?`Todos los pregrados EAN publicados con cruce ANUIES (${programas.length})`:seleccionado;
  return <section className="glass granular-panel">
    <div className="granular-head"><div><span className="kicker">ANUIES · 2025–2026 · SOLO EAN VIRTUAL VIGENTE</span><h3>Mapa y comparables del portafolio EAN</h3><p>El mapa resume por entidad de la institución. Aquí no se mezclan programas presenciales de EAN y sí puedes trabajar un solo programa o todo el portafolio de pregrados publicado.</p></div><a href="https://anuario.anuies.mx/" target="_blank" rel="noreferrer">Portal y exportación oficial ↗</a></div>
    <div className="filters granular-filters">
      <label>Programa EAN<select aria-label="Programa EAN" value={seleccionado} onChange={e=>{onProgramaChange(e.target.value);clearFilters()}}><option value={ALL}>Todos los pregrados EAN publicados</option>{programas.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Entidad<select aria-label="Entidad ANUIES" value={entidad} onChange={e=>setEntidad(e.target.value)}><option value="">Todas las entidades</option>{[...new Set(raw.map(x=>x.entidad))].sort((a,b)=>a.localeCompare(b,'es')).map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Institución<select aria-label="Institución ANUIES" value={institucion} onChange={e=>setInstitucion(e.target.value)}><option value="">Todas las instituciones</option>{institutes.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Modalidad<select aria-label="Modalidad ANUIES" value={modalidad} onChange={e=>setModalidad(e.target.value)}><option value="">Todas las modalidades extraídas</option>{modalidades.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Correspondencia<select aria-label="Tipo de coincidencia" value={tipo} onChange={e=>setTipo(e.target.value)}><option>Todas</option><option value="EXACTA_DENOMINACION">Denominación exacta</option><option value="AFIN_DENOMINACION">Denominación afín</option></select></label>
      <label>Buscar programa<input aria-label="Buscar programa mexicano" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Nombre publicado"/></label>
      <label>Métrica del mapa<select aria-label="Métrica del mapa" value={metricaMapa} onChange={e=>setMetricaMapa(e.target.value)}>{Object.entries(METRICAS).map(([key,val])=><option key={key} value={key}>{val.label}</option>)}</select></label>
      <button className="soft-btn" onClick={clearFilters}>Restablecer filtros ANUIES</button>
    </div>
    <p className="small">Universo visible: <b>{universoTxt}</b>. Cobertura del filtro actual: <b>{programRows.length?`${fmt(programRows.length)} filas ANUIES con correspondencia analítica`:'pendiente de extracción o coincidencia comprobable'}</b>. Modalidades publicadas: {modalidades.join(', ')||'ninguna todavía'}.</p>
    {selected.length? <>
      <div className="kpis"><div className="kpi"><span>Matrícula comparable</span><strong>{fmt(totals.matricula)}</strong><small>Personas · filtros activos</small></div><div className="kpi"><span>Nuevo ingreso comparable</span><strong>{fmt(totals.nuevos)}</strong><small>Personas · ciclo 2025–2026</small></div><div className="kpi"><span>Egresados comparables</span><strong>{fmt(totals.egresados)}</strong><small>Personas · mismo corte</small></div><div className="kpi"><span>Registros de plantel y programa</span><strong>{fmt(selected.length)}</strong><small>{fmt(ranked.length)} instituciones · {fmt(states.length)} entidades</small></div></div>
      <div className="two"><div><h4>{METRICAS[metricaMapa].label} por entidad de la institución</h4><div className="map-box"><MapaMexico zoom={{min:1,max:8}} data={mapData} paleta="teal" stroke="#ffffff" emptyColor="#edf2f5" formatValue={v=>`${fmt(v)} · ${METRICAS[metricaMapa].label.toLowerCase()} · 2025–2026`} onSelect={e=>setEntidad(raw.find(r=>claveEntidad(r.entidad)===e.cve)?.entidad||'')} ariaLabel="Mapa ANUIES por entidad de institución"/></div><p className="small">Haz clic en una entidad para filtrar. El mapa representa ubicación institucional, no ciudad de residencia ni intención de compra.</p></div><div><h4>Top entidades del subconjunto</h4><div className="granular-ranking">{states.slice(0,12).map((x,i)=><button key={x.nombre} onClick={()=>setEntidad(x.nombre)}><span>{i+1}. {x.nombre}</span><b>{fmt(metricaMapa==='matricula_total'?x.matricula:metricaMapa==='egresados_total'?x.egresados:x.nuevos)}</b></button>)}</div><p className="small">Puedes usar el ranking como entrada rápida al filtro territorial.</p></div></div>
      <div className="two"><div><h4>Instituciones por {METRICAS[orden].label.toLowerCase()}</h4><div className="granular-ranking">{ranked.slice(0,10).map((x,i)=><button key={x.nombre} onClick={()=>setInstitucion(x.nombre)}><span>{i+1}. {x.nombre}</span><b>{fmt(orden==='matricula_total'?x.matricula:orden==='egresados_total'?x.egresados:x.nuevos)}</b></button>)}</div><p className="small">Ranking del subconjunto filtrado. No demuestra por sí solo competencia directa ni modalidad 100 % virtual.</p></div><div><h4>Qué está viendo el usuario</h4><div className="dictionary"><b>Programa / universo</b><p>{universoTxt}</p></div><div className="dictionary"><b>Tipo de correspondencia</b><p>{tipo==='Todas'?'Exacta y afín':tipo==='EXACTA_DENOMINACION'?'Solo exacta por nombre':'Solo afinidad por nombre'}</p></div><div className="dictionary"><b>Métrica del mapa</b><p>{METRICAS[metricaMapa].label}</p></div><div className="dictionary"><b>Entidad activa</b><p>{entidad||'Todas las entidades'}</p></div></div></div>
      <div className="granular-table-head"><h4>Filas verificables</h4><div><label>Ordenar <select aria-label="Ordenar filas ANUIES" value={orden} onChange={e=>setOrden(e.target.value)}><option value="nuevo_ingreso_total">Nuevo ingreso</option><option value="matricula_total">Matrícula</option><option value="egresados_total">Egresados</option></select></label><button className="soft-btn" onClick={exportCsv}>Exportar CSV filtrado</button></div></div>
      <div className="granular-scroll"><table><thead><tr><th>Entidad / institución</th><th>Programa publicado</th><th>Coincidencia</th><th>Modalidad ANUIES</th><th>Matrícula</th><th>Nuevos</th><th>Egresados</th></tr></thead><tbody>{sortRows.map(r=><tr key={r.id}><td><b>{r.entidad}</b><br/>{r.institucion}<small>{r.plantel}</small></td><td>{r.programa_original}<small>{r.nivel}</small></td><td>{r.tipo_coincidencia==='EXACTA_DENOMINACION'?'Exacta por nombre':'Afín por nombre'}</td><td>{r.modalidad}</td><td>{fmt(r.matricula_total)}</td><td>{fmt(r.nuevo_ingreso_total)}</td><td>{fmt(r.egresados_total)}</td></tr>)}</tbody></table></div>
    </>:<div className="alert"><p><b>{programRows.length?'Los filtros activos no dejan filas comparables.':'Todavía no hay una correspondencia ANUIES documentada para este programa o subconjunto.'}</b> {programRows.length?'Restablece los filtros para volver al universo importado.':'Esto no equivale a matrícula cero; puede faltar una exportación o una validación académica.'}</p></div>}
    <h4>Oferta publicada y precios: investigación independiente del anuario</h4><p className="small">Cambio comparativo al {MXN_COP_REFERENCIA.fecha}: 1 MXN ≈ {MXN_COP_REFERENCIA.copPorMxn} COP · <a href={MXN_COP_REFERENCIA.fuente} target="_blank" rel="noreferrer">referencia ↗</a>. Se muestra el valor original en MXN y su estimación en COP para el mismo período.</p>
    {competencia.length?<div className="granular-evidence">{competencia.map(x=><article key={x.id}><b>{x.institucion}</b><p>{x.programa_mexico} · {x.tipo_institucion} · {x.modalidad_publicada}</p><p><strong>{x.precio_mxn==null?'Precio no encontrado':<>{fmt(x.precio_mxn)} {x.moneda} {x.periodicidad}<br/>≈ {dineroCop(convertirMxnCop(x.precio_mxn))} COP · mismo período</>}</strong></p><small>{x.requisitos}</small><small>{x.estado_regulatorio}</small><small>{x.observaciones}</small><a href={x.url_oficial} target="_blank" rel="noreferrer">Ficha específica consultada el {x.fecha_consulta} ↗</a></article>)}</div>:<p className="small">Sin ficha de oferta específica validada para este filtro. Las instituciones del anuario no sustituyen esa verificación.</p>}
    <p className="small granular-caveat">Criterio: coincidencia por denominación exacta o afín, sin evaluación curricular. “No escolarizada” no prueba enseñanza 100 % virtual. No hay código institucional, sostenimiento, RVOE, precio ni duración en la exportación ANUIES; las fichas de oferta provienen de fuentes independientes. Ninguna cifra implica reconocimiento legal del título EAN.</p>
  </section>
}
