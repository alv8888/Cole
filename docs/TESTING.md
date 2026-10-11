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
