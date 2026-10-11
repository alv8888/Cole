# AeroLab 0.8 · vistas planetarias Three.js

## Objetivo y necesidad técnica

Renderizar una esfera terrestre con textura y líneas 3D interactivas en Space Lab y Rocket Lab. Three.js aporta WebGL, materiales, textura y cámara en perspectiva con OrbitControls; el Canvas ortográfico anterior no ofrecía ese renderizado. El usuario pidió expresamente esta dependencia. Se incorpora Three.js **0.180.0 (r180)** mediante copias locales sin modificar del paquete npm, con licencia MIT y SHA-256 en vendor/three/README.md. No hay CDN, backend o instalación necesaria al ejecutar el sitio.

Los archivos three.module.js, three.core.js y OrbitControls.js se distribuyen en vendor/three. El import map de index.html y rocket.html resuelve el identificador `three` al módulo local. La vista se carga con importación dinámica; si no carga o no hay WebGL, los cálculos, tablas y SVG siguen disponibles. La biblioteca no calcula la física.

## Tierra y otras esferas

Esfera de radio visual 1, con 64 segmentos longitudinales y 32 latitudinales. Unidades de render: 1 = radio del cuerpo central. Tierra muestra un JPEG estático de 2048 px, copiado sin editar del ejemplo earth_atmos_2048.jpg de Three.js r180. Fuente exacta, hash y licencia de distribución se documentan en assets/textures/README.md; se conserva la licencia MIT del proyecto en vendor/three/LICENSE. No se afirma haber actualizado cartografía, NASA o meteorología en vivo.

Luna y Marte muestran esferas simples identificadas por color. Los cuerpos personalizados tampoco reciben textura terrestre. La esfera conserva la relación con las distancias calculadas: no se agranda para hacerla visible en órbitas extremas. Los marcadores de satélite/cohete sí se amplían para legibilidad y no representan tamaño físico de vehículos. Las luces son visuales, sin efemérides solares, rotación del planeta, eclipses, relieve, achatamiento o geometría atmosférica.

## Órbitas: conexión con la física

La configuración visible se elige A/B; se muestra una a la vez para no superponer cuerpos con radios o μ distintos como si fueran el mismo planeta. La comparación 2D previa permanece intacta. El radio y nombre del cuerpo se muestran junto al visor.

La órbita es la misma elipse de dos cuerpos, con foco en el origen. Para a, b y e calculados en SI:

- x=a(cos E−e), y=b sin E en el plano orbital original.
- Coordenadas 3D de la línea: (x/R, 0, y/R).
- 512 muestras uniformes de anomalía excéntrica y línea cerrada mediante LineLoop.

La elipse sigue siendo plana en el espacio tridimensional. Se puede observar desde distintas direcciones; girar cámara no cambia inclinación física, estado orbital o gravedad. No se introduce una inclinación respecto a un marco de misión, un RAAN o geolocalización a partir de la textura. Los radios periapsis/apoapsis conservan escala respecto al cuerpo.

La posición del satélite se obtiene del mismo estado `orbitalState` ya resuelto mediante Kepler por el laboratorio y se transforma (x/R,0,y/R). Reproducción, pausa, exploración temporal y escenarios actualizan el marcador 3D junto a las vistas SVG. Se invalidan geometría/marcador cuando la configuración seleccionada deja de ser válida. No hay otro reloj independiente.

## Cohete: trayectoria radial

Se usa el resultado de la integración radial RK4 existente, con todos sus límites de ROCKET-FLIGHT.md. Cada estado de altura h se dibuja como (0,1+h/R,0). La dirección +y se elige como referencia visual sobre el polo: no indica un lugar de lanzamiento real ni modifica la gravedad del modelo esférico.

La trayectoria se limita a 1200 estados originales ordenados por tiempo, conservando los extremos. La línea muestra solo muestras hasta el tiempo reproducido y el marcador usa el estado exacto mostrado por Rocket Lab. No hay nuevos puntos físicos calculados por Three.js. Al regresar, la línea ascendente y descendente se superpone porque el modelo es radial. No se inventa una curva alrededor del planeta para simular una órbita, un guiado o una inclinación lateral que no se han implementado. Un escape radial tampoco se convierte en órbita circular.

Calcular genera la geometría; la reproducción mueve el marcador y aumenta el segmento visible. La cámara se encuadra para la extensión de la trayectoria calculada, aunque su parte futura no se dibuja. Cambiar diseño limpia línea y marcador anteriores. Luna conserva su propio radio y esfera simple. La calculadora original de una etapa mantiene su geometría Canvas y no alimenta esta nueva línea.

## Interacciones y rendimiento

Arrastrar gira; rueda o gesto de pinza acerca/aleja; OrbitControls permite desplazar el encuadre. Siete botones permiten giro horizontal/vertical, acercar, alejar y restablecer cámara mediante teclado. Restablecer afecta solo cámara. No hay giro automático, nuevo integrador, reloj oculto o reproducción adicional. Renderizado bajo demanda al cambiar cámara, tamaño o estado físico; densidad de píxeles limitada a 2. Los módulos locales suman aproximadamente 2 MB sin comprimir y la textura unos 0,5 MB. Se recomienda compresión HTTP/caché en el hosting; no se ha probado un proveedor real ni medido rendimiento en dispositivos físicos.

Al reemplazar la línea se liberan geometría y material antiguos. La textura se reutiliza durante la página. ResizeObserver ajusta resolución y aspecto del visor. Una pérdida de contexto informa el problema y desactiva controles 3D; las herramientas 2D siguen disponibles. Si el navegador restaura el contexto se vuelve a renderizar y habilitar los controles. Se verificó pérdida y ausencia de WebGL; no se simuló restauración en las pruebas. La carga fallida de la textura deja la esfera sin mapa y muestra aviso; se probó ese fallo bloqueando la solicitud de imagen, conservando cámara, geometría y resultados.

## Exactitud y verificación

La transformación divide distancias en metros por R en metros: queda adimensional y no altera el cálculo SI. El redondeo JavaScript y los buffers Float32 de WebGL limitan representación, especialmente en relaciones de escala extremas. La línea une muestras con segmentos rectos: 512 muestras orbitales y hasta 1200 del lanzamiento son aproximaciones de dibujo, no mejoras de precisión física. El último segmento visible del cohete puede terminar antes del marcador entre muestras retenidas. El marcador sí corresponde al estado original; no se interpola una trayectoria física nueva.

Tres pruebas unitarias comprueban periapsis/apoapsis, radio circular, foco y plano, posición orbital calculada, trayectoria radial sin desplazamiento lateral, radio/altitud, extremos temporales, estados cortos y entradas inválidas. La tolerancia relativa 10⁻¹² en estas conversiones solo contrasta la aritmética de doble precisión, no afirma precisión de la misión o del render Float32.

Siete grupos Chromium verifican WebGL real por SwiftShader (renderizador por software de pruebas), textura local, cambios reales de imagen con cámara, arrastre, selección A/B/cuerpos, marcador temporal, invalidez, trayectoria, anchuras 320–1440 px, pérdida de contexto, fallo de textura y fallback sin WebGL. Se inspeccionaron capturas de órbita y cohete en escritorio y móvil. Se comprobó que las solicitudes de recursos de la prueba permanecen en el origen local. Los cuatro scripts de navegador anteriores conservan regresiones. No se comprobó GPU física, Safari, Firefox, auditoría WCAG, recuperación de contexto o hosting.

## Archivos y ejecución

- src/three/geometry.js: conversiones puras SI/3D y muestreo, sin DOM/Three.js.
- src/three/viewer.js: escena, esfera, textura, línea, marcador y OrbitControls.
- src/three/bridge.js: carga diferida, cámara accesible y fallo controlado.
- src/app.js y src/rocket/ui.js: conexión al estado físico y reloj existentes.
- vendor/three/: biblioteca, controles, licencia y procedencia.
- assets/textures/: JPEG y procedencia.
- tests/three-geometry.test.js y tests/three-browser.mjs: verificación.
- index.html, rocket.html y styles.css: paneles adaptables e import map.

Servidor HTTP como indica README. No abrir con file://. Entra a index.html para Space Lab y rocket.html para lanzar. El visor requiere navegador con módulos ES, import maps y WebGL2; si no está disponible se conservan los modelos y SVG. Pruebas manuales y comandos: TESTING.md. Al publicar deben incluirse vendor/ y assets/ con sus licencias, además de HTML/CSS/src/docs.

Completado: Three.js local, Tierra texturizada, cámara interactiva, órbita y lanzamiento conectados a modelos, controles por teclado y fallback. Pendiente: hardware/navegadores alternativos, compresión/caché probada en hosting, auditoría de accesibilidad, trayectoria no radial validada antes de representarla y otras texturas con trazabilidad. El desarrollo visual no cambia las limitaciones científicas originales.
