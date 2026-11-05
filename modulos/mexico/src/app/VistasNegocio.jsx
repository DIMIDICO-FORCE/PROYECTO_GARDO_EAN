const OportunidadesExpansion=React.lazy(()=>import('../modules/oportunidades/OportunidadesExpansion.jsx')); 
import EvidenciaDecision from '../modules/mercado360/EvidenciaDecision.jsx';
import evidenciaDecision from '../modules/mercado360/evidencia-decision.json';
import {textoMxnCop} from '../shared/utils/cambio.js';
import React,{useMemo,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {ExternalLink,Info,Download} from 'lucide-react';
import {catalogoVirtual,construirUniverso,agruparEntidad,valorMetrica} from '../modules/mapa-mercado/calculosMapa.js';
import ProgramaFondo from '../modules/programas/components/ProgramaFondo';
import ComparadorPrecios from '../modules/precios/ComparadorPrecios.jsx';
import preciosReferencia2026 from '../modules/precios/referencias2026.json';
import MatrizLegalCun from '../modules/legal/MatrizLegalCun.jsx';
import {claveEntidad} from '../entidades-anuies.js';
import {convertirMxnCop,dineroCop,MXN_COP_REFERENCIA} from '../shared/utils/cambio.js';
import FinanzasEnifEnigh,{PagosResumen} from '../modules/economia/FinanzasEnifEnigh.jsx';
import PublicoObjetivoV21 from '../modules/clientes/PublicoObjetivoV21.jsx';
import CentroExpansionEAN from '../modules/programas/components/CentroExpansionEAN.jsx';

const fmt=n=>n==null||!Number.isFinite(Number(n))?'N/D':new Intl.NumberFormat('es-MX',{maximumFractionDigits:0}).format(n);
const pct=n=>n==null||!Number.isFinite(Number(n))?'N/D':`${Number(n).toLocaleString('es-MX',{maximumFractionDigits:1})} %`;
const mxn=textoMxnCop;
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const COP=n=>dineroCop(convertirMxnCop(n));
function Tarjeta({title,value,detail}){return <div className="portal19-card"><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>}
function Panel({title,lead,children}){return <section className="peru-mx-panel portal19-pad"><div className="portal19-title"><div><h2>{title}</h2>{lead&&<p>{lead}</p>}</div></div>{children}</section>}
function FiltroEstado({entidades,valor,cambiar}){return <label className="peru-mx-filter"><span>Entidad federativa</span><select value={valor} onChange={e=>cambiar(e.target.value)}>{entidades.map(x=><option key={x.cve_ent} value={x.cve_ent}>{x.entidad}</option>)}</select></label>}
function CabeceraFiltro({entidades,estado,cambiar,children}){return <div className="peru-mx-controls peru-mx-panel"><FiltroEstado entidades={entidades} valor={estado} cambiar={cambiar}/>{children}</div>}
function Fila({nombre,valor,nota}){return <div className="portal19-row"><div><b>{nombre}</b>{nota&&<p>{nota}</p>}</div><strong>{valor}</strong></div>}
function Aviso({children}){return <div className="portal19-note"><Info size={14} style={{display:'inline',marginRight:6}}/>{children}</div>}
function LinkExterno({url,children}){return <a style={{color:'var(--pm-accent)',fontSize:12}} href={url} target="_blank" rel="noopener noreferrer">{children} <ExternalLink size={11} style={{display:'inline'}}/></a>}
function Barra({label,value,max,help}){const n=Math.max(0,Number(value)||0);return <div className="atlas-bar"><div className="atlas-bar-label"><span>{label}</span><b>{fmt(value)}</b></div><div className="atlas-track"><i style={{width:`${Math.min(100,n/(max||1)*100)}%`}}/></div>{help&&<small>{help}</small>}</div>}
function Estado({oficial}){const [estado,setEstado]=useState('09');const entidades=oficial.entidades||[];return {estado,setEstado,entidades,actual:entidades.find(x=>x.cve_ent===estado)||entidades[0]}}
function Descarga({rows,nombre='datos_mx.csv'}){return <button className="peru-mx-reset" onClick={()=>{const cols=Object.keys(rows[0]||{});const cell=x=>'"'+String(x??'').replaceAll('"','""')+'"';const csv=[cols.join(';'),...rows.map(r=>cols.map(c=>cell(r[c])).join(';'))].join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=nombre;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}} disabled={!rows.length}><Download size={14}/> Exportar datos filtrados</button>}

function Compra({db,oficial,finanzas}){
 const {estado,setEstado,entidades,actual}=Estado({oficial});
 const [busqueda,setBusqueda]=useState('administración de empresas en línea');
 const [canal,setCanal]=useState('Todos');
 const canales=db.extra2027?.canales||[];
 const evidencias=canales.filter(x=>canal==='Todos'||x.canal===canal);
 const estadoTrends=actual?.entidad||'México';
 return <><EvidenciaDecision/><PagosResumen finanzas={finanzas}/>
  <CabeceraFiltro entidades={entidades} estado={estado} cambiar={setEstado}><label className="peru-mx-filter"><span>Canal de información</span><select value={canal} onChange={e=>setCanal(e.target.value)}><option>Todos</option>{canales.map(x=><option key={x.canal}>{x.canal}</option>)}</select></label><label className="peru-mx-filter"><span>Programa que investigarás</span><input value={busqueda} onChange={e=>setBusqueda(e.target.value)} aria-label="Consulta a investigar"/></label></CabeceraFiltro>
  <div className="portal19-card-grid"><Tarjeta title="Personas que usan internet · 6+" value={pct(actual?.personas_6mas_internet_2025_pct)} detail={`${estadoTrends} · ENDUTIH 2025, referencia estatal`}/><Tarjeta title="Hogares conectados" value={pct(actual?.hogares_internet_2025_pct)} detail="ENDUTIH 2025 · hogares; no usuarios de redes"/><Tarjeta title="Búsquedas absolutas del programa" value="No disponible" detail="No se obtuvieron volúmenes de Google Ads ni Search Console"/></div>
  <div className="portal19-two"><Panel title="Canales que podemos medir" lead="Herramientas y su nivel real de observación"><div className="portal19-list">{evidencias.map(x=><div className="portal19-row" key={x.canal}><div><b>{x.canal}</b><p>{x.descripcion}</p><p>{x.medicion}</p></div><LinkExterno url={x.canal==='Google Trends'&&busqueda?`https://trends.google.com/trends/explore?geo=MX&q=${encodeURIComponent(busqueda)}`:x.url}>Explorar</LinkExterno></div>)}</div></Panel><Panel title="Lectura por territorio" lead="No extrapolar automáticamente un canal nacional a una ciudad"><Fila nombre="Zona elegida" valor={estadoTrends} nota="Entidad federativa, no municipio"/><Fila nombre="Acceso general a internet" valor={pct(actual?.personas_6mas_internet_2025_pct)} nota="Población 6+"/><Fila nombre="Audiencia Meta por ciudad" valor="Sin medición" nota="Necesita herramienta publicitaria autorizada"/><Aviso>Esta sección todavía no muestra cuántas veces se busca cada carrera ni usuarios registrados en una red. Para construirlo se requieren series descargadas de Keyword Planner, Google Trends y plataformas de anuncios.</Aviso></Panel></div>
 </>;
}

function Clientes({db,oficial}){
 const {estado,setEstado,entidades,actual}=Estado({oficial});
 const [perfil,setPerfil]=useState('pregrado');
 const [municipio,setMunicipio]=useState('');
 const mun=(oficial.municipios||[]).filter(x=>x.cve_ent===estado).sort((a,b)=>b.poblacion_2027-a.poblacion_2027);
 const seleccionado=mun.find(x=>x.cvegeo===municipio);
 const per=perfil==='pregrado'?['20–24 años',seleccionado?.edad_20_24, 'Personas en edad típica de entrada, no interesados confirmados']:perfil==='profesional'?['25–34 años',(seleccionado?.edad_25_29??0)+(seleccionado?.edad_30_34??0),'Posible segmento compatible con formación flexible; requiere título previo para posgrado']:['35–44 años',(seleccionado?.edad_35_39??0)+(seleccionado?.edad_40_44??0),'Adultos con trayectorias heterogéneas; no todos son elegibles'];
 return <>
  <CabeceraFiltro entidades={entidades} estado={estado} cambiar={x=>{setEstado(x);setMunicipio('')}}><label className="peru-mx-filter"><span>Municipio o alcaldía</span><select value={municipio} onChange={e=>setMunicipio(e.target.value)}><option value="">Selecciona municipio para cifra etaria</option>{mun.map(x=><option key={x.cvegeo} value={x.cvegeo}>{x.municipio}</option>)}</select></label><label className="peru-mx-filter"><span>Perfil de análisis</span><select value={perfil} onChange={e=>setPerfil(e.target.value)}><option value="pregrado">Jóvenes · 20–24</option><option value="profesional">Profesionales jóvenes · 25–34</option><option value="adulto">Adultos · 35–44</option></select></label></CabeceraFiltro>
  <div className="portal19-card-grid"><Tarjeta title={per[0]} value={seleccionado?fmt(per[1]):'Elige municipio'} detail={seleccionado?`${seleccionado.municipio} · CONAPO 2027`:'El dato corresponde al municipio, no al estado si no se selecciona'}/><Tarjeta title="Ingreso promedio mensual por hogar" value={mxn(actual?.ingreso_hogar_mensual_2024_mxn)} detail={`${actual?.entidad} · ENIGH 2024`}/><Tarjeta title="Conectividad de hogares" value={pct(actual?.hogares_internet_2025_pct)} detail="ENDUTIH 2025 · entidad completa"/></div>
  <Panel title="Cliente potencial: perfil, no comprador estimado" lead={per[2]}><div className="portal19-two"><div><Fila nombre="Demografía observable" valor={per[0]} nota="Población, no compradores"/><Fila nombre="Condición académica" valor="Sin medición" nota="El censo de población no identifica intención de cursar un programa específico EAN"/><Fila nombre="Situación laboral individual" valor="Sin medición" nota="No atribuir empleo a estudiantes sin encuesta que cruce ambas condiciones"/></div><div><Fila nombre="Capacidad de pago" valor="Requiere análisis" nota="Comparar ingreso/gasto del hogar, beca y costos reales de la carrera"/><Fila nombre="Propuesta de canal" valor="Digital, por validar" nota="ENDUTIH mide acceso, no preferencia por universidades"/><Fila nombre="Pregrados EAN publicados" valor={fmt(catalogoVirtual(db).length)} nota="Catálogo elegible; la selección del perfil no es una estimación de matrícula"/></div></div></Panel>
  <Aviso>No equiparamos nivel socioeconómico mexicano con estratos colombianos ni inferimos cuántos pagarían. Para la ficha comercial completa de cada perfil hacen falta intención, escolaridad previa, empleo y presupuesto por municipio.</Aviso>
 </>;
}
function Portafolio({db}){
 const [params,setParams]=useSearchParams();
 const incoming=params.get('programa')||'__TODOS__';
 const programa=db.ean_catalogo.find(p=>p.id===incoming||norm(p.nombre)===norm(incoming))?.nombre.toUpperCase()||'__TODOS__';
 const curricular=params.get('enfoque')==='curricular';
 function cambiar(v){const next=new URLSearchParams(params);v?next.set('enfoque','curricular'):next.delete('enfoque');setParams(next);}
 return <><div className="portal19-tabbar" role="group" aria-label="Análisis del portafolio"><button aria-pressed={!curricular} className={!curricular?'active':''} onClick={()=>cambiar(false)}>Afinidad y matrícula por programa</button><button aria-pressed={curricular} className={curricular?'active':''} onClick={()=>cambiar(true)}>Cobertura documental y cruces preliminares</button></div>{curricular?<><CentroExpansionEAN db={db}/><details className="peru-mx-panel portal19-pad"><summary>Referentes institucionales Colombia ↔ México</summary><Equivalencias/></details></>:<ProgramaFondo db={db} programa={programa} onProgramaChange={value=>{const next=new URLSearchParams(params);next.set('programa',value);setParams(next);}}/>}</>;
}
function FuentesMetodo({db,oficial,censo}){
 const [params,setParams]=useSearchParams(),audit=params.get('enfoque')==='auditoria';
 function cambiar(value){const next=new URLSearchParams(params);value?next.set('enfoque','auditoria'):next.delete('enfoque');setParams(next);}
 return <><Panel title="Estudios incorporados sobre elección y canales" lead="Documentos originales revisados el 4 de noviembre de 2026">{evidenciaDecision.fuentes.map(f=><article key={f.id}><h3>{f.titulo}</h3><p>{f.ambito}</p><LinkExterno url={f.url}>Abrir fuente original</LinkExterno></article>)}</Panel><div className="portal19-tabbar" role="group" aria-label="Fuentes y calidad"><button aria-pressed={!audit} className={!audit?'active':''} onClick={()=>cambiar(false)}>Catálogo de fuentes</button><button aria-pressed={audit} className={audit?'active':''} onClick={()=>cambiar(true)}>Cobertura y calidad</button></div>{audit?<Auditoria db={db} oficial={oficial} censo={censo}/>:<Fuentes db={db} oficial={oficial} censo={censo}/>}</>;
}
function Competencia({db,oficial}){
 const [vista,setVista]=useState('precios'),[busca,setBusca]=useState('');
 const programas=catalogoVirtual(db);
 const universo=construirUniverso(db,{programa:'__TODOS__'});
 const instituciones=[...new Map(universo.filas.filter(x=>norm(x.institucion).includes(norm(busca))).map(x=>[x.institucion,true])).keys()].sort((a,b)=>a.localeCompare(b,'es'));
 return <><div className="portal19-tabbar" role="group" aria-label="Vistas de competencia"><button aria-pressed={vista==='precios'} className={vista==='precios'?'active':''} onClick={()=>setVista('precios')}>Precios publicados · MXN/COP</button><button aria-pressed={vista==='instituciones'} className={vista==='instituciones'?'active':''} onClick={()=>setVista('instituciones')}>Universidades observadas</button><button aria-pressed={vista==='aliados'} className={vista==='aliados'?'active':''} onClick={()=>setVista('aliados')}>Posibles aliados</button></div>
  {vista==='precios'?<ComparadorPrecios db={db}/>:vista==='instituciones'?<><div className="portal19-card-grid"><Tarjeta title="Pregrados EAN" value={fmt(programas.length)} detail="Universo de referencia"/><Tarjeta title="Instituciones observadas" value={fmt(instituciones.length)} detail="Subconjunto de filas ANUIES vinculadas"/><Tarjeta title="Filas ANUIES" value={fmt(universo.filas.length)} detail="No equivalen a programas activos comprobados"/></div><Panel title="Instituciones mexicanas con registros académicos comparables"><input className="portal19-input" aria-label="Filtrar institución" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Filtrar universidad…"/><div className="portal19-list">{instituciones.slice(0,100).map(n=><Fila key={n} nombre={n} valor="ANUIES" nota="Ubicación y programa histórico; investigar precio y modalidad"/>)}</div></Panel></>:<Panel title="Aliados potenciales: investigación preliminar" lead="No confundir coincidencia académica con convenio existente"><Aviso>El material disponible no documenta acuerdos de colaboración con estas instituciones. La sección identifica candidatos para evaluación posterior, no aliados confirmados.</Aviso>{(db.universidades||[]).map(x=><Fila key={x.id} nombre={x.nombre} valor={x.tipo} nota={x.detalle}/>)}</Panel>}
 </>;
}
function Equivalencias(){
 const filas=[['Ministerio de Educación Nacional / MEN','SEP · Secretaría de Educación Pública','Autoridades nacionales de educación','Las atribuciones, títulos y controles no son idénticos','https://www.gob.mx/sep'],['SNIES','ANUIES / SEP / SIRVOES','Catálogo académico, estadísticas y reconocimiento por programa','ANUIES es asociación y fuente estadística; no autoridad homologadora','https://anuario.anuies.mx/'],['DANE','INEGI','Estadística nacional y encuestas','La población objetivo requiere igualar población, referencia territorial y año','https://www.inegi.org.mx/'],['DIAN','SAT','Administración tributaria','Facturación y obligaciones de una institución extranjera deben validarse','https://www.sat.gob.mx/'],['Ministerio de Relaciones Exteriores / Apostilla','SEP · revalidación de estudios extranjeros','Legalización documental vs reconocimiento académico','Apostillar no revalida ni habilita automáticamente el ejercicio profesional','https://dgair.sep.gob.mx/revalidacion_superior']];
 return <><Aviso>Son equivalencias funcionales de instituciones, no equivalencias jurídicas perfectas, ni una aprobación para que EAN ofrezca todos sus títulos en México.</Aviso><Panel title="Mapa Colombia ↔ México" lead="Traduce los referentes institucionales al proceso mexicano"><div className="portal19-list">{filas.map(([a,b,t,d,url])=><div className="portal19-row" key={a}><div><b>{a} → {b}</b><p>{t}. {d}</p></div><LinkExterno url={url}>Oficial</LinkExterno></div>)}</div></Panel></>;
}
function Legal({db}){return <><MatrizLegalCun db={db}/><Panel title="Normas y condiciones registradas" lead="Marco jurídico preliminar, no dictamen profesional"><div className="portal19-list">{(db.normas_expansion||db.normas||[]).slice(0,18).map((n,i)=><div className="portal19-row" key={n.id||i}><div><b>{n.nombre||n.norma||n.titulo||`Referencia ${i+1}`}</b><p>{n.descripcion||n.resumen||n.impacto||n.accion||'Verificar fuente, alcance y vigencia por programa.'}</p></div>{n.url&&<LinkExterno url={n.url}>Fuente</LinkExterno>}</div>)}</div></Panel></>}
function Auditoria({db,oficial,censo}){
 const urls=db.fuentes||[];
 const veri=catalogoVirtual(db);
 return <><div className="portal19-card-grid"><Tarjeta title="Pregrados EAN" value={fmt(veri.length)} detail="Publicados en las fichas EAN"/><Tarjeta title="Municipios CONAPO 2027" value={fmt(oficial.municipios?.length)} detail="Cobertura de población proyectada"/><Tarjeta title="Censo Económico municipal" value={`${censo?.n_estados??'N/D'}/32`} detail="Chihuahua (08) pendiente en el material recibido"/></div><Panel title="Trazabilidad y límites de interpretación" lead="Qué podemos afirmar y qué no"><Fila nombre="ANUIES 2025–2026" valor="Observado" nota="Matrículas y nuevo ingreso por institución; no estudiantes interesados en EAN"/><Fila nombre="CONAPO 2027" valor="Proyección" nota="Población de municipios y alcaldías; no mercado educativo adquirido"/><Fila nombre="ENIGH 2024" valor="Encuesta" nota="Valores ponderados por entidad; no ingresos por alcaldía"/><Fila nombre="ENIF 2024" valor="Encuesta" nota="Medios de pago nacional y 6 regiones, por edad 18 a 70; no transacciones de colegiaturas"/><Fila nombre="ENDUTIH 2025" valor="Encuesta" nota="Conectividad estatal; no cantidad de usuarios de Meta por ciudad"/><Fila nombre="INEGI CE2024" valor={`${censo?.n_municipios_con_registros??'N/D'} municipios`} nota="Actividad 2023; 31 de 32 paquetes, omitir datos de confidencialidad"/><Fila nombre="Precios de universidades" valor={`${preciosReferencia2026.registros.length} referencias, ${new Set(preciosReferencia2026.registros.map(x=>x.programa_cun)).size} programas`} nota="Fuentes oficiales individualizadas V24; valores por unidad de cobro, vínculos afines no siempre equivalentes"/></Panel><Aviso>Las pruebas automáticas no validan jurídicamente los programas ni reemplazan una revisión visual en navegador. Los filtros municipales no deben modificar artificialmente estadísticas exclusivamente estatales.</Aviso></>;
}
function Fuentes({db,oficial,censo}){
 const [buscar,setBuscar]=useState('');
 const fuentes=(db.fuentes||[]).filter(f=>norm([f.institucion,f.titulo,f.nota].join(' ')).includes(norm(buscar)));
 const extras=[['ANUIES','Anuario educación superior 2025–2026','https://anuario.anuies.mx/'],['INEGI','ENIF 2024 hábitos y medios de pago','https://www.inegi.org.mx/programas/enif/2024/'],['INEGI','ENIGH 2024 ingreso/gasto','https://www.inegi.org.mx/programas/enigh/nc/2024/'],['INEGI','ENDUTIH 2025 conectividad','https://www.inegi.org.mx/programas/endutih/2025/'],['INEGI','Censos Económicos 2024 municipal','https://www.inegi.org.mx/programas/ce/2024/'],['CONAPO','Proyección de población municipal 2027','https://www.gob.mx/conapo']];
 return <><div className="portal19-card-grid"><Tarjeta title="Fuentes originales registradas" value={fmt(db.fuentes?.length)} detail="Identificadas en el repositorio"/><Tarjeta title="Archivos de censo municipal" value={fmt(censo?.archivos?.length||censo?.n_estados)} detail="31 entidades, falta Chihuahua"/><Tarjeta title="Campos ANUIES adicionales" value={fmt(oficial.anuies_campos?.length)} detail="No escolarizada, 2025–2026"/></div><Panel title="Buscar en el catálogo de fuentes" lead="Abre el origen antes de emplear una cifra en una presentación"><input className="portal19-input" aria-label="Buscar fuente" value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="INEGI, CONAPO, SEP…"/><div className="portal19-list">{fuentes.map((f,i)=><div className="portal19-row" key={f.id||i}><div><b>{f.institucion} · {f.titulo}</b><p>{f.fecha} · {f.nota}</p></div>{f.url&&<LinkExterno url={f.url}>Abrir</LinkExterno>}</div>)}</div></Panel><Panel title="Fuentes oficiales principales"><div className="portal19-list">{extras.map(([entidad,nombre,url])=><div className="portal19-row" key={url}><div><b>{entidad}: {nombre}</b></div><LinkExterno url={url}>Abrir</LinkExterno></div>)}</div></Panel></>;
}
export default function VistasNegocio({tipo,db,oficial,censo,finanzas,publico,vivienda}){
 if(tipo==='oportunidades')return <React.Suspense fallback={<p role="status">Cargando síntesis documental…</p>}><OportunidadesExpansion/></React.Suspense>;
 if(tipo==='compra')return <Compra db={db} oficial={oficial} finanzas={finanzas}/>;
 if(tipo==='clientes')return <PublicoObjetivoV21 db={db} oficial={oficial} finanzas={finanzas} publico={publico}/>;
 if(tipo==='portafolio')return <Portafolio db={db}/>;
 if(tipo==='competencia')return <Competencia db={db} oficial={oficial}/>;
 if(tipo==='economia')return <FinanzasEnifEnigh db={db} oficial={oficial} finanzas={finanzas} vivienda={vivienda} publico={publico}/>;
 if(tipo==='equivalencias')return <><CentroExpansionEAN db={db}/><details className="peru-mx-panel portal19-pad"><summary>Referencias de instituciones Colombia ↔ México</summary><Equivalencias/></details></>;
 if(tipo==='leyes')return <Legal db={db}/>;
 if(tipo==='auditoria')return <Auditoria db={db} oficial={oficial} censo={censo}/>;
 if(tipo==='fuentes')return <FuentesMetodo db={db} oficial={oficial} censo={censo}/>;
 return <div>Sección no reconocida.</div>;
}
