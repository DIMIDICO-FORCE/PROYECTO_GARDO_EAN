import {createContext,useContext,useMemo,useState,useEffect,type ReactNode} from 'react';
type Tema='dark'|'light';
interface ValorTema {tema:Tema;esOscuro:boolean;cambiarTema:()=>void}
const TemaContexto=createContext<ValorTema|null>(null);
function inicial():Tema {try{return (localStorage.getItem('ean-tema')||localStorage.getItem('mx2027-tema'))==='light'?'light':'dark'}catch{return 'dark'}}
export function ProveedorTema({children}:{children:ReactNode}){
  const [tema,setTema]=useState<Tema>(inicial);
  useEffect(()=>{const sync=(value:string)=>{const next=value==='light'?'light':'dark';document.documentElement.dataset.theme=next;setTema(next);};const message=(event:MessageEvent)=>{if(event.origin===location.origin&&event.data?.type==='ean-theme')sync(event.data.theme);};const storage=(event:StorageEvent)=>{if(event.key==='ean-tema')sync(event.newValue||'dark');};window.addEventListener('message',message);window.addEventListener('storage',storage);sync(inicial());return()=>{window.removeEventListener('message',message);window.removeEventListener('storage',storage);};},[]);
  const value=useMemo<ValorTema>(()=>({tema,esOscuro:tema==='dark',cambiarTema:()=>setTema(actual=>{
    const siguiente=actual==='dark'?'light':'dark';document.documentElement.dataset.theme=siguiente;
    try{localStorage.setItem('mx2027-tema',siguiente);localStorage.setItem('ean-tema',siguiente)}catch{/* Una preferencia no debe bloquear el observatorio. */}
    if(parent!==window)parent.postMessage({type:'ean-theme',theme:siguiente},location.origin);return siguiente;
  })}),[tema]);
  return <TemaContexto.Provider value={value}>{children}</TemaContexto.Provider>;
}
export function useTema(){const context=useContext(TemaContexto);if(!context)throw Error('TemaContexto ausente');return context}
