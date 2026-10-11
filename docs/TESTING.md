# Pruebas y evidencia de la entrega 2 · Space Lab 0.2

## Resultado observado

- Node.js 24.19.0: **23 pruebas unitarias aprobadas**, 0 fallos, 0 omitidas.
- Chromium headless mediante Playwright: **11 comprobaciones de integración aprobadas**, sin errores JavaScript no capturados en la página principal.
- Cálculo independiente con Python 3.12.14: valores terrestres a 400 km y a radio 42164 km concordantes con las referencias de las pruebas.
- Página y módulos servidos por HTTP con Python; no se requiere instalación de paquetes de aplicación ni compilación.
- Capturas de escritorio de 1440 px y móvil de 390 px inspeccionadas. Comprobación automática sin desbordamiento global a 1440, 768, 390 y 320 px. La tabla permite desplazamiento horizontal propio en móvil.

Los resultados corresponden a esta entrega; ejecutar los comandos nuevamente produce evidencia para cualquier modificación posterior. Los 11 checks de navegador son grupos de aserciones, no 11 modelos científicos adicionales.

## Qué comprueban las pruebas unitarias

Caso terrestre ideal de 400 km; periodo casi sidéreo a radio 42164 km; caso normalizado μ=1 y r=1; tercera ley de Kepler; escalamiento con radio y μ; equilibrio centrípeto; energía específica; radio constante y periodicidad; conversiones; signo del porcentaje de energía; entradas no físicas y desbordamiento; extremos de los límites admitidos; guardado/carga, versión incorrecta, JSON dañado, parámetros inválidos y almacenamiento indisponible.

La ampliación verifica e=0 como regresión circular, caso normalizado elíptico, referencia terrestre independiente, periapsis/apoapsis, periodicidad, conservación de energía y momento angular, vis-viva, geometría en 120 fases para cuatro excentricidades, residuo de Kepler, segunda ley de áreas, e=0,9 y migración de guardados v1. Un cero con signo negativo de IEEE-754 se compara como valor numérico cero; no es una velocidad física distinta.

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
PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs node tests/browser.mjs
```

Opciones: `CHROMIUM_PATH` para otro ejecutable y `AEROLAB_URL` para otra dirección de prueba. El script lanza Chromium sin sandbox dentro de este contenedor de pruebas; para ejecutar en otro entorno, revisa la política de aislamiento antes de reutilizar esa opción. Las capturas se escriben en `/tmp/aerolab-desktop.png` y `/tmp/aerolab-mobile.png`, fuera del checkout. No se necesita acceso a servicios externos durante las pruebas.

Comprobaciones: resultados iniciales; comparación e invalidez; presets y personalizado; avisos; guardado persistente entre recargas; reset sin borrar; datos dañados; movimiento, pausa y reloj; diseño adaptable y enlace de salto de teclado; errores de almacenamiento mostrados al usuario.

También se comprueban geometría elíptica con el cuerpo en un foco, resultados de los extremos, entradas e≥1 rechazadas, lecturas de velocidad/distancia variables, persistencia de e y migración v1 sin sobrescribir datos hasta Guardar.

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

## No comprobado

Safari, Firefox, dispositivos físicos, lectores de pantalla, una auditoría WCAG completa, hosting real, incertidumbre de constantes, efemérides reales, perturbaciones orbitales, conservación durante integración numérica (no hay integrador), e>0,9, órbitas abiertas ni otros módulos. Ninguno de estos resultados se anuncia como validado.
