export type CausaRed='TIEMPO'|'CANCELADA'|'RED'|'HTTP';
export class ErrorDatos extends Error {constructor(public causa:CausaRed,message:string){super(message);this.name='ErrorDatos'}}
interface Opciones {tiempoMs?:number;signal?:AbortSignal}
export async function customFetch(ruta:string,{tiempoMs=8000,signal}:Opciones={}):Promise<Response>{
  const controller=new AbortController();let porTiempo=false;
  const timer=setTimeout(()=>{porTiempo=true;controller.abort()},tiempoMs);
  const cancelar=()=>controller.abort();signal?.addEventListener('abort',cancelar,{once:true});
  try{
    const base=import.meta.env.VITE_API_BASE||'';
    const response=await fetch(`${base}${ruta}`,{credentials:'include',signal:controller.signal});
    if(!response.ok)throw new ErrorDatos('HTTP',`Respuesta ${response.status} de ${ruta}`);
    return response;
  }catch(e){
    if(e instanceof ErrorDatos)throw e;
    if(porTiempo)throw new ErrorDatos('TIEMPO',`La lectura de ${ruta} superó ${tiempoMs} ms`);
    if(signal?.aborted||controller.signal.aborted)throw new ErrorDatos('CANCELADA','Lectura cancelada');
    throw new ErrorDatos('RED',`No se pudo leer ${ruta}`);
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',cancelar)}
}
