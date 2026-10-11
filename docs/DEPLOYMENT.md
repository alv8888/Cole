# Publicación y mantenimiento de AeroLab 0.14

El producto es estático: no requiere compilación, servidor de física, base de datos ni credenciales de API. Los modelos se ejecutan en el navegador. Guardados y propuestas de masa pertenecen al origen del sitio; cambiar dominio o puerto cambia el almacenamiento accesible.

## Archivos de publicación

Sirve juntos, conservando rutas relativas:

```text
index.html
aircraft.html
rocket.html
structure.html
styles.css
workbench.css
src/
vendor/
assets/
docs/
```

No es necesario publicar `.git/`, `tests/`, `tools/`, node_modules ni artefactos ZIP/Markdown de entrega. Conserva licencias y atribuciones de Three.js y de la textura terrestre. La nueva hoja `workbench.css` es obligatoria: omitirla conserva cálculos, pero pierde la distribución de esta versión.

## Comprobación previa

```bash
node --test --test-isolation=none tests/*.test.js
PLAYWRIGHT_MODULE=/ruta/node_modules/playwright/index.mjs npm run test:browser
```

Revisa los resultados individuales y el resumen final; un runner que solo enumera archivos no prueba las funciones. El workflow `.github/workflows/tests.yml` ejecuta modelos y añade Chromium fijado mediante Playwright 1.64.0; sube capturas cuando la tarea termina. La herramienta de pruebas no forma parte de la descarga de la aplicación.

En el proveedor estático, activa HTTPS, MIME JavaScript/CSS correctos y compresión Brotli o gzip. Usa caché revalidable para HTML, CSS y módulos con nombres sin hash: un `immutable` prolongado puede dejar páginas y módulos de versiones distintas. Configura CSP según el proveedor y prueba su compatibilidad con el import map inline; no añadas `unsafe-eval` para ocultar errores. Evalúa `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y `frame-ancestors` cuando el proveedor permita cabeceras. Estas son instrucciones de preparación, no cabeceras aplicadas por el servidor de Python ni un alojamiento configurado.

## Verificación en el sitio publicado

1. Abre directamente cada una de las cuatro páginas y una URL compartida, también desde un subdirectorio.
2. Comprueba respuesta correcta de ambas hojas CSS, todos los módulos, textura, vendor y licencias.
3. Repite cálculos, modos de Structure, gráficos y controles de teclado/táctiles.
4. Comprueba portapapeles bajo HTTPS, guardados y transferencia de masa dentro del mismo origen.
5. Prueba fallback sin WebGL y errores de almacenamiento. Revisa consola/red para recursos bloqueados.
6. Registra navegador, fecha, commit y resultados; no sustituyas estas comprobaciones por un push Git.

## Mantenimiento

Los nuevos servicios se reutilizan progresivamente sin reemplazar modelos ya comprobados. Cada cambio físico necesita referencias, unidades, límites y pruebas independientes. Los formatos existentes de Structure v2 aceptan el modo opcional `display`; archivos anteriores recuperan modo `field` al aplicarse. Si cambias el significado de un campo físico, migra explícitamente el formato.

La triangulación es visual y el FEM es 1D. El uso educativo continúa sin certificación. LocalStorage no cifra los parámetros; no introduzcas datos privados ni secretos. Three.js y textura se sirven localmente; no se añadió CDN ni dependencia de ejecución.

El hosting público no está desplegado ni verificado por esta entrega. GitHub contiene el código y la configuración de CI.
