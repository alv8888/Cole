# Entrega 14 · Interfaz, renderizado y comprobación (0.14)

## Objetivo y alcance de la fase

Completar la reorganización de interfaz y la mejora técnica de renderizado propuestas por la auditoría, sobre las cuatro páginas existentes. Se conservan todos los controles, cálculos, referencias, guardados, archivos y enlaces. No se incorpora un framework ni una biblioteca de ejecución nueva. Three.js/WebGL y SVG siguen siendo suficientes.

Problemas tratados antes de avanzar: visores situados demasiado abajo; controles de reproducción separados; parámetros sin agrupación plegable; sombreado de geometría deformada con normales antiguas; leyenda de color desacoplada del mapa real; gráfico de Structure sin escala firmada consistente; opciones visuales que repetían el FEM; callbacks RAF permanentes al estar pausados; comprobaciones de navegador ausentes en CI.

## Funciones implementadas por laboratorio

- **Space:** escena planeta/órbita y parámetros en un banco de trabajo común. El mismo reloj, timeline y accesos a ápsides están junto al 3D. Las dos vistas orbitales SVG y experimentos siguen disponibles. La línea y el marcador mantienen los estados de Kepler existentes; la iluminación es ilustrativa, no una efeméride solar.
- **Aircraft:** visor 3D prioritario, cámara ajustada a límites/orientación, rejilla proporcionada al modelo e iluminación compartida. Se mantienen perfil lateral, flujo ilustrativo, cuatro fuerzas calculadas y gráficos. Animación sin callbacks al estar pausada.
- **Rocket:** planeta/trayectoria y reproducción próximos, inspector multietapa a un lado y por delante de la calculadora independiente. Se mantiene la línea radial calculada, el esquema de etapas y las gráficas. La geometría de una etapa continúa siendo independiente del lanzamiento multietapa; no se dibujan piezas desprendidas ni una trayectoria lateral ficticia. Reproducción bajo demanda.
- **Structure:** geometría y escenario de cargas dan prioridad al visor. Selector entre material iluminado y campo resistente de color estable. La leyenda coincide con colores de índice 0, 0,5 y ≥1; la saturación cromática no recorta los índices numéricos. Se actualizan normales y volúmenes envolventes después de deformar. Cambiar malla, nodos, modo, amplificación o fracción no recalcula el FEM. Un error visual conserva el resultado físico y permite corregir la vista.
- **Global:** inspectores con disclosures nativos y teclado, controles preservados, composición más compacta y tamaños de ayuda legibles. Los gráficos científicos disponen de regiones desplazables en móvil para conservar sus etiquetas. Compartir Structure conserva el nuevo modo visual; los documentos anteriores sin ese campo siguen siendo válidos.

## Arquitectura y archivos

```text
Cole/
├── index.html, aircraft.html, rocket.html, structure.html
├── styles.css                      # tema y componentes anteriores conservados
├── workbench.css                   # distribución compartida, reflujo y gráficas
├── src/navigation/
│   ├── ui.js                       # integra la distribución con tabs/anchors existentes
│   ├── workbench.js                # mueve nodos existentes y regiones de gráficos
│   └── inspector.js                # agrupación nativa de fieldsets existentes
├── src/rendering/
│   ├── presentation.js             # luces, color cuantitativo y encuadre
│   └── clock.js                    # reproducción sin frames en reposo
├── src/charts/
│   ├── scales.js                   # escalas firmadas, ticks y selección de nodo
│   └── line.js                     # interacción SVG/texto independiente del modelo
├── src/structure/design/
│   ├── ui.js, viewer.js, data.js    # integración, modos y compatibilidad de formatos
│   └── deformation.js              # adaptador físico conservado de entrega 13
├── src/three/viewer.js              # escena orbital/radial e iluminación común
├── src/engineering/ui.js, vehicle-viewer.js
├── src/app.js, src/rocket/ui.js, src/aircraft/visualization.js
├── tests/presentation.test.js
├── tests/workbench-browser.mjs
├── tools/test-browser.mjs          # servidor y ejecución reproducible de 11 suites
└── .github/workflows/tests.yml     # pruebas numéricas + tarea Chromium
```

Las ecuaciones y solvers físicos no se cambian en esta fase. La nueva gráfica utiliza el campo nodal ya calculado; sus escalas son funciones puras. La infraestructura de gráfica se introduce primero en Structure, sin reemplazar indiscriminadamente todos los gráficos anteriores.

## Decisiones de renderizado y ciencia

Three.js vendorizado permanece fijado. La política común utiliza salida sRGB, tone mapping ACES para geometría, iluminación hemisférica, principal y de contorno. Los colores resistentes usan materiales sin iluminación ni tone mapping, para no confundir sombra con menor esfuerzo. El color interpola tres referencias sRGB publicadas en la leyenda.

La distancia de cámara se obtiene de la esfera envolvente en el planeta o de los ocho vértices de una caja proyectada según la dirección de cámara para los vehículos. Se considera el eje horizontal y vertical del campo de visión. La cámara no cambia las dimensiones físicas.

La deformación sigue siendo una rampa de la solución estática, con interpolación del adaptador existente. Normales y bounds se actualizan únicamente cuando cambia la amplitud visual; rotar no vuelve a deformar ni resolver. El campo de color es una envolvente/interpolación por sección extendida al contorno, no un tensor FEM tridimensional. Las superficies grises pueden aportar masa sin un campo calculado. La triangulación superficial y los nodos FEM 1D mantienen rótulos distintos.

SVG y CSV conservan signos y unidades: posición en m y desplazamiento en mm. El cero del eje se coloca en su valor real dentro del dominio; no en una coordenada prefijada. El cursor selecciona nodos calculados, sin inventar resultados intermedios. Inicio/Fin y flechas ofrecen la misma consulta que el puntero.

## Ejecución exacta

Desde la raíz del checkout, con Python disponible:

```bash
npm start
```

O, sin npm:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

En tu equipo abre `http://localhost:8000`. Los módulos JavaScript requieren HTTP; no abras con `file://`. No es un servidor de producción ni un backend de cálculos.

Pruebas numéricas:

```bash
npm test
```

En el sandbox actual se usó Node 24 sin aislamiento de procesos para comprobar las pruebas individuales:

```bash
node --test --test-isolation=none tests/*.test.js
```

Herramientas de navegador instaladas fuera del proyecto, solo para desarrollo/CI:

```bash
npm install --prefix /tmp/aerolab-browser --no-save playwright@1.64.0
/tmp/aerolab-browser/node_modules/.bin/playwright install --with-deps chromium
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser
```

El runner levanta Python en `127.0.0.1:8060`, verifica una respuesta AeroLab y ejecuta tres suites concurrentes; detiene únicamente su propio servidor al terminar. Si ese puerto está ocupado, inicia otro servidor y proporciona `AEROLAB_URL`. `CHROMIUM_PATH` permite usar un ejecutable determinado; si no está definido, utiliza Chromium del sistema o el instalado por Playwright. No desactives TLS ni firmas para instalar herramientas.

Ejemplo de una suite seleccionada:

```bash
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser -- workbench-browser.mjs
```

## Pruebas manuales

1. Abre cada laboratorio a 390 px y en escritorio. El visor debe aparecer antes que los grupos largos de parámetros. Confirma que no haya desbordamiento horizontal de toda la página.
2. Usa las tres pestañas con Tab, flechas e Inicio/Fin. Abre un enlace interno de teoría y vuelve: los parámetros deben permanecer.
3. Plega y despliega un grupo del inspector con Enter; confirma que conserve valores y que puedas acceder a todos los campos al abrirlo.
4. Space: reproduce, pausa, selecciona A/B, periapsis/apoapsis y mueve timeline. Compara el marcador 3D con el estado y las dos vistas SVG.
5. Aircraft: modifica masa, superficie, CL/CD y viento; gira y acerca la cámara. Confirma fuerzas/advertencias y el flujo explícitamente ilustrativo. Pausa el flujo.
6. Rocket: calcula, reproduce y explora tiempo; observa altitud, velocidad y masa calculadas. Cambiar parámetros debe retirar la trayectoria anterior. La calculadora de una etapa mantiene su pluma separada del vuelo multietapa.
7. Structure: alterna campo/geometría, nodos y malla; cambia amplificación/fracción. Los resultados de masa/esfuerzo/factor deben permanecer. Borra amplificación, verifica el aviso y recupera una entrada válida.
8. En cargas, aplica deformación y gira: el sombreado debe seguir la forma deformada. Centra la cámara cuando aumentes mucho la amplificación.
9. En resultados, enfoca la gráfica; usa flechas/Inicio/Fin y selecciona con clic. Verifica posición y desplazamiento frente a la tabla nodal y CSV. En compresión los desplazamientos firmados deben quedar por debajo de cero.
10. Comparte, recarga y guarda/carga Structure con modo geometría; comprueba recuperación pausada y compatibilidad de archivos anteriores.
11. Comprueba pérdida/restauración de WebGL y contexto sin WebGL: los resultados numéricos y SVG deben seguir disponibles.

## Verificación y resultados

**101 pruebas unitarias y 96 grupos Chromium** aprobados: las 86 comprobaciones de navegador previas y 10 nuevas. Se verifican: encuadre/colores/escalas y ciclo RAF, dispositivos emulados a 320/390/768/1440 px, zoom CSS del 200 %, pestañas, normales actualizadas, independencia de parámetros visuales, recuperación de error visual, gráfico por teclado/puntero, URL exacta, disclosures, recuperación WebGL estructural y callbacks detenidos en reposo/pausa.

Posición del inicio del canvas desde el principio de la página a 390×900:

| Lab | Auditoría 0.12 | Entrega 14 |
|---|---:|---:|
| Space | 2928 px | 691 px |
| Aircraft | 1322 px | 527 px |
| Rocket | 2647 px | 528 px |
| Structure | 1001 px | 710 px |

No son tiempos de rendimiento. La comprobación de frames valida ausencia de callbacks en reposo en Aircraft/Rocket; no demuestra una tasa FPS o consumo de batería. Se revisaron capturas de los visores y se mejoró el encuadre tras detectar espacio vacío excesivo. La primera regresión de normales terminó en timeout porque dos ajustes podían volver a la misma amplitud en un frame; se cambió el caso para garantizar una amplitud final diferente, conservando la aserción de actualización.

Contrastes calculados para los pares principales del tema: texto/panel 14,88:1; texto secundario/panel 7,85:1; acento/panel 11,31:1; texto de botón/fondo 10,49:1. No cubren cada estado ni sustituyen una auditoría WCAG con lector de pantalla. Zoom CSS verificado no equivale a todas las implementaciones del zoom nativo.

## Limitaciones y estado de cierre

Completado: distribución compartida, inspectores plegables, presentación 3D común, encuadre, campos coherentes, normales/bounds, controles visuales independientes, gráfica firmada interactiva, animación bajo demanda, regresiones y runner/CI de navegador, documentación y preparación de publicación.

No se añadió CFD, FEM volumétrico, órbitas perturbadas ni dinámica tridimensional de separación. No se validaron propiedades de materiales mediante ensayos. No se midieron GPU física, batería ni FPS. Las pruebas de navegador son Chromium en este entorno, no dispositivos físicos ni Safari/Firefox. La tarea de GitHub Actions está configurada; su ejecución remota debe consultarse en Actions después de publicar. Preparar el sitio estático no demuestra que un hosting HTTPS esté desplegado; véase DEPLOYMENT.md.
