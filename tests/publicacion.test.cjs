const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createServer}=require('../server.cjs');
test('la entrega independiente sirve módulos, datos, recursos y planes',async()=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const get=async(route)=>{const r=await fetch(base+route);assert.equal(r.status,200,route);return r;};
  for(const route of ['/','/modulos/internacional/','/modulos/mexico/','/identidad-estudio.css','/experiencia-radar.js','/ean-logo.png','/api/estado','/api/tablas'])await get(route);
  for(const file of fs.readdirSync(path.join(__dirname,'../data')).filter(x=>x.endsWith('.json')&&!['mexico-ean.json','planes-ean-texto.json'].includes(x))){const r=await get('/api/'+file.slice(0,-5));await r.json();}
  const model=await (await get('/api/datos')).json();assert.ok(model.institucion_referencia);
  const plans=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/planes-ean-texto.json')));
  for(const plan of plans){const r=await get('/api/planes-ean/'+plan.id);assert.match(r.headers.get('content-type'),/application\/pdf/);}
  const html=await(await get('/modulos/mexico/')).text();
  for(const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g))await get(match[1]);
  for(const route of ['/server.cjs','/.env','/data/mexico-ean.json','/../package.json'])assert.notEqual((await fetch(base+route)).status,200,route);
  assert.equal((await fetch(base+'/api/estado',{method:'POST'})).status,405);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
