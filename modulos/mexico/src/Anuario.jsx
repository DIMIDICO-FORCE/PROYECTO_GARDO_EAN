import React, {useMemo,useState} from 'react';
import {MapaMexico} from '@webrek/mx-geo/react';
import geo from './estados_mapa.json';
import {claveEntidad} from './entidades-anuies.js';
import {BookOpen, Download, ExternalLink, Info, GraduationCap, Users, BarChart3, ArrowRight} from 'lucide-react';

const formatter=new Intl.NumberFormat('es-MX',{maximumFractionDigits:0});
const fmt=n=>formatter.format(Number(n)||0);
const pct=(a,b)=>b?`${(100*a/b).toFixed(1)} %`:'—';
const METRICS=[
  {id:'matricula',label:'Matrícula total',help:'Personas registradas en educación superior, ciclo 2025–2026'},
  {id:'nuevo_ingreso',label:'Nuevo ingreso',help:'Nuevos estudiantes en el ciclo; no equivale a prospectos ni solicitudes'},
  {id:'egresados',label:'Egresados',help:'Egresos registrados durante el ciclo; no es tasa de graduación'}
];
const dictionary={matricula:'Matrícula',nuevo_ingreso:'Nuevo ingreso',egresados:'Egresados'};
const SEX=[['total','Total'],['mujeres','Mujeres'],['hombres','Hombres']];
const SORT=[['cantidad','Mayor volumen'],['participacion','Participación nacional'],['mujeres','Porcentaje de mujeres']];
const gname=code=>geo.find(g=>g.clave===code)?.nombre_tablero;

function ExportButton({rows}){
  function exportCsv(){
    const columns=['estado','matricula_total','matricula_mujeres','matricula_hombres','nuevo_ingreso_total','nuevo_ingreso_mujeres','nuevo_ingreso_hombres','egresados_total','egresados_mujeres','egresados_hombres','participacion_matricula_nacional_pct','participacion_ingresos_nacional_pct'];
    const q=x=>'"'+String(x??'').replaceAll('"','""')+'"';
    const data=[columns.join(';'),...rows.map(r=>columns.map(c=>q(r[c])).join(';'))].join('\r\n');
    const blob=new Blob(['\ufeff'+data],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='ANUIES_2025_2026_entidades_filtradas.csv';a.click();URL.revokeObjectURL(url);
  }
  return <button className="an-btn" onClick={exportCsv}><Download size={14}/> Exportar CSV filtrado</button>;
}

function Kpi({title,value,caption}){return <div className="kpi"><span>{title}</span><strong>{value}</strong><small>{caption}</small></div>}

export default function Anuario({db,estadoInicial='',onProgramas,onTerritorio}){
  const rows=useMemo(()=>db?.anuario_2025_2026_estados||[],[db]);
  const [estado,setEstado]=useState(estadoInicial||'Todos');
  const [metric,setMetric]=useState('nuevo_ingreso');
  const [sex,setSex]=useState('total');
  const [search,setSearch]=useState('');
  const [sort,setSort]=useState('cantidad');
  const [pageSize,setPageSize]=useState(16);
  const metricKey=`${metric}_${sex}`;
  const national=useMemo(()=>{
    const ans={};for(const m of METRICS)for(const [s] of SEX)ans[`${m.id}_${s}`]=rows.reduce((a,r)=>a+(Number(r[`${m.id}_${s}`])||0),0);
    return ans;
  },[rows]);
  const visible=useMemo(()=>{
    const key=metricKey;
    const arr=rows.filter(r=>r.estado.toLocaleLowerCase('es-MX').includes(search.toLocaleLowerCase('es-MX')));
    return [...arr].sort((a,b)=>sort==='mujeres'?(
      ((b[`${metric}_mujeres`]/(b[`${metric}_total`]||1))-(a[`${metric}_mujeres`]/(a[`${metric}_total`]||1)))
    ):b[key]-a[key]);
  },[rows,search,metricKey,metric,sort]);
  const selected=rows.find(r=>claveEntidad(r.estado)===claveEntidad(estado));
  const max=visible.length?Math.max(...visible.map(r=>r[metricKey])):1;
  const values=Object.fromEntries(geo.map(g=>[g.clave, rows.find(r=>claveEntidad(r.estado)===g.clave)?.[metricKey]||0]));
  const mainMetric=METRICS.find(m=>m.id===metric);
  const cities=(db?.ciudades_2027||[]).filter(c=>claveEntidad(c.estado_referencia)===claveEntidad(selected?.estado));
  const ctx=(db?.contexto_estados_2026||[]).find(c=>claveEntidad(c.estado)===claveEntidad(selected?.estado));
  const recommendations=(db?.recomendaciones_academicas_estado||[]).filter(c=>claveEntidad(c.estado)===claveEntidad(selected?.estado));
  if(!rows.length)return <div className="glass"><h3>No se pudo cargar el Anuario 2025–2026</h3><p>Comprueba que el proyecto V16 esté completo y que el servidor pueda leer SQLite o la copia de respaldo.</p></div>;
  return <div>
    <div className="sect-title"><span className="kicker">DATOS REALES · ANUIES · CICLO 2025–2026</span><h2>Así estudia México, estado por estado</h2><p>Ahora podemos consultar matrícula, ingreso a educación superior y egresados de las 32 entidades, desglosados entre mujeres y hombres, con el archivo del Anuario que compartiste.</p></div>
    <div className="kpis an-kpis">
      <Kpi title="Matrícula registrada" value={fmt(national.matricula_total)} caption="32 entidades · 2025–2026"/>
      <Kpi title="Nuevos estudiantes" value={fmt(national.nuevo_ingreso_total)} caption="Nuevas incorporaciones registradas"/>
      <Kpi title="Egresados" value={fmt(national.egresados_total)} caption="Egresos del ciclo; no seguimiento de cohorte"/>
      <Kpi title="Mujeres en matrícula" value={pct(national.matricula_mujeres,national.matricula_total)} caption={`${fmt(national.matricula_mujeres)} mujeres registradas`}/>
    </div>
    <div className="an-explain"><Info size={18}/><div><b>¿Qué sabemos y qué falta?</b> El archivo ofrece datos agregados por <b>estado y sexo</b>, no una lista de estudiantes. No informa carrera, edad, universidad, modalidad presencial/virtual ni interés de compra. Por eso las recomendaciones del estudio 2027 se mantienen como <b>orientaciones</b>, no como preferencias demostradas con este Excel.</div></div>
    <div className="glass an-map-shell">
      <h3>Mapa de México con matrícula, ingreso y egresados</h3>
      <p className="small">Elige qué quieres medir. El mapa cambiará sus colores y podrás pulsar un estado para ver sus cifras reales.</p>
      <div className="an-filters">
        <label>Indicador<select value={metric} onChange={e=>setMetric(e.target.value)}>{METRICS.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
        <label>Sexo<select value={sex} onChange={e=>setSex(e.target.value)}>{SEX.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>
        <label>Estado<select value={estado} onChange={e=>setEstado(e.target.value)}><option value="Todos">Todos los estados</option>{[...rows].sort((a,b)=>a.estado.localeCompare(b.estado,'es')).map(r=><option value={r.estado} key={r.estado}>{r.estado}</option>)}</select></label>
        <label>Buscar<input placeholder="Ej. Jalisco" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      </div>
      <div className="two an-map-grid">
        <div><div className="map-box"><MapaMexico zoom={{min:1,max:8}} data={values} formatValue={n=>`${fmt(n)} · ${dictionary[metric]} · ${SEX.find(([s])=>s===sex)?.[1]}`} stroke="var(--bi-border)" emptyColor="var(--bi-map-empty)" paleta="teal" ariaLabel="Mapa de México basado en matrícula y nuevo ingreso ANUIES 2025 a 2026" onSelect={e=>{const found=rows.find(r=>claveEntidad(r.estado)===e.cve);if(found)setEstado(found.estado)}}/></div><p className="small">Los valores proceden del Excel ANUIES 2025–2026. Son <b>estados completos</b>, no áreas metropolitanas ni municipios.</p></div>
        <div className="an-state-card">
          {selected?<>
            <span className="kicker">ESTADO SELECCIONADO</span><h3>{selected.estado}</h3>
            <div className="an-value">{fmt(selected[metricKey])}</div><p className="small">{mainMetric.label} · {SEX.find(([s])=>s===sex)?.[1]} · ciclo 2025–2026</p>
            <div className="an-sex-pair"><div><small>Mujeres</small><b>{fmt(selected[`${metric}_mujeres`])}</b></div><div><small>Hombres</small><b>{fmt(selected[`${metric}_hombres`])}</b></div></div>
            <p><b>Participación del total nacional:</b> {pct(selected[metricKey],national[metricKey])}</p>
            <p><b>Proporción de mujeres en este indicador:</b> {pct(selected[`${metric}_mujeres`],selected[`${metric}_total`])}</p>
            <div className="an-divider"/><h4>Relación con México 2027</h4>
            {ctx&&<p><b>Economía regional:</b> {ctx.sector_referencia}. Es contexto productivo, no demanda comprobada por carrera.</p>}
            <p><b>Áreas urbanas presentes en el modelo:</b> {cities.length}. Estas proyecciones no son totales estatales.</p>
            <p><b>Recomendaciones académicas:</b> {recommendations.length} orientaciones por nivel y edad, basadas en contexto económico.</p>
            <div className="an-actions"><button className="an-btn" onClick={()=>onProgramas(selected.estado)}><GraduationCap size={14}/> Programas del estado <ArrowRight size={13}/></button><button className="an-btn secondary" onClick={()=>onTerritorio(selected.estado)}>Mapa y ciudades</button><button className="an-btn secondary" onClick={()=>setEstado('Todos')}>Mostrar todo</button></div>
          </>:<><span className="kicker">MÉXICO ENTERO</span><h3>Selecciona una entidad</h3><div className="an-value">{fmt(national[metricKey])}</div><p className="small">{mainMetric.label} · {SEX.find(([s])=>s===sex)?.[1]}</p><p>Los resultados suman las 32 entidades y provienen del ciclo 2025–2026.</p><p>Para relacionarlos con la expansión 2027, selecciona una entidad y revisa la actividad económica y las recomendaciones educativas existentes.</p></>}
        </div>
      </div>
    </div>
    <div className="two">
      <div className="glass"><h3>Estados con mayor volumen de {mainMetric.label.toLowerCase()}</h3><div className="an-control"><label>Ordenar<select value={sort} onChange={e=>setSort(e.target.value)}>{SORT.map(([k,n])=><option value={k} key={k}>{n}</option>)}</select></label><ExportButton rows={visible}/></div><div className="an-rank-scroll">{visible.slice(0,pageSize).map((r,i)=><button key={r.estado} onClick={()=>setEstado(r.estado)} className={`an-ranking ${selected?.estado===r.estado?'selected':''}`}><div><small>{i+1}. {r.estado}</small><b>{fmt(r[metricKey])}</b></div><div className="an-meter"><i style={{width:`${100*r[metricKey]/max}%`}}/></div></button>)}</div>{pageSize<visible.length&&<button className="an-btn secondary" onClick={()=>setPageSize(32)}>Ver los 32 estados</button>}{pageSize>=visible.length&&<button className="an-btn secondary" onClick={()=>setPageSize(16)}>Mostrar menos</button>}</div>
      <div className="glass"><h3>Género y distribución territorial</h3><p className="small">Compara cada indicador con el total del país. No confundir porcentaje de mujeres con una tasa de asistencia, admisión o permanencia.</p>
        {METRICS.map(m=>{const total=national[`${m.id}_total`],women=national[`${m.id}_mujeres`];return <div className="an-gender" key={m.id}><div><b>{m.label}</b><span>{fmt(total)}</span></div><div className="an-genderbar"><i style={{width:`${100*women/total}%`}}/></div><small>Mujeres {pct(women,total)} · Hombres {pct(total-women,total)}</small></div>})}
        <div className="an-divider"/><h4>Para qué sirve el anuario</h4><p><b>Territorios de mayor volumen:</b> comparar dónde se concentra la matrícula y el ingreso.</p><p><b>Mezcla por sexo:</b> entender la distribución de los alumnos y egresados en cada entidad.</p><p><b>Ampliación académica:</b> usar estos datos para orientar investigación adicional, no para afirmar qué carrera prefiere cada estado.</p>
      </div>
    </div>
    <div className="glass"><h3>Diccionario sencillo y límites del análisis</h3><div className="an-definition-grid"><div><b>Matrícula</b><p>Personas inscritas en estudios superiores durante el ciclo.</p></div><div><b>Nuevo ingreso</b><p>Alumnos que ingresaron durante ese período. No equivale a personas que solicitaron cupo o a leads.</p></div><div><b>Egresados</b><p>Personas que terminaron un programa; no implica que se titularon ni que pertenezcan a la cohorte de nuevos ingresos.</p></div><div><b>Participación nacional</b><p>Valor del estado dividido por el total de las 32 entidades para el mismo indicador.</p></div></div>
      <p className="an-warning"><b>No calcular deserción o graduación con estos totales:</b> se necesitan cohortes seguidas a lo largo de varios años. Tampoco se puede comparar directamente el total ANUIES 2025–2026 con SEP 2024–2025 sin revisar que ambos universos estadísticos sean equivalentes.</p>
      <p className="small">Fuente: Excel del Anuario 2025–2026 suministrado el 15/oct/2026. Referencia institucional: <a href="https://anuario.anuies.mx/index.php" target="_blank" rel="noreferrer">ANUIES · anuario.anuies.mx <ExternalLink size={12} style={{display:'inline'}}/></a>. Incluye matrícula, nuevo ingreso y egresados, por sexo y entidad.</p>
    </div>
  </div>
}
