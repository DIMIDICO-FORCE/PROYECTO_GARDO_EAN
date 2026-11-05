import {MXN_COP_REFERENCIA} from '../shared/utils/cambio.js';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {NavLink,useLocation,useNavigate} from 'react-router-dom';
import {MapPinned,Building2,Search,Users,GraduationCap,BookOpen,Wallet,Scale,Database,ShieldCheck,ArrowLeftRight,Moon,Sun,Menu,X,ChevronRight} from 'lucide-react';
import {useTema} from './contextos/TemaContexto';
import SintesisEstudio from '../modules/oportunidades/SintesisEstudio.jsx';
import Mercado360V22 from '../modules/mercado360/Mercado360V22.jsx';
import AtlasOficialMexico from '../modules/ciudades/AtlasOficialMexico.jsx';
import VistasNegocio from './VistasNegocio.jsx';
import '../modules/mapa-mercado/mapa-mercado.css';
import './styles/portal19.css';

export const RUTAS_MX=[
 {ruta:'/oportunidades',titulo:'Oportunidades de expansión',corto:'Oportunidades',Icono:GraduationCap},
 {ruta:'/territorio',titulo:'Mapa del mercado',corto:'Mapa',Icono:MapPinned},
 {ruta:'/atlas',titulo:'Ciudad a fondo',corto:'Ciudad',Icono:Building2},
 {ruta:'/compra',titulo:'Cómo compra la gente',corto:'Compra',Icono:Search},
 {ruta:'/clientes',titulo:'Público objetivo',corto:'Clientes',Icono:Users},
 {ruta:'/portafolio',titulo:'Oferta EAN y afinidad académica',corto:'EAN · pregrados',Icono:GraduationCap},
 {ruta:'/competencia',titulo:'Competencia y precios',corto:'Competencia',Icono:BookOpen},
 {ruta:'/economia',titulo:'Finanzas del hogar',corto:'Finanzas',Icono:Wallet},
 {ruta:'/leyes',titulo:'Reglas del juego',corto:'Legal',Icono:Scale},
 {ruta:'/fuentes',titulo:'Fuentes y método',corto:'Fuentes',Icono:Database},
 {ruta:'/sintesis',titulo:'Síntesis de México',corto:'Síntesis',Icono:BookOpen}
];
const resumen={
 '/oportunidades':'Síntesis de programas, evidencia, territorios y público para priorizar la investigación de expansión EAN hacia México',
 '/territorio':'Centro integrado para localizar y comprender el mercado educativo para el portafolio EAN',
 '/atlas':'Ciudad a fondo: estratificación económica, vivienda, cultura, educación e industrias',
 '/compra':'Canales, pagos y decisiones educativas; pública frente a privada sin supuestos disfrazados',
 '/clientes':'Público objetivo: demografía, ingresos, educación, empleo y capacidad económica',
 '/portafolio':'Relación entre los pregrados virtuales EAN, las carreras observadas en México y la cobertura de evidencia del estudio',
 '/competencia':'Precios publicados, instituciones, programas comparables y referencias',
 '/economia':'Ingresos, gastos, renta, medios de pago y crédito con referencias por edad',
 '/equivalencias':'Homologación preliminar, cobertura del estudio y documentos para decidir la expansión',
 '/leyes':'Publicidad educativa, pagos transfronterizos, apostilla y profesión regulada',
 '/auditoria':'Coberturas, niveles territoriales, períodos y vacíos verificables',
 '/sintesis':'Hallazgos del contraste mexicano, público propuesto y condiciones para profundizar',
 '/fuentes':'Trazabilidad de archivos, metodología y enlaces oficiales'
};
export default function PortalMexico(){
 const location=useLocation(),navigate=useNavigate();
 const {tema,cambiarTema}=useTema();
 const [navOpen,setNavOpen]=useState(false);
 const [compact,setCompact]=useState(()=>window.matchMedia('(max-width:940px)').matches);
 const navRef=useRef(null),mainRef=useRef(null),menuRef=useRef(null);
 const [datos,setDatos]=useState(null),[oficial,setOficial]=useState(null),[censo,setCenso]=useState(null),[finanzas,setFinanzas]=useState(null),[publico,setPublico]=useState(null),[vivienda,setVivienda]=useState(null),[error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  const get=async(primary,backup)=>{const r=await fetch(primary,{signal:controller.signal});if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()};
  (async()=>{try{
   const [a,b,c,d,e,f]=await Promise.all([
    fetch('/api/datos',{signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject(Error('API'))).catch(()=>get('/datos_respaldo.json')),
    get('/fuentes_mexico_2026.json'),get('/censo_municipal_2024.json'),get('/finanzas_mexico_enif_enigh.json'),get('/publico_objetivo_enigh_2024.json'),get('/vivienda_enigh_2024.json')
   ]);
   if(!controller.signal.aborted){setDatos(a);setOficial(b);setCenso(c);setFinanzas(d);setPublico(e);setVivienda(f)}
  }catch(e){if(!controller.signal.aborted)setError(String(e.message||e))}})();
  return()=>controller.abort();
 },[]);
 const ruta=location.pathname;
 const modulo=RUTAS_MX.find(x=>x.ruta===ruta);
 useEffect(()=>{
  const media=window.matchMedia('(max-width:940px)');
  const update=()=>{setCompact(media.matches);if(!media.matches)setNavOpen(false);};
  media.addEventListener('change',update);return()=>media.removeEventListener('change',update);
 },[]);
 useEffect(()=>{
  if(!navOpen||!compact)return;
  const priorOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const focusables=()=>[...navRef.current.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length);
  focusables()[0]?.focus();
  const keyboard=event=>{
   if(event.key==='Escape'){event.preventDefault();setNavOpen(false);return;}
   if(event.key!=='Tab')return;
   const items=focusables(),first=items[0],last=items[items.length-1];
   if(!first)return;
   if(event.shiftKey&&(document.activeElement===first||!navRef.current.contains(document.activeElement))){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&(document.activeElement===last||!navRef.current.contains(document.activeElement))){event.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',keyboard);
  return()=>{document.body.style.overflow=priorOverflow;document.removeEventListener('keydown',keyboard);requestAnimationFrame(()=>menuRef.current?.focus({preventScroll:true}));};
 },[navOpen,compact]);
 useEffect(()=>{if(!modulo){
  if(ruta==='/equivalencias'||ruta==='/auditoria'){const next=new URLSearchParams(location.search);next.set('enfoque',ruta==='/equivalencias'?'curricular':'auditoria');navigate((ruta==='/equivalencias'?'/portafolio':'/fuentes')+'?'+next,{replace:true});return;}
  const alias={'/programas':'/portafolio','/precios':'/competencia','/personas':'/clientes','/búsquedas2027':'/compra','/educación':'/portafolio','/inicio':'/territorio','/competencia':'/competencia'};
  navigate((alias[ruta]||'/territorio')+location.search,{replace:true});
 }},[ruta,modulo,navigate,location.search]);
 if(!modulo)return null;
 return <div className="peru-mx-app portal19">
  <a className="portal19-skip" href="#contenido-mexico" onClick={event=>{event.preventDefault();mainRef.current?.focus();}}>Saltar al contenido</a>
  <aside id="navegacion-mexico" ref={navRef} aria-label="Navegación de México" aria-hidden={compact&&!navOpen?true:undefined} inert={compact&&!navOpen?'':undefined} className={'peru-mx-sidebar portal19-sidebar '+(navOpen?'abierto':'')}>
   <button className="portal19-nav-close" type="button" onClick={()=>setNavOpen(false)} aria-label="Cerrar menú de México"><X size={20} aria-hidden="true"/> Cerrar menú</button>
   <NavLink className="peru-mx-brand" to="/territorio" onClick={()=>setNavOpen(false)}><img className="ean-institutional-logo" src="/ean-logo.png" alt="Universidad Ean"/><span><b>EAN · MÉXICO 2027</b><small>Oferta virtual EAN y mercado mexicano</small></span></NavLink>
   <p className="peru-mx-sidebar-caption">03 · EXPANSIÓN VIRTUAL · MÉXICO</p>
   <nav aria-label="Módulos del observatorio">{RUTAS_MX.filter(x=>!['/atlas','/compra','/clientes','/economia'].includes(x.ruta)).map(({ruta:r,titulo,Icono})=><NavLink key={r} to={r} onClick={()=>setNavOpen(false)} className={({isActive})=>'peru-mx-menu-item '+(isActive?'actual':'')}><Icono size={18}/><span>{titulo}</span></NavLink>)}</nav>
   <div className="peru-mx-sidebar-bottom"><button type="button" onClick={cambiarTema}>{tema==='dark'?<Sun size={16}/>:<Moon size={16}/>} Cambiar a tema {tema==='dark'?'claro':'oscuro'}</button><small><ShieldCheck size={15}/> EAN · pregrados · Evidencia identificada</small></div>
  </aside>
  {navOpen&&compact&&<button type="button" className="portal19-screen" tabIndex={-1} onClick={()=>setNavOpen(false)} aria-label="Cerrar navegación"/>}
  <main id="contenido-mexico" ref={mainRef} tabIndex={-1} aria-labelledby="titulo-modulo-mexico" inert={compact&&navOpen?'':undefined} className="peru-mx-main portal19-main">
   <div className="portal19-mobile"><button ref={menuRef} type="button" aria-expanded={navOpen} aria-controls="navegacion-mexico" onClick={()=>setNavOpen(v=>!v)}>{navOpen?<X size={20} aria-hidden="true"/>:<Menu size={20} aria-hidden="true"/>} Menú</button><b>EAN · MÉXICO 2027</b></div>
   <div className="portal19-header"><div><span>ESTUDIO DE MERCADO <ChevronRight size={12} aria-hidden="true"/> {modulo.titulo.toUpperCase()}</span><h1 id="titulo-modulo-mexico">{modulo.titulo}</h1><p>{resumen[ruta]}</p></div><div className="peru-mx-status" role="status"><i aria-hidden="true"/>{datos&&oficial?'Fuentes locales cargadas':'Cargando fuentes'}</div></div>
   <div className="portal19-content">
    {ruta==='/sintesis'?<SintesisEstudio/>:(ruta==='/atlas')?<div className="portal-embedded"><AtlasOficialMexico db={datos}/></div>:
     error?<div className="peru-mx-panel portal19-pad" role="alert">No fue posible cargar los datos: {error}</div>:
     !datos||!oficial||!finanzas||!publico||!vivienda?<div className="peru-mx-panel portal19-pad" role="status">Preparando indicadores oficiales…</div>:
     ruta==='/territorio'?<Mercado360V22 db={datos} oficial={oficial} censo={censo} finanzas={finanzas} publico={publico} vivienda={vivienda}/>:<VistasNegocio tipo={ruta.slice(1)} db={datos} oficial={oficial} censo={censo} finanzas={finanzas} publico={publico} vivienda={vivienda}/>
    }
   </div>
   <footer className="portal19-footer"><p>Todos los montos mexicanos incluyen su equivalente aproximado en pesos colombianos. 1 MXN ≈ {MXN_COP_REFERENCIA.copPorMxn} COP · referencia {MXN_COP_REFERENCIA.fecha}, 20:30 de Colombia. <a href={MXN_COP_REFERENCIA.fuente} target="_blank" rel="noreferrer">Fuente cambiaria ↗</a>. Misma unidad de cobro; tasa fija de consulta.</p>EAN · México 2027 · V24 · ENIF 2024 · ANUIES 2025–2026 · CONAPO 2027 · ENIGH 2024 · ENDUTIH 2025 · Censos Económicos 2024. Las cifras de mercado no representan compradores reales ni reconocimiento automático de títulos.</footer>
  </main>
 </div>;
}
