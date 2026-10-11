# Entrega 15 · Inicio y exploración de AEROLAB (0.15)

## Fase 1 · Diagnóstico previo a los cambios

La inspección se realizó sobre `4d03b22fa78532a6ff6f85a8c79afbcee039fd49`, rama `work`. Git estaba limpio: 0 archivos modificados, añadidos, eliminados o no rastreados; 0 líneas añadidas/eliminadas en el diff. No había trabajo pendiente que preservar. No se restauró, borró ni reinició ningún archivo.

El producto es un laboratorio educativo estático. `index.html` era tanto portada como Space Lab: un título, una descripción genérica y cuatro enlaces cortos, seguidos del banco de trabajo. Aircraft, Rocket y Structure ya eran páginas funcionales; no eran módulos pendientes. La navegación compartida reorganiza los nodos en pestañas sin recrear sus controles. Los cuatro módulos incluyen guardados locales y enlaces de simulación; existen gráficos SVG, visores WebGL, modelos independientes de la interfaz y pruebas. Structure distingue FEM de vigas/barras 1D, membranas analíticas y triangulación visual de superficie.

Tecnologías comprobadas: HTML, CSS, ES modules, SVG/Canvas y Three.js r180 distribuido localmente. Sin React, backend, npm runtime ni compilación. Se conservaron la paleta oscura, teal/violeta, tipografía del sistema y los paneles internos. No existían clips propios del producto. Las imágenes disponibles incluyen una textura terrestre estática, innecesaria para la demostración ligera de entrada. Las dependencias vendorizadas tienen procedencia/licencia y no se duplicaron. No se detectó contenido generado accidental pendiente.

Debilidades concretas: poco contexto para elegir un laboratorio, ausencia de ejemplos en la entrada, catálogo reducido a navegación, interfaz científica visible antes de explicar el producto y carga inicial de Three.js aunque no se estuviera usando. La adaptación existente de los laboratorios funcionaba; el problema era la experiencia de descubrimiento.

## Fase 2 · Dirección visual y alcance

Una composición de dos columnas: mensaje específico y demostración física. Catálogo con Space destacado, tres experiencias complementarias, preguntas concretas, capacidades disponibles y sus límites. Dos filtros temáticos bastan para cuatro experiencias; no se añadieron búsquedas, recomendaciones opacas, favoritos, estadísticas ni contenidos futuros. Tres pasos explican cómo usar las herramientas sin repetir sus descripciones.

Se conserva `index.html` como entrada de Space Lab. No se creó una aplicación paralela ni una nueva ruta orbital. Los laboratorios internos mantienen sus cálculos, formularios, pestañas, visores, exportaciones y formatos de datos. Se añadió un enlace compartido para regresar al catálogo; en sus HTML solo cambia la etiqueta de versión.

## Fases 3–4 · Implementación

- Hero orbital SVG: Tierra, periapsis de 400 km, excentricidad 0–0,75 y tiempo 0–100 % de un periodo. Usa `ellipticOrbit`, `orbitalState`, `drawOrbit` y `moveSatellite` existentes. No hay una segunda implementación física.
- Periodo, velocidad y altitud actuales con unidades. Posición por ecuación de Kepler; escala ajustada al apoapsis. El tamaño del marcador es ilustrativo.
- Reproducción opcional, inicialmente pausada, a 300 s simulados/s. El tiempo se acumula en precisión completa; no depende del redondeo del slider. Se limita el salto de frame a 0,1 s real para evitar saltos grandes tras interrupciones; en frames muy lentos la reproducción puede avanzar más despacio. Pausa al ocultar el documento, salir de la demostración o cambiar la preferencia de movimiento. No se reanuda automáticamente. Los resultados actualizados por frame no generan anuncios continuos al lector de pantalla.
- Aplicar el ejemplo requiere pulsar **Usar en configuración A**: valida la configuración, cambia A, reinicia el tiempo y abre `#lab`. B y localStorage se conservan. El botón espera a que Space Lab esté listo.
- Catálogo mantenible por datos, dos filtros con estados accesibles y enlaces reales a las rutas existentes. Los esquemas son ilustrativos, no CFD, trayectorias calculadas ni campos FEM.
- Ejemplos calculados a demanda: órbita circular, fuerzas de Aircraft, Tsiolkovsky de una etapa y semiala FEM 1D. Entradas, unidades y límites visibles. Rocket distingue Δv ideal de altitud/velocidad de lanzamiento; Structure no declara certificación ni FEM 3D.
- Panel de ejemplo con carga, error, cierre por botón/Escape y devolución del foco. Una respuesta atrasada no puede reemplazar la selección actual. Sin cambios en guardados. Ante un error de importación se puede abrir el laboratorio o recargar para reintentar.
- Three.js orbital se importa cuando su panel se aproxima al viewport; conserva el último estado físico calculado durante la espera. Navegadores sin IntersectionObserver usan el comportamiento inmediato anterior. Aircraft/Rocket/Structure conservan su estrategia de carga.

Nuevos archivos: `home.css`, `src/home/catalog.js`, `src/home/models.js`, `src/home/ui.js`, `tests/home.test.js`, `tests/home-browser.mjs`, este documento. Modificaciones funcionales acotadas: `index.html`, `src/app.js`, `src/three/bridge.js`, `src/navigation/ui.js`, `workbench.css`. El runner incorpora la nueva suite; las pruebas de visor/workbench entran explícitamente al laboratorio, pues ahora la portada precede a Space Lab. No se reducen sus aserciones de cálculo/renderizado.

Las hojas y módulos nuevos de la portada suman aproximadamente 22 KB sin comprimir. No añaden librerías, fuentes, imágenes ni recursos externos. No se descarga Three.js en la entrada inicial comprobada a 1440 × 1000. Esto no es una medición Lighthouse ni una garantía de rendimiento en todos los dispositivos.

## Ejecutar y pruebas manuales

```sh
cd /workspace/Cole
python3 -m http.server 8000 --bind 0.0.0.0
```

Sirve los archivos por HTTP con el mecanismo de acceso al puerto de tu entorno. En tu equipo local, abre `http://localhost:8000`. `npm start` es equivalente. No se necesita `npm install` para ejecutar. Detén el proceso con Ctrl+C.

1. Abre el inicio: identifica los cuatro temas y entra al catálogo. Mueve e a 0: velocidad 7,67 km/s, periodo 92,4 min. A e=0,5 y 50 % del periodo: altitud actual 13.942 km, periodo 261,4 min. Modelo ideal terrestre.
2. Reproduce, pausa y recorre la vuelta con el slider. Sal al catálogo: la reproducción se pausa. No debería haber animación inicial automática.
3. Alterna los filtros: cada tema tiene dos laboratorios. Calcula los cuatro ejemplos y revisa unidades/hipótesis; cierra por Escape y comprueba el foco.
4. Modifica B y guarda ambas configuraciones. Aplica la demostración desde la portada: cambia A, B permanece. Pulsa Cargar: se recupera el guardado anterior. Compartir/exportar sigue usando los controles originales del laboratorio.
5. Abre Aircraft, Rocket y Structure desde las tarjetas y vuelve con **Catálogo de laboratorios**. Verifica las pestañas y funcionalidades previas.
6. Usa teclado para filtros, enlaces, botones y sliders. Prueba 320, 390, 768 y 1440 px y zoom 200 %. El inicio no debe desbordarse horizontalmente.
7. Si WebGL falla, la demostración SVG y los resultados siguen disponibles. Si falla la carga de un ejemplo, debe aparecer un error sin resultados anteriores engañosos.

## Estado y límites

Completados: diagnóstico presentado antes de editar, propuesta, inicio, catálogo, integración y refinamiento para esta primera entrega. Evidencia automatizada y resultados exactos se registran en TESTING.md. Las capturas se generan fuera del repositorio, no se incorporan como recursos pesados.

Pendientes para mayor calidad: revisión con usuarios, auditoría WCAG completa, Firefox/Safari y dispositivos táctiles reales, benchmark de carga/GPU y validación del hosting HTTPS. No se añadieron videos; la demostración real evita enlaces inventados o reproducción pesada. La validación científica previa se conserva y el nuevo ejemplo reutiliza esos modelos, sin convertirlos en herramientas certificadas.
