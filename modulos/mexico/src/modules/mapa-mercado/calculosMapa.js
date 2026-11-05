import {claveEntidad} from '../../entidades-anuies.js';

export const TODAS='__TODOS__';
export const metricas=[
 {id:'nuevo_ingreso_total',nombre:'Nuevos estudiantes',breve:'Nuevos',nota:'Nuevo ingreso ANUIES 2025–2026'},
 {id:'matricula_total',nombre:'Matrícula',breve:'Matrícula',nota:'Matrícula registrada en el ciclo'},
 {id:'egresados_total',nombre:'Egresados',breve:'Egresados',nota:'Egresos, no tasa de graduación'},
 {id:'instituciones',nombre:'Instituciones observadas',breve:'Instituciones',nota:'Instituciones únicas en el subconjunto'}
];
export const normalizar=(texto)=>String(texto??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
export function catalogoVirtual(db){
 const vigentes=new Set((db?.portafolio_cun||[]).filter(r=>r.vigencia==='PUBLICADA'&&r.modalidad==='VIRTUAL').map(r=>normalizar(r.programa_normalizado)));
 const catalogo=[...new Set((db?.homologacion_programas_cun_mexico||[]).map(r=>r.programa_cun).filter(p=>vigentes.has(normalizar(p))))].sort((a,b)=>a.localeCompare(b,'es'));
 return catalogo;
}
/** La fila ANUIES se cuenta UNA vez por id aun si se relaciona con varios programas. */
export function construirUniverso(db,{programa=TODAS,nivel='TODOS',capa='directa',institucion=''}={}){
 const todos=catalogoVirtual(db);
 const levels=new Map((db?.homologacion_programas_cun_mexico||[]).map(r=>[r.programa_cun,normalizar(r.nivel_cun)]));
 const elegibles=todos.filter(p=>(programa===TODAS||p===programa)&&(nivel==='TODOS'||(nivel==='PREGRADO'?!levels.get(p)?.includes('POST'):levels.get(p)?.includes('POST'))));
 const directos=(db?.anuies_cun_correspondencias||[]).filter(r=>elegibles.includes(r.programa_cun));
 const idDirecto=new Set(directos.map(r=>Number(r.anuies_id)));
 const refs=(db?.relaciones_academicas_cun_v15||[]).filter(r=>elegibles.includes(r.programa_cun)&&r.anuies_id!=null&&!idDirecto.has(Number(r.anuies_id)));
 const ids=new Set((capa==='directa'?directos:refs).map(r=>Number(r.anuies_id)));
 const q=normalizar(institucion);
 const filas=(db?.anuies_granular_2025_2026||[]).filter(r=>ids.has(Number(r.id))&&(!q||normalizar(r.institucion).includes(q)));
 return {filas,programas:elegibles,idsDirectos:idDirecto,programasConDato:new Set(directos.map(r=>r.programa_cun)).size,capa};
}
export function agruparEntidad(filas){
 const grupos=new Map();
 for(const r of filas){
   const codigo=claveEntidad(r.entidad);
   if(!codigo) throw Error('Entidad ANUIES sin homologación: '+r.entidad);
   let acc=grupos.get(codigo);
   if(!acc){acc={clave:codigo,estado:r.entidad,matricula_total:0,nuevo_ingreso_total:0,egresados_total:0,filas:0,instituciones:new Set(),programas:new Set()};grupos.set(codigo,acc)}
   acc.matricula_total+=Number(r.matricula_total)||0;
   acc.nuevo_ingreso_total+=Number(r.nuevo_ingreso_total)||0;
   acc.egresados_total+=Number(r.egresados_total)||0;
   acc.filas++;
   acc.instituciones.add(normalizar(r.institucion));
   acc.programas.add(normalizar(r.programa_original));
 }
 return grupos;
}
export function valorMetrica(filas,id){
 if(id==='instituciones')return new Set(filas.map(r=>normalizar(r.institucion))).size;
 return filas.reduce((n,r)=>n+(Number(r[id])||0),0);
}
export function valorGrupo(grupo,id){return id==='instituciones'?grupo.instituciones.size:(grupo[id]||0)}
export function ordenarRanking(grupos,id){return [...grupos.values()].sort((a,b)=>valorGrupo(b,id)-valorGrupo(a,id)||a.estado.localeCompare(b.estado,'es'))}
export function participacion(a,b){return b?100*a/b:0}
