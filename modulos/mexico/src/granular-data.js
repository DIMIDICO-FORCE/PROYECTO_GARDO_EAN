/** Cruce unívoco: cada fila oficial tiene como máximo una correspondencia EAN. */
export function filterGranular(rows,links,{programa,entidad='',institucion='',modalidad='',tipo='Todas',busca=''}){
  const byId=new Map(links.filter(x=>x.programa_cun===programa && (tipo==='Todas'||x.tipo_coincidencia===tipo)).map(x=>[x.anuies_id,x]));
  const q=busca.trim().toLocaleLowerCase('es');
  return rows.filter(r=>byId.has(r.id)&&(!entidad||r.entidad===entidad)&&(!institucion||r.institucion===institucion)&&(!modalidad||r.modalidad===modalidad)&&(!q||r.programa_original.toLocaleLowerCase('es').includes(q))).map(r=>({...r,...byId.get(r.id)}));
}
export function rankGranular(rows,key){
  const groups=new Map();
  for(const r of rows){const k=r[key];const a=groups.get(k)||{nombre:k,matricula:0,nuevos:0,egresados:0,filas:0};a.matricula+=r.matricula_total;a.nuevos+=r.nuevo_ingreso_total;a.egresados+=r.egresados_total;a.filas++;groups.set(k,a)}
  return [...groups.values()].sort((a,b)=>b.nuevos-a.nuevos||a.nombre.localeCompare(b.nombre,'es'));
}
