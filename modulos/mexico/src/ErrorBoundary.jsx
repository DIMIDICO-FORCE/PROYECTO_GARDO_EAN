import React from 'react';
/** Captura errores en renderizados; informa la causa técnica sin mostrar datos personales. */
export default class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null,info:null}}
  static getDerivedStateFromError(error){return {error}}
  componentDidCatch(error,info){console.error('Falló el tablero:',error,info);this.setState({info:info?.componentStack||''})}
  render(){
    if(this.state.error)return <div className="startup" role="alert" style={{padding:24}}>
      <div className="startup-logo">EAN</div>
      <h1>No fue posible mostrar esta vista</h1>
      <p>Se identificó un error al dibujar un componente. La aplicación y la base de datos no deben reinstalarse por este mensaje.</p>
      <details style={{maxWidth:750,width:'100%',border:'1px solid #64748b55',padding:15,borderRadius:12,background:'#ffffff12'}} open><summary style={{fontWeight:700}}>Detalle técnico para corregir el problema</summary>
        <pre style={{fontSize:12,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{this.state.error.name}: {this.state.error.message}{'\n'}{(this.state.error.stack||'').split('\n').slice(0,8).join('\n')}{'\n'}{(this.state.info||'').split('\n').slice(0,8).join('\n')}</pre>
      </details>
      <button className="soft-btn" onClick={()=>window.location.reload()}>Volver a cargar</button>
    </div>;
    return this.props.children;
  }
}
