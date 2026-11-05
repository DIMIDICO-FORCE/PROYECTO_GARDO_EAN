(function(scope){
 'use strict';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const nf=n=>Number(n).toLocaleString('es-CO',{maximumFractionDigits:0});
 const place=s=>/^bogot/i.test(String(s))?'Bogotá D.C.':String(s).toLocaleLowerCase('es-CO').replace(/(^|[\s-])\p{L}/gu,c=>c.toLocaleUpperCase('es-CO')).replace(/\bDe\b/g,'de').replace(/\bDel\b/g,'del');
 const palette=['#294d69','#377c96','#55a9b3','#a1d9c5','#d6ed85'];
 function create(){
  let data,geo,options,result,ready=false;
  const label=()=>$('co-indicador').value==='matricula'?'matriculados':'estudiantes de primer curso';
  const bars=(r,max)=>`<div class="co-bar" aria-label="EAN ${r.ean_registros?nf(r.ean):'sin registros'}, otras privadas ${nf(r.privadas)}, oficiales ${nf(r.oficiales)}"><i class="co-ean" style="width:${r.ean/max*100}%"></i><i class="co-private" style="width:${r.privadas/max*100}%"></i><i class="co-public" style="width:${r.oficiales/max*100}%"></i></div>`;
  function detail(code){const f=geo.features.find(f=>f.properties.dpto_ccdgo===code),r=result.departamentos.find(r=>r.id===code);$('co-map-detail').innerHTML=`<b>${esc(place(f.properties.dpto_cnmbr))}</b>${r?nf(r.total)+' '+label()+' · EAN '+(r.ean_registros?nf(r.ean):'sin registros territoriales')+' · otras privadas '+nf(r.privadas)+' · oficiales '+nf(r.oficiales):'Sin observaciones con estos filtros; no equivale a cero demanda.'}`;}
  function drawMap(){
   const eanLayer=$('co-capa').value==='ean';const totals=new Map(result.departamentos.filter(r=>!eanLayer||r.ean_registros>0).map(r=>[r.id,eanLayer?r.ean:r.total])),positive=[...totals.values()].filter(v=>v>0).sort((a,b)=>a-b);
   const thresholds=[.2,.4,.6,.8].map(q=>positive[Math.min(positive.length-1,Math.floor(positive.length*q))]??0);
   const color=n=>n===undefined?'#1b283c':n===0?'#2b3848':palette[thresholds.filter(t=>n>t).length];
   const mercator=([lon,lat])=>[lon,Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))*180/Math.PI];
   const points=[];function collect(c){if(typeof c[0]==='number')points.push(mercator(c));else c.forEach(collect);}geo.features.forEach(f=>collect(f.geometry.coordinates));
   const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),width=540,height=470,pad=14;
   const factor=Math.min((width-2*pad)/(maxX-minX),(height-2*pad)/(maxY-minY));
   const x0=(width-(maxX-minX)*factor)/2,y0=(height-(maxY-minY)*factor)/2;
   const ring=coordinates=>coordinates.map((p,i)=>{const [x,y]=mercator(p);return(i?'L':'M')+(x0+(x-minX)*factor).toFixed(2)+','+(y0+(maxY-y)*factor).toFixed(2);}).join(' ')+'Z';
   const shape=f=>(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates).map(p=>p.map(ring).join(' ')).join(' ');
   $('co-mapa').innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="group" aria-label="Mapa de Colombia por departamento; selecciona para consultar ciudades">${geo.features.map(f=>{const code=f.properties.dpto_ccdgo,n=totals.get(code),name=place(f.properties.dpto_cnmbr);return `<path class="co-geo-feature ${$('co-departamento').value===code?'is-selected':''}" d="${shape(f)}" fill="${color(n)}" fill-rule="evenodd" tabindex="0" role="button" aria-pressed="${$('co-departamento').value===code}" aria-label="${esc(name)}: ${n===undefined?'sin observaciones':nf(n)+' '+label()}" data-departamento="${code}"><title>${esc(name)} · ${n===undefined?'Sin observaciones':nf(n)+' '+label()}</title></path>`;}).join('')}</svg>`;
   $('co-mapa').querySelectorAll('[data-departamento]').forEach(path=>{const code=path.dataset.departamento;path.addEventListener('pointerenter',()=>detail(code));path.addEventListener('focus',()=>detail(code));const select=()=>{$('co-departamento').value=code;paint();};path.addEventListener('click',select);path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();$('co-departamento').focus();}});});
   $('co-map-legend').innerHTML=`<span>Menor volumen</span>${palette.map(c=>`<i style="background:${c}"></i>`).join('')}<span>Mayor volumen</span><span>Quintiles entre territorios con valor positivo · gris: sin observación o cero reportado</span>`;
   const selected=$('co-departamento').value;if(selected)detail(selected);else $('co-map-detail').innerHTML=`<b>${nf([...totals.values()].reduce((s,n)=>s+n,0))} ${label()} en la capa ${eanLayer?'EAN':'del mercado'}</b>Los colores mantienen la escala nacional. Gris indica ausencia de registros en la capa; no ausencia de público.`;
  }
  function paint(){
   if(!ready||!options)return;
   const settings={...options,alcance:$('co-alcance').value,indicador:$('co-indicador').value,departamento:$('co-departamento').value};
   result=EanCompetition.landscape(data,options.programs,settings);
   const name=geo.features.find(f=>f.properties.dpto_ccdgo===settings.departamento)?.properties.dpto_cnmbr;
   $('co-scope').textContent=`${options.periodo} · ${options.modalidad==='Todas'?'Todas las modalidades':options.modalidad} · sector ${options.sector||'privado y oficial'} · ${settings.alcance==='ean'?'Programas relacionados con '+(options.programs.length===1?options.programs[0].nombre:'el portafolio EAN seleccionado'):'Todo el pregrado universitario; el filtro de programa EAN no se aplica aquí'} · ${name?place(name):'Colombia completa'}. Indicador propio de esta sección: ${label()}.`;
   const departments=$('co-nivel').value==='departamentos',ranking=departments?result.departamentos:result.ciudades,max=Math.max(1,...ranking.map(r=>r.total));
   $('co-city-title').textContent=(departments?'Departamentos':'Ciudades')+($('co-indicador').value==='matricula'?' con mayor matrícula':' con más nuevos ingresos');
   $('co-city-scope').textContent=`Top ${Math.min(10,ranking.length)} de ${ranking.length} territorios con registros · ${departments?'Colombia completa':name?place(name):'Colombia completa'} · lugar de oferta.`;
   $('co-ciudades').innerHTML=ranking.slice(0,10).map((r,i)=>`<div class="co-city-row"><span>${String(i+1).padStart(2,'0')}</span><div><span class="co-place" title="${esc(place(r.nombre))} · código ${r.id}">${esc(place(r.nombre))}</span><small>EAN: ${r.ean_registros?nf(r.ean):'sin filas para este corte'}</small>${bars(r,max)}</div><b>${nf(r.total)}</b></div>`).join('')||'<p class="co-empty">No hay observaciones para este territorio y estos filtros. Puedes restablecer Colombia completa.</p>';
   $('co-career-title').textContent=settings.indicador==='matricula'?'Carreras más estudiadas':'Carreras con más nuevos ingresos';
   $('co-career-count').textContent=`${result.carreras.length} denominaciones con registros`;
   $('co-career-scope').textContent=`Top ${Math.min(15,result.carreras.length)} · ${name?place(name):'Colombia completa'} · ${nf(result.total)} ${label()} en total. Las barras separan EAN, otras privadas y oficiales dentro del sector elegido arriba.`;
   const maxCareer=Math.max(1,...result.carreras.map(r=>r.total));
   $('co-carreras').innerHTML=result.carreras.slice(0,15).map(r=>`<div class="co-career-row"><span class="co-career-name">${esc(r.nombre)}</span>${bars(r,maxCareer)}<b>${nf(r.total)}</b></div>`).join('')||'<p class="co-empty">Sin carreras con observaciones para esta selección.</p>';
   const eanTotal=result.departamentos.reduce((s,r)=>s+r.ean,0),eanPlaces=result.departamentos.filter(r=>r.ean_registros>0);
   $('co-ean-summary').textContent=eanPlaces.length?'EAN en el universo nacional filtrado: '+nf(eanTotal)+' '+label()+', reportados por lugar de oferta en '+eanPlaces.map(r=>place(r.nombre)).join(', ')+'. Los demás territorios no tienen filas EAN en este corte; esto no identifica residencia ni ausencia de público.':'EAN: sin registros para la combinación de sector, modalidad, programa y corte elegida. No se interpreta como cero demanda.';
   drawMap();
  }
  for(const id of ['co-alcance','co-indicador','co-departamento','co-nivel','co-capa'])$(id).addEventListener('change',paint);
  $('co-ver-ean').onclick=()=>{$('co-departamento').value='11';$('co-nivel').value='ciudades';paint();};
  $('co-restablecer').onclick=()=>{$('co-departamento').value='';paint();};
  $('co-exportar').onclick=()=>{if(!result)return;const cell=x=>'"'+String(x??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';const rows=[['Código IES','Institución','SNIES','Programa','Modalidad','Periodo','Código departamento','Departamento','Código municipio','Municipio de oferta','Indicador','Valor'],...result.filas.map(r=>[r.institucion_codigo,data.instituciones[r.institucion_codigo].nombre,r.snies,r.programa,r.modalidad,r.ano+'-'+r.semestre,r.departamento_codigo,r.departamento,r.municipio_codigo,r.municipio,r.indicador,r.valor])];const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='mercado-territorial-colombia.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  Promise.all(['territorio-colombia','colombia-departamentos'].map(async name=>{const r=await fetch('/api/'+name);if(!r.ok)throw Error('HTTP '+r.status);return r.json();})).then(([d,g])=>{data=d;geo=g;ready=true;const features=[...g.features].sort((a,b)=>a.properties.dpto_cnmbr.localeCompare(b.properties.dpto_cnmbr,'es'));$('co-departamento').insertAdjacentHTML('beforeend',features.map(f=>`<option value="${f.properties.dpto_ccdgo}">${esc(place(f.properties.dpto_cnmbr))}</option>`).join(''));$('co-status').textContent='';$('co-exportar').disabled=false;paint();if(location.hash==='#ean-territorio')$('ean-territorio').scrollIntoView({block:'start'});}).catch(error=>{$('co-status').textContent='No se pudo cargar el análisis territorial. Revisa las fuentes locales y recarga el módulo.';console.error('Territorio Colombia:',error);});
  return {update(next){options=next;paint();}};
 }
 scope.ColombiaMercado={create};
})(window);
