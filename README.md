# Inteligencia académica EAN

Aplicativo de investigación documental para el proyecto de grado de Ingeniería de Sistemas. Integra tres módulos: posición y competencia en Colombia, referentes internacionales y oportunidades de expansión virtual en México.

## Ejecutar localmente

Requiere Node.js 22.13 o posterior. Desde esta carpeta:

```sh
npm start
```

Abrir http://127.0.0.1:5180/. La entrega incluye la versión compilada; no requiere instalar dependencias para consultar el aplicativo. Los enlaces a fuentes externas requieren internet.

## Modificar y reconstruir

```sh
npm run build
npm test
npm start
```

La compilación instala las dependencias fijadas en `modulos/mexico/package-lock.json`. El servidor utiliza módulos estándar de Node.js. `public/` contiene la integración y estilos compartidos; `modulos/internacional/`, Colombia y referentes; `modulos/mexico/src/`, el módulo React; `data/`, las bases derivadas consultadas por el aplicativo y los planes académicos públicos.

## Publicación gratuita en Render

[Crear despliegue desde este repositorio](https://dashboard.render.com/select-repo?type=blueprint)

Elegir este repositorio como Blueprint. `render.yaml` define el servicio gratuito, la compilación, las pruebas y el inicio. La variable HOST debe ser `0.0.0.0`; Render asigna PORT automáticamente. No requiere una base de datos de pago: las consultas utilizan archivos derivados de solo lectura.

El plan gratuito se suspende tras un período sin visitas; la primera apertura puede tardar alrededor de un minuto. Ver https://render.com/docs/free.

## Alcance académico

Las coincidencias de programas son referencias documentales, no homologaciones aprobadas. Matrícula y nuevo ingreso describen actividad académica; no son ventas ni demanda confirmada para EAN en México. Las tarifas conservan la fecha y condiciones de su fuente. El aplicativo no implica aprobación institucional de una expansión.

Esta copia excluye documentos personales, borradores de tesis y presentación, bases originales de trabajo, dependencias instaladas, capturas de auditoría y entregas antiguas. Conserva los conjuntos derivados y los documentos públicos necesarios para consultar los tres módulos. Las rutas históricas `/antecedentes/` no forman parte de esta entrega independiente.

## Entrega a la universidad

Consultar [ENTREGA_UNIVERSIDAD.md](docs/ENTREGA_UNIVERSIDAD.md). La tesis y la presentación se entregan por separado; no se publican automáticamente en este repositorio.
