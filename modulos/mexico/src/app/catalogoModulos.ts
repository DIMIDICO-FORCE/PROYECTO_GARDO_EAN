import {lazy} from 'react';
import {Map,LayoutDashboard,Users,Wifi,Library,GraduationCap,School,PanelsTopLeft,CalendarDays,BookOpen,Blocks,Building2,Wallet,CreditCard,HandCoins,Landmark,ShieldAlert,BriefcaseBusiness,Search,Scale,type LucideIcon} from 'lucide-react';

// Cada ruta mantiene la vista V14, y el módulo legado se carga solo tras entrar al tablero.
const Vista=lazy(()=>import('../App.jsx'));
const MapaPeru=lazy(()=>import('../modules/mapa-mercado/MapaMercadoMexico.jsx'));
const AtlasOficial=lazy(()=>import('../modules/ciudades/AtlasOficialMexico.jsx'));
export interface Modulo {clave:string;ruta:string;titulo:string;grupo:string;icono:LucideIcon;color:string;descripcion:string;componente:typeof Vista}
const specs:[string,string,string,LucideIcon,string][]=[
 ['Territorio','Territorios','territorio',Map,'Mapa y ciudades'],['Atlas','Ciudad a fondo · oficial','territorio',Building2,'Población, economía, conectividad y estudios'],['Inicio','Inicio ejecutivo','territorio',LayoutDashboard,'Panorama verificable'],['Segmentos','Segmentos','territorio',Users,'Edad y NSE'],['Tecnología','Conectividad','territorio',Wifi,'Acceso digital'],['Fuentes','Fuentes','territorio',Library,'Procedencia y límites'],
 ['Anuario','Anuario ANUIES','educacion',GraduationCap,'Matrícula 2025–2026'],['Educación','Sistema universitario','educacion',School,'Estructura mexicana'],['Modalidad','Modalidades','educacion',PanelsTopLeft,'Oferta y formatos'],['Edades','Etapas educativas','educacion',CalendarDays,'Edad y trayectorias'],['Carreras','Carreras','educacion',BookOpen,'Tendencias académicas'],['Programas','Programa EAN a fondo','educacion',Blocks,'Relaciones académicas'],['Competencia','Competencia','educacion',Building2,'Instituciones mexicanas'],
 ['Familias','Hogares','costos',Wallet,'Ingreso y contexto'],['Gasto','Gasto del hogar','costos',Wallet,'Distribución y límites'],['Precios','Colegiaturas','costos',CreditCard,'Precios publicados'],['Pagos','Medios de pago','costos',HandCoins,'Formas de pago'],['Financiación','Becas y créditos','costos',Landmark,'Opciones financieras'],['Barreras','Barreras de acceso','costos',ShieldAlert,'Riesgos educativos'],
 ['Personas','Perfiles','empleo',Users,'Personas orientativas'],['Empleo2027','Empleo y movilidad','empleo',BriefcaseBusiness,'Actividad laboral'],
 ['Eventos','Agenda','cultura',CalendarDays,'Eventos fechados'],['Cultura2027','Cultura','cultura',Library,'Recintos y oferta'],['Búsquedas2027','Búsquedas','cultura',Search,'Señales digitales'],['Leyes','Regulación','cultura',Scale,'Marco jurídico']
];
export const modulos:Modulo[]=specs.map(([clave,titulo,grupo,icono,descripcion])=>({clave,ruta:`/${encodeURIComponent(clave.toLowerCase())}`,titulo,grupo,icono,color:grupo==='educacion'?'cyan':grupo==='territorio'?'teal':grupo==='costos'?'amber':grupo==='empleo'?'purple':'indigo',descripcion,componente:clave==='Territorio'?MapaPeru:clave==='Atlas'?AtlasOficial:Vista}));
export const moduloPorClave=(clave:string)=>modulos.find(x=>x.clave===clave);
export const clavePorRuta=(ruta:string)=>modulos.find(x=>x.ruta===ruta)?.clave||'Inicio';
