(function(scope){
 const normalizar=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
 function resumir(data,{ano=2025,modalidad='Todas',nivel=''}={}){
  const rows=data.filas.filter(r=>r.ano===Number(ano)&&(modalidad==='Todas'||r.modalidad===modalidad)&&(!nivel||r.nivel===nivel)&&(r.indicador==='graduados'||r.semestre===2));
  const totals={},levels=new Map(),programs=new Map();
  for(const r of rows){totals[r.indicador]=(totals[r.indicador]??0)+r.valor;if(!levels.has(r.nivel))levels.set(r.nivel,{nombre:r.nivel});const l=levels.get(r.nivel);l[r.indicador]=(l[r.indicador]??0)+r.valor;
   const key=normalizar(r.programa)+'|'+r.nivel;if(!programs.has(key))programs.set(key,{nombre:r.programa,nivel:r.nivel});const p=programs.get(key);p[r.indicador]=(p[r.indicador]??0)+r.valor;
  }return {totales:totals,niveles:[...levels.values()],programas:[...programs.values()],filas:rows};
 }
 const api={resumir};if(typeof module!=='undefined')module.exports=api;else scope.PerfilEAN=api;
})(typeof window==='undefined'?globalThis:window);
