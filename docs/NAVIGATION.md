# Entrega 9 · Pestañas y enlaces de simulación (0.9)

## Objetivo y alcance

Reducir el recorrido vertical de Space, Aircraft y Rocket sin cambiar los modelos físicos. Tres pestañas reales: **Configuración y Simulación**, **Análisis y Gráficos**, **Teoría y Modelos**. Los parámetros, controles de reproducción y vistas principales se mantienen en la primera; tablas, barridos y gráficas en la segunda; ecuaciones, hipótesis y límites en la tercera. Las advertencias dependientes de entradas permanecen cerca de los controles.

La navegación mueve los nodos existentes, conserva sus eventos y valores y oculta los paneles inactivos. Flechas izquierda/derecha, Home y End cambian la pestaña; Tab entra al panel activo. Los enlaces superiores a la teoría abren la pestaña correspondiente. Cambiar de pestaña pausa la reproducción y el flujo ilustrativo sin reiniciar el tiempo. Sin JavaScript se conserva el contenido original de las páginas, aunque las simulaciones requieren JavaScript.

## Archivos nuevos y modificados

- `src/navigation/ui.js`: pestañas accesibles, distribución de paneles, botón superior de compartir, validación conjunta antes de restaurar y copia con alternativa manual.
- `src/navigation/share.js`: transporte de estado mediante `URLSearchParams`, versión, límites y validación de tipos. No depende del DOM.
- `src/app.js`, `src/engineering/ui.js`, `src/rocket/ui.js`: adaptadores del estado actual, validación con los modelos y restauración pausada.
- `src/aircraft/visualization.js`: pausa del aire ilustrativo al cambiar de pestaña.
- `styles.css`: pestañas adaptables, selección visible, paneles ocultos y enlace manual.
- `index.html`, `aircraft.html`, `rocket.html`, `package.json`: versión 0.9 y enlace interno actualizado.
- `tests/navigation.test.js`, `tests/navigation-browser.mjs`: transporte, rechazo, navegación, portapapeles y recuperación de estados.
- Pruebas existentes adaptadas para acceder a los controles desde la pestaña correspondiente.

## Qué comparte el enlace

El botón **Copiar enlace de simulación** agrega `lab`, `v=1` y `sim` (JSON codificado por SearchParams) a la URL y actualiza el historial sin recargar. Los parámetros ajenos a AeroLab y el fragmento de navegación se conservan.

- Space: configuraciones A/B completas (μ y radio en km³/s² y km; altitud en km; excentricidad), segundos transcurridos, velocidad de reproducción, referencia temporal y configuración de la vista planetaria.
- Aircraft: todos los parámetros, modo de resistencia, referencia capturada y orientación de la geometría Canvas.
- Rocket: diseño multietapa completo, existencia de trayectoria calculada, segundos del reloj y velocidad de reproducción; además la configuración, referencia y orientación de la calculadora independiente de una etapa.

El vuelo se recalcula mediante el mismo modelo al abrir el enlace; no se envían miles de muestras. Siempre se abre pausado. No guarda ni sobrescribe localStorage. Un estado incompleto, incompatible, no numérico, fuera de límites, repetido o de otro laboratorio se rechaza antes de aplicar configuraciones. El reloj de Rocket debe estar dentro de la trayectoria calculada. El límite de enlace es 24000 caracteres.

## Ejecutar y comprobar

```sh
cd /workspace/Cole
python3 -m http.server 8001 --bind 0.0.0.0
```

En tu equipo, abre `http://localhost:8001/index.html`, `aircraft.html` o `rocket.html`. En el entorno remoto utiliza el acceso al puerto de tu proveedor. No hace falta instalar dependencias nuevas. Las instrucciones completas están en README.md.

```sh
npm test
AEROLAB_URL=http://127.0.0.1:8001 PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs node tests/navigation-browser.mjs
```

La segunda orden necesita Playwright y Chromium como herramientas de pruebas, con esa ruta disponible en este entorno; no son dependencias de la aplicación.

Pruebas manuales:

1. Edita parámetros, cambia entre las tres pestañas y regresa: los valores permanecen. Comprueba con flechas, Home, End y Tab.
2. En Space, compara A/B en Análisis; realiza un barrido y aplica una muestra. Regresa a Configuración para comprobar el cambio.
3. En Aircraft, captura referencia y modifica superficie o empuje. Las tablas y barras en Análisis deben reflejar los valores calculados.
4. En Rocket, calcula, explora hasta el 42 % y abre Análisis: gráficas, presupuesto y eventos deben corresponder a ese instante. Regresa para seguir explorando.
5. Copia un enlace y ábrelo en otra pestaña o navegador. Comprueba parámetros, referencias e instante; la reproducción debe estar pausada.
6. Modifica `v` o elimina una configuración en la URL: debe rechazarse, manteniendo los parámetros iniciales. Un guardado previo debe seguir disponible.
7. Bloquea el acceso al portapapeles: debe aparecer el enlace seleccionable y una explicación, sin afirmar que se copió.
8. Revisa las tres pestañas en móvil y escritorio; los controles de cámara deben seguir funcionando tras ocultar y mostrar la visualización.

## Validación y límites

61 pruebas unitarias y 56 grupos de navegador Chromium pasaron: las 57 pruebas físicas/de datos anteriores, cuatro de transporte URL, 51 grupos de regresión y cinco de navegación/enlaces. Los enlaces recuperaron valores, referencias y el estado de vuelo; se verificó el portapapeles y su rechazo. No se cambió ningún modelo matemático ni se aumentó su precisión.

La URL incluye parámetros públicos legibles. No debe contener secretos. El acceso al portapapeles suele requerir HTTPS o localhost; existe copia manual como alternativa. Algunos servicios pueden recortar enlaces largos; JSON sigue disponible como exportación. La reproducción exacta depende de usar la misma versión de los modelos. No se comparten la orientación de OrbitControls de Three.js, las opciones transitorias del barrido ni la selección de experimentos/predicciones; se reconstruyen con sus valores iniciales. No se probaron Safari/Firefox, lectores de pantalla reales ni GPU física. El código en GitHub no equivale a un sitio desplegado.

Completado: fases 1–4 de esta mejora, conservación de modelos y persistencia, pestañas y enlaces verificados. Pendiente: pruebas adicionales de accesibilidad/navegadores, cámara WebGL compartible si se necesita y publicación del sitio con HTTPS.
