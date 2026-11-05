import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';


export default defineConfig({
  base:'/modulos/mexico/',plugins:[react()],
  resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},
  build:{rollupOptions:{output:{manualChunks:{react:['react','react-dom','react-router-dom'],icons:['lucide-react'],mexicoMap:['@webrek/mx-geo']}}}},
  server:{host:'127.0.0.1',port:5173,strictPort:true,allowedHosts:['.trycloudflare.com']},preview:{host:'127.0.0.1',port:4173,strictPort:true}
});
