// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {customFetch,ErrorDatos} from './api';

afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers()});
describe('customFetch',()=>{
  it('clasifica un HTTP no exitoso',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response('',{status:503})));
    await expect(customFetch('/api/datos')).rejects.toMatchObject({causa:'HTTP'} satisfies Partial<ErrorDatos>);
  });
  it('distingue error de red de respuesta HTTP',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>{throw new TypeError('Sin conexión')}));
    await expect(customFetch('/api/datos')).rejects.toMatchObject({causa:'RED'} satisfies Partial<ErrorDatos>);
  });
});
