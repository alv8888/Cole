# Structure Lab · Entrega 11 (0.11)

## Objetivo, usuarios y alcance

Completar el selector de AeroLab con un laboratorio estructural independiente para estudiantes y docentes. Primera versión funcional con flexión de voladizos rectangulares y compresión axial de tubos ideales. Permite modificar material, propiedades, geometría, carga y apoyos; muestra deformación, diagramas, esfuerzos y coeficientes frente a referencias declaradas.

No modela un ala completa ni un fuselaje real. La prioridad es identificar las ecuaciones y sus límites, sin presentar una comparación de resistencias como certificación de seguridad.

## Arquitectura y archivos

```text
structure.html                   Página del cuarto laboratorio
src/structure/materials.js       Presets, unidades, rangos y valores iniciales
src/structure/model.js           Validación, configuración limpia y cálculos puros SI
src/structure/visualization.js   Diagramas SVG de deformación y momento
src/structure/storage.js         Guardado local exclusivo y validación al cargar
src/structure/ui.js              Formularios, resultados, referencia, archivos y enlaces
src/navigation/ui.js             Pestañas compartidas y enlaces a teoría
styles.css                       Estética oscura y adaptación a pantallas
 tests/structure.test.js          Casos numéricos y persistencia, sin DOM
 tests/structure-browser.mjs      Interacciones, archivos, enlaces y menús
```

Se reutilizan conversión/formato de unidades, descarga de archivos y transporte URL existentes. No hay biblioteca, servidor de cálculo o dependencia adicional: SVG basta para este modelo estático. Los otros módulos no comparten estados ni cálculos con Structure. El código completo de todos los archivos se entrega en ZIP y documento separado.

## Materiales declarados

| Opción | E (GPa) | Referencia tracción (MPa) | Referencia compresión (MPa) | Interpretación |
|---|---:|---:|---:|---|
| Aluminio 7075-T6 | 71,7 | 503 | 503 | Ejemplo típico orientativo; misma fluencia en ambos sentidos supuesta |
| Fibra de carbono | 70 | 600 | 400 | Laminado equivalente hipotético; resistencias supuestas, sin límite elástico único |
| Titanio | 114 | 830 | 830 | Ejemplo orientativo Ti-6Al-4V; misma fluencia supuesta |
| Acero | 210 | 355 | 355 | Ejemplo S355; valor nominal dependiente de producto/espesor |

Son presets educativos, no valores de diseño certificados ni mínimos garantizados. No se verificaron contra una ficha de lote, tratamiento o producto. Las propiedades son editables: el modelo usa los valores de los campos y señala si se cambiaron. Seleccionar otro material restablece sus propiedades orientativas. La validación realizada es de las ecuaciones, no de estos materiales.

Carbono no es isotrópico en general. Este MVP usa una respuesta longitudinal equivalente homogénea y lineal; no implementa laminados, orientación de fibras, matrices ABD, interacción de esfuerzos, delaminación ni criterios de fallo de composites. Para el coeficiente de flexión se toma la menor resistencia de tracción y compresión porque ambos extremos aparecen en la sección.

## Modelos y condiciones

**Voladizo rectangular:** longitud L, ancho b, altura h; raíz perfectamente empotrada, punta libre, deformación inicial cero. A=bh, I=bh³/12, y=h/2. Desplazamiento positivo hacia abajo; se muestran magnitudes de esfuerzos.

Fuerza puntual P en punta:

```text
M(x) = P(L − x)
Mmax = PL
σmax = Mmax × (h/2) / I
v(x) = Px²(3L − x)/(6EI)
δpunta = PL³/(3EI)
```

Carga uniforme q a lo largo de toda la viga:

```text
M(x) = q(L − x)²/2
Mmax = qL²/2
v(x) = qx²(6L² − 4Lx + x²)/(24EI)
δpunta = qL⁴/(8EI)
```

Supone Euler–Bernoulli, material equivalente, sección constante, pequeñas deformaciones y carga estática. Omite peso propio, cortante, torsión, conexiones y fatiga. Avisa si L/h < 10, δ/L > 0,05 o σ alcanza la referencia; estos filtros no prueban validez ni predicen fallo. El ala real suele ser una estructura de paredes delgadas, no esta sección rectangular maciza.

**Compresión tubular:** tubo uniforme, diámetro exterior D, pared t y diámetro interior d=D−2t positivo. Carga axial centrada P. A=π(D²−d²)/4; I=π(D⁴−d⁴)/64; σ=P/A; acortamiento ΔL=PL/(EA). En el cálculo se factorizan diferencias de potencias para reducir cancelación numérica. Desplazamiento axial en x: Px/(EA).

Pandeo ideal de Euler: Pcr=π²EI/(KL)². Esbeltez λ=KL/√(I/A). K=1 articulado–articulado; 0,5 empotrado–empotrado; 0,699 empotrado–articulado; 2 empotrado–libre. K=0,699 es una aproximación habitual para apoyos ideales, no una medida de una unión real.

Se muestra el margen Pcr/P solamente si Pcr/A ≤ referencia de compresión/2, un filtro conservador para pandeo elástico. No es un código estructural. Si no se cumple, el resultado aparece «no aplicable», sin inventar un coeficiente global. No se calcula pandeo inelástico, excentricidad, imperfecciones, pandeo local de pared, abolladuras, presión ni pospandeo. El diagrama muestra solo acortamiento axial; no dibuja una curva lateral ficticia. El coeficiente material por sí solo no demuestra resistencia del fuselaje.

**Coeficientes:** flexión = min(referencia tracción, referencia compresión)/σmax; compresión material = referencia compresión/(P/A). Son adimensionales. A carga cero, se muestra «∞ (sin carga)», representado internamente por null sin serializar Infinity. Un coeficiente menor que 1 supera esa referencia, pero uno mayor que 1 no demuestra seguridad global ni es un factor objetivo de una norma.

## Unidades, algoritmos y precisión

Entradas SI: m, N y N/m. Las cargas admiten cero o un mínimo positivo de 10⁻⁶ N / N/m, declarado en los controles para evitar magnitudes numéricamente despreciables. E en GPa y resistencias en MPa se convierten a Pa con 10⁹ y 10⁶. A en m², I en m⁴, M en N·m, σ en Pa y desplazamiento en m; interfaz convierte σ a MPa y desplazamiento a mm.

Dimensiones: My/I = (N·m)m/m⁴ = Pa; PL³/(EI) = m; qL⁴/(EI) = m; P/A = Pa; PL/(EA) = m; EI/(KL)² = N. No hay integrador, paso temporal ni problema de estabilidad numérica. Se evalúan 81 posiciones con fórmulas cerradas. La polilínea aproxima únicamente el dibujo, no la deflexión máxima calculada analíticamente.

JavaScript Number usa doble precisión. Las propiedades/materiales y la idealización dominan el error; los decimales mostrados no prueban precisión física. Los extremos permitidos dan números finitos, pero pueden violar completamente el modelo elástico y producen advertencias. La deformación se escala automáticamente para verla, con ampliación máxima de 10⁶; la escala se declara y se puede desactivar. Si excede el encuadre, el aviso indica el recorte; los números conservan el resultado analítico.

## Casos conocidos comprobados

Referencias calculadas independientemente con Python y fórmulas directas, no ensayos experimentales:

1. L=2 m, b=0,1 m, h=0,2 m, E=70 GPa, P=1000 N: I=6,6666666667×10⁻⁵ m⁴, Mmax=2000 N·m, σmax=3 MPa, δpunta=0,5714285714 mm.
2. Misma viga, q=1000 N/m: Mmax=2000 N·m, σmax=3 MPa, δpunta=0,4285714286 mm. Para igual fuerza total, la flecha por carga uniforme es 3/8 de la flecha por fuerza en punta.
3. Tubo L=2 m, D=0,1 m, t=0,002 m, E=70 GPa, P=1000 N, K=1: A≈0,0006157521601 m², I≈7,3951834428×10⁻⁷ m⁴, σ≈1,6240300315 MPa, ΔL≈0,0464008580 mm, Pcr≈127728,186345 N.
4. P=0: esfuerzo y desplazamiento cero. Duplicar E divide la flecha por dos; duplicar h divide el esfuerzo por cuatro y la flecha por ocho. Cambiar K de 1 a 2 divide Pcr por cuatro. No se valida una estructura real a partir de estas identidades.

## Ejecutar

```sh
cd /workspace/Cole
python3 -m http.server 8001 --bind 0.0.0.0
```

En tu equipo abre `http://localhost:8001/structure.html`. En el entorno remoto usa el acceso al puerto de tu proveedor. También puedes entrar desde los cuatro menús principales. No hace falta npm install. Usa HTTP, no file://.

```sh
npm test
AEROLAB_URL=http://127.0.0.1:8001 PLAYWRIGHT_MODULE=/tmp/aerolab-browser/node_modules/playwright/index.mjs node tests/structure-browser.mjs
```

La segunda orden requiere Playwright y Chromium como herramientas de desarrollo externas a la app; la ruta corresponde al entorno usado.

## Pruebas manuales

1. Entra desde Space, Aircraft y Rocket: Structure debe ser un enlace activo. Prueba las tres pestañas con teclado y el enlace superior a teoría.
2. Introduce el caso de viga 1 anterior. Verifica 3 MPa y 0,571 mm, curva empotrada y momento máximo en la raíz. Alterna escala automática sin cambiar resultados numéricos.
3. Cambia a carga uniforme y q=1000 N/m: verifica 0,429 mm. Revisa gráficas y 81 filas en Análisis.
4. Cambia a compresión y configura el caso tubular 3. Verifica esfuerzo y acortamiento. Cambia apoyos; luego reduce L a 0,1 m: Euler debe quedar no aplicable.
5. Cambia materiales y edita E/resistencias. Carbono debe declarar laminado hipotético y resistencia, sin afirmar límite elástico. Captura referencia y comprueba ambas columnas.
6. Vacía una entrada, supera límites o introduce t≥D/2: cálculos afectados, diagramas, guardado y exportación deben invalidarse. P=0 debe mostrar cero e infinito sin carga.
7. Guarda, recarga y carga; otros laboratorios conservan sus guardados. Exporta JSON y CSV: el CSV tiene encabezado y 81 filas SI.
8. Copia un enlace con referencia y escala, ábrelo y verifica configuración. Modifica un valor a negativo en la URL: debe rechazarse sin restauración parcial ni sobrescritura del guardado.
9. Comprueba las tres pestañas en móvil y escritorio y que las advertencias siguen legibles.

## Validación, entrega y pendientes

73 pruebas unitarias y 72 grupos Chromium pasaron. Ocho pruebas unitarias nuevas cubren referencias independientes, leyes de escala, condiciones de borde, compresión/Euler, carga cero, carbono, inválidos/extremos y persistencia. Ocho grupos nuevos cubren fórmulas visibles, diagramas, cambio de carga/material/apoyos, referencias, archivos, enlaces, cuatro menús y pantallas 320–1440 px. Se ejecutaron las siete suites previas para detectar regresiones. Capturas desktop y móvil inspeccionadas.

Guardado exclusivo `aerolab.structure.v1`, registro versionado y validado. Referencia dura durante la sesión y puede viajar en el enlace; no sobrescribe otros módulos. CSV incluye tipo de carga, material, propiedades, dimensiones, carga/apoyos y puntos calculados con unidades en el encabezado; JSON la conserva. No se guarda la referencia con el botón de guardado local, lo mismo que en los otros módulos.

Fases 1–4 completadas para este MVP. Problemas importantes tratados: carbono sin límite elástico universal, flexión frente a compresión, aplicabilidad de Euler, escala del dibujo, incertidumbre de materiales y enlaces inválidos. Pendiente: fichas trazables por producto/temperatura, laminados anisótropos, cajones alares, pandeo local e inelástico, cargas combinadas/fatiga, contraste experimental, otros navegadores y revisión completa de accesibilidad. No se han validado aeronaves ni fuselajes reales. Código en GitHub no equivale a un sitio desplegado; hosting HTTPS sigue pendiente.
