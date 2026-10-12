# Pruebas y evidencia de la entrega 8 · AEROLAB 0.8

## Resultado observado

- Node.js 24.19.0: **57 pruebas unitarias aprobadas**, 0 fallos, 0 omitidas.
- Chromium headless mediante Playwright: **51 comprobaciones de integración aprobadas** (20 Space, 10 Aircraft/Rocket anterior, 7 lanzamiento multietapa, 7 Aircraft lateral y 7 Three.js), sin errores JavaScript no capturados en las tres páginas.
- Cálculo independiente con Python 3.12.14: valores terrestres a 400 km y a radio 42164 km concordantes con las referencias de las pruebas.
- Página y módulos servidos por HTTP con Python; no se requiere instalación de paquetes de aplicación ni compilación.
- Capturas de escritorio de 1440 px y móvil de 390 px inspeccionadas. Comprobación automática sin desbordamiento global a 1440, 768, 390 y 320 px. La tabla permite desplazamiento horizontal propio en móvil.

Los resultados corresponden a esta entrega; ejecutar los comandos nuevamente produce evidencia para cualquier modificación posterior. Los 51 checks de navegador son grupos de aserciones, no 51 modelos científicos adicionales.

## Qué comprueban las pruebas unitarias

Caso terrestre ideal de 400 km; periodo casi sidéreo a radio 42164 km; caso normalizado μ=1 y r=1; tercera ley de Kepler; escalamiento con radio y μ; equilibrio centrípeto; energía específica; radio constante y periodicidad; conversiones; signo del porcentaje de energía; entradas no físicas y desbordamiento; extremos de los límites admitidos; guardado/carga, versión incorrecta, JSON dañado, parámetros inválidos y almacenamiento indisponible.

La ampliación verifica e=0 como regresión circular, caso normalizado elíptico, referencia terrestre independiente, periapsis/apoapsis, periodicidad, conservación de energía y momento angular, vis-viva, geometría en 120 fases para cuatro excentricidades, residuo de Kepler, segunda ley de áreas, e=0,9 y migración de guardados v1. Un cero con signo negativo de IEEE-754 se compara como valor numérico cero; no es una velocidad física distinta.

La entrega 3 añade comprobaciones de formato JSON portable, límite de bytes y entradas incorrectas, propiedades ajenas descartadas, muestreo con extremos, filas CSV y tiempos/unidades, coherencia física de los cuatro escenarios, predicciones basadas en valores actuales y extremos del control temporal. Los archivos JSON se validan antes de aplicar ambos estados; una importación parcial no se acepta.

La entrega 4 añade cuatro pruebas: extremos y leyes de escala del barrido de altura, condiciones fijas y relaciones analíticas del barrido de e, rechazo de intervalos/tamaños inválidos y contenido/unidades del CSV. En navegador se comprueban gráfica y tabla, selección de muestras, borrado de datos obsoletos, configuración inválida, exportación real y aplicación exclusiva a B.

La entrega 5 añade seis pruebas de ingeniería: fuerzas de referencia; viento relativo y escalamiento; geometría/viga/energía; balance y estados de cohete; escalamiento, gravedad cero y dimensiones visuales; rechazo de entradas no finitas y fuera de rango en todos los campos. Los casos y sus dimensiones están en ENGINEERING.md.

La entrega 6 añade ocho pruebas: presupuesto multietapa con masas superiores; despegue tardío y plataforma; caída y escape; reducción de paso y conservación de energía; horizonte incompleto; referencia independiente Python; entradas inválidas y extremos; persistencia versionada exclusiva. Los resultados y el algoritmo se documentan en ROCKET-FLIGHT.md.

La entrega 7 añade seis pruebas: fuerzas/aceleraciones de referencia; equilibrio y banda del 0,5 %; CD directo sin duplicar inducida y arrastre cero; proyección vertical/balance lateral no resuelto; nuevas entradas inválidas; migración v1/v2. El cálculo independiente de referencia en Python se detalla en AIRCRAFT-FORCES.md.

La entrega 8 añade tres pruebas de conversión geométrica: foco/radios y estado orbital; trayectoria radial/escala/extremos temporales; casos cortos e invalidez. No se cambia la física: se verifica que representarla en 3D conserva sus distancias y plano.

Comando:

```sh
cd /workspace/Cole
node --test tests/*.test.js
```

Los resultados de referencia se calcularon por separado con:

```python
import math
mu = 3.98600435507e14
for r in (6771000, 42164000):
    print(math.sqrt(mu/r), 2*math.pi*math.sqrt(r**3/mu))
```

Esta comparación usa las mismas ecuaciones físicas y no datos observados. La tercera ley, el balance energético y los casos normalizados aportan comprobaciones de invariantes adicionales.

Referencia independiente para e=0,5 y hₚ=400 km: a=13 542 000 m, rₐ=20 313 000 m, vₚ=9396.975770677078 m/s, vₐ=3132.3252568923594 m/s y T=15683.218680060498 s. La ecuación de Kepler se contrastó con Newton en Python, por separado del solucionador de bisección JavaScript. MODEL.md documenta la raíz, cotas y alcance.

## Reproducir las pruebas de navegador (opcional)

Playwright se usa solo para pruebas; no se incorpora al runtime. Chromium debe estar instalado. En la máquina de esta entrega existe `/usr/bin/chromium`. La instalación se realizó fuera del repositorio:

```sh
npm install --prefix /tmp/aerolab-browser --cache /tmp/aerolab-npm-cache --no-audit --no-fund --package-lock=false playwright
```

Con el servidor de README funcionando en otra terminal:

```sh
cd /workspace/Cole
AEROLAB_URL=http://127.0.0.1:8001 PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs node tests/browser.mjs
AEROLAB_URL=http://127.0.0.1:8001 PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs node tests/engineering-browser.mjs
AEROLAB_URL=http://127.0.0.1:8001 PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs node tests/rocket-flight-browser.mjs
AEROLAB_URL=http://127.0.0.1:8001 PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs node tests/aircraft-forces-browser.mjs
AEROLAB_URL=http://127.0.0.1:8001 PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs node tests/three-browser.mjs
```

Opciones: `CHROMIUM_PATH` para otro ejecutable y `AEROLAB_URL` para otra dirección de prueba. El script lanza Chromium sin sandbox dentro de este contenedor de pruebas; para ejecutar en otro entorno, revisa la política de aislamiento antes de reutilizar esa opción. Las capturas se escriben en `/tmp/aerolab-desktop.png` y `/tmp/aerolab-mobile.png`, fuera del checkout. No se necesita acceso a servicios externos durante las pruebas.

Para esta entrega se utilizó `AEROLAB_URL=http://127.0.0.1:8001` con el servidor de Python en 8001. La primera prueba contra 8000 falló por respuesta vacía del servidor anterior, antes de cargar la aplicación. El puerto estaba ocupado; el fallo se resolvió para la validación usando otro puerto, sin modificar el modelo ni omitir aserciones.

Comprobaciones: resultados iniciales; comparación e invalidez; presets y personalizado; avisos; guardado persistente entre recargas; reset sin borrar; datos dañados; movimiento, pausa y reloj; diseño adaptable y enlace de salto de teclado; errores de almacenamiento mostrados al usuario.

También se comprueban geometría elíptica con el cuerpo en un foco, resultados de los extremos, entradas e≥1 rechazadas, lecturas de velocidad/distancia variables, persistencia de e y migración v1 sin sobrescribir datos hasta Guardar.

Interacciones nuevas verificadas en Chromium: los cuatro escenarios; cargas y edición propia; control temporal, 100 %, accesos de apsis, cambio de referencia conservando segundos y marcadores de curvas; corrección de predicciones y limpieza de respuestas antiguas; descargas JSON/CSV leídas desde sus archivos reales; selector de archivo; importación válida sin guardar automáticamente; archivos corruptos y demasiado grandes que conservan el estado; funciones nuevas deshabilitadas con entradas inválidas. Se revisaron capturas de las curvas en escritorio y móvil.

Aircraft/Rocket añaden 10 grupos: resultados conocidos y cámara; referencias e invalidez; persistencia/exportación real y datos dañados; viento invertido y gravedad cero; anchuras, navegación y etiquetas. Capturas: `/tmp/aerolab-aircraft-desktop.png`, `/tmp/aerolab-aircraft-mobile.png`, `/tmp/aerolab-rocket-desktop.png`, `/tmp/aerolab-rocket-mobile.png`.

## Pruebas manuales para el usuario

1. Inicia el servidor y abre Space Lab. A debe mostrar aproximadamente 7,67 km/s y 92,41 min; B, 7,35 km/s y 104,97 min.
2. Cambia B a 400 km: todos los porcentajes deben ser 0,00 %. Después aumenta su altitud: baja su velocidad y sube su periodo.
3. Borra una entrada, escribe un valor negativo o supera el máximo. Debe aparecer un error; el resultado afectado debe mostrar —, y Guardar/Reproducir deben quedar deshabilitados. Corrige y confirma que se recuperan.
4. Selecciona Luna o Marte. Verifica que cambian μ y R. Edita cualquiera de esos valores: el selector debe pasar a Personalizado.
5. Selecciona Tierra con h=10 km. Debe aparecer el aviso de arrastre. No interpretes la solución matemática como una órbita practicable.
6. Reproduce a 60 o 600 s/s real. El satélite debe moverse en sentido antihorario. Pausa y confirma que se detiene; Tiempo a cero vuelve al lado derecho. Cambia parámetros y comprueba la pausa y el reinicio.
7. Guarda altitudes diferentes, recarga y pulsa Cargar. Deben recuperarse. Restablece y vuelve a Cargar: el guardado debe seguir existiendo.
8. Navega con Tab, Shift+Tab y Enter; utiliza el enlace para saltar al laboratorio. Verifica foco visible, etiquetas y apertura del panel de ecuaciones.
9. Prueba a 390 px y en escritorio. Confirma que puedes alcanzar todos los controles y deslizar la tabla en móvil.
10. Con Tierra, hₚ=400 km y e=0,5: periapsis 6771 km, apoapsis 20313 km, velocidades 9,40 y 3,13 km/s, periodo 261,39 min. Reproduce: el cuerpo debe ocupar un foco y las lecturas actuales deben variar. e=0 vuelve al círculo; e=1 debe mostrar error.
11. Carga «Distinta forma, mismo periodo». Compara T y a: deben coincidir, aunque e y los radios extremos difieran. Predice «Son iguales» para el periodo y compruébalo.
12. Carga «Estirar una órbita», selecciona B como referencia y pulsa Ir a apoapsis. B debe mostrar aproximadamente r=20313 km y v=3,13 km/s. Cambia a A como referencia: los segundos no deben cambiar.
13. Exporta JSON, cambia parámetros e importa ese archivo. Deben recuperarse ambos estados sin modificar el guardado local hasta pulsar Guardar. Un JSON malformado debe mostrar un error y conservar la configuración.
14. Exporta CSV: comprueba el encabezado de unidades y 482 filas de datos. Los últimos tiempos de A y B pueden diferir: cada bloque describe una vuelta propia.
15. Usa Tab y las flechas sobre el control temporal. La reproducción debe quedar pausada al moverlo; los puntos de las curvas y satélites deben actualizarse.
16. Con A terrestre y e=0, barre altitud de 400 a 2000 km: el periodo debe crecer y la velocidad en periapsis disminuir. Cambia Resultado y recalcula para comparar la tendencia.
17. Elige B y barre excentricidad de 0 a 0,8. Selecciona la última muestra y aplícala: B debe quedar con e=0,8; A debe conservarse. El reloj vuelve a cero y el barrido deja de estar vigente.
18. Introduce un mínimo mayor que el máximo: debe aparecer un error y no quedar datos aplicables o exportables. Prueba una entrada inválida en la base y comprueba el mismo comportamiento.
19. Exporta el barrido de 21 muestras: el archivo debe contener encabezado más 21 filas. Comprueba columnas de μ, R, hₚ, e, periodo y velocidades.

20. Abre Aircraft: con los parámetros iniciales, L=14700 N y D≈1174 N. Introduce viento longitudinal −10 m/s: Vaire=60 m/s y L=21168 N. +10 m/s da 40 m/s. No son resultados de una aeronave real.
21. Captura referencia, cambia velocidad y revisa Actual/Referencia/%. Duplica el módulo elástico de 70 a 140 GPa: la deflexión debe pasar de 0,0084 a 0,0042 m, manteniendo las demás condiciones.
22. Gira ambos modelos por arrastre y controles de cámara. Cambia envergadura/estrechamiento en Aircraft y diámetro/longitud en Rocket. Las dimensiones visuales de Rocket no deben alterar Δv.
23. Abre Rocket: masa inicial 300 kg, flujo 5 kg/s y Δv total≈1318,335 m/s. Estado 50 %: masa 200 kg; 100 %: masa 100 kg y Δv acumulado igual al total. Gravedad 0 muestra T/W indefinido y no descuenta gravedad.
24. Guarda parámetros distintos en cada módulo, recarga y carga. Deben recuperarse de manera independiente. Exporta JSON y verifica módulo/versión/parámetros. Capturar referencia no debe guardar automáticamente; restablecer no debe borrar el guardado.
25. Vacía campos y supera sus límites: los cálculos se ocultan y guardar/exportar/capturar quedan deshabilitados. Corrige y confirma recuperación. Prueba con teclado y pantalla estrecha.

26. En Rocket, comprueba la nueva sección Lanzamiento multietapa: dos etapas iniciales, masa inicial 3100 kg, masa final 200 kg, Δv ideal≈6574,01 m/s. Cambia el número de etapas de 1 a 4 y verifica que aparecen sus controles y cambia el presupuesto.
27. Con valores iniciales y Tierra, calcula; pausa o acelera. Explora hasta 100 %: debe informar impacto alrededor de 1685,29 s, altitud final cero y velocidad descendente. Las gráficas deben mostrar ascenso, altura máxima y caída; los eventos incluyen separación a 100 s.
28. Cambia solo el cuerpo a Luna y calcula nuevamente. Al 100 % debe indicar escape energético tras terminar los motores a 200 s. La velocidad radial final≈6299,52 m/s supera el escape local≈2072,97 m/s. No equivale a una misión real.
29. Reduce el horizonte a 60 s: debe informar desenlace no resuelto con motores pendientes, no inventar caída o escape. Con Tierra, una etapa, empuje 100 N y horizonte 300 s debe indicar que no despega.
30. Guarda un diseño multietapa, recarga y carga: verifica que permanece independiente del guardado anterior. Exporta CSV y revisa encabezado SI y estados reales. Vacía un campo: trayectoria, CSV y reproducción deben quedar invalidados. Restablece y vuelve a calcular.
31. Con movimiento reducido, calcular debe dejar la reproducción pausada. Ocultar la pestaña también pausa. Usa Tab, flechas y End sobre el control temporal: End debe alcanzar el desenlace final incluso si el instante tiene decimales.

El navegador multietapa verificó siete grupos: edición de etapas/presupuesto; caída y eventos/gráficas/CSV real; escape y pausa; entradas inválidas; persistencia/corrupción; horizonte y no despegue; etiquetas y anchuras de 320, 390, 768 y 1440 px. Capturas inspeccionadas: `/tmp/aerolab-launch-desktop.png` y `/tmp/aerolab-launch-mobile.png`.

32. Abre Aircraft: perfil lateral con L=14700 N, W=11767,98 N, T=1200 N y D≈1174 N. Las flechas y barras deben coincidir con la tabla; Fx≈26 N y Fz≈2932,02 N. No está en equilibrio.
33. Edita peso a 19613,3 N: masa debe ser 2000 kg. Edita masa a 1000 kg: peso debe pasar a 9806,65 N. Vacía peso o escribe 1 N: deben ocultarse resultados y deshabilitar guardado/animación; restablece para recuperar.
34. Selecciona CD total impuesto, ρ=1,2, S=20, Vsuelo=50, viento cero, masa=1000, CL=9806,65/30000≈0,3268883333333333, CD=0,03 y T=900 N. Ambos ejes deben indicar equilibrio aproximado. Duplicar T debe dar fuerza longitudinal positiva. No se calcula estabilidad ni una trayectoria.
35. En modo directo verifica que CD₀ y e quedan inactivos. Al volver a polar, CD total impuesto queda inactivo. Guarda y recarga: modo/CD/T deben recuperarse con Cargar. Exporta JSON: formato v2, masa y parámetros, sin duplicar peso independiente.
36. Viento vertical=10 m/s debe inclinar las flechas de L/D. Viento lateral=1 m/s debe retirar direcciones y balance 2D, conservando magnitudes. Vaciar área retira flechas y barras; corregir recupera resultados.
37. Pulsa Animar aire ilustrativo: los trazos se mueven pero ninguna fuerza cambia. Pausa y confirma que paran; ocultar pestaña pausa. La silueta no representa datos de un perfil real.

La entrega 7 verificó siete grupos de navegador: flechas/barras iniciales; peso/masa bidireccionales y escritura gradual; CD directo/equilibrio; viento y entradas inválidas; animación sin alterar física; migración/persistencia/exportación; etiquetas y anchuras. Capturas inspeccionadas: `/tmp/aerolab-aircraft-forces-desktop.png` y `/tmp/aerolab-aircraft-forces-mobile.png`. Se ejecutaron también los tres scripts anteriores para regresión. Ningún error JavaScript no capturado.

38. En Space Lab, espera Tierra texturizada en el visor nuevo. Gira por arrastre y botones; acerca/aleja y restablece. Debe cambiar la perspectiva sin cambiar cálculos orbitales. A/B elige solo la configuración mostrada en 3D.
39. Reproduce o ve a apoapsis: el marcador 3D debe seguir el mismo tiempo del SVG. Cambia el cuerpo seleccionado a Luna/Marte: debe mostrar esfera simple, no textura terrestre. Vacía su altitud: la línea y marcador deben desaparecer hasta corregir.
40. En Rocket, calcula y explora el tiempo. El marcador sube según h y la línea crece radialmente. Al impacto debe volver a la superficie; no se dibuja una órbita circular. Cambiar una entrada debe retirar la trayectoria anterior.
41. Prueba cámara con teclado y pantalla estrecha. Si no hay WebGL, lee el aviso y comprueba que siguen disponibles tablas, SVG, guardados y simulación. La textura no representa clima actual ni geolocalización de una misión.

El script Three.js usa Chromium con `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` para verificar render WebGL por software en el contenedor. Compara capturas reales tras cámara/zoom, comprueba textura y que no hay recursos externos, valida selección/invalidación/marcadores/trayectoria y simula pérdida de contexto. Se bloqueó además la solicitud de textura para verificar esfera sin mapa, cámara y cálculos operativos. Un segundo Chromium con `--disable-webgl` verifica fallback sin bloquear cálculos. Se ejecutaron los otros cuatro scripts de integración como regresión. Capturas inspeccionadas: `/tmp/aerolab-three-orbit-desktop.png`, `/tmp/aerolab-three-orbit-mobile.png`, `/tmp/aerolab-three-rocket-desktop.png`, `/tmp/aerolab-three-rocket-mobile.png`.

## No comprobado

GPU física, restauración de contexto, Safari, Firefox, dispositivos físicos, lectores de pantalla, una auditoría WCAG completa, hosting real, incertidumbre de constantes, efemérides reales, perturbaciones orbitales, conservación durante integración numérica (no hay integrador), e>0,9, órbitas abiertas ni fidelidad experimental de Aircraft/Rocket, CFD, estabilidad, resistencia última de materiales, ciclo de vida ambiental ni fidelidad experimental de la trayectoria radial multietapa. Ninguno de estos resultados se anuncia como validado.

## Entrega 9 · Pestañas y URL

61 pruebas unitarias y 56 grupos Chromium pasaron. Nuevas pruebas: `tests/navigation.test.js` (4) y `tests/navigation-browser.mjs` (5). Validan teclado, panel activo único, cambios conservados, enlaces a teoría, URL con referencias/tiempo, portapapeles real, copia manual y rechazo atómico sin sobrescribir localStorage. Se repitieron las seis suites de navegador, incluyendo modelos previos y Three.js. Los selectores de controles utilizan la pestaña apropiada; esperar tablas ocultas usa estado attached. Ver [NAVIGATION.md](NAVIGATION.md) para comandos y pruebas manuales.

## Entrega 10 · Visores de vehículos

65 pruebas unitarias y 64 grupos Chromium pasaron. Nuevos archivos: `tests/vehicle-geometry.test.js` (4 pruebas) y `tests/vehicle-browser.mjs` (8 grupos). Se comprobó render WebGL real, cambios de imagen al girar/animar, rueda, pan con botón derecho, cámara por teclado, vectores/CG, viento lateral y entradas inválidas, empuje porcentual, apagado, guardado, enlaces y móviles. La pérdida de contexto deshabilita cámara y conserva cálculos; restaurarlo recupera el visor. Sin WebGL, las tablas y SVG siguen operativos. Todas las suites de regresión se ejecutaron. Capturas `/tmp/aerolab-vehicle-{aircraft,rocket}-{desktop,mobile}.png` inspeccionadas. Comandos y pruebas manuales en VEHICLE-VIEWS.md.

## Entrega 11 · Structure Lab

73 pruebas unitarias y 72 grupos Chromium pasaron: ocho pruebas nuevas de estructura y ocho grupos nuevos de navegador, más todas las suites anteriores. Referencias Python independientes para voladizo puntual/uniforme y tubo comprimido; comprobación dimensional, escalas, carga nula, casos inválidos/extremos, aplicación de Euler y almacenamiento exclusivo. Navegador verifica formularios, materiales/propiedades, apoyo, dibujos, comparación, exportaciones reales, URL, menús y móvil 320–1440 px. Capturas `/tmp/aerolab-structure-desktop.png` y `/tmp/aerolab-structure-mobile.png` inspeccionadas. No hay validación experimental ni certificación de materiales/estructuras. Instrucciones: STRUCTURE.md.

## Entrega 12 · Diseño estructural y FEM 1D

Validación en Node 24 y Chromium local: **86 pruebas unitarias** (13 nuevas) y **83 grupos de navegador** (11 nuevos, más 72 de regresión). Se ejecutaron todas las suites anteriores: Space (20), engineering (10), fuerzas Aircraft (7), lanzamiento (7), Three.js (7), navegación (5), vehículos (8), Structure anterior (8). Nuevo `structure-design-browser.mjs` (11): formas/mallas/nodos, cambio real de imagen al rotar, cámara por teclado, carga, deformación animada, UD y esfera, invalidación, JSON/CSV/persistencia, URL nueva/antigua/rechazo atómico, importación sin guardar, propuestas de masa aplicadas una sola vez, destino multietapa, móvil/movimiento reducido y falta de WebGL/almacenamiento bloqueado.

Casos unitarios: fórmula cerrada de voladizo uniforme, esfuerzo raíz, equilibrio y Euler K=2; axial/temperatura; presión cilíndrica/esférica; criterio UD y esfera no soportada; masa y fronteras; refinamiento 8/16/32; cargas cero, singularidad y datos inválidos; importaciones y aplicación de masa sobre configuración vigente. El código de fórmulas independientes no utiliza el ensamblaje FEM.

Cálculos Python independientes ejecutados para E=71,7 GPa, L=3 m, b=0,08 m, h=0,12 m, F=5000 N uniforme: δpunta=0,020430177824267787 m, σraíz=39.062.500 Pa y Pcr(K=2)=226.448,20337859416 N. Cilindro L=4 m, D=0,6 m, t=0,003 m, Δp=100.000 Pa: σθ=9.950.000 Pa, VM=8.616.952,767655164 Pa, desplazamiento axial=0,00009436541143654115 m. Las pruebas FEM comparan con estas expresiones y tolerancias explícitas; no son datos experimentales.

Comandos utilizados:

```sh
npm test
AEROLAB_URL=http://127.0.0.1:8001 \
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs \
node tests/structure-design-browser.mjs
```

Las herramientas de navegador solo se instalaron en `/tmp`, fuera de dependencias del producto. Capturas de escritorio y móvil: `/tmp/aerolab-structure-design-desktop.png`, `/tmp/aerolab-structure-design-mobile.png`; captura de visor `/tmp/design-canvas.png`. Se inspecciona la geometría renderizada y la distribución. No se ha validado fidelidad experimental, FEM volumétrico/cascarón, un diseño real, GPU física, Safari/Firefox, lectores de pantalla, WCAG completa ni hosting. Los casos ideales comprobados no certifican estructuras ni materiales. Pruebas manuales detalladas: [STRUCTURE-DESIGN.md](STRUCTURE-DESIGN.md).

## Entrega 13 · Correcciones de auditoría

Node 24.19.0: **94 pruebas individuales aprobadas**, 0 fallos/omisiones, mediante `node --test --test-isolation=none tests/*.test.js`. El runner con aislamiento de este entorno solo reportaba archivos; esos resultados no se contabilizaron como pruebas individuales. Ocho regresiones nuevas cubren catálogo heredado, estados finitos, borradores independientes, termoelasticidad/Poisson, UD, corte, origen y consumo de propuestas.

Chromium local sobre HTTP en puerto 8013: **86 grupos aprobados**, sin omitir suites previas: Space 20, engineering 10, fuerzas 7, vuelo 7, Three 7, navegación 5, vehículos 8, Structure anterior 8, diseñador 11 y audit-regressions-browser 3. El primer intento del diseñador requirió actualizar la espera de su test: la aplicación ahora utiliza Web Locks de manera asíncrona; la suite espera a que termine antes de leer resultados. Casos manuales, fórmulas y límites en CORRECTIONS.md. Sin validación en hosting ni otros navegadores.

## Entrega 14 · Interfaz y renderizado

**101 pruebas individuales Node 24 y 96 grupos Chromium aprobados**. Siete pruebas numéricas nuevas: mapa de colores/leyenda, encuadre esférico y por caja, ejes firmados/cero, cursor nodal, ciclo de reproducción bajo demanda y compatibilidad de opciones visuales. `node --test --test-isolation=none tests/*.test.js` confirma los tests individuales en este sandbox.

`PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser` inicia/verifica/detiene servidor HTTP en 8060 y ejecuta las 11 suites: Space 20, engineering 10, fuerzas 7, vuelo 7, Three 7, navegación 5, vehículos 8, Structure anterior 8, diseñador 11, correcciones 3 y workbench 10. Se conserva salida no cero si cualquier suite falla. También se comprobó selección de suites y servidor externo con AEROLAB_URL.

Las diez comprobaciones nuevas abarcan distribución/reflujo en cuatro módulos, 200 % zoom CSS, ausencia de solve al mover controles visuales, normales/bounds tras deformación, invalidez visual recuperable, ejes/cero y selección de nodo, URL con display, disclosure por teclado, recuperación de WebGL estructural sin perder resultados y ausencia de RAF en reposo/pausa. La primera prueba de normales podía devolver la misma amplitud tras dos ajustes; su timeout se resolvió haciendo distinto el estado final, sin quitar la comprobación.

Capturas revisadas y medidas de posición del visor/contrastes en WORKBENCH.md. Se añadió tarea de navegador a GitHub Actions con herramienta fijada, pero aquí se valida la ejecución local del runner; no se afirma aprobación de una ejecución remota ni validación de hosting/otros navegadores/hardware.

Tras el ajuste final de tamaño inicial y recuperación de contexto se repitieron las suites del diseñador (11) y workbench (10), ambas aprobadas. Se confirmó además la existencia de Playwright 1.64.0 en el registro npm; esto no sustituye la ejecución remota del workflow.

## Entrega 15 · Inicio y exploración (0.15)

104 pruebas unitarias: 101 regresiones previas y 3 nuevas (referencia circular y vis-viva/escalamiento de la demo; rutas y partición del catálogo; ejemplos frente a cálculos independientes de fuerzas y Tsiolkovsky, salida FEM identificada y entradas inválidas). 0 fallos, 0 omitidas. Ejecutadas con Node 24.19.0 mediante:

```sh
node --test --test-isolation=none tests/*.test.js
```

12 suites Chromium mediante el runner existente: 104 grupos de comprobaciones (96 previos y 8 del inicio), 0 fallos. La suite de inicio comprueba SVG calculado y ausencia de carga inicial de Three.js; reproducción/pausa/salida del viewport; filtros y los cuatro ejemplos; aplicación explícita a A preservando B y localStorage; enlaces y regreso desde las tres páginas; reflujo a 320, 390, 768, 1440 px y zoom CSS 200 %; error de importación y protección contra respuestas atrasadas; ausencia de solicitudes externas y errores JavaScript no capturados. Las suites 3D/workbench ahora acceden explícitamente a Space Lab y mantienen sus verificaciones anteriores.

```sh
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser
```

El entorno usa Chromium instalado en `/usr/bin/chromium` y Playwright fuera del checkout. El runner crea y cierra su servidor propio, verifica HTTP y propaga fallos. La nueva suite se incorpora automáticamente al job CI existente. Ejemplos de referencia: a e=0, velocidad 7,6725985878 km/s y periodo 5544,85513975 s; a e=0,5 el periodo aumenta por 2^(3/2). Aircraft: 14700 N de sustentación y 11767,98 N de peso. Rocket: 1200 ln(3) = 1318,3347464 m/s de Δv ideal. Los valores se calculan con los mismos modelos del laboratorio, sin sustituir datos de una misión real.

Durante las pruebas se detectó y corrigió una congelación de la reproducción al acumular tiempo a través del slider redondeado y una pausa tardía al quedar solo un borde de la demo visible. El reloj ahora mantiene precisión completa y pausa al quedar menos del 15 % de la demo en el viewport. La suite de inicio se repitió tras las correcciones. Capturas `/tmp/aerolab-015-home-{desktop,mobile}.png` y `/tmp/aerolab-015-catalog-{desktop,mobile}.png` inspeccionadas. No se afirma validación con Safari/Firefox, hardware móvil real, Lighthouse ni auditoría WCAG completa.

## Entrega 16 · Experimentos del catálogo (0.16)

108 pruebas unitarias aprobadas, 0 fallos y 0 omitidas: 104 anteriores y 4 nuevas. Estas verifican la ley de escala orbital, L proporcional a V² con peso constante, ve y Tsiolkovsky con propelente variable/flujo derivado, conversión mm/m y relación rigidez/masa sin mutar los datos originales, extremos y 21 casos finitos de cada curva y los contratos completos de las URL de continuación.

```sh
node --test --test-isolation=none tests/*.test.js
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser
```

13 suites Chromium aprobadas, 0 fallos; 109 grupos de comprobaciones (104 previos más 5 nuevos). La nueva suite comprueba edición/restablecimiento, valor independiente de sustentación, ejes/unidades/cursor por teclado, foco al abrir, entradas inválidas y limpieza de resultados, ediciones rápidas y enlace vigente, continuación en Aircraft/Rocket/Structure, aplicación exclusiva a A en Space, guardados reales distintos del experimento y recuperación mediante Cargar, alcance correcto de los paneles complementarios, ausencia de errores JavaScript, reflujo 320–1440 px y zoom CSS 200 %. Las suites anteriores conservan modelos, exportaciones, enlaces, escenarios, 3D, datos compartidos y fallos de WebGL/almacenamiento.

Al comprobar persistencia se distinguen los guardados explícitos de las tres instantáneas de intercambio existentes: `aerolab.bridge.snapshot.aircraft.v1`, `.calculator.v1` y `.launch.v1`. Los destinos ya actualizaban estas claves al cambiar el caso activo; esta entrega conserva ese comportamiento. Las demás claves se comparan íntegramente y se verifica además la carga de configuraciones previamente guardadas. No se modificó el puente para ocultar esta actualización.

Capturas finales `/tmp/aerolab-016-experiment-desktop.png` y `/tmp/aerolab-016-experiment-mobile.png` inspeccionadas. Los modelos matemáticos originales no cambiaron; las curvas son casos independientes y no añaden validación experimental ni una simulación de motor fijo. No se afirma comprobación en Firefox/Safari, hardware físico, Lighthouse ni conformidad WCAG completa.

## Entrega 17 · Comparación y exportación (0.17)

112 pruebas unitarias aprobadas, 0 fallos y 0 omitidas: 108 anteriores y 4 nuevas. Se verifican diferencias conocidas (sustentación +6468 N y +44 % entre 50/60 m/s), peso constante, referencia cero/negativa, rechazo de magnitudes/unidades incompatibles o no finitas, CSV rectangular con valores/unidades/configuraciones completas y 21 muestras por laboratorio, escape correcto de comillas/comas/saltos de línea y rechazo de curvas inválidas.

14 suites Chromium aprobadas, 0 fallos; 113 grupos de comprobaciones (109 anteriores y 4 nuevos). Se ejercitan referencias iniciales/personalizadas, restablecimientos independientes, persistencia temporal por módulo y ausencia de escrituras en localStorage, entradas inválidas y limpieza de tablas/descarga, archivo Blob descargado y leído realmente, contenido vigente del CSV, disclosure por teclado, tabla con desplazamiento local a 320–1440 px, zoom CSS 200 % y ausencia de errores JavaScript. Se mantienen todas las regresiones de modelos, visores, exportaciones, enlaces y datos compartidos.

```sh
node --test --test-isolation=none tests/*.test.js
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser
```

Capturas `/tmp/aerolab-017-comparison-{desktop,mobile}.png` inspeccionadas. No se cambiaron ecuaciones de los laboratorios ni sus validaciones anteriores. La comparación no demuestra incertidumbre, mejora de diseño ni certificación. Pendientes de evidencia externa: Firefox/Safari, dispositivos físicos, evaluación completa de lectores de pantalla/contraste y rendimiento medido.

## Entrega 18 · Estado del cálculo (0.18)

112 pruebas unitarias aprobadas, 0 fallos y 0 omitidas; sin cambios en los modelos. Las 14 suites Chromium anteriores pasaron (113 grupos). La nueva suite pasó tras corregir dos supuestos de prueba: el alias peso/masa aparece primero en el formulario, y el viento longitudinal admite −40 a 40 m/s. El error físico entre parámetros se prueba con velocidad 20 y viento 30 m/s, ambos válidos individualmente. Resultado agregado: 15 suites, 116 grupos aprobados. La ejecución completa inicial informó el fallo de la nueva prueba; se volvió a ejecutar únicamente esa suite después de corregirla, sin cambios de implementación adicionales.

```sh
node --test --test-isolation=none tests/*.test.js
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser -- calculation-state-browser.mjs
```

La nueva suite comprueba estado vigente independiente del guardado, invalidación/recuperación, explicación del error físico, apertura de campos plegados y foco por teclado, trayectoria pendiente tras edición, independencia de la calculadora ideal, ausencia de errores JavaScript y reflujo 320–1440 px. Las capturas `/tmp/aerolab-018-state-desktop.png` y `/tmp/aerolab-018-state-mobile.png` fueron inspeccionadas. Las regresiones existentes comprueban además zoom CSS 200 %, visores inicialmente visibles y conservación de controles. No se afirma validación con lectores de pantalla, Firefox/Safari o dispositivos reales.

## Entrega 19 · Estados Space/Structure (0.19)

112 pruebas unitarias aprobadas, 0 fallos/omitidas; no se modifican modelos. La ejecución inicial detectó que el botón de revisión Space quedaba dentro de un grupo plegable: se corrigió su montaje fuera de details. Después, la ejecución completa aprobó las 15 suites Chromium, 120 grupos (116 anteriores y 4 nuevos). Tras el ajuste final del inspector Space a una columna se repitieron las suites calculation-state, browser y workbench: 37 grupos aprobados, sin fallos; no son 37 casos nuevos.

```sh
node --test --test-isolation=none tests/*.test.js
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser -- calculation-state-browser.mjs browser.mjs workbench-browser.mjs
```

Casos nuevos: A/B válidas, una inválida con el resultado restante conservado, ambas inválidas, acceso al campo B con el grupo plegado y ancho mínimo legible a 390 px; solución Structure activa conservada con borrador inactivo inválido; revisar sin cambiar objeto ni campo calculado; recuperación del borrador; opciones visuales inválidas con resultados/revisión FEM conservados; navegación automática a controles de cargas/vista; esfera UD etiquetada solo geometría/masa y banco anterior independiente. Se conservan todas las regresiones de cálculos, guardados, enlaces, exportaciones, transferencia de masa, escenas WebGL y errores de contexto/almacenamiento. Workbench verifica 320–1440 px, zoom CSS 200 % y visores inicialmente visibles.

Capturas `/tmp/aerolab-019-state-{desktop,mobile}.png`, `/tmp/aerolab-019-draft-mobile.png` y `/tmp/aerolab-019-space-mobile.png` inspeccionadas. La última muestra el inspector en una columna, con revisión accesible fuera del grupo plegado. No se afirma validación experimental de los modelos ni auditoría WCAG completa; pendientes Firefox/Safari, hardware, lectores de pantalla y rendimiento medido.

## Entrega 20 · Comparación del diseñador (0.20)

116 pruebas unitarias aprobadas, 0 fallos/omitidas: 112 anteriores y 4 nuevas. Comprueban escalado lineal con la fuerza sin cambiar masa, conversiones Pa/MPa y m/mm, conservación de entradas, incompatibilidad de criterios metal/UD y casos de carga, referencia cero, desplazamientos negativos, magnitudes ausentes en esfera UD y CSV con configuraciones completas validadas. Exportar rechaza borradores inactivos inválidos. No se modifican los modelos científicos originales.

La ejecución completa aprobó 16 suites Chromium y 124 grupos (120 anteriores y 4 nuevos). Después de mejorar descripciones de referencias y conservación ante entradas inválidas se repitió la suite nueva, aprobada; tras el refinamiento de columnas móviles/zoom se repitió nuevamente. Son las mismas 4 comprobaciones ampliadas, no grupos nuevos. Un intento de repetición con AEROLAB_URL apuntó al servidor de la ejecución completa ya finalizada y falló en disponibilidad HTTP antes de abrir el navegador; se ejecutó después con servidor propio y pasó.

```sh
node --test --test-isolation=none tests/*.test.js
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser -- design-comparison-browser.mjs
```

La suite nueva captura un diseño real, cambia fuerza 14700→29400 N, verifica masa constante y esfuerzo +100 %, descarga/lee/parsea CSV de 11 columnas y tres métricas, comprueba JSON completos y ausencia de escrituras en localStorage. Restablecer conserva referencia (esfuerzo −50 %), entradas inválidas limpian tabla/CSV y conservan la identificación de referencia. Hay referencias aisladas por objeto, diferencias incompatibles explícitas, borrador inactivo bloqueando captura/CSV sin ocultar resultados activos y vista inválida que no afecta comparación ni revisión FEM. Se comprueban esfera UD sin magnitudes ficticias, eliminación/recarga de referencias, teclado, reflujo 320–1440 px, zoom CSS 200 % y ausencia de errores JavaScript.

Capturas finales `/tmp/aerolab-020-comparison-desktop.png` y `/tmp/aerolab-020-comparison-mobile.png` inspeccionadas. Tabla con desplazamiento local, criterios explícitos y sin desbordamiento global. Se conservan regresiones anteriores de datos, enlaces, guardados, puente de masa y WebGL. Pendientes lectores de pantalla reales, Firefox/Safari, hardware y rendimiento medido; estos casos no demuestran validación experimental ni seguridad.

## Entrega 21 · Refinamiento FEM (0.21)

120 pruebas unitarias aprobadas, 0 fallos/omitidas: 116 anteriores y 4 nuevas. Se comprueba conservación de entradas, objetivos 4/8/16/32/48, reducción de diferencias en el ala variable conocida, sección constante, carga cero y porcentajes indefinidos contra cero, conteo real de secciones de cohete, rechazo de esfera/borradores inválidos y CSV con cinco configuraciones completas. La primera comprobación de cero se ajustó para reconocer −0 IEEE-754 como cero matemático, sin cambiar el modelo.

Las 16 suites Chromium anteriores pasaron (124 grupos). La nueva suite pasó después de corregir su comparación de texto visible: innerText cambia al mostrar una pestaña, aun si los resultados no cambian; se compara textContent y la revisión física. Resultado agregado: 17 suites y 127 grupos aprobados. Tras refinar formato científico y tamaño de gráfica se repitió la nueva suite, tres grupos aprobados. La ejecución completa inicial informó la discrepancia de prueba; no se presenta como una ejecución completa sin fallos.

```sh
node --test --test-isolation=none tests/*.test.js
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs npm run test:browser -- convergence-browser.mjs
```

Comprobaciones nuevas: cálculo explícito de cinco soluciones, elementos/resultados/revisión del caso activo intactos, gráfica por teclado con unidades y selección de magnitud, descarga real con cabecera SI/configuraciones, opciones visuales que conservan estudio, cambios físicos que limpian datos/CSV, exclusión de esfera, cohete objetivo 4→real 5, advertencias, residuo en notación científica, disclosure por teclado, reflujo 320–1440 px, zoom CSS 200 % y ausencia de errores JavaScript. Las suites anteriores mantienen guardados, referencias comparativas, enlaces, puentes, modelos y visores.

Capturas finales `/tmp/aerolab-021-convergence-desktop.png` y `/tmp/aerolab-021-convergence-mobile.png` inspeccionadas. No se demuestra convergencia para todos los casos, error exacto, validación física ni pandeo; límites en CONVERGENCE.md. Pendientes navegadores/hardware adicionales, lectores de pantalla y rendimiento medido.
