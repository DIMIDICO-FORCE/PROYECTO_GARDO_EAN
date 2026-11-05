export interface Programa {programa_cun:string;nivel_cun:string}
export interface Portafolio {programa_normalizado:string;modalidad:string;vigencia:string;programa_original:string;nivel_original?:string}
export interface FilaAnuies {id:number;entidad:string;institucion:string;plantel:string;nivel:string;modalidad:string;programa_original:string;matricula_total:number;nuevo_ingreso_total:number;egresados_total:number;periodo:string;fuente_url:string}
export interface Vinculo {anuies_id:number;programa_cun:string;tipo_coincidencia:string;confianza:string}
export interface Relacion {id:number;programa_cun:string;programa_mexico:string;anuies_id:number|null;nivel_cun:string;nivel_mexico:string;tipo_relacion:string;confianza:string;motivo:string;fuente_url:string;periodo:string;fecha_consulta:string;capa:string;aditiva:number}
export interface Competidor {id:number;programa_cun:string;institucion:string;programa_mexico:string;modalidad_publicada:string;tipo_institucion:string;precio_mxn:number|null;moneda:string|null;periodicidad:string|null;duracion:string|null;estado_regulatorio:string;url_oficial:string;fecha_consulta:string}
export interface DatosProgramas {
  homologacion_programas_cun_mexico:Programa[];portafolio_cun:Portafolio[];
  anuies_granular_2025_2026:FilaAnuies[];anuies_cun_correspondencias:Vinculo[];
  relaciones_academicas_cun_v15:Relacion[];competencia_cun_fuentes:Competidor[];
}
