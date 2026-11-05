import React,{useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import MapaGeoNuevo from './MapaGeoNuevo.jsx';
import {BookOpen,Building2,ChevronRight,GraduationCap,Layers3,MapPinned,Moon,Sun,RotateCcw,ArrowUpRight,ChartNoAxesCombined,Info,ShieldCheck,Wallet,Users,Search,Scale,Database,PanelLeftClose} from 'lucide-react';
import {customFetch} from '../../shared/utils/api';
import {useTema} from '../../app/contextos/TemaContexto';
import entidades from '../../estados_mapa.json';
import {claveEntidad} from '../../entidades-anuies.js';
import {catalogoVirtual,construirUniverso,agruparEntidad,valorMetrica,valorGrupo,ordenarRanking,participacion,metricas,TODAS} from './calculosMapa';
import './mapa-mercado.css';

const fmt=n=>new Intl.NumberFormat('es-MX',{maximumFractionDigits:0}).format(n??0);
const pct=n=>`${new Intl.NumberFormat('es-MX',{maximumFractionDigits:1}).format(n)} %`;
const nombre=codigo=>entidades.find(e=>e.clave===codigo)?.nombre_tablero||'Entidad';
const MENUS=[
 ['Mapa del mercado','/territorio',MapPinned],['Ciudad a fondo','/atlas',Building2],['Cómo compra la gente','/b%C3%BAsquedas2027',Search],
 ['Clientes ideales','/personas',Users],['Nuestro portafolio','/programas',GraduationCap],['Competencia','/competencia',BookOpen],
 ['Economía y precios','/precios',Wallet],['Reglas del juego','/leyes',Scale],['Datos y fuentes','/fuentes',Database]
];
class LimiteMapa extends React.Component{
 constructor(props){super(props);this.state={error:null}}
 static getDerivedStateFromError(error){return {error}}
 componentDidCatch(error){console.error('No se pudo dibujar el mapa geográfico:',error)}
 render(){if(this.state.error)return <div className="peru-mx-map-fallback" role="alert"><b>El mapa geográfico no se pudo representar.</b><span>Los filtros, indicadores, estados y ranking siguen funcionando. Error: {this.state.error.message}</span><span>Selecciona la entidad desde el filtro o ranking de la derecha.</span></div>;return this.props.children}
}
function Tarjeta({etiqueta,valor,nota}){return <article className="peru-mx-kpi"><span>{etiqueta}</span><strong>{valor}</strong><small>{nota}</small></article>}
function Filtro({titulo,children}){return <label className="peru-mx-filter"><span>{titulo}</span>{children}</label>}
export default function MapaMercadoMexico(){
 const [db,setDb]=useState(null);
 const [error,setError]=useState('');
 const [origen,setOrigen]=useState('');
 const [reiniciar,setReiniciar]=useState(0);
 const [programa,setPrograma]=useState(TODAS);
 const [nivel,setNivel]=useState('TODOS');
 const [capa,setCapa]=useState('directa');
 const [metrica,setMetrica]=useState('nuevo_ingreso_total');
 const [estado,setEstado]=useState('');
 const [institucion,setInstitucion]=useState('');
 const [menuAbierto,setMenuAbierto]=useState(false);
 const {tema,cambiarTema}=useTema();
 useEffect(()=>{
   const abort=new AbortController();
   (async()=>{
    setError('');setDb(null);
    try{
      const response=await customFetch('/api/datos',{signal:abort.signal,tiempoMs:12000});
      const datos=await response.json();if(!abort.signal.aborted){setDb(datos);setOrigen('SQLite · API local')}
    }catch(err){
      if(abort.signal.aborted)return;
      try{
        const resp=await customFetch('/datos_respaldo.json',{signal:abort.signal,tiempoMs:16000});
        const datos=await resp.json();if(!abort.signal.aborted){setDb(datos);setOrigen('Respaldo JSON validado')}
      }catch(err2){if(!abort.signal.aborted)setError(`API y respaldo no disponibles: ${err2.message}`)}
    }
   })();
   return ()=>abort.abort();
 },[reiniciar]);
 const programas=useMemo(()=>catalogoVirtual(db),[db]);
 const universo=useMemo(()=>construirUniverso(db,{programa,nivel,capa,institucion}),[db,programa,nivel,capa,institucion]);
 const grupos=useMemo(()=>agruparEntidad(universo.filas),[universo]);
 const ranking=useMemo(()=>ordenarRanking(grupos,metrica),[grupos,metrica]);
 const meta=metricas.find(m=>m.id===metrica);
 const filasEstado=useMemo(()=>estado?universo.filas.filter(r=>claveEntidad(r.entidad)===estado):universo.filas,[universo,estado]);
 const totalGlobal=valorMetrica(universo.filas,metrica);
 const totalFiltrado=valorMetrica(filasEstado,metrica);
 const resumenActivo=grupos.get(estado);
 const datosMapa=useMemo(()=>Object.fromEntries([...grupos.entries()].map(([codigo,g])=>[codigo,valorGrupo(g,metrica)])),[grupos,metrica]);
 const nInst=new Set(filasEstado.map(x=>x.institucion)).size;
 const instituciones=useMemo(()=>{
  const ranked=new Map();
  for(const r of filasEstado){const k=r.institucion,actual=ranked.get(k)||{nombre:k,nuevos:0,matricula:0};actual.nuevos+=r.nuevo_ingreso_total;actual.matricula+=r.matricula_total;ranked.set(k,actual)}
  return [...ranked.values()].sort((a,b)=>b.nuevos-a.nuevos||a.nombre.localeCompare(b.nombre,'es')).slice(0,8)
 },[filasEstado]);
 const programasDirectos=useMemo(()=>{
  const links=(db?.anuies_cun_correspondencias||[]);
  const idFilas=new Set(universo.filas.map(r=>r.id));
  return new Set(links.filter(l=>idFilas.has(l.anuies_id)&&universo.programas.includes(l.programa_cun)).map(l=>l.programa_cun)).size;
 },[db,universo]);
 const enlacePrograma='/portafolio?programa='+encodeURIComponent(programa)+'&entidad='+encodeURIComponent(resumenActivo?.estado||'');
 const limpiar=()=>{setPrograma(TODAS);setNivel('TODOS');setCapa('directa');setMetrica('nuevo_ingreso_total');setEstado('');setInstitucion('')};
 return <div className="peru-mx-app">
   <aside className={'peru-mx-sidebar '+(menuAbierto?'abierto':'')} aria-label="Navegación del estudio">
    <Link className="peru-mx-brand" to="/territorio"><span className="peru-mx-monograma">C</span><span><b>EAN · México 2027</b><small>Observatorio de educación virtual</small></span></Link>
    <p className="peru-mx-sidebar-caption">ESTUDIO DE MERCADO</p>
    <nav>{MENUS.map(([texto,ruta,Icon])=><Link key={texto} className={'peru-mx-menu-item '+(ruta==='/territorio'?'actual':'')} to={ruta} onClick={()=>setMenuAbierto(false)}><Icon size={18}/>{texto}{ruta==='/territorio'&&<ChevronRight size={14} className="peru-mx-chevron"/>}</Link>)}</nav>
    <div className="peru-mx-sidebar-bottom"><button onClick={cambiarTema}>{tema==='dark'?<Sun size={17}/>:<Moon size={17}/>} Tema {tema==='dark'?'claro':'oscuro'}</button><small><ShieldCheck size={14}/> ANUIES 2025–2026 · EAN · pregrados</small></div>
   </aside>
   <main className="peru-mx-main"><div className="peru-mx-container">
    <header className="peru-mx-heading"><div><div className="peru-mx-breadcrumb"><button className="peru-mx-mobile-menu" type="button" onClick={()=>setMenuAbierto(s=>!s)} aria-expanded={menuAbierto}><PanelLeftClose size={18}/> Menú</button> INVESTIGACIÓN INTERNACIONAL <ChevronRight size={13}/> MÉXICO 2027</div><h1>Mapa del mercado</h1><p>¿Dónde se concentran los estudiantes de programas comparables a la oferta <b>virtual vigente de EAN</b>?</p></div><div className="peru-mx-status"><i/>{origen||'Preparando datos'}</div></header>
    {error?<div className="peru-mx-panel" role="alert"><h2>No se pudieron cargar los datos</h2><p>{error}</p><button className="peru-mx-primary" onClick={()=>setReiniciar(x=>x+1)}>Reintentar</button></div>:!db?<div className="peru-mx-panel" role="status">Cargando datos de México y ANUIES…</div>:<>
     <div className="peru-mx-context"><Info size={18}/><p><b>Lectura correcta:</b> ANUIES describe matrícula y nuevo ingreso de instituciones mexicanas, no matrículas potenciales para EAN. El mapa permite ver relaciones académicas <b>directas</b> y <b>afines</b> por separado. La modalidad «no escolarizada» no equivale automáticamente a 100 % virtual.</p></div>
     <div className="peru-mx-controls peru-mx-panel">
      <Filtro titulo="Programa de EAN"><select value={programa} onChange={e=>{setPrograma(e.target.value);setEstado('')}}><option value={TODAS}>Todos los pregrados EAN publicados ({programas.length})</option>{programas.map(p=><option key={p} value={p}>{p}</option>)}</select></Filtro>
      <Filtro titulo="Nivel EAN"><select value={nivel} onChange={e=>{setNivel(e.target.value);setEstado('')}}><option value="TODOS">Pregrado y posgrado</option><option value="PREGRADO">Pregrado</option><option value="POSTGRADO">Posgrado</option></select></Filtro>
      <Filtro titulo="Capa de análisis"><select value={capa} onChange={e=>{setCapa(e.target.value);setEstado('')}}><option value="directa">Correspondencias directas</option><option value="afin">Afinidades académicas (no aditivas)</option></select></Filtro>
      <Filtro titulo="Indicador"><select value={metrica} onChange={e=>setMetrica(e.target.value)}>{metricas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}</select></Filtro>
      <Filtro titulo="Entidad federativa"><select value={estado} onChange={e=>setEstado(e.target.value)}><option value="">Las 32 entidades</option>{entidades.map(e=><option key={e.clave} value={e.clave}>{e.nombre_tablero}</option>)}</select></Filtro>
      <Filtro titulo="Institución (búsqueda)"><input value={institucion} onChange={e=>{setInstitucion(e.target.value);setEstado('')}} placeholder="Buscar por nombre…" aria-label="Filtrar institución"/></Filtro>
      <button className="peru-mx-reset" type="button" onClick={limpiar}><RotateCcw size={15}/> Restablecer</button>
     </div>
     <div className="peru-mx-summary">
       <Tarjeta etiqueta={meta.nombre+' · selección'} valor={fmt(totalFiltrado)} nota={estado?nombre(estado):'Universo de entidades filtrado'}/>
       <Tarjeta etiqueta="Instituciones observadas" valor={fmt(nInst)} nota="Únicas, según ANUIES"/>
       <Tarjeta etiqueta="Programas EAN con cruce" valor={capa==='directa'?fmt(programasDirectos):'Referencias afines'} nota={capa==='directa'?'De los programas virtuales elegibles':'No sumables entre programas'}/>
       <Tarjeta etiqueta="Ámbito de la evidencia" valor={capa==='directa'?'Directa':'Afín'} nota="ANUIES 2025–2026 · entidad del plantel"/>
     </div>
     <div className="peru-mx-layout">
      <section className="peru-mx-insights peru-mx-panel"><h2>Lectura de los datos</h2><div className="peru-mx-big-number">{fmt(totalFiltrado)}<small>{meta.breve.toLowerCase()} · {estado?nombre(estado):'todas las entidades'}</small></div><div className="peru-mx-mini"><span>Participación dentro del subconjunto</span><b>{estado?pct(participacion(totalFiltrado,totalGlobal)):'100 %'}</b></div><div className="peru-mx-progress"><i style={{width:`${estado?participacion(totalFiltrado,totalGlobal):100}%`}}/></div><div className="peru-mx-divider"/><h3>Qué indica esta cifra</h3><p>{meta.nota}. Solo se cuentan filas únicas de las exportaciones ANUIES vinculadas con los programas seleccionados.</p><div className="peru-mx-caveat"><Info size={16}/><span>{capa==='afin'?'Los registros de afinidad pueden referirse a varios programas EAN y NO deben sumarse entre programas.':'Las correspondencias por nombre son académicas, no equivalencias curriculares o legales.'}</span></div><Link className="peru-mx-text-link" to={enlacePrograma}>Examinar programas EAN <ArrowUpRight size={15}/></Link>{estado&&<Link className="peru-mx-text-link" to={`/atlas?entidad=${encodeURIComponent(estado)}`}>Explorar ciudades y alcaldías de {nombre(estado)} <ArrowUpRight size={15}/></Link>}</section>
      <section className="peru-mx-map-card peru-mx-panel"><div className="peru-mx-map-head"><div><span className="peru-mx-kicker">DISTRIBUCIÓN TERRITORIAL · MÉXICO</span><h2>{meta.nombre}</h2><p>Selecciona un estado para segmentar todos los indicadores.</p></div><div className="peru-mx-map-actions">{estado&&<button onClick={()=>setEstado('')}>Ver todo México</button>}</div></div>
        <div className="peru-mx-map-stage"><div className="peru-mx-map-glow"/><LimiteMapa><MapaGeoNuevo datos={datosMapa} seleccion={estado} onSelect={setEstado} indicador={meta.nombre}/></LimiteMapa></div>
        <div className="peru-mx-map-foot"><div className="peru-mx-legend"><i/><span>Menor concentración</span><div className="peru-mx-gradient"/><span>Mayor concentración</span></div><small>{ranking.length}/32 entidades con registros en este subconjunto</small></div>
      </section>
      <aside className="peru-mx-ranking peru-mx-panel"><div className="peru-mx-rank-head"><h2>Ranking por entidad</h2><small>{meta.nombre} · {ranking.length} con datos</small></div><div className="peru-mx-rank-list">{ranking.map((r,i)=><button key={r.clave} className={estado===r.clave?'selected':''} onClick={()=>setEstado(s=>s===r.clave?'':r.clave)}><span className="peru-mx-rank-num">{String(i+1).padStart(2,'0')}</span><span className="peru-mx-rank-name">{nombre(r.clave)}<small>{r.instituciones.size} instituciones · {r.programas.size} carreras observadas</small></span><b>{fmt(valorGrupo(r,metrica))}</b></button>)}{!ranking.length&&<p>No hay filas en el subconjunto elegido. Cambia de programa o capa.</p>}</div></aside>
     </div>
     <section className="peru-mx-bottom-grid"><div className="peru-mx-panel"><h2>{estado?'Detalle de '+nombre(estado):'Instituciones principales del subconjunto'}</h2><p className="peru-mx-help">Instituciones con mayor nuevo ingreso en las filas observadas, sin interpretar el dato como intención de matricularse en EAN.</p><div className="peru-mx-instituciones">{instituciones.length?instituciones.map((x,i)=><div key={x.nombre}><b>{i+1}. {x.nombre}</b><span>{fmt(x.nuevos)} nuevos</span></div>):<p>Sin instituciones para esta selección.</p>}</div></div><div className="peru-mx-panel"><h2>Programas EAN a fondo</h2><p className="peru-mx-help">Estás comparando {programa===TODAS?'todos los programas virtuales vigentes':programa}. La selección permite revisar evidencia de cada programa, instituciones y precios publicados.</p><Link className="peru-mx-primary" to={enlacePrograma}>Ver programas y precios <ArrowUpRight size={16}/></Link><h3>Alcance de la etapa</h3><p>Datos de la institución por entidad federativa, no por domicilio del estudiante. El detalle de ciudades, compradores y costos de vida se integra en la siguiente etapa.</p></div></section>
     <footer className="peru-mx-footer">Fuente: ANUIES 2025–2026 y portafolio institucional EAN. Los cruces afines son orientaciones académicas; no homologación legal ni demanda comercial. <Link to="/fuentes">Consultar procedencia →</Link></footer>
    </>}
   </div></main>
 </div>
}
