# AEROLAB · Space Lab 0.1

MVP educativo de órbitas circulares. HTML semántico, CSS, JavaScript modular y SVG. Sin dependencias de aplicación, API, base de datos, compilación ni cuentas. Aircraft, Rocket y Structure Lab están identificados como módulos futuros y no tienen controles ficticios.

## Ejecutar

Desde una terminal con Python 3:

```sh
cd /workspace/Cole
python3 -m http.server 8000 --bind 0.0.0.0
```

Abre `http://localhost:8000` en tu equipo local. En una máquina remota, utiliza el mecanismo de acceso al puerto que ofrezca tu proveedor. No abras `index.html` con `file://`: los módulos JavaScript necesitan servirse por HTTP. Detén el servidor con Ctrl+C. Este servidor solo sirve archivos; no es un backend físico ni almacena datos.

Alternativa con Node y npm presentes: `npm start`. No se necesita `npm install` para usar la aplicación o ejecutar las pruebas unitarias.

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
├── src/
│   ├── app.js                 # Eventos, estado, comparación y reloj de animación
│   ├── data.js                # Presets declarados y valores iniciales
│   ├── physics.js             # Solución circular pura en SI
│   ├── units.js               # Conversiones y formato
│   ├── validation.js          # Límites de entrada
│   ├── visualization.js       # SVG orbital y gráficas con eje desde cero
│   └── storage.js             # Guardado local versionado y validado
├── tests/
│   ├── physics.test.js        # Física, invariantes, conversiones y límites
│   ├── storage.test.js        # Persistencia y errores
│   └── browser.mjs            # Integración opcional con Playwright y Chromium
└── docs/
    ├── MODEL.md               # Modelo, dimensiones, supuestos y precisión
    ├── TESTING.md             # Evidencia, reproducción y pruebas manuales
    └── ROADMAP.md             # Fases completadas, problemas y pendientes
```

## Uso

1. Elige el cuerpo central de A y B o introduce parámetros propios. Editar μ o R cambia el selector a Personalizado.
2. Introduce la altitud. Las unidades y límites aparecen junto a cada entrada; todos los campos deben ser válidos.
3. Compara los resultados, barras y órbitas. Ambas vistas comparten escala de distancia. Los cuerpos pueden tener distinto radio y μ.
4. Reproduce o pausa la posición analítica. La velocidad del reloj indica segundos simulados por segundo real. La animación empieza pausada, también para usuarios con movimiento reducido.
5. Guardar conserva ambas configuraciones en el navegador. Cargar recupera el guardado, incluso después de recargar. No se carga automáticamente. Restablecer devuelve los presets iniciales sin borrar el guardado.

Los cambios de parámetros pausan y reinician el tiempo. Ocultar la pestaña pausa la reproducción para evitar saltos al volver. No hay adquisición de telemetría ni cálculo de trayectorias reales.

## Publicación inicial

Los archivos son estáticos y se pueden servir mediante cualquier alojamiento con HTTPS y soporte de tipos MIME JavaScript. Publica `index.html`, `styles.css`, `src/` y `docs/`; no publiques `.git`, pruebas ni herramientas temporales. Los enlaces y módulos son relativos y funcionan bajo un subdirectorio. No se ha desplegado el proyecto ni comprobado un hosting real.

Antes de publicar: ejecuta las pruebas, verifica el sitio sobre HTTPS, revisa enlaces y accesibilidad manual y configura políticas de seguridad en el proveedor. No se introducen secretos, código de terceros ni contenido remoto durante el cálculo. El almacenamiento local no está cifrado y depende del origen del sitio; úsalo solo para parámetros públicos. No uses el servidor de Python como servidor de producción.

Para actualizar modelos, conserva pruebas de regresión y migra o cambia la versión del formato guardado. Las extensiones futuras deben tener modelos y pruebas independientes.
