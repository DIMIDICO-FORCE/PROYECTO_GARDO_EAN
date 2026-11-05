(function (scope) {
  function stats(program, mode, semester, metric) {
    const offers = program.ofertas.filter(o => mode === 'Todas' || o.modalidad === mode);
    const values = offers.map(o => {
      const rows = o.estadisticas.filter(r => r.semestre === semester && r.indicador === metric);
      return rows.length ? rows.reduce((sum, r) => sum + r.valor, 0) : null;
    });
    const present = values.filter(v => v !== null);
    return { valor: present.length ? present.reduce((a, b) => a + b, 0) : null, parcial: present.length > 0 && present.length < offers.length, ofertas_con_dato: present.length, ofertas: offers.length };
  }
  function nationalPeers(program, mode, semester, national) {
    const offers = program.ofertas.filter(o => mode === 'Todas' || o.modalidad === mode);
    const allowed = new Set(offers.flatMap(o => o.campos.filter(c => c.codigo !== '0' && c.codigo !== '9800').map(c => o.modalidad + '|' + c.codigo)));
    const rows = national.filter(r => r.ano === '2025' && r.semestre === semester && allowed.has(r.modalidad + '|' + r.cine));
    const ownCodes = new Set(offers.map(o => o.snies).filter(Boolean));
    const total = rows.reduce((s, r) => s + r.valor, 0);
    const own = rows.filter(r => r.institucion_codigo === '2812' && ownCodes.has(r.snies)).reduce((s, r) => s + r.valor, 0);
    return { rows: [...rows].sort((a, b) => b.valor - a.valor), total, own, participacion: total ? own / total * 100 : null, ownCodes };
  }
  function nationalComparison(programs, mode, semester, national, kind, concepts) {
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const offers=programs.flatMap(p=>p.ofertas.filter(o=>mode==='Todas'||o.modalidad===mode));
    const modes=new Set(offers.map(o=>o.modalidad));
    const codes=new Set(offers.map(o=>o.snies).filter(Boolean));
    const fields=new Set(offers.flatMap(o=>o.campos.filter(c=>!['0','9800'].includes(c.codigo)).map(c=>o.modalidad+'|'+c.codigo)));
    const terms=[...programs.map(p=>p.nombre),...concepts].map(normalize);
    const result=national.filter(r=>r.indicador==='matricula'&&r.semestre===semester&&r.ano==='2025'&&modes.has(r.modalidad)&&(r.institucion_codigo!=='2812'||codes.has(r.snies))&&(kind==='campo'?fields.has(r.modalidad+'|'+r.cine):terms.some(t=>normalize(r.programa).includes(t))));
    return result.sort((a,b)=>b.valor-a.valor);
  }
  const api = { stats, nationalPeers, nationalComparison };
  if (typeof module !== 'undefined') module.exports = api;
  else scope.EanDomain = api;
})(typeof window === 'undefined' ? globalThis : window);
