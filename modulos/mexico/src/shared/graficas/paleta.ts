export interface PaletaMapa {borde:string;sinDato:string;texto:string;rango:[string,string,string]}
// Los valores CSS se resuelven desde el mismo TemaContexto que actualiza el shell.
export const paletaMapa=(esOscuro:boolean):PaletaMapa=>({borde:'var(--bi-border)',sinDato:'var(--bi-map-empty)',texto:'var(--bi-text)',rango:esOscuro?['#0e7490','#22d3ee','#a5f3fc']:['#0e7490','#38bdf8','#cffafe']});
