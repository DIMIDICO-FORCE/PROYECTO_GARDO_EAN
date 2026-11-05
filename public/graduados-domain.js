(function(scope){
 function comparar(data,{ano=2025,nivel='Universitario',modalidad='Todas',sector='Privado'}={}){
  const rows=data.filas.filter(r=>(!nivel||r.nivel===nivel)&&(modalidad==='Todas'||r.modalidad===modalidad)&&(!sector||r.sector===sector));
  const groups=new Map();for(const r of rows){if(!groups.has(r.institucion))groups.set(r.institucion,{nombre:r.institucion,valores:{}});const g=groups.get(r.institucion);g.valores[r.ano]=(g.valores[r.ano]??0)+r.valor;}
  const ranking=[...groups.values()].filter(r=>r.valores[ano]!==undefined).sort((a,b)=>b.valores[ano]-a.valores[ano]||a.nombre.localeCompare(b.nombre,'es'));
  ranking.forEach((r,i)=>{r.valor=r.valores[ano];r.posicion=i&&r.valor===ranking[i-1].valor?ranking[i-1].posicion:i+1;});
  const own=ranking.find(r=>r.nombre==='UNIVERSIDAD EAN')??null,total=ranking.reduce((s,r)=>s+r.valor,0),previous=own?.valores[ano-1];
  return {ranking,own,total,participacion:own&&total>0?own.valor/total*100:null,variacion:own&&previous>0?(own.valor/previous-1)*100:null,filas:rows.filter(r=>r.ano===Number(ano)),anos:data.anos.filter(y=>y<=ano)};
 }
 const api={comparar};if(typeof module!=='undefined')module.exports=api;else scope.EanGraduados=api;
})(typeof window==='undefined'?globalThis:window);
