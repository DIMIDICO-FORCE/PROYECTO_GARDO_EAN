import {Suspense} from 'react';
import {HashRouter} from 'react-router-dom';
import {ProveedorTema} from './contextos/TemaContexto';
import PortalMexico from './PortalMexico.jsx';
export default function App(){return <ProveedorTema><HashRouter><Suspense fallback={<div role="status">Cargando Observatorio México…</div>}><PortalMexico/></Suspense></HashRouter></ProveedorTema>}
