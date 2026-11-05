'use strict';
fetch('/api/oportunidades-ean-mexico').then(r=>{if(!r.ok)throw Error('No disponible');return r.json();}).then(data=>{
 const container=document.getElementById('clasificacion');container.replaceChildren();const groups=document.createElement('div');groups.className='groups';
 for(const [id,label] of [['PRIORIZAR','Prioridad de contraste'],['AFINIDAD','Afinidad académica'],['APERTURA','Apertura futura']]){const rows=data.programas.filter(p=>p.grupo===id),article=document.createElement('article'),h=document.createElement('h3'),ul=document.createElement('ul');h.textContent=rows.length+' · '+label;for(const p of rows){const li=document.createElement('li');li.textContent=p.nombre;ul.append(li);}article.append(h,ul);groups.append(article);}container.append(groups);
}).catch(()=>{document.getElementById('clasificacion').textContent='No fue posible cargar el detalle de programas. La matriz se puede consultar en el módulo México.';});
