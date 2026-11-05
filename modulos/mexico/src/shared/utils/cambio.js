/** Referencia comparativa puntual; NO es cotización bancaria ni tasa automática. */
export const MXN_COP_REFERENCIA=Object.freeze({
  copPorMxn:168.61,
  fecha:'2026-11-03',
  horaFuenteUtc:'2026-11-04T01:30:00Z',
  fuente:'https://www.exchange-rates.org/converter/mxn-cop',
  descripcion:'Referencia del 03/11/2026 a las 20:30 de Colombia (04/11, 01:30 UTC). Conversión comparativa, no cotización de pago.'
});
export function convertirMxnCop(valor,tasa=MXN_COP_REFERENCIA.copPorMxn){
  if(valor===null||valor===undefined||typeof valor==='boolean'||(typeof valor==='string'&&!valor.trim())||!Number.isFinite(Number(valor))||Number(valor)<0||!Number.isFinite(Number(tasa))||Number(tasa)<=0)return null;
  return Math.round(Number(valor)*Number(tasa));
}
export const dineroCop=(valor)=>valor===null?'N/D':new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(valor);
/** Conserva la unidad de origen: mes, materia, módulo o día se indica al usarlo. */
export function textoMxnCop(valor){
  const cop=convertirMxnCop(valor);
  if(cop===null)return 'Sin dato';
  const mxn=new Intl.NumberFormat('es-CO',{minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(valor));
  return `$${mxn} MXN (≈ ${dineroCop(cop)} COP)`;
}
/** Anota importes explícitos en MXN dentro de notas con notación española. */
export function textoConConversion(texto){
  return String(texto??'').replace(/\$([\d.]+(?:,\d+)?)\s*MXN\b/g,(_,importe)=>textoMxnCop(Number(importe.replaceAll('.','').replace(',','.'))));
}
