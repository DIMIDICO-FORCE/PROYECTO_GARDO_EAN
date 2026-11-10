(function(scope){
 function mercado(data,{ano=2025,nivel='',modalidad='Todas',sector='',indicador='matricula'}={}){
  const temporal=data.filas.filter(r=>r.indicador===indicador&&(indicador==='graduados'||r.semestre===2)&&(!nivel||r.nivel===nivel)&&(modalidad==='Todas'||r.modalidad===modalidad)&&(!sector||r.sector===sector));
  const groups=new Map();for(const r of temporal){if(!groups.has(r.institucion))groups.set(r.institucion,{nombre:r.institucion,sector:r.sector,valores:{}});const g=groups.get(r.institucion);g.valores[r.ano]=(g.valores[r.ano]??0)+r.valor;}
  const ranking=[...groups.values()].filter(r=>r.valores[ano]!==undefined).sort((a,b)=>b.valores[ano]-a.valores[ano]||a.nombre.localeCompare(b.nombre,'es'));
  ranking.forEach((r,i)=>{r.valor=r.valores[ano];r.posicion=i&&r.valor===ranking[i-1].valor?ranking[i-1].posicion:i+1;});
  const own=ranking.find(r=>r.nombre==='UNIVERSIDAD EAN')??null,total=ranking.reduce((s,r)=>s+r.valor,0),previous=own?.valores[ano-1];
  const totalAnterior=[...groups.values()].reduce((s,r)=>s+(r.valores[ano-1]??0),0);
  const variacionMercado=ranking.length&&totalAnterior>0?(total/totalAnterior-1)*100:null;
  const rows=temporal.filter(r=>r.ano===Number(ano));function agg(key){const m=new Map();for(const r of rows)m.set(r[key],(m.get(r[key])??0)+r.valor);return [...m].map(([nombre,valor])=>({nombre,valor})).sort((a,b)=>b.valor-a.valor);}
  return {ranking,own,total,participacion:own&&total>0?own.valor/total*100:null,variacion:own&&previous>0?(own.valor/previous-1)*100:null,variacionMercado,niveles:agg('nivel'),modalidades:agg('modalidad'),filas:rows};
 }
 const api={mercado};if(typeof module!=='undefined')module.exports=api;else scope.MercadoGeneral=api;
})(typeof window==='undefined'?globalThis:window);
