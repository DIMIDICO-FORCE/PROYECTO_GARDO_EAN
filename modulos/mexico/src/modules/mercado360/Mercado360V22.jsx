import EvidenciaDecision from './EvidenciaDecision.jsx';
import Monto from '../../shared/Monto.jsx';
import {textoMxnCop} from '../../shared/utils/cambio.js';
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPinned,
  House,
  Users,
  GraduationCap,
  Wallet,
  BriefcaseBusiness,
  PartyPopper,
  ArrowRight,
  Info,
  Search,
  Globe2
} from 'lucide-react';
import ContextoProgramaEAN from '../../shared/ContextoProgramaEAN.jsx';
import MapaGeoNuevo from '../mapa-mercado/MapaGeoNuevo.jsx';
import BuyerPersonasV24 from './BuyerPersonasV24.jsx';
import FichaPublicoObjetivo from './DefinicionPublico.jsx';
import CulturaPublico from './CulturaPublico.jsx';
import {porcentajePonderadoCompleto} from './publico-calculos.js';
import { catalogoVirtual, construirUniverso, agruparEntidad } from '../mapa-mercado/calculosMapa.js';
import './mercado360.css';

const nf = (n) => n !== null && n !== undefined && n !== '' && Number.isFinite(Number(n))
  ? Number(n).toLocaleString('es-MX', { maximumFractionDigits: 0 })
  : 'N/D';
const mxn=textoMxnCop;
const pf = (n) => n !== null && n !== undefined && n !== '' && Number.isFinite(Number(n))
  ? `${Number(n).toLocaleString('es-MX', { maximumFractionDigits: 1 })} %`
  : 'N/D';
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const EDADES = [
  ['TODAS', 'Todas las edades objetivo · 20–44'],
  ['20-24', '20–24 años'],
  ['25-34', '25–34 años'],
  ['35-44', '35–44 años']
];
const QUINTILES = [
  ['Todos', 'Todos los hogares'],
  ['Q1', 'D1–D2 · bajos'],
  ['Q2', 'D3–D4 · medio-bajos'],
  ['Q3', 'D5–D6 · medios'],
  ['Q4', 'D7–D8 · medio-altos'],
  ['Q5', 'D9–D10 · altos']
];
const TABS = [
  ['mapa', 'Mapa de calor', MapPinned],
  ['territorio', 'Ciudad y estratificación', House],
  ['audiencia', 'Público objetivo', GraduationCap],
  ['decisiones', 'Cómo eligen y compran', Search],
  ['personas', 'Psicografía y buyer personas', Users],
  ['economia', 'Vivienda y economía', Wallet],
  ['empleo', 'Empleos e industrias', BriefcaseBusiness],
  ['cultura', 'Cultura y eventos', PartyPopper]
];
const INDICADORES = [
  ['edad', 'Población de edad seleccionada · 2027', 'CONAPO · personas'],
  ['cun', 'Público potencial · demanda observada', 'ANUIES 2025–2026 · nuevos ingresos en programas no escolarizados comparables'],
  ['poblacion', 'Población total · 2027', 'CONAPO · personas'],
  ['ingreso', 'Ingreso medio de hogares · 2024', 'ENIGH · MXN por mes'],
  ['internet', 'Hogares con internet · 2025', 'ENDUTIH · % de hogares'],
  ['nuevos', 'Nuevos no escolarizada · 2025–26', 'ANUIES · estudiantes del plantel'],
  ['renta', 'Viviendas rentadas · 2024', 'ENIGH · % de viviendas']
];

const countAge = (x, age) => {
  if (age === 'TODAS') return ['edad_20_24', 'edad_25_29', 'edad_30_34', 'edad_35_39', 'edad_40_44'].reduce((a, k) => a + (Number(x[k]) || 0), 0);
  if (age === '20-24') return Number(x.edad_20_24) || 0;
  if (age === '25-34') return (Number(x.edad_25_29) || 0) + (Number(x.edad_30_34) || 0);
  return (Number(x.edad_35_39) || 0) + (Number(x.edad_40_44) || 0);
};

const edadLabel = (age) => EDADES.find(([v]) => v === age)?.[1] || age;
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const weighted = porcentajePonderadoCompleto;
const sampleSum = (rows) => rows.reduce((a, r) => a + (Number(r.muestra_personas) || 0), 0);

function aggregatePersonaRows(personas = [], cve_ent, quintil) {
  const rows = personas.filter((x) => x.cve_ent === cve_ent && x.quintil === quintil && ['20-24', '25-34', '35-44'].includes(x.edad));
  if (!rows.length) return null;
  const muestra = sampleSum(rows);
  return {
    cve_ent,
    edad: 'TODAS',
    quintil,
    muestra_personas: muestra,
    poblacion_expandida: rows.reduce((a, r) => a + (Number(r.poblacion_expandida) || 0), 0),
    porcentaje_asiste_escuela: weighted(rows, 'porcentaje_asiste_escuela'),
    porcentaje_trabajo_mes_anterior: weighted(rows, 'porcentaje_trabajo_mes_anterior'),
    porcentaje_trabaja_y_estudia: weighted(rows, 'porcentaje_trabaja_y_estudia'),
    porcentaje_nivel_bachillerato_o_mas: weighted(rows, 'porcentaje_nivel_bachillerato_o_mas'),
    porcentaje_nivel_licenciatura_o_mas: weighted(rows, 'porcentaje_nivel_licenciatura_o_mas'),
    muestra_adecuada_30: muestra >= 30
  };
}

function Kpi({ label, value, detail }) {
  return <article className="m22-kpi"><span>{label}</span><strong><Monto value={value}/></strong><small>{detail}</small></article>;
}
function Panel({ title, detail, children }) {
  return <section className="m22-panel"><div className="m22-panel-head"><h3>{title}</h3>{detail && <small>{detail}</small>}</div>{children}</section>;
}
function Fact({ title, value, detail }) {
  return <div className="m22-fact"><div><strong>{title}</strong><p>{detail}</p></div><b><Monto value={value}/></b></div>;
}
function Percent({ name, value, detail }) {
  return <div className="m22-percent"><div><b>{name}</b><strong>{pf(value)}</strong></div><span><i style={{ width: `${clamp(Number(value) || 0)}%` }} /></span>{detail && <small>{detail}</small>}</div>;
}
function Notice({ children }) {
  return <div className="m22-notice"><Info size={17} /><span>{children}</span></div>;
}

export default function Mercado360V22({ db, oficial, finanzas, publico, censo, vivienda }) {
  const nav = useNavigate();
  const [tab, setTab] = useState('audiencia');
  const [estado, setEstado] = useState('09');
  const [municipio, setMunicipio] = useState('');
  const [edad, setEdad] = useState('25-34');
  const [quintil, setQuintil] = useState('Todos');
  const [nivel, setNivel] = useState('pregrado');
  const [programa, setPrograma] = useState('__TODOS__');
  const [indicador, setIndicador] = useState('cun');
  const [cuota, setCuota] = useState(1800);
  const [buscar, setBuscar] = useState('');
  const [industriaModo, setIndustriaModo] = useState('empleo');

  const estados = oficial.entidades || [];
  const municipios = oficial.municipios || [];
  const entidad = estados.find((x) => x.cve_ent === estado);
  const muni = municipios.find((x) => x.cvegeo === municipio);
  const filteredMunicipios = useMemo(
    () => municipios.filter((x) => !estado || x.cve_ent === estado).filter((x) => norm(x.municipio).includes(norm(buscar))).sort((a, b) => b.poblacion_2027 - a.poblacion_2027),
    [municipios, estado, buscar]
  );
  const municipiosEntidad = useMemo(() => municipios.filter((x) => x.cve_ent === estado), [municipios, estado]);
  const grupo = estado || '00';
  const gasto = finanzas.enigh_gasto_hogares.find((x) => x.cve_ent === grupo);
  const hogar = publico.hogares.find((x) => x.cve_ent === grupo && x.quintil === quintil);
  const persona = edad === 'TODAS'
    ? aggregatePersonaRows(publico.personas || [], grupo, quintil)
    : publico.personas.find((x) => x.cve_ent === grupo && x.edad === edad && x.quintil === quintil);
  const renta = vivienda?.entidades?.find((x) => x.cve_ent === grupo);
  const grupoP = persona?.muestra_adecuada_30 ? persona : null;
  const selNombre = muni?.municipio || (entidad?.entidad || 'México completo');
  const programas = catalogoVirtual(db);
  const anuiCun = useMemo(
    () => agruparEntidad(construirUniverso(db, { programa, nivel: nivel === 'posgrado' ? 'POSTGRADO' : 'PREGRADO', capa: 'directa' }).filas),
    [db, programa, nivel]
  );
  const anuiSelected = estado ? anuiCun.get(estado) : null;
  const anuiNational = [...anuiCun.values()].reduce((a, x) => a + x.nuevo_ingreso_total, 0);
  const filasNombre=estado?(anuiSelected?.filas||0):[...anuiCun.values()].reduce((sum,r)=>sum+r.filas,0);
  const selectedProgram=(db.ean_catalogo||[]).find(p=>norm(p.nombre)===norm(programa));
  const expansionLink='/equivalencias'+(selectedProgram?'?programa='+encodeURIComponent(selectedProgram.id):'');
  const programRef = (db.homologacion_programas_cun_mexico || []).find((x) => x.programa_cun === programa);
  const nivelOperativo = programa === '__TODOS__' ? nivel : (norm(programRef?.nivel_cun).includes('POST') ? 'posgrado' : 'pregrado');

  const edadMun = muni ? countAge(muni, edad) : null;
  const stateAge = useMemo(() => municipiosEntidad.reduce((a, m) => a + countAge(m, edad), 0), [municipiosEntidad, edad]);
  const edadTotal = muni ? edadMun : estado ? stateAge : null;
  const metricas = useMemo(() => Object.fromEntries(estados.map((x) => {
    const terr = municipios.filter((m) => m.cve_ent === x.cve_ent);
    const vh = vivienda?.entidades?.find((r) => r.cve_ent === x.cve_ent);
    const val = indicador === 'edad'
      ? terr.reduce((a, m) => a + countAge(m, edad), 0)
      : indicador === 'cun'
        ? (anuiCun.get(x.cve_ent)?.nuevo_ingreso_total ?? null)
        : indicador === 'poblacion'
          ? x.poblacion_2027
          : indicador === 'ingreso'
            ? x.ingreso_hogar_mensual_2024_mxn
            : indicador === 'internet'
              ? x.hogares_internet_2025_pct
              : indicador === 'nuevos'
                ? x.anuies_no_escolarizada_nuevos_2025_2026
                : vh?.porcentaje_rentadas;
    return [x.cve_ent, val == null ? null : Number(val)];
  })), [estados, municipios, indicador, vivienda, edad, anuiCun]);
  const metricLabel = INDICADORES.find((x) => x[0] === indicador) || INDICADORES[0];
  const ranking = useMemo(() => estados.map((x) => ({ ...x, valor: metricas[x.cve_ent] })).filter((x) => x.valor != null).sort((a, b) => b.valor - a.valor), [estados, metricas]);
  const munPopTotal = muni ? muni.poblacion_2027 : entidad?.poblacion_2027;
  const gastoProm = finanzas.enigh_gasto_hogares.find((x) => x.cve_ent === grupo);
  const fuenteIngresos = grupo === '00' ? 'nacional' : `entidad ${entidad?.entidad}`;
  const sectorGeo = muni?.cvegeo;
  const sectors = useMemo(
    () => !sectorGeo
      ? []
      : (censo?.sectores || [])
          .filter((x) => x.cvegeo === sectorGeo)
          .map((x) => ({ ...x, rotulo: censo?.catalogo_sector?.[x.sector] || x.sector }))
          .sort((a, b) => (Number(b[industriaModo]) || -1) - (Number(a[industriaModo]) || -1)),
    [censo, sectorGeo, industriaModo]
  );
  const events = db?.eventos_mexico || [];
  const confirmed = db?.extra2027?.eventos_confirmados || [];
  const relevantEvents = useMemo(
    () => events.filter((e) => !estado || norm(e.estado).includes(norm(entidad?.entidad || ''))).filter((e) => !muni || norm(e.ciudad) === norm(muni.municipio)),
    [events, estado, entidad, muni]
  );
  const eventsByCity = useMemo(() => Object.entries(events.reduce((a, e) => {
    const key = `${e.ciudad || 'No identificada'} · ${e.estado || 'Sin entidad'}`;
    a[key] = (a[key] || 0) + 1;
    return a;
  }, {})).sort((a, b) => b[1] - a[1]), [events]);
  const arquetipos = db.perfiles_mercado || [];
  const personasIndicador = grupoP;
  const bienPrecio = hogar?.ingreso_mediano_hogar_mxn > 0 ? (100 * cuota) / hogar.ingreso_mediano_hogar_mxn : null;
  const gotoAtlas = () => nav(`/atlas?entidad=${estado || '09'}&municipio=${encodeURIComponent(municipio)}`);
  const updateEstado = (code) => { setEstado(code); setMunicipio(''); setBuscar(''); };

  return <div className="m22" data-testid="mercado360-v22">
    <div className="m22-intro"><div><span className="m22-eyebrow"><Globe2 size={14} /> CENTRO DE INTELIGENCIA COMERCIAL · MÉXICO 2027</span><h2>Caracterización del público objetivo en México</h2><p>Explora territorio, poder adquisitivo, vivienda, educación y comportamiento financiero desde un solo lugar. <b>La población observada no es una proyección de matrículas EAN.</b></p></div><div className="m22-source-chip">{programas.length} pregrados virtuales EAN · Fuentes 2024–2027</div></div>
    <ContextoProgramaEAN db={db} programa={programa}/>

    <div className="m22-filters" aria-label="Filtros del explorador">
      <label><span>Entidad federativa</span><select value={estado} onChange={(e) => updateEstado(e.target.value)}><option value="">México · 32 entidades</option>{estados.map((x) => <option key={x.cve_ent} value={x.cve_ent}>{x.entidad}</option>)}</select></label>
      <label><span>Municipio / alcaldía</span><select value={municipio} disabled={!estado} onChange={(e) => setMunicipio(e.target.value)}><option value="">{estado ? 'Toda la entidad' : 'Selecciona entidad primero'}</option>{filteredMunicipios.map((x) => <option key={x.cvegeo} value={x.cvegeo}>{x.municipio}</option>)}</select></label>
      <label><span>Edad objetivo</span><select value={edad} onChange={(e) => setEdad(e.target.value)}>{EDADES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
      <label><span>Ingreso del hogar</span><select value={quintil} onChange={(e) => setQuintil(e.target.value)}>{QUINTILES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
      <label><span>Nivel</span><select value={nivel} onChange={(e) => setNivel(e.target.value)}><option value="pregrado">Pregrado</option></select></label>
      <label className="m22-program-filter"><span>Programa EAN</span><select value={programa} onChange={(e) => setPrograma(e.target.value)}><option value="__TODOS__">Todos los pregrados virtuales EAN ({programas.length})</option>{programas.map((x) => <option value={x} key={x}>{x}</option>)}</select></label>
    </div>

    <div className="m22-tabs" role="group" aria-label="Temas del mercado">{TABS.map(([v, t, I]) => <button key={v} type="button" aria-pressed={tab === v} className={tab === v ? 'activo' : ''} onClick={() => setTab(v)}><I size={16} />{t}</button>)}</div>

    {tab === 'mapa' && <>
      <div className="m22-filters m22-map-filter"><label><span>Variable del mapa de calor</span><select value={indicador} onChange={(e) => setIndicador(e.target.value)}>{INDICADORES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label><span>El color refleja {metricLabel[2]}; cada indicador mantiene su propia escala.</span></div>
      <div className="m22-map-layout"><Panel title="México, 32 entidades" detail="Selecciona una entidad del mapa para investigar sus municipios"><MapaGeoNuevo datos={metricas} seleccion={estado} onSelect={updateEstado} indicador={metricLabel[1]} mostrarEtiquetas={true} /></Panel><Panel title="Concentración territorial" detail="Ordenado por la variable seleccionada"><div className="m22-rank">{ranking.map((r, i) => <button key={r.cve_ent} type="button" className={r.cve_ent === estado ? 'chosen' : ''} onClick={() => updateEstado(r.cve_ent)}><em>{String(i + 1).padStart(2, '0')}</em><span>{r.entidad}<small>{metricLabel[2]}</small></span><strong>{indicador === 'ingreso' ? mxn(r.valor) : indicador === 'internet' || indicador === 'renta' ? pf(r.valor) : nf(r.valor)}</strong></button>)}</div></Panel></div>
      <div className="m22-kpis m22-kpis-five"><Kpi label="Territorio" value={selNombre} detail={muni ? 'Municipio / alcaldía' : estado ? 'Entidad federativa' : 'Total nacional · sin municipio seleccionado'} /><Kpi label="Población 2027" value={nf(munPopTotal ?? estados.reduce((s, e) => s + e.poblacion_2027, 0))} detail="CONAPO · habitantes, no matrícula" /><Kpi label={`Personas ${edadLabel(edad)}`} value={edadTotal == null ? 'Elige entidad' : nf(edadTotal)} detail={muni ? 'CONAPO · municipio' : estado ? 'CONAPO · entidad' : 'Selecciona territorio para analizar la edad'} /><Kpi label="Público potencial · demanda observada" value={filasNombre?nf(estado?anuiSelected.nuevo_ingreso_total:anuiNational):'Sin filas recibidas'} detail={municipio ? 'Nuevo ingreso en programas no escolarizados comparables · dato de la entidad, no del municipio' : 'ANUIES 2025–2026 · nuevos ingresos en programas no escolarizados comparables'} /><Kpi label="Registros del cruce por nombre" value={nf(filasNombre)} detail={municipio?'Cobertura de la entidad; no se atribuye al municipio':'Filas de institución / plantel / modalidad del subconjunto'} /></div>
      <div className="m22-research"><div><strong>Qué significa este público potencial</strong><p>El KPI cuenta nuevos ingresos registrados en programas mexicanos no escolarizados comparables con la oferta EAN seleccionada. Es una señal de demanda académica para priorizar territorios; no estima cuántas personas elegirían la EAN. No se filtra por edad ni ingreso del hogar.</p></div><div><strong>Para evaluar el encaje de la oferta</strong><p>Revisa los referentes, las mallas y las condiciones de admisión por programa. El centro de expansión muestra qué está documentado y cuál es el siguiente paso.</p><Link className="m22-action" to={expansionLink}>Abrir homologación preliminar y brechas <ArrowRight size={15}/></Link></div></div>
      <Notice><b>Lectura del calor:</b> en «Público potencial» el color representa nuevos ingresos en programas no escolarizados comparables. ANUIES ubica el plantel, no la residencia del estudiante. Las filas se cuentan una sola vez aunque correspondan a varios programas EAN; sin registros significa falta de cobertura, no demanda cero.</Notice>
    </>}

    {tab === 'territorio' && <>
      <div className="m22-kpis"><Kpi label="Población 2027" value={nf(munPopTotal ?? null)} detail="CONAPO · municipio o entidad seleccionada" /><Kpi label="Ingreso mediano hogar · grupo" value={mxn(hogar?.ingreso_mediano_hogar_mxn)} detail={`ENIGH · ${fuenteIngresos}`} /><Kpi label="Conexión hogar · estatal" value={pf(entidad?.hogares_internet_2025_pct)} detail="ENDUTIH 2025 · no municipal" /><Kpi label="Viviendas rentadas · estatal" value={pf(renta?.porcentaje_rentadas)} detail="ENIGH 2024 · viviendas" /></div>
      <div className="m22-columns"><Panel title="Estratificación económica real" detail="Quintiles de ingreso nacional · NO estratos colombianos"><p className="m22-muted">México no clasifica domicilios con estratos 1–6 como Colombia. Usamos cinco grupos de deciles nacionales aplicados a la ENIGH estatal; elegir municipio no cambia estos resultados.</p>{QUINTILES.filter((x) => x[0] !== 'Todos').map(([v, title]) => { const x = publico.hogares.find((z) => z.cve_ent === grupo && z.quintil === v); return <div className="m22-fact" key={v}><span><b>{title}</b><small>{nf(x?.hogares_expandidos)} hogares expandidos</small></span><strong>{mxn(x?.ingreso_mediano_hogar_mxn)}</strong></div>; })}<p className="m22-muted">Muestra de hogares: {nf(hogar?.muestra_hogares)} · 2024; los quintiles se construyeron a nivel nacional.</p></Panel><Panel title="Localiza la audiencia por municipio" detail={estado ? `${entidad?.entidad} · ordenado por población 2027` : 'Elige una entidad para comenzar'}>{estado ? <><input className="m22-search" placeholder="Buscar municipio / alcaldía" aria-label="Buscar municipio" value={buscar} onChange={(e) => setBuscar(e.target.value)} /><div className="m22-muni-list">{filteredMunicipios.slice(0, 60).map((x) => <button key={x.cvegeo} type="button" className={municipio === x.cvegeo ? 'chosen' : ''} onClick={() => setMunicipio(x.cvegeo)}><span>{x.municipio}</span><strong>{nf(x.poblacion_2027)}</strong></button>)}</div></> : <p className="m22-muted">Selecciona una entidad o haz clic en el mapa para ver los municipios y alcaldías.</p>}<button className="m22-action" onClick={gotoAtlas}>Abrir Ciudad a fondo <ArrowRight size={15} /></button></Panel></div><Notice>Marginación CONAPO 2020 y deciles ENIGH 2024 son conceptos distintos. Ninguno demuestra por sí mismo intención de estudiar un programa EAN.</Notice>
    </>}

    {tab === 'audiencia' && <>
      <FichaPublicoObjetivo territorio={selNombre} ambito={muni?'municipio':estado?'entidad':'nacional'} edad={edadLabel(edad)} quintil={QUINTILES.find(x=>x[0]===quintil)?.[1]||quintil} programa={programa} poblacion={edadTotal} ingreso={hogar?.ingreso_mediano_hogar_mxn} cuota={cuota} internet={entidad?.hogares_internet_2025_pct} nuevos={filasNombre?(estado?anuiSelected.nuevo_ingreso_total:anuiNational):null} fuenteIngresos={fuenteIngresos}/>
      <div className="m22-kpis m22-kpis-five"><Kpi label={`Edad ${edadLabel(edad)}`} value={edadTotal == null ? 'Selecciona entidad' : nf(edadTotal)} detail="CONAPO 2027 · universo demográfico" /><Kpi label="Bachillerato o más declarado" value={pf(personasIndicador?.porcentaje_nivel_bachillerato_o_mas)} detail="ENIGH 2024 · entidad · nivel reportado, no título validado" /><Kpi label="Hogares con internet" value={pf(entidad?.hogares_internet_2025_pct)} detail="ENDUTIH 2025 · entidad completa, no solo el segmento elegido" /><Kpi label="Trabaja y estudia" value={pf(personasIndicador?.porcentaje_trabaja_y_estudia)} detail="ENIGH 2024 · edad y grupo de ingreso" /></div>
      <div className="m22-columns"><Panel title="Pregrado: universo vs. elegibilidad" detail={`${edadLabel(edad)} · ENIGH + CONAPO`}><p className="m22-muted">La población del grupo etario es un <b>techo demográfico</b>, no aspirantes potenciales medidos. Para ingresar a {nivelOperativo === 'posgrado' ? 'posgrado' : 'pregrado'} habría que verificar {nivelOperativo === 'posgrado' ? 'título profesional' : 'bachillerato terminado'}, aceptación del título y deseo de estudiar.</p><Percent name="Bachillerato o más (declarado)" value={grupoP?.porcentaje_nivel_bachillerato_o_mas} detail="Encuesta de personas · entidad; no terminaron necesariamente estudios" /><Percent name="Asiste a la escuela" value={grupoP?.porcentaje_asiste_escuela} /><Percent name="Trabaja y estudia" value={grupoP?.porcentaje_trabaja_y_estudia} /><small>Base muestral: {nf(persona?.muestra_personas)}. Las proporciones se omiten cuando el cruce tiene menos de 30 respuestas. No se multiplican por población municipal.</small></Panel><Panel title="¿Quién cumple los requisitos?" detail={nivelOperativo === 'posgrado' ? 'Escenario: posgrado' : 'Escenario: pregrado'}><Fact title="Programa EAN" value={programa === '__TODOS__' ? `${programas.length} pregrados` : programa} detail="No confirma autorización ni reconocimiento en México" /><Fact title="Condición mínima" value={nivelOperativo === 'posgrado' ? 'Título profesional' : 'Bachillerato'} detail="Requiere validación documental y admisiones" /><Fact title="Mensualidad hipotética" value={mxn(cuota)} detail="Simulación, no tarifa vigente EAN" /><Fact title="Peso sobre mediana del hogar" value={pf(bienPrecio)} detail={`ENIGH 2024 · ${quintil} · ${fuenteIngresos}`} /><Fact title="Cuota / salario mínimo general 2026" value={pf((cuota / (315.04 * 365 / 12)) * 100)} detail="Comparación con una persona trabajadora · zona general, no aplica a toda la frontera norte" /><label className="m22-amount">Cambiar cuota mensual (MXN)<input type="number" value={cuota} min="0" onChange={(e) => setCuota(Math.max(0, Number(e.target.value) || 0))} /></label><Link className="m22-action" to={`/clientes?entidad=${estado || '09'}&municipio=${encodeURIComponent(municipio)}&edad=${edad === 'TODAS' ? '25-34' : edad}&quintil=${quintil}&nivel=${nivelOperativo}&programa=${encodeURIComponent(programa)}`}>Análisis detallado de público objetivo <ArrowRight size={15} /></Link></Panel></div>
    </>}

    {tab === 'decisiones' && <><EvidenciaDecision/><Panel title="Cómo compran y pagan" detail="ENIF 2024 · hábitos generales; NO pago de matrículas">{(() => { const x = finanzas.enif.find((f) => f.region === '0' && f.edad === 'Todos'); return (x?.pagos?.desde_501?.opciones || []).map((t) => <Percent key={t.codigo} name={t.medio} value={t.porcentaje} />); })()}<p className="m22-muted">Edad {edadLabel(edad)}: ENIF publica bandas distintas (18–29, 30–44…). No aplicamos el porcentaje nacional a la ciudad ni al grupo de edad sin cruce verificable.</p><Link className="m22-action" to="/compra">Consultar canales y hábitos <ArrowRight size={15} /></Link></Panel></>}

    {tab === 'personas' && <>
      <Notice><b>Psicografía ≠ demografía:</b> los intereses, miedos, motivaciones y criterios de compra son <b>hipótesis de investigación</b>, no respuestas levantadas entre estudiantes mexicanos. ENIGH y ENIF respaldan el contexto económico y financiero, no el contenido psicológico de cada arquetipo.</Notice>
      <BuyerPersonasV24 arquetipos={arquetipos} nombreGeo={selNombre} programa={programa} nivel={nivelOperativo} quintil={quintil} ingresoMediano={hogar?.ingreso_mediano_hogar_mxn} cuota={cuota} conectividad={entidad?.hogares_internet_2025_pct} edad={edad} />
      <Panel title="Qué validar con investigación primaria" detail="Guía de encuesta/entrevista para perfiles reales"><div className="m22-questions">{['¿Qué le preocupa del reconocimiento en México de un título obtenido en Colombia?', '¿Qué razón concreta lo lleva a preferir una universidad pública o privada?', '¿Qué cuota mensual y gastos adicionales aceptaría pagar?', '¿Qué programa considera y qué horarios necesita?', '¿Qué red, buscador o persona influyó en su elección?', '¿Qué modalidad de clases, exámenes y prácticas podría cumplir?'].map((x, i) => <div key={x}><b>{i + 1}</b>{x}</div>)}</div></Panel>
    </>}

    {tab === 'economia' && <>
      <div className="m22-kpis"><Kpi label="Viviendas rentadas" value={pf(renta?.porcentaje_rentadas)} detail="ENIGH 2024 · ámbito estatal" /><Kpi label="Renta mensual mediana" value={renta?.muestra_adecuada_30 ? mxn(renta?.renta_mensual_mediana_mxn) : 'Muestra insuficiente'} detail="Solo viviendas rentadas con monto reportado" /><Kpi label="Ingreso mensual del hogar" value={mxn(hogar?.ingreso_mediano_hogar_mxn)} detail={`Mediana · ${quintil} · ENIGH 2024`} /><Kpi label="Gasto medio del hogar" value={mxn(gastoProm?.gasto_mensual_mxn)} detail="Todos los hogares · gasto monetario mensual" /><Kpi label="Salario mínimo · general 2026" value={mxn((315.04 * 365) / 12)} detail="CONASAMI · equivalente mensual de una persona, no ingreso del hogar" /></div>
      <div className="m22-columns"><Panel title="Cómo vive la gente: tenencia de vivienda" detail="ENIGH 2024 · viviendas; no viviendas por municipio"><Percent name="Rentada" value={renta?.porcentaje_rentadas} /><Percent name="Prestada" value={renta?.porcentaje_prestadas} /><Percent name="Propia · pagando" value={renta?.porcentaje_propias_pagando} /><Percent name="Propia · pagada" value={renta?.porcentaje_propias_pagadas} /><p className="m22-muted">Promedio de renta mensual: {renta?.muestra_adecuada_30 ? mxn(renta?.renta_mensual_media_mxn) : 'N/D'} · muestra de viviendas con renta positiva: {nf(renta?.muestra_rentas_declaradas)}.</p></Panel><Panel title="Presupuesto del hogar" detail="ENIGH 2024 · MXN/mes · media estatal de todos los hogares">{[...(gastoProm?.rubros || [])].sort((a, b) => b.mensual_mxn - a.mensual_mxn).slice(0, 8).map((x) => <Fact key={x.id} title={x.nombre} value={mxn(x.mensual_mxn)} detail={`${pf(x.porcentaje_gasto_monetario)} del gasto monetario`} />)}<Notice>La diferencia entre ingreso y gasto monetario medios no equivale a dinero disponible para educación; no se suman alquiler y vivienda sin revisar categorías.</Notice><Link className="m22-action" to={`/economia?entidad=${estado || '00'}`}>Ver pagos, gastos y crédito <ArrowRight size={15} /></Link></Panel></div>
    </>}

    {tab === 'empleo' && <>
      <div className="m22-kpis"><Kpi label="Actividad económica" value={muni?.municipio || 'Selecciona municipio'} detail="CE2024 · municipio × sector SCIAN" /><Kpi label="Registros sectoriales" value={muni ? nf(sectors.length) : 'N/D'} detail="CE2024 · filas disponibles" /><Kpi label="Personas informales · entidad" value={nf(entidad?.personas_informales_2026_06)} detail="STPS 2026 · no comparable directamente con CE" /></div>
      <div className="m22-columns"><Panel title="Industrias que generan empleo en el municipio" detail="Censo Económico 2024 · actividad de 2023"><div className="m22-filterline"><label>Ordenar por<select value={industriaModo} onChange={(e) => setIndustriaModo(e.target.value)}><option value="empleo">Personal ocupado</option><option value="ue">Unidades económicas</option></select></label></div>{!muni ? <p className="m22-muted">Selecciona entidad y municipio en los filtros superiores. Los datos censales tienen cobertura municipal.</p> : sectors.length ? sectors.slice(0, 15).map((x) => <Fact key={x.sector} title={`${x.sector} · ${x.rotulo}`} value={x[industriaModo] == null ? 'Reservado' : nf(x[industriaModo])} detail={x[industriaModo] == null ? 'Confidencialidad · dato no publicado' : 'INEGI · sector SCIAN 2023'} />) : <p className="m22-muted">Sin registros publicados en este municipio. Chihuahua no se encontraba en el ZIP municipal recibido; no se reemplaza por cero.</p>}</Panel><Panel title="De industria a programa EAN" detail="Razonamiento comercial, no demanda universitaria medida"><p>Usa el sector dominante como <b>contexto de ocupaciones</b> para revisar afinidad con pregrados EAN y la matrícula ANUIES de carreras similares.</p><Fact title="Programa elegido" value="" detail={programa === '__TODOS__' ? 'Selecciona uno de los pregrados EAN publicados' : programa} /><Fact title="Formación requerida" value="" detail={nivelOperativo === 'posgrado' ? 'Verificar título previo y reconocimiento aplicable' : 'Verificar bachillerato y elegibilidad de ingreso'} /><Fact title="Datos todavía necesarios" value="" detail="Vacantes reales por ocupación, salarios por perfil, intención de matrícula y empleadores locales" /><Link className="m22-action" to="/portafolio">Explorar portafolio <ArrowRight size={15} /></Link></Panel></div>
    </>}

    {tab === 'cultura' && <CulturaPublico db={db} territorio={selNombre} eventosTerritorio={relevantEvents}/>}

    <div className="m22-bottom">FUENTES: CONAPO 2027 · ENIGH 2024 · ENIF 2024 · ENDUTIH 2025 · ANUIES 2025–2026 · CE2024 · EAN. Los filtros nunca convierten estadísticas estatales en municipales ni demografía en matrículas esperadas. La capa de correspondencias EAN cambia con nivel/programa pero no representa estudiantes de EAN.</div>
  </div>;
}
