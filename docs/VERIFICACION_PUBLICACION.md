# Verificación de publicación — 5 de noviembre de 2026

- Aplicativo vigente: tres módulos y una síntesis por módulo.
- 82 pruebas de regresión del proyecto de trabajo: pasan.
- Compilación independiente con Vite 6.4.5: pasa.
- Auditoría npm del árbol instalado: 0 vulnerabilidades reportadas al preparar esta entrega.
- Prueba independiente de publicación: pasa. Comprueba páginas, recursos compartidos, conjuntos de datos de la API, planes PDF, recursos compilados, método de solo lectura y bloqueo de archivos no publicados.
- La copia se ejecuta sin la carpeta original de trabajo. No incluye `.git` en el ZIP, dependencias instaladas, borradores ni documentos personales.
- Plan de alojamiento seleccionado: Render Free ($0/mes), servidor Node 22.16.0, HOST=0.0.0.0, puerto asignado por el proveedor.

La revisión no acredita homologaciones, aprobación institucional de la expansión ni demanda comercial confirmada. Estas distinciones permanecen en el aplicativo.

## Comprobación en internet

Render confirmó el despliegue Live del commit 10c5cfe. Se abrió la integración por HTTPS y se recorrieron sus tres módulos. Se comprobó HTTP 200 y JSON válido en estado, oportunidades, tarifas EAN, modelos internacionales y territorio colombiano. Los intentos de consultar el archivo del servidor y `.env` devuelven 404.

URL: https://ean-inteligencia-academica.onrender.com/

El despliegue es de consulta pública y solo lectura. El servicio gratuito puede suspenderse por inactividad.
