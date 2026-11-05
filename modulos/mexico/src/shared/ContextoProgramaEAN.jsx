const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
export default function ContextoProgramaEAN({db,programa}){
  const catalogue=db.ean_catalogo||[];
  const p=catalogue.find(p=>norm(p.nombre)===norm(programa));
  const all=programa==='__TODOS__'||!p;
  const offers=all?catalogue.flatMap(p=>p.ofertas):p.ofertas;
  const remote=offers.filter(o=>o.modalidad==='Virtual').length;
  return <section className="portal19-note" aria-label="Oferta EAN de referencia">
    <b>{all?`${catalogue.length} pregrados virtuales · Universidad EAN`:p.nombre}</b>
    {all&&db.ean_alcance_temporal&&<p><b>{db.ean_alcance_temporal.publicados_2026} programas publicados para 2026 + {db.ean_alcance_temporal.anunciados_2027.length} anunciado para 2027.</b> Ingeniería en Inteligencia Artificial anuncia inicio en febrero de 2027; la publicación no confirma apertura efectiva de la cohorte.</p>}
    {!all&&p.contexto_oferta==='ANUNCIADO_2027'&&<p><b>Nuevo programa anunciado para febrero de 2027.</b> No se presenta como una cohorte ya en funcionamiento ni como matrícula observada en 2025.</p>}
    <p>{all?`Solo oferta virtual EAN publicada. Los programas mexicanos son referentes de competencia; no forman parte del portafolio EAN. ANUIES clasifica las filas disponibles como «no escolarizada», categoría que no garantiza enseñanza 100 % virtual.`:offers.map(o=>`${o.modalidad} · SNIES ${o.snies||'por verificar'} · ${o.tarifa_cop?new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(o.tarifa_cop):'Tarifa N/D'}/${o.tarifa_unidad} · ${o.tarifa_ano||'año por verificar'}`).join(' | ')}</p>
    {!all&&!remote&&<p><b>Oferta presencial de referencia.</b> Esta ficha no acredita que el programa pueda cursarse 100 % virtual desde México. Una adaptación de modalidad requiere evaluación institucional.</p>}
    {!all&&remote>0&&<p>Alcance de la investigación: oferta virtual EAN como referencia de expansión. El análisis no establece equivalencias jurídicas ni resultados de admisión.</p>}
    <small>Consulta de oferta: 03 nov 2026 · {all?<a href="https://universidadean.edu.co/pregrados" target="_blank" rel="noreferrer">Catálogo oficial EAN ↗</a>:<a href={p.fuente} target="_blank" rel="noreferrer">Ficha institucional del programa ↗</a>}</small>
    {!all&&<p><a href={'#/equivalencias?programa='+encodeURIComponent(p.id)}>Consultar cruce preliminar, referentes y pensum ↗</a></p>}
  </section>;
}
