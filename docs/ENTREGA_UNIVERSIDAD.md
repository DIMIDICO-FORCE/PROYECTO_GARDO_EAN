# Entrega del proyecto a la universidad

Se recomienda un ZIP académico con esta estructura:

- `01_Tesis/`: documento final revisado por el equipo y su PDF. Usar una sola versión definitiva, con los ajustes de APA y autoría.
- `02_Presentacion/`: presentación definitiva PPTX y, si lo solicitan, su PDF.
- `03_Aplicativo/`: copia de este repositorio, sin `.git`, `node_modules`, temporales ni credenciales. Incluye código fuente, versión compilada, datos derivados y planes públicos necesarios.
- `04_Evidencias/`: matriz de cumplimiento, registro y diagrama PRISMA, bibliografía y evidencia de validación que se cita en la tesis.
- `LEEME_ENTREGA.md`: nombre del proyecto, autores, fecha, instrucciones, enlace al repositorio y URL pública comprobada del aplicativo.

Repositorio: https://github.com/DIMIDICO-FORCE/PROYECTO_GARDO_EAN

No usar los ZIP históricos que contienen un cuarto módulo: el producto vigente conserva tres módulos y una síntesis en cada uno. La tesis y la presentación deben corresponder a esta versión.

## Paquete técnico

El ZIP técnico puede ejecutarse sin instalar dependencias: con Node.js 22.13 o posterior, ejecutar `npm start` y abrir http://127.0.0.1:5180/. Para reconstruir desde el código se necesita internet y `npm run build`.

Aplicativo publicado y verificado: https://ean-inteligencia-academica.onrender.com/

Incluir ambos enlaces en LEEME_ENTREGA.md y, si la plantilla lo permite, en el documento académico.
