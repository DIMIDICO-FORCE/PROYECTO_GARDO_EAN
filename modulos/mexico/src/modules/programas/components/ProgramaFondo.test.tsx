// @vitest-environment jsdom
import {describe,it,expect} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import ProgramaFondo from './ProgramaFondo';
import {ProveedorTema} from '../../../app/contextos/TemaContexto';
import type {DatosProgramas} from '../types';

const db:DatosProgramas={
  homologacion_programas_cun_mexico:[{programa_cun:'ESPECIALIZACION EN INTELIGENCIA DE NEGOCIOS',nivel_cun:'POSTGRADO'}],
  portafolio_cun:[{programa_normalizado:'ESPECIALIZACION EN INTELIGENCIA DE NEGOCIOS',programa_original:'Especialización en Inteligencia de Negocios',modalidad:'VIRTUAL',vigencia:'VIGENTE'}],
  anuies_granular_2025_2026:[{id:1,entidad:'MÉXICO',institucion:'Universidad de prueba',plantel:'Plantel',nivel:'LICENCIATURA UNIVERSITARIA Y TECNOLÓGICA',modalidad:'NO ESCOLARIZADA',programa_original:'LICENCIATURA EN INTELIGENCIA DE NEGOCIOS',matricula_total:12,nuevo_ingreso_total:4,egresados_total:0,periodo:'2025–2026',fuente_url:'https://anuario.anuies.mx/'}],
  anuies_cun_correspondencias:[],
  relaciones_academicas_cun_v15:[{id:1,programa_cun:'ESPECIALIZACION EN INTELIGENCIA DE NEGOCIOS',programa_mexico:'LICENCIATURA EN INTELIGENCIA DE NEGOCIOS',anuies_id:1,nivel_cun:'POSTGRADO',nivel_mexico:'LICENCIATURA UNIVERSITARIA Y TECNOLÓGICA',tipo_relacion:'REFERENCIA_DE_CAMPO',confianza:'BAJA_ACADEMICA',motivo:'Misma temática, nivel distinto.',fuente_url:'https://anuario.anuies.mx/',periodo:'2025–2026',fecha_consulta:'2026-10-20',capa:'B_COMPARABLE_NO_ADITIVO',aditiva:0}],
  competencia_cun_fuentes:[]
};
describe('Programa CUN a fondo',()=>{
  it('muestra nivel distinto y no lo suma como matrícula directa',()=>{
    render(<ProveedorTema><MemoryRouter><ProgramaFondo db={db} programa="ESPECIALIZACION EN INTELIGENCIA DE NEGOCIOS" onProgramaChange={()=>{}}/></MemoryRouter></ProveedorTema>);
    expect(screen.getByText(/Sin matrícula directamente comparable/)).toBeTruthy();
    fireEvent.click(screen.getByRole('tab',{name:'Matrícula y nuevos'}));
    expect(screen.getByText('Matrícula directa')).toBeTruthy();
    expect(screen.getByText('Matrícula afín')).toBeTruthy();
    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
  });
});
