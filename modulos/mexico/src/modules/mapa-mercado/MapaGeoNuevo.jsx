import {textoMxnCop} from '../../shared/utils/cambio.js';
import React,{useMemo,useState} from 'react';
import {geoMercator,geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import {estadosTopoJSON} from '@webrek/mx-geo';
import entidades from '../../estados_mapa.json';
import './mapa-nuevo.css';

const ANCHO=920, ALTO=600;
const nombres=Object.fromEntries(entidades.map(x=>[x.clave,x.nombre_tablero]));
const topo=estadosTopoJSON;
const coleccion=feature(topo,topo.objects.estados);
const geom=coleccion.features.map(f=>({...f,clave:String(f.properties?.cve??f.properties?.CVE_ENT??f.id).padStart(2,'0')}));
const proy=geoMercator().fitExtent([[32,32],[ANCHO-32,ALTO-32]],{type:'FeatureCollection',features:geom});
const dibujar=geoPath(proy);
const trazados=geom.map(f=>({clave:f.clave,camino:dibujar(f)||'',caja:dibujar.bounds(f),centro:dibujar.centroid(f)}));
const maximo=values=>Math.max(1,...Object.values(values).map(x=>Number(x)||0));
const colores=['#163f5e','#146181','#177e99','#0e999e','#14b6aa','#65d8af','#c4f5c9'];
function pintar(n,max){if(!Number.isFinite(n)||n<=0)return '#172b3b';const x=Math.log1p(n)/Math.log1p(max);return colores[Math.min(colores.length-1,Math.floor(x*(colores.length-1)))]}
const fm=n=>n==null?'Sin dato':new Intl.NumberFormat('es-MX',{maximumFractionDigits:1}).format(n);
const fv=(n,indicador)=>n==null?'Sin dato':indicador.includes('%')?fm(n)+' %':indicador.includes('MXN')?textoMxnCop(n):fm(n);
/** Cartografía local: TopoJSON incluido en @webrek/mx-geo, convertido con topojson-client y proyectado con d3-geo. */
export default function MapaGeoNuevo({datos={},seleccion='',onSelect,indicador='Nuevo ingreso',mostrarEtiquetas=true}){
 const [hover,setHover]=useState('');
 const mayor=useMemo(()=>maximo(datos),[datos]);
 const activo=trazados.find(f=>f.clave===seleccion);
 const zoom=useMemo(()=>{if(!activo)return {k:1,x:0,y:0};const [[x0,y0],[x1,y1]]=activo.caja;const k=Math.min(6.2,.79*Math.min(ANCHO/Math.max(1,x1-x0),ALTO/Math.max(1,y1-y0)));return {k,x:ANCHO/2-k*(x0+x1)/2,y:ALTO/2-k*(y0+y1)/2}},[activo]);
 const sel=hover||seleccion;
 return <div className="mapa18" aria-label="Mapa geográfico interactivo de México por entidad">
   <div className="mapa18-bar"><div><strong>Distribución por entidad federativa</strong><span>Cartografía estatal INEGI · selecciona una entidad</span></div><div className="mapa18-buttons"><button type="button" onClick={()=>onSelect('')} disabled={!seleccion}>Restablecer zoom</button></div></div>
   <div className="mapa18-canvas"><svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="group" aria-label={`Mapa de México, indicador ${indicador}. Selecciona una entidad con Enter o espacio; también puedes usar el selector de entidad.`}>
     <defs><pattern id="mx-puntos18" width="19" height="19" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#40627c" opacity=".43"/></pattern><filter id="mx-sombra18"><feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity=".35"/></filter></defs>
     <rect width={ANCHO} height={ALTO} fill="url(#mx-puntos18)"/>
     <g className="mapa18-geo" style={{transform:`translate(${zoom.x}px,${zoom.y}px) scale(${zoom.k})`}}>
       {trazados.map(f=><path key={f.clave} d={f.camino} role="button" tabIndex={0} aria-pressed={seleccion===f.clave} aria-label={`${nombres[f.clave]||f.clave}: ${fv(datos[f.clave],indicador)} · ${indicador}`} fill={pintar(Number(datos[f.clave])||0,mayor)} stroke={f.clave===seleccion?'#fff':'#27576a'} strokeWidth={(f.clave===seleccion?2.3:1.1)/zoom.k} opacity={seleccion&&seleccion!==f.clave?.64:1} className={'mapa18-state '+(seleccion===f.clave?'is-selected':'')} onClick={()=>onSelect(seleccion===f.clave?'':f.clave)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(seleccion===f.clave?'':f.clave);}}} onFocus={()=>setHover(f.clave)} onBlur={()=>setHover('')} onMouseEnter={()=>setHover(f.clave)} onMouseLeave={()=>setHover('')}><title>{nombres[f.clave]||f.clave}: {fv(datos[f.clave],indicador)} · {indicador}</title></path>)}
       {mostrarEtiquetas&&trazados.filter(f=>Number(datos[f.clave])>0).sort((a,b)=>(Number(datos[b.clave])||0)-(Number(datos[a.clave])||0)).slice(0,9).map(f=><text key={f.clave} x={f.centro[0]} y={f.centro[1]} textAnchor="middle" className="mapa18-label" fontSize={11/zoom.k} strokeWidth={3/zoom.k} pointerEvents="none">{nombres[f.clave]?.length>15?nombres[f.clave].split(' ')[0]:nombres[f.clave]}</text>)}
     </g>
   </svg>
   <div className="mapa18-hover"><span>{nombres[sel]||'México completo'}</span><strong>{sel?fv(datos[sel],indicador):'32 entidades'}</strong><small>{indicador}</small></div>
   </div>
   <div className="mapa18-legend"><span>Sin registros</span><i className="mapa18-empty"/>{colores.map((c,i)=><i key={i} style={{background:c}}/>)}<span>Mayor concentración</span><span className="mapa18-source">Mapa nuevo: TopoJSON estatal → D3-geo · 32 entidades</span></div>
 </div>;
}
