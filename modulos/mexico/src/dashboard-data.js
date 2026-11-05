/** Transformaciones puras del tablero; facilitan pruebas sin renderizar React. */
const text=value=>String(value??'').toLocaleLowerCase('es-MX');

export function segmentMetrics({city, age, ageGroups, segments, connectivityByState}) {
  const agePct=Number(ageGroups.find(row=>row.grupo===age)?.porcentaje_nacional)||0;
  const ageProxy=Math.round((Number(city?.habitantes_2027)||0)*agePct/100);
  const nseProxy=segments.reduce((sum,row)=>sum+(Number(row.poblacion_edad_nse_estimada)||0),0);
  const nationalUrbanInternetProxy=segments.reduce((sum,row)=>sum+(Number(row.poblacion_con_internet_proxy)||0),0);
  const stateRate=Number(connectivityByState.find(row=>row.estado===city?.estado_referencia)?.pct_usuarios_internet);
  const stateInternetSensitivity=Number.isFinite(stateRate)?Math.round(nseProxy*stateRate/100):null;
  return {ageProxy,nseProxy,nationalUrbanInternetProxy,stateRate,stateInternetSensitivity};
}

export function filterPrograms(rows,{state,level='Todos',age='Todas'}) {
  const numericAge=Number(age);
  return rows.filter(row=>row.estado===state && (level==='Todos'||row.nivel===level) &&
    (age==='Todas'||(Number(row.edad_desde)<=numericAge&&Number(row.edad_hasta)>=numericAge)));
}

export function filterEvents(rows,{state='Todos',topic='Todos',importance='Todas',date='',includeUndated=false,includePast=false}) {
  return rows.filter(row=>
    (state==='Todos'||row.estado===state) &&
    (topic==='Todos'||row.categoria===topic) &&
    (importance==='Todas'||String(row.importancia)===importance) &&
    (includePast||row.fecha_estado!=='Edición anterior') &&
    (row.fecha_inicio ? (!date||row.fecha_fin>=date) : includeUndated)
  ).sort((a,b)=>(a.fecha_inicio||'9999').localeCompare(b.fecha_inicio||'9999')||Number(b.importancia)-Number(a.importancia));
}

export function filterByField(rows,field,value,all='Todas') {
  return rows.filter(row=>value===all||row[field]===value);
}

export function searchAndFilterLaws(rows,{classification='Todas',query=''}) {
  const needle=text(query);
  return rows.filter(row=>(classification==='Todas'||row.clasificacion===classification)&&text(`${row.titulo} ${row.explicacion_simple}`).includes(needle));
}