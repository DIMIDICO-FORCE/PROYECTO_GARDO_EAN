(function(scope){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=n=>n==null?'Sin observación':n.toLocaleString('es-CO',{maximumFractionDigits:0});
 const pct=n=>n==null?'Sin base comparable':(n>0?'+':'')+n.toLocaleString('es-CO',{maximumFractionDigits:1})+' %';
 function short(name){
  if(/UNIFICADA NACIONAL DE EDUCACION SUPERIOR.*CUN/.test(name))return 'CUN';
  if(/NACIONAL ABIERTA Y A DISTANCIA/.test(name))return 'UNAD';
  if(name==='POLITECNICO GRANCOLOMBIANO')return 'Politécnico Grancolombiano';
  if(name==='UNIVERSIDAD EAN')return 'Universidad EAN';
  if(name==='CORPORACION UNIVERSITARIA MINUTO DE DIOS -UNIMINUTO-')return 'Uniminuto';
  if(name==='FUNDACION UNIVERSITARIA DEL AREA ANDINA')return 'Fundación Universitaria del Área Andina';
  if(name==='CORPORACION UNIVERSITARIA IBEROAMERICANA')return 'Corporación Universitaria Iberoamericana';
  return name;
 }
 function render(result,{periodo,indicador,indexed}){
  const firstCourse=indicador==='primer_curso',label=firstCourse?'Primer curso':'Matrícula',rank=result.ranking;
  const shown=rank.slice(0,7);if(result.own&&!shown.some(r=>r.id==='2812'))shown.push(result.own);
  const max=Math.max(1,...shown.map(r=>r.valor));
  document.getElementById('ean-ranking-title').textContent=firstCourse?'Quién capta más estudiantes':'Quién concentra la matrícula';
  document.getElementById('ean-ranking-scope').textContent=`${label} · ${periodo} · ${rank.length} IES con registros en el universo filtrado`;
  document.getElementById('ean-ranking').innerHTML=shown.map(r=>`<div class="ean-rank-row ${r.id==='2812'?'is-ean':''}" title="${esc(r.nombre)} · código ${r.id}"><span class="ean-rank-pos">${r.posicion}</span><div class="ean-rank-institution"><strong>${esc(short(r.nombre))}</strong><div class="ean-rank-track"><span style="width:${r.valor/max*100}%"></span></div></div><b>${number(r.valor)}</b></div>`).join('')||'<p class="ean-chart-empty">No hay registros del indicador para esta selección. Prueba otra modalidad o un universo más amplio.</p>';
  renderTrend(result,{indicador,indexed});
 }
 function renderTrend(result,{indicador,indexed,target='ean',semestre=null,scale=indexed?'indice':'volumen'}){
  const rank=result.ranking,label=indicador==='primer_curso'?'Primer curso':'Matrícula';
  const leaders=rank.filter(r=>r.id!=='2812').slice(0,target==='ean'?3:5);
  const series=[...(result.own?[result.own]:[]),...leaders];
  const periods=result.periodos;
  const palette=['#6ca8ed','#4ec2c4','var(--ed-data, #67e8f9)','#ef9c69','#dc82b1'];
  const values=series.map(r=>({r,color:r.id==='2812'?'#d6ed85':palette[leaders.indexOf(r)],values:EanCompetition.trendValues(r,periods,scale)}));
  const all=values.flatMap(s=>s.values).filter(v=>v!==null);
  const wide=target!=='ean',width=wide?1000:620,height=wide?350:300,pad={left:65,right:28,top:25,bottom:42},top=Math.max(1,...all)*1.12,bottom=Math.min(0,...all)*1.12,range=top-bottom;
  const x=i=>pad.left+i*(width-pad.left-pad.right)/Math.max(1,periods.length-1),y=v=>height-pad.bottom-(v-bottom)/range*(height-pad.top-pad.bottom);
  const ticks=Array.from({length:6},(_,i)=>bottom+range*i/5);
  const grid=ticks.map(v=>`<line x1="${pad.left}" x2="${width-pad.right}" y1="${y(v)}" y2="${y(v)}" stroke="#2a384e"/><text x="${pad.left-12}" y="${y(v)+4}" text-anchor="end" fill="#9eb1c6" font-size="11">${esc(scale==='anual'?Math.round(v)+' %':Math.abs(v)>=1000?(v/1000).toLocaleString('es-CO',{maximumFractionDigits:1})+' mil':Math.round(v))}</text>`).join('');
  const paths=values.map(s=>{
   let previous=false;const commands=[],segments=[];let segment=[];
   s.values.forEach((v,i)=>{if(v===null){previous=false;if(segment.length)segments.push(segment);segment=[];return;}commands.push((previous?'L':'M')+x(i)+','+y(v));segment.push([i,v]);previous=true;});if(segment.length)segments.push(segment);
   const area=wide&&s.r.id==='2812'?segments.map(segment=>`<path d="M${x(segment[0][0])},${y(0)} ${segment.map(([i,v])=>'L'+x(i)+','+y(v)).join(' ')} L${x(segment.at(-1)[0])},${y(0)} Z" fill="${s.color}" opacity=".12"/>`).join(''):'';
   return area+`<path d="${commands.join(' ')}" fill="none" stroke="${s.color}" stroke-linejoin="round" stroke-linecap="round" stroke-width="${s.r.id==='2812'?4:2.5}"/>`+s.values.map((v,i)=>v===null?'':`<circle cx="${x(i)}" cy="${y(v)}" r="${s.r.id==='2812'?6:4}" fill="${s.color}" stroke="#141a2a" stroke-width="2"><title>${esc(s.r.nombre)} · ${periods[i]}: ${number(s.r.valores[periods[i]])}${scale==='indice'?' · índice '+v.toFixed(1):scale==='anual'?' · variación anual '+v.toFixed(1)+' %':''}</title></circle>`).join('');
  }).join('');
  document.getElementById(target==='ean'?'ean-tendencia':'ean-historico-chart').innerHTML=all.length?`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolución de ${esc(label.toLowerCase())} de la EAN y los líderes entre ${periods.join(' y ')}. ${scale==='indice'?'Índice del primer corte igual a cien':scale==='anual'?'Variación frente al mismo semestre del año anterior':'Volumen reportado'}"><title>${semestre?'Mismo semestre '+semestre+' de cada año':'Cortes semestrales'} observados; no proyección</title>${grid}${paths}${periods.map((p,i)=>`<text x="${x(i)}" y="${height-12}" text-anchor="middle" fill="#bdc5d6" font-size="12">${p}</text>`).join('')}</svg>`:'<p class="ean-chart-empty">No hay una base comparable para esta escala. Cambia a volumen para consultar los valores disponibles.</p>';
  if(target==='ean')document.getElementById('ean-trend-note').textContent=indexed?`${periods[0]} = 100 · compara el cambio relativo; el ranking de la izquierda muestra el volumen.`:'Volúmenes por semestre · tres líderes de la selección y EAN, cuando tiene observaciones.';
  document.getElementById(target==='ean'?'ean-trend-legend':'ean-historico-legend').innerHTML=values.map(s=>{const a=s.r.valores[periods[0]],b=s.r.valores[periods.at(-1)];const change=a>0&&b!==undefined?(b/a-1)*100:null;return `<div><span class="ean-series-dot" style="background:${s.color}"></span><span title="${esc(s.r.nombre)}">${esc(short(s.r.nombre))}<small>${number(a)} → ${number(b)}</small></span><b>${pct(change)}</b></div>`;}).join('');
 }
 scope.EanCompetitionCharts={render,renderTrend};
})(window);
