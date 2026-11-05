(function(scope){
 const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 function market(data,programs,{modalidad='Todas',comparacion='nombre',sector='Privado',indicador='primer_curso',periodo='2025-2',conceptos=[]}={}){
  const offers=programs.flatMap(p=>p.ofertas.filter(o=>modalidad==='Todas'||o.modalidad===modalidad));
  const modes=new Set(offers.map(o=>o.modalidad)),codes=new Set(offers.map(o=>o.snies).filter(Boolean));
  const fields=new Set(offers.flatMap(o=>o.campos.filter(c=>!['0','9800'].includes(c.codigo)).map(c=>o.modalidad+'|'+c.codigo)));
  const terms=[...programs.map(p=>p.nombre),...conceptos].map(normalize).filter(Boolean);
  const filtered=data.filas.filter(r=>r.indicador===indicador&&modes.has(r.modalidad)&&(!sector||data.instituciones[r.institucion_codigo]?.sector===sector)&&(r.institucion_codigo!=='2812'||codes.has(r.snies))&&(comparacion==='campo'?fields.has(r.modalidad+'|'+r.cine):terms.some(t=>normalize(r.programa).includes(t))));
  const byInstitution=new Map();
  for(const row of filtered){let institution=byInstitution.get(row.institucion_codigo);if(!institution){institution={id:row.institucion_codigo,nombre:data.instituciones[row.institucion_codigo].nombre,sector:data.instituciones[row.institucion_codigo].sector,valores:{},registros:{}};byInstitution.set(institution.id,institution);}const period=row.ano+'-'+row.semestre;institution.valores[period]=(institution.valores[period]??0)+row.valor;institution.registros[period]=(institution.registros[period]||0)+1;}
  const ranking=[...byInstitution.values()].filter(r=>r.valores[periodo]!==undefined).sort((a,b)=>b.valores[periodo]-a.valores[periodo]||a.nombre.localeCompare(b.nombre,'es'));
  ranking.forEach((r,i)=>{r.valor=r.valores[periodo];r.posicion=i&&r.valor===ranking[i-1].valor?ranking[i-1].posicion:i+1;});
  const own=ranking.find(r=>r.id==='2812')||null,total=ranking.reduce((s,r)=>s+r.valor,0);
  const previous=[...data.periodos].sort().filter(p=>p<periodo).at(-1);
  const base=own&&previous?own.valores[previous]:undefined;
  const change=own&&base!==undefined&&base>0?(own.valor/base-1)*100:null;
  const selectedRows=filtered.filter(r=>r.ano+'-'+r.semestre===periodo).map(r=>({...r,institucion:data.instituciones[r.institucion_codigo].nombre}));
  return {ranking,own,total,participacion:own&&total>0?own.valor/total*100:null,variacion:change,base:base??null,periodo_previo:previous??null,ofertas:offers.length,periodos:data.periodos,rows:selectedRows};
 }
 function indexedValues(institution,periods,indexed){const base=institution.valores[periods[0]];return periods.map(p=>{const n=institution.valores[p];return n===undefined?null:indexed?(base>0?n/base*100:null):n;});}
 function trendValues(institution,periods,scale){
  if(scale!=='anual')return indexedValues(institution,periods,scale==='indice');
  return periods.map(p=>{const current=institution.valores[p],previous=institution.valores[String(Number(p)-1)];return current!==undefined&&previous>0?(current/previous-1)*100:null;});
 }
 function landscape(data,programs,options={}){
  const {alcance='mercado',modalidad='Todas',sector='',periodo='2025-2',indicador='primer_curso',departamento=''}=options;
  const rows=alcance==='ean'?market(data,programs,options).rows:data.filas.filter(r=>r.ano+'-'+r.semestre===periodo&&r.indicador===indicador&&(modalidad==='Todas'||r.modalidad===modalidad)&&(!sector||data.instituciones[r.institucion_codigo].sector===sector));
  function aggregate(input,key,label){const groups=new Map();for(const r of input){const id=key(r);if(!groups.has(id))groups.set(id,{id,nombre:label(r),total:0,ean:0,ean_registros:0,privadas:0,oficiales:0});const item=groups.get(id);item.total+=r.valor;if(r.institucion_codigo==='2812'){item.ean+=r.valor;item.ean_registros++;}else if(data.instituciones[r.institucion_codigo].sector==='Privado')item.privadas+=r.valor;else item.oficiales+=r.valor;}return [...groups.values()].sort((a,b)=>b.total-a.total||a.nombre.localeCompare(b.nombre,'es'));}
  const departamentos=aggregate(rows,r=>r.departamento_codigo,r=>r.departamento);
  const selected=departamento?rows.filter(r=>r.departamento_codigo===departamento):rows;
  return {departamentos,ciudades:aggregate(selected,r=>r.municipio_codigo,r=>r.municipio),carreras:aggregate(selected,r=>normalize(r.programa),r=>r.programa),total: selected.reduce((s,r)=>s+r.valor,0),total_nacional:rows.reduce((s,r)=>s+r.valor,0),filas:selected};
 }
 function historical(data,{modalidad='Todas',sector='Privado',indicador='primer_curso',semestre='2'}={}){
  const groups=new Map(),years=[...new Set(data.filas.map(r=>String(r.ano)))].sort();
  for(const r of data.filas){
   if(String(r.semestre)!==String(semestre)||r.indicador!==indicador||(sector&&r.sector!==sector)||(modalidad!=='Todas'&&r.modalidad!==modalidad))continue;
   const id=r.institucion==='UNIVERSIDAD EAN'?'2812':r.institucion;
   if(!groups.has(id))groups.set(id,{id,nombre:r.institucion,valores:{}});
   const item=groups.get(id);item.valores[r.ano]=(item.valores[r.ano]??0)+r.valor;
  }
  const last=years.at(-1),ranking=[...groups.values()].filter(r=>r.valores[last]!==undefined).sort((a,b)=>b.valores[last]-a.valores[last]||a.nombre.localeCompare(b.nombre));
  ranking.forEach((r,i)=>{r.valor=r.valores[last];r.posicion=i&&r.valor===ranking[i-1].valor?ranking[i-1].posicion:i+1;});
  const own=ranking.find(r=>r.id==='2812')??null,total=ranking.reduce((s,r)=>s+r.valor,0);
  const previous=own?.valores[String(Number(last)-1)];
  return {ranking,own,total,periodos:years,variacion:own&&previous>0?(own.valor/previous-1)*100:null,concentracion:total>0?ranking.slice(0,5).reduce((s,r)=>s+r.valor,0)/total*100:null};
 }
 const api={market,indexedValues,trendValues,historical,landscape};if(typeof module!=='undefined')module.exports=api;else scope.EanCompetition=api;
})(typeof window==='undefined'?globalThis:window);
