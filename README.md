# AEROLAB 0.21 · Space, Aircraft, Rocket y Structure Lab

Plataforma educativa con Space Lab (órbitas de dos cuerpos), Aircraft Lab (perfil lateral, balance de fuerzas y viga alar simplificada) y Rocket Lab (balance de masa, Δv ideal y lanzamiento radial multietapa). HTML semántico, CSS, JavaScript modular, SVG y visores reales de vehículos con Three.js/WebGL. Three.js 0.210.0 se distribuye localmente para las nuevas vistas WebGL. Sin API, base de datos, compilación ni cuentas; no hace falta instalar paquetes para ejecutar. Structure Lab incorpora voladizos rectangulares y compresión tubular, con propiedades declaradas y coeficientes frente a referencias resistentes. Los modelos y sus límites se documentan en [MODEL.md](docs/MODEL.md), [ENGINEERING.md](docs/ENGINEERING.md) y [STRUCTURE.md](docs/STRUCTURE.md).

La entrada incorpora una demostración orbital calculada y un catálogo temático con experimentos de una variable, curvas calculadas y continuidad hacia los cuatro laboratorios. Los visores y controles internos se conservan. Consulta [la entrega de inicio y exploración](docs/HOME.md) para el diagnóstico, archivos, límites y pruebas manuales.

La ampliación de experimentos se documenta en [EXPERIMENTS.md](docs/EXPERIMENTS.md): rangos, hipótesis, enlaces y pruebas manuales.

El catálogo también permite capturar referencias, comparar cambios y descargar datos científicos CSV. Consulta [COMPARISON.md](docs/COMPARISON.md) para alcance, archivos y pruebas manuales.

Aircraft y Rocket distinguen el estado del cálculo de los mensajes de guardado, con acceso por teclado a campos inválidos. Consulta [CALCULATION-STATE.md](docs/CALCULATION-STATE.md).

Space distingue la validez de A/B y Structure separa solución activa, documento completo, opciones de visualización y combinaciones sin análisis resistente. Consulta [la entrega 19](docs/STATE-INTEGRATION.md).

El diseñador estructural permite comparar referencias independientes por objeto, masa/esfuerzo/desplazamiento y descargar CSV con los dos casos completos. Consulta [la entrega 20](docs/DESIGN-COMPARISON.md).

El diseñador ofrece también un estudio de refinamiento FEM de cinco discretizaciones, sin modificar el caso activo. Consulta [CONVERGENCE.md](docs/CONVERGENCE.md) para interpretación y límites.

## Ejecutar

Desde una terminal con Python 3:

```sh
cd /workspace/Cole
python3 -m http.server 8000 --bind 0.0.0.0
```

Abre `http://localhost:8000` en tu equipo local. En una máquina remota, utiliza el mecanismo de acceso al puerto que ofrezca tu proveedor. No abras `index.html` con `file://`: los módulos JavaScript necesitan servirse por HTTP. Detén el servidor con Ctrl+C. Este servidor solo sirve archivos; no es un backend físico ni almacena datos.

Alternativa con Node y npm presentes: `npm start`. No se necesita `npm install` para usar la aplicación o ejecutar las pruebas unitarias.

Si el puerto 8000 está ocupado, ejecuta `python3 -m http.server 8001 --bind 0.0.0.0` y utiliza el puerto 8001. Las entregas 4, 5, 6, 7, 8 y 9 se validaron en 8001 porque un servidor anterior ocupaba 8000 sin responder correctamente; no se detuvo ese proceso al no poder verificar su propiedad desde el entorno actual.

## Pruebas

```sh
cd /workspace/Cole
npm test
```

Con Node 20 o superior, también puedes ejecutar `node --test tests/*.test.js` sin npm. Consulta [el registro de pruebas](docs/TESTING.md) para pruebas de navegador y manuales.

## Archivos

```text
Cole/
├── index.html                 # Inicio, selector, controles, ecuaciones y resultados
├── aircraft.html              # Aerodinámica, viento, viga, energía y comparación
├── rocket.html                # Balance de masa, Δv ideal y comparación
├── home.css                   # Portada, demostración y catálogo adaptable
├── styles.css                 # Identidad visual, estados, foco y diseño adaptable
├── package.json               # Comandos; dependencia local en vendor/
├── .gitignore
├── .github/workflows/tests.yml # Pruebas unitarias en GitHub Actions
├── vendor/three/              # Three.js r180, OrbitControls, licencia y procedencia
├── assets/textures/           # Textura terrestre estática y procedencia
├── src/
│   ├── home/                  # Catálogo por datos, adaptadores de modelos y UI
│   ├── three/
│   │   ├── geometry.js        # Conversiones SI/3D y muestreo, sin WebGL
│   │   ├── viewer.js          # Escena y cámara WebGL
│   │   └── bridge.js          # Carga diferida y fallback
│   ├── aircraft/
│   │   ├── forces.js          # Suma vectorial y balance instantáneo, sin DOM
│   │   ├── visualization.js   # Perfil lateral, cuatro fuerzas y animación
│   │   └── configuration.js   # Validación de formato y migración v1/v2
│   ├── rocket/
│   │   ├── model.js           # Trayectoria radial, RK4 y Tsiolkovski por etapas
│   │   ├── storage.js         # Persistencia multietapa independiente
│   │   ├── visualization.js   # Gráficas y esquema de separaciones
│   │   └── ui.js              # Editor, reproducción y CSV
│   ├── engineering/
│   │   ├── models.js          # Modelos puros Aircraft/Rocket y validación SI
│   │   ├── profiles.js        # Parámetros, unidades, supuestos y advertencias
│   │   ├── view3d.js          # Adaptador del visor WebGL de vehículos
│   │   └── ui.js              # Interfaz, gráficas, comparación y guardado separado
│   ├── app.js                 # Eventos, estado, comparación y reloj de animación
│   ├── data.js                # Presets declarados y valores iniciales
│   ├── physics.js             # Solución circular pura en SI
│   ├── elliptic.js            # Elipses, ecuación de Kepler y estado orbital SI
│   ├── configuration.js       # Formato portable JSON, migración y validación
│   ├── exploration.js         # Muestreo, CSV, fase temporal y predicciones
│   ├── sensitivity.js         # Barridos puros y CSV de configuraciones
│   ├── sensitivity-ui.js      # Controles, gráfica, selección y aplicación de muestras
│   ├── scenarios.js           # Experimentos declarados e idealizados
│   ├── files.js               # Descargas locales mediante Blob
│   ├── units.js               # Conversiones y formato
│   ├── validation.js          # Límites de entrada
│   ├── visualization.js       # SVG orbital y gráficas con eje desde cero
│   └── storage.js             # Guardado local versionado y validado
├── tests/
│   ├── physics.test.js        # Física, invariantes, conversiones y límites
│   ├── elliptic.test.js       # Kepler, energía, momento angular y casos de referencia
│   ├── exploration.test.js    # Escenarios, archivos, muestreo y predicciones
│   ├── sensitivity.test.js    # Barridos, conservación de condiciones y leyes de escala
│   ├── storage.test.js        # Persistencia y errores
│   ├── three-geometry.test.js # Escalas, extremos y trayectoria radial
│   ├── three-browser.mjs      # Render, cámara, textura y fallback
│   ├── aircraft-forces.test.js # Balance, proyecciones, CD y migración
│   ├── aircraft-forces-browser.mjs # Perfil lateral, controles y guardados
│   ├── rocket-flight.test.js  # Trayectoria, masa, energía y referencia Python
│   ├── rocket-flight-browser.mjs # Interacciones del lanzamiento
│   ├── engineering.test.js    # Referencias, viento, vigas, masas y límites
│   ├── engineering-browser.mjs # Interacciones Aircraft/Rocket opcionales
│   └── browser.mjs            # Integración opcional con Playwright y Chromium
└── docs/
    ├── MODEL.md               # Modelo, dimensiones, supuestos y precisión
    ├── THREE-VIEWS.md         # Visores WebGL, recursos y validación
    ├── AIRCRAFT-FORCES.md     # Perfil lateral, fuerzas y precisión
    ├── ROCKET-FLIGHT.md        # Lanzamiento radial multietapa, RK4 y validación
    ├── ENGINEERING.md         # Modelos Aircraft/Rocket, dimensiones y casos
    ├── TESTING.md             # Evidencia, reproducción y pruebas manuales
    └── ROADMAP.md             # Fases completadas, problemas y pendientes
```

## Tierra y trayectorias WebGL 3D · versión 0.8

Space Lab incluye un nuevo visor Three.js con Tierra texturizada, selección A/B y satélite conectado al reloj existente. Rocket Lab dibuja la trayectoria radial calculada y el marcador de altitud durante la reproducción. Arrastra para girar; rueda/pinza para zoom, o usa los botones con teclado. La textura es estática y no se aplica a otros cuerpos. No hay un modelo orbital nuevo ni una trayectoria curva de cohete inventada.

La dependencia se justifica por el renderizado WebGL de esfera/textura y cámara en perspectiva; la versión fija vive en `vendor/three/` con licencia/procedencia. La imagen local está en `assets/textures/`. No hay solicitudes a CDN ni instalación adicional. Si falla WebGL se mantienen cálculos y vistas SVG. Detalles, escalas, muestreo, recursos y límites: [THREE-VIEWS.md](docs/THREE-VIEWS.md).

## Aircraft Lab · perfil lateral y cuatro fuerzas (0.7)

Abre `/aircraft.html`. El formulario conserva superficie alar, velocidad, densidad y CL y añade peso en N vinculado a masa en kg, empuje horizontal y selector de resistencia: polar existente o CD total impuesto. En modo directo no se suma otra resistencia inducida. Cambiar parámetros actualiza flechas, barras y fuerzas netas/aceleraciones instantáneas. El balance incorpora proyecciones con viento vertical; con viento lateral se declara no resuelto en 2D.

El perfil lateral es genérico y la animación opcional del aire es ilustrativa. No hay CFD, datos del perfil, integración de trayectoria ni estabilidad calculada. Animar no cambia fuerzas. La tabla y el texto acompañan las visualizaciones. Nuevos guardados/exportaciones Aircraft usan v2; cargar v1 conserva parámetros anteriores y añade controles hipotéticos sin sobrescribir hasta Guardar. Detalles: [AIRCRAFT-FORCES.md](docs/AIRCRAFT-FORCES.md).

## Lanzamiento multietapa · Rocket Lab 0.6

En `/rocket.html`, la primera sección permite diseñar de 1 a 4 etapas. Indica masa seca, propelente, empuje y duración por etapa, carga útil, Tierra/Luna y tiempo máximo. **Calcular y lanzar** obtiene una trayectoria vertical en vacío con gravedad variable. Las gráficas de altitud/velocidad se actualizan al reproducir estados calculados; el control permite pausar, cambiar velocidad y explorar tiempo. La interfaz informa escape energético, caída/impacto, ausencia de despegue o desenlace todavía sin resolver. No equivale a simular un lanzamiento terrestre real.

Guardar/Cargar diseño usan una clave independiente. Exportar trayectoria CSV descarga todos los estados. Cambiar entradas invalida la trayectoria anterior. El presupuesto por etapas usa Tsiolkovski incluyendo la masa de las superiores; no se confunde con velocidad final. Consulta [ROCKET-FLIGHT.md](docs/ROCKET-FLIGHT.md) para ecuaciones, algoritmo, casos independientes y limitaciones.

Arquitectura añadida: `src/rocket/{model,storage,visualization,ui}.js`, `tests/rocket-flight.test.js`, `tests/rocket-flight-browser.mjs` y `docs/ROCKET-FLIGHT.md`. La calculadora anterior y su visualización 3D permanecen independientes debajo: sus controles no cambian el lanzamiento multietapa.

## Aircraft y calculadora anterior de Rocket

Abre Aircraft Lab o Rocket Lab desde el selector, o visita `/aircraft.html` y `/rocket.html`. Modifica los parámetros: cada campo muestra unidades y límites. Gira la geometría arrastrando el Canvas o con los controles de cámara, accesibles por teclado. La visualización usa Three.js/WebGL y cámara perspectiva; no hace CFD ni certifica un diseño.

- Aircraft calcula velocidad relativa al aire con tres componentes de viento uniforme, sustentación y resistencia con coeficientes impuestos, geometría trapezoidal, flexión de una viga alar ideal y potencia/emisiones según un factor hipotético elegido. El CG solo mueve un marcador, sin calcular estabilidad. La gráfica muestra sustentación frente a velocidad con coeficientes fijos.
- Rocket calcula balance de masa, flujo constante, velocidad efectiva de escape y Δv de Tsiolkovski. El porcentaje de funcionamiento permite inspeccionar estados; no es una trayectoria de lanzamiento. La corrección vertical por gravedad supone vuelo libre ya iniciado, vacío y gravedad constante. Diámetro y longitud solo modifican el dibujo.
- Capturar referencia compara la configuración actual con una copia durante la sesión. Borrar referencia la elimina. La diferencia porcentual no se muestra si el denominador es cero.
- Guardar/Cargar son independientes por módulo y navegador. Restablecer recupera valores iniciales sin borrar el guardado ni la referencia. Recargar pierde la referencia y requiere Cargar para recuperar parámetros guardados. Exportar JSON descarga parámetros; Aircraft/Rocket todavía no importan archivos.

Los ejemplos no corresponden a aeronaves o vehículos reales. No hay meteorología en vivo, datos de red eléctrica actualizados ni datos de fabricantes. Consulta ENGINEERING.md antes de interpretar los resultados.

## Uso de Space Lab

1. Elige el cuerpo central de A y B o introduce parámetros propios. Editar μ o R cambia el selector a Personalizado.
2. Introduce la altitud del periapsis y la excentricidad (0 = círculo; máximo 0,9). Las unidades y límites aparecen junto a cada entrada; todos los campos deben ser válidos. El cuerpo ocupa un foco, no el centro de la elipse.
3. Compara los resultados, barras y órbitas. Ambas vistas comparten escala de distancia. Los cuerpos pueden tener distinto radio y μ.
4. Reproduce o pausa la posición calculada mediante Kepler. Las lecturas bajo cada vista muestran distancia y velocidad actuales; la tabla muestra extremos y periodo. La velocidad del reloj indica segundos simulados por segundo real. La animación empieza pausada, también para usuarios con movimiento reducido.
5. Guardar conserva ambas configuraciones en el navegador. Cargar recupera el guardado, incluso después de recargar. No se carga automáticamente. Restablecer devuelve los presets iniciales sin borrar el guardado.
6. Carga uno de los cuatro experimentos para estudiar altura, excentricidad, semieje mayor o gravedad lunar. Son casos hipotéticos para aprender, no misiones reales. Editar un parámetro cambia a exploración propia.
7. Usa el control de porcentaje de tiempo, con A o B como referencia. Ir a apoapsis lleva al 50 % del periodo de esa referencia; ambos satélites comparten los mismos segundos. Cambiar referencia no cambia el tiempo. El control admite teclado.
8. Examina distancia y rapidez durante una vuelta. Cada curva usa su propio periodo normalizado, con marcadores del estado actual. Las leyendas distinguen A por línea continua y B por línea discontinua.
9. Predice si el periodo o una velocidad de B será mayor, igual o menor que A. Comprobar calcula la respuesta con los valores actuales. No hay resultados de aprendizaje ficticios ni puntuaciones de misión.
10. Exportar JSON descarga ambas configuraciones. Importar JSON las valida antes de aplicarlas; no las guarda automáticamente. Se admiten formatos v1 y v2 hasta 16 KiB. Un archivo inválido conserva los parámetros actuales. Datos CSV descarga 241 estados por configuración, con unidades en los encabezados y tiempos en segundos para cada órbita.
11. En Análisis de sensibilidad, selecciona base A/B, variable, intervalo, resultado y número de muestras; pulsa Calcular barrido. Al variar hₚ se conserva e; al variar e se conserva hₚ. Los radios del cuerpo y μ también permanecen fijos. Selecciona una muestra con el control de rango para inspeccionarla y Aplicar muestra para modificar solo la configuración indicada.
12. La tabla muestra todas las muestras; Exportar barrido CSV incluye las condiciones físicas y resultados en segundos y km/s. Cambiar un parámetro base o un control del barrido retira los resultados anteriores hasta recalcular. Las opciones del barrido no se guardan al recargar; los parámetros aplicados sí pueden guardarse con Guardar ambas.

Los cambios de parámetros pausan y reinician el tiempo. Ocultar la pestaña pausa la reproducción para evitar saltos al volver. No hay adquisición de telemetría ni cálculo de trayectorias reales.

Los guardados v1 se cargan con e=0 y no se sobrescriben hasta pulsar Guardar. Los nuevos guardados usan el formato v2 y conservan el mismo identificador de almacenamiento para recuperar datos anteriores.

El CSV usa coma como separador y punto decimal, sin formato regional. Hay 482 filas de datos más el encabezado. La columna `orbit_fraction` abarca de 0 a 1; `time_s` corresponde al periodo de A o B, no a una cronología compartida de misión. Los archivos son locales; no se envían a un servidor.

## Publicación inicial

Los archivos son estáticos y se pueden servir mediante cualquier alojamiento con HTTPS y soporte de tipos MIME JavaScript. Publica `index.html`, `aircraft.html`, `rocket.html`, `structure.html`, `styles.css`, `workbench.css`, `src/`, `docs/`, `vendor/` y `assets/`; no publiques `.git`, pruebas ni herramientas temporales. Los enlaces y módulos son relativos y funcionan bajo un subdirectorio. No se ha desplegado el proyecto ni comprobado un hosting real.

Antes de publicar: ejecuta las pruebas, verifica el sitio sobre HTTPS, revisa enlaces y accesibilidad manual y configura políticas de seguridad en el proveedor. No se introducen secretos ni contenido remoto durante el cálculo. Three.js es código de terceros fijado y servido localmente; conserva sus licencias y revisa actualizaciones antes de cambiar versión. El almacenamiento local no está cifrado y depende del origen del sitio; úsalo solo para parámetros públicos. No uses el servidor de Python como servidor de producción.

Para actualizar modelos, conserva pruebas de regresión y migra o cambia la versión del formato guardado. Las extensiones futuras deben tener modelos y pruebas independientes.

## Pestañas y simulaciones compartibles · versión 0.9

Cada laboratorio separa configuración, análisis y teoría mediante pestañas con teclado. **Copiar enlace de simulación** guarda parámetros, referencias e instante en la URL; el enlace se abre pausado sin sobrescribir guardados. Si el navegador bloquea el portapapeles, muestra copia manual. Alcance, archivos y pruebas: [NAVIGATION.md](docs/NAVIGATION.md).

## Visores de vehículos · versión 0.10

Aircraft y la calculadora de una etapa de Rocket utilizan Three.js con cámara orbital 360°, rueda/pinza para zoom, desplazamiento y controles de teclado. Aircraft muestra vectores de fuerzas desde el CG; con viento lateral oculta las direcciones no calculadas. Rocket añade porcentaje de empuje aplicado (1–100 %) y una pluma ilustrativa animada que se apaga al agotarse el propelente. Se reutiliza Three.js local, sin nuevas dependencias. Detalles, ecuaciones y pruebas: [VEHICLE-VIEWS.md](docs/VEHICLE-VIEWS.md).

## Structure Lab · versión 0.11

Abre `structure.html` desde cualquiera de los cuatro menús. Selecciona material y carga, configura geometría/propiedades y consulta esfuerzo, coeficiente material, deflexión de voladizo o acortamiento axial. Hay diagramas SVG, filtro de aplicabilidad de Euler, comparación, guardado exclusivo, exportación JSON/CSV y enlaces compartibles. Carbono utiliza un laminado hipotético con resistencias supuestas, sin afirmar un límite elástico. Archivos, casos conocidos, pruebas y límites: [STRUCTURE.md](docs/STRUCTURE.md).

## Structure Lab · diseñador 0.12

Geometría paramétrica NACA/ellipsoide, cohete por secciones y envolvente esférica. Visor Three.js local con nodos 1D, campo de esfuerzos, deformación amplificada y cámara interactiva. Flexión Euler–Bernoulli, barras termoelásticas, membranas de presión y pandeo global ideal; carbono UD por máximo esfuerzo por dirección, sin Von Mises. No es FEM volumétrico ni una certificación. Los presets y guardados del banco anterior permanecen independientes.

Pestañas: **Geometría y Materiales**, **Simulación de Cargas**, **Análisis Finito y Resultados**. Importa casos válidos abiertos en Aircraft/Rocket y envía una propuesta de masa revisable en destino, sin modificar sus ecuaciones ni el resto de sus parámetros. JSON, CSV, almacenamiento local y URL exacta con compatibilidad de enlaces antiguos.

Consulta [STRUCTURE-DESIGN.md](docs/STRUCTURE-DESIGN.md) para arquitectura, propiedades, ecuaciones, unidades, ejecución, pruebas manuales, límites y tareas pendientes. Todo el código completo se entrega en los archivos de la versión, sin fragmentos pendientes. No hay nueva dependencia de ejecución: se reutiliza Three.js vendorizado.

## Correcciones de auditoría · versión 0.13

Cuerpos centrales validados sin propiedades heredadas, estados de vuelo finitos, corte de motor coherente, deformación térmica con Poisson y borradores geométricos independientes. Las propuestas de masa conservan ahora el caso completo de origen y permiten elegir explícitamente entre ese caso y las entradas abiertas. No hay guardado automático.

Entrega, archivos, ejecución y pruebas manuales: [CORRECTIONS.md](docs/CORRECTIONS.md). Se mantienen los cuatro laboratorios y sus formatos anteriores.

## Interfaz y renderizado · versión 0.14

Los cuatro laboratorios muestran antes sus visores, con inspectores agrupados y reproducción junto a la escena. Servicios comunes de iluminación/encuadre; Structure separa geometría iluminada y campos resistentes sin iluminación, actualiza normales/bounds de la deformación y conserva el cálculo al modificar opciones visuales. Su gráfica tiene ejes firmados, ticks y selección de nodos con teclado/puntero. Los gráficos conservan legibilidad en móvil mediante regiones desplazables.

Pruebas y CI de navegador: `PLAYWRIGHT_MODULE=/ruta/node_modules/playwright/index.mjs npm run test:browser`. El runner inicia y detiene su propio servidor local; Playwright es una herramienta de pruebas, no una dependencia del sitio. Guía completa de archivos, ejecución, pruebas manuales y límites: [WORKBENCH.md](docs/WORKBENCH.md). Preparación de hosting: [DEPLOYMENT.md](docs/DEPLOYMENT.md).
