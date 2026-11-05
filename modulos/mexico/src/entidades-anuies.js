import geo from './estados_mapa.json' with {type:'json'};

const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
const byAlias=new Map();
for(const state of geo){
  for(const alias of [state.nombre_oficial,state.nombre_tablero]){
    const key=norm(alias);
    if(byAlias.has(key)&&byAlias.get(key)!==state.clave)throw Error(`Alias ambiguo: ${alias}`);
    byAlias.set(key,state.clave);
  }
}
export const claveEntidad=value=>byAlias.get(norm(value))||null;
export const entidades=geo.map(({clave,nombre_tablero,nombre_oficial})=>({clave,nombre_tablero,nombre_oficial}));

/** Agrega únicamente filas del subconjunto filtrado; la clave representa ubicación institucional. */
export function resumenMapaEntidad(rows){
  const result=Object.fromEntries(entidades.map(x=>[x.clave,{filas:0,matricula:0,nuevos:0,egresados:0}]));
  for(const row of rows){
    const key=claveEntidad(row.entidad);
    if(!key)throw Error(`Entidad ANUIES sin alias verificado: ${row.entidad}`);
    const cell=result[key];
    cell.filas++;
    cell.matricula+=row.matricula_total;
    cell.nuevos+=row.nuevo_ingreso_total;
    cell.egresados+=row.egresados_total;
  }
  return result;
}
