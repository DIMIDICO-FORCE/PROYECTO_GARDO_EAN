/** No estima una banda completa con porcentajes suprimidos de alguna edad. */
export function porcentajePonderadoCompleto(rows,field){
 const missing=x=>x==null||x===''||!Number.isFinite(Number(x));
 if(!rows.length||rows.some(r=>missing(r.poblacion_expandida)))return null;
 const positive=rows.filter(r=>Number(r.poblacion_expandida)>0);
 if(!positive.length||positive.some(r=>r.muestra_adecuada_30===false||missing(r[field])))return null;
 const total=positive.reduce((s,r)=>s+Number(r.poblacion_expandida),0);
 return positive.reduce((s,r)=>s+Number(r[field])*Number(r.poblacion_expandida),0)/total;
}
