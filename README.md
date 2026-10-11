# AEROLAB · Space Lab 0.4

Laboratorio educativo de órbitas circulares y elípticas de dos cuerpos. HTML semántico, CSS, JavaScript modular y SVG. Sin dependencias de aplicación, API, base de datos, compilación ni cuentas. Aircraft, Rocket y Structure Lab están identificados como módulos futuros y no tienen controles ficticios.

## Ejecutar

Desde una terminal con Python 3:

```sh
cd /workspace/Cole
python3 -m http.server 8000 --bind 0.0.0.0
```

Abre `http://localhost:8000` en tu equipo local. En una máquina remota, utiliza el mecanismo de acceso al puerto que ofrezca tu proveedor. No abras `index.html` con `file://`: los módulos JavaScript necesitan servirse por HTTP. Detén el servidor con Ctrl+C. Este servidor solo sirve archivos; no es un backend físico ni almacena datos.

Alternativa con Node y npm presentes: `npm start`. No se necesita `npm install` para usar la aplicación o ejecutar las pruebas unitarias.

Si el puerto 8000 está ocupado, ejecuta `python3 -m http.server 8001 --bind 0.0.0.0` y utiliza el puerto 8001. La entrega 4 se validó en 8001 porque un servidor anterior ocupaba 8000 sin responder correctamente; no se detuvo ese proceso al no poder verificar su propiedad desde el entorno actual.

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
├── styles.css                 # Identidad visual, estados, foco y diseño adaptable
├── package.json               # Comandos, sin dependencias
├── .gitignore
├── .github/workflows/tests.yml # Pruebas unitarias en GitHub Actions
├── src/
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
│   └── browser.mjs            # Integración opcional con Playwright y Chromium
└── docs/
    ├── MODEL.md               # Modelo, dimensiones, supuestos y precisión
    ├── TESTING.md             # Evidencia, reproducción y pruebas manuales
    └── ROADMAP.md             # Fases completadas, problemas y pendientes
```

## Uso

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

Los archivos son estáticos y se pueden servir mediante cualquier alojamiento con HTTPS y soporte de tipos MIME JavaScript. Publica `index.html`, `styles.css`, `src/` y `docs/`; no publiques `.git`, pruebas ni herramientas temporales. Los enlaces y módulos son relativos y funcionan bajo un subdirectorio. No se ha desplegado el proyecto ni comprobado un hosting real.

Antes de publicar: ejecuta las pruebas, verifica el sitio sobre HTTPS, revisa enlaces y accesibilidad manual y configura políticas de seguridad en el proveedor. No se introducen secretos, código de terceros ni contenido remoto durante el cálculo. El almacenamiento local no está cifrado y depende del origen del sitio; úsalo solo para parámetros públicos. No uses el servidor de Python como servidor de producción.

Para actualizar modelos, conserva pruebas de regresión y migra o cambia la versión del formato guardado. Las extensiones futuras deben tener modelos y pruebas independientes.
