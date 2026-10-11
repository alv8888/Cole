# Entrega 10 · Visores reales de vehículos (0.10)

## Objetivo de la fase y funciones

Reemplazar la proyección ortográfica manual de Aircraft y la calculadora independiente de una etapa de Rocket por renderizado Three.js/WebGL con cámara perspectiva, giro horizontal 360°, zoom y desplazamiento. Se conserva la separación entre simulación, análisis y teoría y la estética espacial oscura.

- Arrastre izquierdo: rotación. Rueda: zoom. Botón derecho o Ctrl/Shift + arrastre: desplazamiento. En móvil, un dedo gira; dos dedos desplazan y acercan.
- Rangos de giro/inclinación y siete botones de cámara para teclado. Restablecer cámara recupera posición, orientación y encuadre, sin modificar parámetros.
- Aircraft: cuatro vectores coloreados y etiquetas flotantes desde el CG configurado. Se conservan el perfil lateral SVG y las tablas para consultar resultados sin WebGL.
- Rocket: porcentaje de empuje nominal de 1 a 100 %, pluma de tres capas y botón para animar/pausar. El fuego se apaga al terminar el funcionamiento. Movimiento reducido comienza pausado; cambiar pestaña u ocultar el documento pausa la animación.
- Carga diferida y aviso si WebGL no está disponible. Pérdida de contexto deshabilita la cámara; los cálculos siguen funcionando y se recupera el visor al restaurarlo.

## Estructura y código

Archivos completos incluidos en el ZIP y el documento de código de la entrega:

```text
src/engineering/
  view3d.js              Adaptador de carga, controles y disponibilidad
  vehicle-viewer.js      Escena, mallas, cámara, vectores y pluma
  vehicle-geometry.js    CG, ala, escala de vectores y potencia de pluma; sin DOM
  models.js             Cálculos con empuje nominal y porcentaje
  profiles.js           Campos, unidades, resultados e hipótesis
  ui.js                 Configuración, persistencia y enlaces
vendor/three/            Three.js y OrbitControls locales ya existentes
styles.css              Visor y controles adaptables
aircraft.html           Importmap, visor y controles
rocket.html             Visor, cámara, leyenda y animación
index.html              Número de versión global
package.json            Versión 0.10.0
 tests/vehicle-geometry.test.js
 tests/vehicle-browser.mjs
 tests/engineering-browser.mjs
 tests/navigation-browser.mjs
```

Se reutiliza Three.js 0.180.0 ya distribuido con licencia; no se incorpora otra biblioteca, CDN, textura ni API. Los modelos físicos siguen separados del renderizador y se prueban sin navegador.

## Modelo de fuerzas y escala

Coordenadas del vehículo en metros: x hacia delante, y lateral, z hacia arriba. CG según la misma referencia MAC del modelo previo. Para viento longitudinal/vertical se utilizan exactamente los componentes de `balanceForces`: L y D rotados en el plano x/z, T horizontal y W vertical descendente. Cada longitud dibujada es `|F| / max(|F|, 1 N) × 0,65 × extensión del vehículo`, usando el mismo máximo para las cuatro fuerzas. La escala es una elección visual común, no una longitud física asociada a la fuerza. Un vector nulo no dibuja una flecha.

Las fuerzas se trasladan al CG para comparación; no se calcula el punto de aplicación real ni momentos, estabilidad o deformación. Con viento lateral distinto de cero, el modelo previo solo entrega magnitudes: se ocultan los vectores y se muestra una explicación. No se inventa un modelo de aerodinámica 3D.

## Empuje y pluma

En la calculadora independiente de una etapa:

```text
T = Tnominal × thrustPercent / 100           N
ṁ = mprop / tfunc                           kg/s
ve = T / ṁ                                 m/s
Δv = ve × ln(m₀ / mf)                       m/s
```

El porcentaje es constante para cada cálculo; admite 1–100 %. Se mantiene el flujo impuesto por masa/duración. Por ello reducir a 50 % reduce T, ve y Δv a la mitad sin cambiar la masa consumida a un mismo tiempo. Esto define un escenario ideal con una velocidad efectiva de escape distinta; no es un mapa de regulación de un motor real ni una predicción de consumo. Se documenta en el panel de teoría. No se modifica el modelo ni el guardado del lanzamiento multietapa.

La pluma usa conos transparentes con mezcla aditiva y oscilaciones acotadas. Su longitud relativa sigue el porcentaje y su anchura la raíz cuadrada del porcentaje. A 100 % de tiempo consumido su potencia visual es cero; el porcentaje de consumo no atenúa ficticiamente un motor de empuje constante. No calcula combustión, temperatura, química, presión, expansión, flujo ni radiación térmica.

La masa/duración, fuerzas y Δv tienen las unidades y ecuaciones previas. No se promete mayor precisión por cambiar la visualización.

## Compatibilidad y persistencia

Los guardados Rocket anteriores (registro v1) se cargan con porcentaje 100 %. La nueva calculadora escribe/exporta registro v2 con `thrustPercent`, manteniendo la clave local anterior y sin sobrescribir hasta pulsar Guardar. Los registros v2 incompletos se rechazan. Aircraft conserva su registro v2. Los enlaces nuevos incluyen el porcentaje; los anteriores, sin esa propiedad, conservan el comportamiento del 100 %. Orientación y dimensiones siguen compartiéndose; el zoom/desplazamiento de cámara y la fase de la animación visual no se serializan.

## Ejecutar y probar

```sh
cd /workspace/Cole
python3 -m http.server 8001 --bind 0.0.0.0
```

En tu equipo abre `http://localhost:8001/aircraft.html` o `rocket.html`. En el entorno remoto usa el acceso al puerto del proveedor. No uses file://; no hace falta npm install para la aplicación.

```sh
npm test
AEROLAB_URL=http://127.0.0.1:8001 PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs node tests/vehicle-browser.mjs
```

Playwright/Chromium son herramientas externas de pruebas, no dependencias de la web. La ruta mostrada corresponde al entorno de desarrollo utilizado.

Pruebas manuales:

1. Gira completamente ambos vehículos y prueba zoom, botón derecho, pinza, botones y rangos. Restablecer debe recuperar el encuadre inicial.
2. En Aircraft cambia CG: mueve el origen de las flechas sin alterar L/D/W/T. Cambia viento vertical: giran las direcciones calculadas. Introduce viento lateral: desaparecen los vectores con explicación.
3. Con Aircraft inicial verifica L=14700 N, W=11767,98 N, T=1200 N y D≈1174 N en tablas y leyenda lateral. Las cuatro flechas usan escala común.
4. En Rocket nominal 6000 N y porcentaje 50 %: T aplicado=3000 N, ve=600 m/s, Δv≈659,167 m/s; las masas se conservan. Compara pluma al 100 % y 50 %.
5. Activa y pausa pluma. Cambia tiempo consumido a 100 %: desaparece. Cambia de pestaña: la animación se pausa y los valores se conservan.
6. Guarda el porcentaje, recarga y carga. Comparte un enlace: se recupera también el porcentaje sin reemplazar guardados. Carga un archivo local anterior: porcentaje 100 %.
7. Vacía una entrada: se ocultan geometría y fuerzas afectadas. Comprueba recuperación al corregirla y consulta los resultados si WebGL falla.
8. Revisa móvil y escritorio, además del perfil SVG, barridos, lanzamiento multietapa y vistas planetarias.

## Pruebas ejecutadas, límites y tareas

65 pruebas unitarias y 64 grupos de navegador Chromium pasaron. Cuatro pruebas nuevas comprueban CG/ala, componentes y escala de vectores, empuje porcentual y compatibilidad, y apagado de pluma. Ocho grupos nuevos verifican cámara real, imágenes cambiantes, fuerzas, pluma, persistencia, pestañas/móvil, pérdida/restauración de contexto y ausencia de WebGL. Se repitieron las suites previas de Space, ingeniería, fuerzas, vuelo multietapa, planetas y enlaces, incluyendo el porcentaje en el enlace Rocket. Capturas de ambos visores inspeccionadas en escritorio y móvil.

Se utilizó WebGL con SwiftShader en Chromium; no se comprobó GPU física ni Safari/Firefox. Geometría genérica, alas como superficies simplificadas, motor ideal y fuego ilustrativo; no es CFD, CAD certificado ni simulación de gases. Las etiquetas flotantes pueden solaparse según la cámara: la leyenda y las tablas contienen los datos accesibles. Los modelos planetarios y el lanzamiento multietapa siguen siendo independientes del visor de la calculadora de una etapa.

Completadas fases 1–4 de esta mejora: alcance, arquitectura, implementación y validación. Problemas tratados antes de ampliar: evitar direcciones laterales inventadas, separar porcentaje de empuje/consumo, conservar guardados y mantener cálculos sin GPU. Pendientes: pruebas en hardware y otros navegadores, revisión completa de accesibilidad, exportación completa de cámara y despliegue del sitio con HTTPS. GitHub contiene código; no se afirma un despliegue de hosting.
