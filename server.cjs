const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const { pathToFileURL } = require('node:url');
const root = __dirname;
const originalRoot = process.env.EAN_FUENTES || path.join(root, 'antecedentes-locales');
const mexicoRoot = path.join(originalRoot, 'MEXICO_2027_V24_BUYER_PERSONAS_PRECIOS_CUN');
const originalDist = path.join(mexicoRoot, 'dist');
const adaptedDist = path.join(root,'modulos/mexico/dist');
const datasets = new Set(['catalogo-ean', 'cobertura-programas', 'nacional-2025', 'mexico-academico', 'mexico-contexto', 'internacional-antecedentes', 'auditoria', 'resumen','pedagogia','adaptacion-ean','precios-mexico-verificados']);
const contentTypes = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2' };
let originalAPI;
function loadOriginalAPI() {
  if (!originalAPI) originalAPI = import(pathToFileURL(path.join(mexicoRoot, 'server/sqlite-api.js')).href).then(({ sqliteApi }) => {
    let handler;
    sqliteApi().configureServer({ middlewares: { use(fn) { handler = fn; } } });
    return handler;
  });
  return originalAPI;
}
function originalAssets(directory, relative = '') {
  const files = new Map();
  if (!fs.existsSync(directory)) return files;
  for (const item of fs.readdirSync(directory, { withFileTypes:true })) {
    const local = path.join(directory, item.name);
    const route = relative + '/' + item.name;
    if (item.isDirectory()) for (const entry of originalAssets(local, route)) files.set(...entry);
    else if (item.isFile()) files.set(route, local);
  }
  return files;
}
function createServer() {
  const originalFiles = originalAssets(originalDist);
  const adaptedFiles = originalAssets(adaptedDist);
  const jsonCache = new Map();
  const acceptsGzip = req => {
    const encodings = String(req.headers['accept-encoding'] || '').split(',').map(part => {
      const [name,...parameters] = part.trim().toLowerCase().split(';');
      const quality = parameters.find(p => p.trim().startsWith('q='));
      return {name,q:quality ? Number(quality.trim().slice(2)) : 1};
    });
    const selected = encodings.find(e => e.name === 'gzip') || encodings.find(e => e.name === '*');
    return Boolean(selected && Number.isFinite(selected.q) && selected.q > 0 && selected.q <= 1);
  };
  function readJson(file) {
    const stat = fs.statSync(file), previous = jsonCache.get(file);
    if (previous && previous.mtime === stat.mtimeMs && previous.size === stat.size) return previous;
    const bytes = fs.readFileSync(file);
    const entry = {mtime:stat.mtimeMs,size:stat.size,bytes,json:JSON.parse(bytes.toString('utf8')),gzip:null};
    jsonCache.set(file,entry);
    return entry;
  }
  function sendJson(req,res,value,entry) {
    const bytes = entry ? entry.bytes : Buffer.from(JSON.stringify(value));
    res.setHeader('Vary','Accept-Encoding');
    let body = bytes;
    if (bytes.length > 2048 && acceptsGzip(req)) {
      if (entry) body = entry.gzip || (entry.gzip = gzipSync(bytes));
      else body = gzipSync(bytes);
      res.setHeader('Content-Encoding','gzip');
    }
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
    return res.end(body);
  }
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'");
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }); return res.end('Método no permitido'); }
    let url; try { url = new URL(req.url, 'http://127.0.0.1'); } catch { res.writeHead(400); return res.end('Solicitud inválida'); }
    if(url.pathname.startsWith('/api/planes-ean/')){
      const match=url.pathname.match(/^\/api\/planes-ean\/(\d+)$/);
      if(!match){res.writeHead(404);return res.end('Plan no disponible');}
      try{
        const plans=readJson(path.join(root,'data/planes-ean-texto.json')).json;
        const plan=plans.find(p=>p.id===Number(match[1]));
        const directory=path.resolve(root,'data/fuentes/planes-ean')+path.sep;
        const file=plan&&path.resolve(root,plan.archivo);
        if(!file||!file.startsWith(directory)||path.extname(file)!=='.pdf'){res.writeHead(404);return res.end('Plan no disponible');}
        const content=fs.readFileSync(file);
        res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="'+path.basename(file)+'"'});return res.end(content);
      }catch{res.writeHead(503);return res.end('No fue posible leer el plan. Revisa la descarga de fuentes.');}
    }
    if (url.pathname.startsWith('/antecedentes/api/')) {
      try { const handler = await loadOriginalAPI(); req.url=req.url.replace('/antecedentes/api/','/api/'); return handler(req,res,()=>{res.writeHead(404);res.end('Ruta no disponible')}); }
      catch {res.writeHead(500);return res.end('No fue posible consultar el antecedente.');}
    }
    if (['/api/datos', '/api/estado', '/api/tablas'].includes(url.pathname) || url.pathname.startsWith('/api/tabla/')) {
      try {
        const source=readJson(path.join(root,'data/mexico-ean.json'));
        const model=source.json;
        const tables=Object.keys(model).filter(name=>Array.isArray(model[name]));
        let result;
        if(url.pathname==='/api/datos')result=model;
        else if(url.pathname==='/api/estado')result={ok:true,institucion:'EAN',programas:model.institucion_referencia.programas,ofertas:model.portafolio_cun.length,modo:'solo lectura; modelo derivado de fuentes conservadas'};
        else if(url.pathname==='/api/tablas')result=tables;
        else {const table=url.pathname.slice('/api/tabla/'.length);if(!tables.includes(table)){res.writeHead(404);return res.end('Tabla no autorizada');}result=model[table].slice(0,10000);}
        return sendJson(req,res,result,url.pathname==='/api/datos'?source:null);
      } catch {res.writeHead(503,{'Content-Type':'application/json; charset=utf-8'});return res.end(JSON.stringify({error:'Genera el modelo EAN con npm run adaptar:datos.'}));}
    }
    const files = { '/ean-logo.png':['public/ean-logo.png','image/png'], '/conclusiones.html':['public/conclusiones.html','text/html; charset=utf-8'], '/conclusiones.css':['public/conclusiones.css','text/css; charset=utf-8'], '/conclusiones.js':['public/conclusiones.js','text/javascript; charset=utf-8'], '/': ['public/integracion.html','text/html; charset=utf-8'], '/modulos/ean/': ['public/index.html','text/html; charset=utf-8'], '/radar-ean.js':['public/radar-ean.js','text/javascript; charset=utf-8'], '/radar-ean.css':['public/radar-ean.css','text/css; charset=utf-8'], '/integracion.js': ['public/integracion.js','text/javascript; charset=utf-8'], '/integracion.css': ['public/integracion.css','text/css; charset=utf-8'], '/app.js': ['public/app.js','text/javascript; charset=utf-8'], '/domain.js': ['public/domain.js','text/javascript; charset=utf-8'], '/styles.css': ['public/styles.css','text/css; charset=utf-8'] };
    let entry = files[url.pathname];
    if(['/competencia-domain.js','/competencia-charts.js','/competencia.css','/colombia-mercado.js','/colombia-mercado.css','/auditoria-visual.css','/graduados.js','/graduados-domain.js','/perfil-ean.js','/perfil-ean-domain.js','/mercado-general-domain.js','/mercado-general.js','/sintesis-colombia.js','/modelos-internacionales.js','/fuentes-modulos.js','/tema.js','/tema-radar.css','/estudio-unificado.css','/experiencia-radar.js','/lectura-estudio.js','/tarifas-ean.js','/sintesis-modulos.js','/identidad-estudio.css'].includes(url.pathname))entry=['public'+url.pathname,contentTypes[path.extname(url.pathname)]];
    let absolute;
    if (url.pathname === '/modulos/internacional/') absolute = path.join(root,'modulos/internacional/index.html');
    else if (url.pathname === '/modulos/mexico/') absolute = path.join(adaptedDist,'index.html');
    else if(url.pathname==='/antecedentes/internacional/')absolute=path.join(originalRoot,'informe_universidades_exterior.html');
    else if(url.pathname==='/antecedentes/mexico/')absolute=path.join(originalDist,'index.html');
    else if(url.pathname.startsWith('/modulos/mexico/'))absolute=adaptedFiles.get(url.pathname.slice('/modulos/mexico'.length));
    else if (!entry && !url.pathname.startsWith('/api/')) absolute = adaptedFiles.get(url.pathname) || originalFiles.get(url.pathname);
    if (absolute) {
      // Se sirve el archivo permitido de la copia adaptada o del antecedente, según la ruta.
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self'; object-src 'none'; base-uri 'self'");
      fs.readFile(absolute, (error, content) => {
        if (error) { res.writeHead(503); return res.end('No se encontró el módulo original. Revisa EAN_FUENTES y la carpeta dist.'); }
        res.writeHead(200, { 'Content-Type':contentTypes[path.extname(absolute)] || 'application/octet-stream' }); res.end(content);
      });
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.slice(5);
      if (datasets.has(name)||['expansion-ean','competencia-colombia','historico-colombia','territorio-colombia','colombia-departamentos','graduados-colombia','perfil-ean-colombia','mercado-general-colombia','oportunidades-ean-mexico','modelos-internacionales-compilado','lectura-estudio','tarifas-ean-publicas'].includes(name)) entry = ['data/' + name + '.json','application/json; charset=utf-8'];
    }
    if (!entry) { res.writeHead(404); return res.end('Recurso no encontrado'); }
    if(url.pathname==='/api/territorio-colombia'){
      res.setHeader('Vary','Accept-Encoding');
      if(acceptsGzip(req)&&fs.existsSync(path.join(root,'data/territorio-colombia.json.gz'))){entry=[entry[0]+'.gz',entry[1]];res.setHeader('Content-Encoding','gzip');}
    }
    if(entry[1].startsWith('application/json') && entry[0].endsWith('.json')) {
      try { return sendJson(req,res,null,readJson(path.join(root,entry[0]))); }
      catch { res.writeHead(500); return res.end('No se pudo cargar el recurso. Revisa la generación de datos.'); }
    }
    fs.readFile(path.join(root, entry[0]), (error, content) => {
      if (error) { res.writeHead(500); return res.end('No se pudo cargar el recurso. Revisa la generación de datos.'); }
      res.writeHead(200, { 'Content-Type': entry[1] }); res.end(content);
    });
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT || 5180);
  const host = process.env.HOST || '127.0.0.1';
  const server = createServer();
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Puerto ${port} ocupado. Usa otro valor en PORT.` : 'No se pudo iniciar el servidor local.'); process.exitCode = 1; });
  server.listen(port, host, () => console.log(`EAN · Inteligencia académica: http://${host}:${port}`));
}
module.exports = { createServer };
