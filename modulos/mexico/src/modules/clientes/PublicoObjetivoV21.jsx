import {textoMxnCop} from '../../shared/utils/cambio.js';
import ContextoProgramaEAN from '../../shared/ContextoProgramaEAN.jsx';
import React,{useMemo,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {ExternalLink,Info} from 'lucide-react';
import {catalogoVirtual,normalizar} from '../mapa-mercado/calculosMapa.js';
import {convertirMxnCop,dineroCop,MXN_COP_REFERENCIA} from '../../shared/utils/cambio.js';
import './publico-objetivo.css';

const fmt=n=>n==null||!Number.isFinite(Number(n))?'N/D':new Intl.NumberFormat('es-MX',{maximumFractionDigits:0}).format(n);
const money=textoMxnCop;
const pct=n=>n==null||!Number.isFinite(Number(n))?'N/D':`${Number(n).toLocaleString('es-MX',{maximumFractionDigits:1})} %`;
const MINIMO_MENSUAL=315.04*365/12; // Referencia general CONASAMI 2026, NO zona fronteriza
const EDADES=[['20-24','20–24 años'],['25-34','25–34 años'],['35-44','35–44 años'],['45-59','45–59 años']];
const QUINTILES=[['Todos','Todos los ingresos'],['Q1','D1–D2 · ingresos bajos'],['Q2','D3–D4 · medio-bajos'],['Q3','D5–D6 · medios'],['Q4','D7–D8 · medio-altos'],['Q5','D9–D10 · altos']];
function Kpi({label,value,note}){return <div className="pub21-kpi"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function Panel({title,lead,children}){return <section className="pub21-panel"><h3>{title}</h3><p className="pub21-lead">{lead}</p>{children}</section>}
function Barra({label,value,foot}){return <div className="pub21-bar"><div><b>{label}</b><strong>{pct(value)}</strong></div><div className="pub21-track"><i style={{width:`${Math.max(0,Math.min(100,Number(value)||0))}%`}}/></div><small>{foot}</small></div>}
function habitantesMunicipales(rows,edad){const c={'20-24':['edad_20_24'],'25-34':['edad_25_29','edad_30_34'],'35-44':['edad_35_39','edad_40_44']}[edad];return c?rows.reduce((a,r)=>a+c.reduce((s,k)=>s+(Number(r[k])||0),0),0):null}
export default function PublicoObjetivoV21({db,oficial,finanzas,publico}){
 const [params]=useSearchParams();
 const [estado,setEstado]=useState(()=>params.get('entidad')||'09'),[municipio,setMunicipio]=useState(()=>params.get('municipio')||''),[edad,setEdad]=useState(()=>params.get('edad')||'25-34'),[quintil,setQuintil]=useState(()=>params.get('quintil')||'Todos'),[nivel,setNivel]=useState(()=>params.get('nivel')||'pregrado'),[programa,setPrograma]=useState(()=>params.get('programa')||'__TODOS__'),[cuota,setCuota]=useState(1800);
 const estados=oficial.entidades||[];
 const actual=estados.find(x=>x.cve_ent===estado);
 const municipios=useMemo(()=>(oficial.municipios||[]).filter(x=>x.cve_ent===estado).sort((a,b)=>b.poblacion_2027-a.poblacion_2027),[oficial,estado]);
 const selected=municipios.find(x=>x.cvegeo===municipio);
 const pop=habitantesMunicipales(selected?[selected]:municipios,edad);
 const programas=catalogoVirtual(db);
 const ficha=(db.homologacion_programas_cun_mexico||[]).find(x=>x.programa_cun===programa);
 const nivelFinal='pregrado';
 const hogares=publico.hogares.find(x=>x.cve_ent===estado&&x.quintil===quintil);
 const hogaresTotales=publico.hogares.find(x=>x.cve_ent===estado&&x.quintil==='Todos');
 const personas=publico.personas.find(x=>x.cve_ent===estado&&x.edad===edad&&x.quintil===quintil);
 const encuesta=personas?.muestra_adecuada_30?personas:null;
 const ingreso=hogares?.ingreso_promedio_hogar_mxn;
 const mediana=hogares?.ingreso_mediano_hogar_mxn;
 const cuotaPromedio=ingreso>0?100*cuota/ingreso:null;
 const cuotaMediana=mediana>0?100*cuota/mediana:null;
 const gasto=finanzas.enigh_gasto_hogares.find(x=>x.cve_ent===estado);
 const academicLabel=nivelFinal==='posgrado'?'Nivel declarado: licenciatura o más':'Nivel declarado: bachillerato/normal o más';
 const academicValue=nivelFinal==='posgrado'?encuesta?.porcentaje_nivel_licenciatura_o_mas:encuesta?.porcentaje_nivel_bachillerato_o_mas;
 return <div className="pub21" data-testid="clientes-v21">
  <header><span className="pub21-kicker">PÚBLICO OBJETIVO · ENIGH 2024 + CONAPO 2027</span><h2>Quién podría estudiar en EAN · pregrados</h2><p>Personas y hogares observados, no clientes ni aspirantes confirmados. Filtra el territorio, las edades y los ingresos; el programa elegido cambia el contexto académico, no infla una estimación de compradores.</p></header>
  <ContextoProgramaEAN db={db} programa={programa}/>
  <div className="pub21-filters">
   <label>Entidad federativa<select aria-label="Entidad objetivo" value={estado} onChange={e=>{setEstado(e.target.value);setMunicipio('')}}>{estados.map(x=><option key={x.cve_ent} value={x.cve_ent}>{x.entidad}</option>)}</select></label>
   <label>Municipio o alcaldía<select aria-label="Municipio objetivo" value={municipio} onChange={e=>setMunicipio(e.target.value)}><option value="">Toda la entidad</option>{municipios.map(x=><option key={x.cvegeo} value={x.cvegeo}>{x.municipio}</option>)}</select></label>
   <label>Edad<select aria-label="Edad objetivo" value={edad} onChange={e=>setEdad(e.target.value)}>{EDADES.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
   <label>Ingreso del hogar<select aria-label="Ingresos por deciles" value={quintil} onChange={e=>setQuintil(e.target.value)}>{QUINTILES.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
   <label>Nivel educativo EAN<select aria-label="Nivel objetivo" value={nivelFinal} disabled={programa!=='__TODOS__'} onChange={e=>setNivel(e.target.value)}><option value="pregrado">Pregrado</option></select></label>
   <label className="pub21-full">Programa EAN<select aria-label="Programa virtual" value={programa} onChange={e=>setPrograma(e.target.value)}><option value="__TODOS__">Todos los pregrados EAN publicados</option>{programas.map(x=><option key={x}>{x}</option>)}</select></label>
  </div>
  <div className="pub21-kpis">
   <Kpi label="Personas de esta edad · 2027" value={fmt(pop)} note={pop===null?'Sin corte de edad municipal 45–59 en el archivo entregado':`${selected?.municipio||actual?.entidad} · CONAPO · no demanda de EAN`}/>
   <Kpi label="Ingreso mensual promedio del hogar" value={money(ingreso)} note={`ENIGH 2024 · grupo ${quintil} · ${fmt(hogares?.hogares_expandidos)} hogares expandidos en la entidad`}/>
   <Kpi label="Ingreso mediano del hogar" value={money(mediana)} note="ENIGH 2024 · 50 % de hogares de este grupo por debajo"/>
   <Kpi label="Hogares con internet" value={pct(actual?.hogares_internet_2025_pct)} note={`ENDUTIH 2025 · toda ${actual?.entidad}`}/>
  </div>
  <div className="pub21-notice"><Info size={17}/><span><b>Geografías diferentes:</b> la población cambia al escoger municipio. Ingreso, empleo, asistencia escolar y conectividad son referencias <b>de la entidad federativa</b>, incluso cuando se selecciona una alcaldía o municipio. Los deciles se calcularon a escala nacional.</span></div>
  <div className="pub21-grid">
   <Panel title="Quién estudia y trabaja" lead={`${actual?.entidad} · ${edad} años · ${quintil} · muestra ENIGH 2024`}>
    {encuesta?<><Barra label="Trabajó el mes anterior" value={encuesta.porcentaje_trabajo_mes_anterior} foot="No mide empleo formal"/><Barra label="Asiste a la escuela" value={encuesta.porcentaje_asiste_escuela} foot="No significa estar matriculado en EAN"/><Barra label="Trabaja y estudia" value={encuesta.porcentaje_trabaja_y_estudia} foot="Ambas condiciones observadas en la misma persona"/><Barra label={academicLabel} value={academicValue} foot="Nivel declarado; no verifica título, grado ni elegibilidad de admisión"/></>:<p className="pub21-missing">Sin muestra suficiente para este cruce (n={fmt(personas?.muestra_personas)}). Prueba todos los ingresos o un rango etario más amplio. No extrapolamos porcentajes inseguros.</p>}
    <small className="pub21-source">Base: {fmt(personas?.muestra_personas)} personas de muestra. Porcentajes ponderados; mínimo exploratorio de 30 respuestas, sin garantizar precisión estadística.</small>
   </Panel>
   <Panel title="¿Qué pesa una mensualidad?" lead="Simulación comercial, no colegiatura oficial EAN ni evidencia de intención de pago">
    <label className="pub21-input">Mensualidad hipotética MXN<input aria-label="Mensualidad hipotética MXN" type="number" min="0" value={cuota} onChange={e=>setCuota(Math.max(0,Number(e.target.value)||0))}/></label>
    <div className="pub21-price"><span>Equivalente en COP</span><strong>{dineroCop(convertirMxnCop(cuota))}</strong></div>
    <Barra label="% del ingreso promedio del hogar" value={cuotaPromedio} foot="Promedio del grupo seleccionado"/>
    <Barra label="% del ingreso mediano del hogar" value={cuotaMediana} foot="Mediana del grupo seleccionado"/>
    <Barra label="% del salario mínimo general" value={100*cuota/MINIMO_MENSUAL} foot={`2026 · ${money(MINIMO_MENSUAL)}/mes aprox. por trabajador, no por hogar`}/>
    <div className="pub21-price"><span>Ingreso/gasto monetario medio estatal, todos los hogares</span><strong>{money(hogaresTotales?.ingreso_promedio_hogar_mxn)} / {money(gasto?.gasto_mensual_mxn)}</strong></div>
    <small className="pub21-source">No se calcula ingreso «sobrante» restando medias no comparables. Referencia fronteriza 2026: {money(440.87)} diarios (aprox. {money(13410)}/mes); aplica solo a municipios designados. No se asigna automáticamente a toda una entidad.</small>
   </Panel>
  </div>
  <Panel title="Interpretación comercial" lead={`${programa==='__TODOS__'?'Oferta de pregrados publicada de EAN ('+programas.length+' programas)':programa} · ${nivelFinal==='posgrado'?'posgrado':'pregrado'}`}>
   <div className="pub21-segments"><div><b>Necesidad académica</b><p>{nivelFinal==='posgrado'?'Profesionales con título previo por verificar. Haber cursado licenciatura no prueba titulación ni elegibilidad.':'Bachillerato concluido y condiciones de ingreso por verificar. La encuesta no prueba grado terminado.'}</p></div><div><b>Viabilidad económica</b><p>Compara precios confirmados con ingresos medianos y medios, crédito educativo y periodicidad del pago. No equivalen a capacidad real de pago.</p></div><div><b>Canal de acceso</b><p>ENDUTIH describe conectividad. Faltan búsquedas por programa, audiencias territoriales verificables e intención declarada de matrícula.</p></div></div>
  </Panel>
  <Panel title="Deciles de ingreso familiar: referencia nacional" lead="Ingreso corriente mensual ponderado por hogar · ENIGH 2024 · los grupos Q1–Q5 unen dos deciles">
   <div className="pub21-deciles"><div className="pub21-decileheading"><b>Decil</b><b>Ingreso medio</b><b>Rango mensual</b></div>{publico.deciles_nacionales.map(d=><div key={d.decil}><b>D{d.decil}</b><strong>{money(d.ingreso_promedio_hogar_mxn)}</strong><span>{money(d.desde_mxn)} – {d.hasta_mxn==null?'sin tope':money(d.hasta_mxn)}</span></div>)}</div>
   <small className="pub21-source">Los deciles nacionales no son estratos colombianos ni segmentos comerciales validados. Las personas de una entidad se clasifican según el ingreso de su hogar respecto de estos umbrales.</small>
  </Panel>
  <div className="pub21-footer"><a href={publico.fuente.url} target="_blank" rel="noreferrer">Fuente oficial: ENIGH 2024 <ExternalLink size={12}/></a><a href="https://www.gob.mx/conasami" target="_blank" rel="noreferrer">CONASAMI · salario mínimo <ExternalLink size={12}/></a><span>Conversión COP referencial de {MXN_COP_REFERENCIA.fecha}: 1 MXN ≈ {MXN_COP_REFERENCIA.copPorMxn} COP</span></div>
 </div>
}
