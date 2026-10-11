# Entrega 12 · Structure Lab: diseñador y análisis

## Objetivo de la fase

Fase 5: ampliar Structure Lab con geometría paramétrica 3D, respuesta estática calculada, materiales por dirección e intercambio explícito de masas. Se conserva el banco de pruebas de la entrega 11, sus enlaces y guardados. No se modifica ninguna ecuación de Space, Aircraft ni Rocket.

Problemas identificados antes de implementar: una triangulación visual no calcula tensiones; carbono UD no admite un límite elástico isotrópico ni Von Mises; los otros módulos no definen todos los datos geométricos; masa de piel no equivale a masa total o seca. La interfaz distingue estos casos y nunca certifica un diseño.

## Funciones implementadas

- Avión: perfil de familia NACA de cuatro dígitos, cuerda raíz/punta, envergadura, flecha de borde de ataque, diedro, espesor de piel, fuselaje elipsoidal. Valores NACA continuos; contorno discretizado con distribución cosenoidal y borde cerrado. No acepta perfiles arbitrarios ni archivos CAD.
- Cohete: 1–4 secciones cilíndricas independientes, ojiva cono/semielipsoide, aletas triangulares con espesor y diámetro/pared por sección. Cambios de diámetro forman escalones; no se diseñan empalmes estructurales.
- Satélite/cuerpo celeste: envolvente esférica hueca. No se resuelve gravedad propia ni el interior de un planeta; etiqueta educativa explícita.
- Three.js local: rotación libre, zoom, pan, teclado, nodos reales del eje FEM y triangulación superficial independiente. Color normalizado por referencia resistente; gris para piezas sin analizar. La deformación usa el campo estático nodal y una amplificación visible. La animación es una rampa ilustrativa, no integración temporal.
- Flexión alar por carga uniforme, compresión axial, membranas presurizadas, dilatación libre/restringida, pandeo global de columna ideal cuando corresponde. Una carga por escenario; no combinaciones.
- Guardado local independiente, JSON completo, campo CSV, gráficas/tablas con unidades, URL compartida con ambos calculadores estructurales, rechazo atómico de URL inválidas y compatibilidad de enlaces antiguos.
- Importación del último caso válido de Aircraft, Rocket geométrico o lanzamiento multietapa del mismo navegador. Exportación revisada de masa, sumando o sustituyendo solo el campo escogido.

## Archivos y responsabilidades

| Archivo | Responsabilidad |
|---|---|
| `structure.html` | Geometría/Materiales, Cargas, Análisis/Resultados y banco anterior |
| `styles.css` | Diseño adaptable, leyenda, tarjetas, panel de recepción |
| `src/structure/design/data.js` | Materiales, configuración inicial y validación SI |
| `src/structure/design/geometry.js` | NACA, secciones, discretización y masa por componentes |
| `src/structure/design/fem.js` | Ensamblaje, LU, equilibrio y autovalor de pandeo; sin DOM |
| `src/structure/design/model.js` | Casos de carga, criterios y límites; sin DOM |
| `src/structure/design/viewer.js` | Superficies Three.js, campo de deformación y cámara |
| `src/structure/design/ui.js` | Formularios, resultados, gráficos e intercambio |
| `src/structure/design/storage.js` | Persistencia aislada, versión de registros y recuperación validada |
| `src/integration/bridge.js` | Instantáneas, validación, propuestas y revisión en destino |
| `src/engineering/ui.js`, `src/rocket/ui.js` | Publicación del caso válido y recepción explícita de masa |
| `src/navigation/ui.js` | Pestañas específicas y URL de diseñador + banco anterior |
| `tests/structure-design.test.js` | Casos físicos, convergencia, errores y transferencias |
| `tests/structure-design-browser.mjs` | Controles, WebGL, guardados, URL, importación, revisión, móvil |
| `tests/structure-browser.mjs` | Regresión del banco anterior dentro de su pestaña |

`src/structure/{model,materials,visualization,storage,ui}.js` conserva los modelos de la entrega anterior. Three.js y OrbitControls se reutilizan del directorio `vendor/three`, sin descargas ni nuevas dependencias de ejecución. No hay servidor de cálculo, API, base de datos ni cuenta.

## Ecuaciones, condiciones y unidades

Entradas en m, N, Pa y cambios de temperatura en K (numéricamente iguales a °C para diferencias); E/resistencias almacenados en Pa, densidad en kg/m³. Contorno en m; A en m²; I en m⁴. K de flexión utiliza fuerzas y momentos como componentes diferentes: unidades de entrada/salida de cada grado de libertad coherentes. σ = My/I produce (N·m)(m)/m⁴ = Pa; PL³/EI y qL⁴/EI producen m. p r/t produce Pa; αΔT es adimensional. Masa = volumen × densidad.

### Semialas

Modelo Euler–Bernoulli estático, encastre ideal v(0)=v′(0)=0, extremo libre, carga q = (F/2)/(b/2). Piel delgada NACA: A = t ∮ds, centroide ponderado e I = t ∮(z−zc)²ds, incorporando la variación lineal de cada segmento. Dos grados de libertad por nodo, interpolación cúbica de desplazamiento y giro, K local = EI/L³ por la matriz clásica 4×4; carga consistente [qL/2, qL²/12, qL/2, −qL²/12]. E/I de cada elemento constantes en su punto medio. El esfuerzo en el extremo izquierdo se recupera mediante curvatura y término de carga consistente; el último extremo libre tiene momento nulo. Esfuerzo informado como envolvente positiva de flexión, con tracción y compresión comparadas para UD. La gráfica/3D interpola linealmente los desplazamientos nodales; no modifica la solución FEM.

La longitud mecánica es la semienvergadura proyectada: flecha/diedro cambian la forma, pero no generan acoplamientos mecánicos 3D. No hay torsión, cortante, costillas, largueros, juntas ni tensiones en fuselaje. Advertencia δ/L > 0,05, sin garantía de validez por debajo de ese filtro.

### Compresión y temperatura

Barras axiales: k = EA/L; σ = E[(uj−ui)/L − αΔT]. Base fija, extremo libre salvo restricción térmica de ambos extremos. Empuje se representa por una fuerza compresiva en el extremo: σ<0 y acortamiento<0. El fuselaje real de un lanzamiento no tiene esa distribución de fuerzas; tampoco se representa flexión lateral tras pandeo.

ΔT uniforme, E/α/resistencias constantes; sin gradientes térmicos ni cambios de propiedades. En UD, E1 y α1 actúan en el eje; E2/α2 describen dirección transversal. No se resuelven laminados ni uniones.

Pandeo global empotrado–libre: K u = P G u, matriz geométrica consistente de viga; mayor autovalor de K⁻¹G mediante iteración de potencia inversa (120 iteraciones, tolerancia relativa 10⁻⁹), Pcr = 1/λ. Un resultado sin convergencia se marca no calculado. En sección constante equivale a π²EI/(2L)². El margen Pcr/P solo se usa si Pcr/Amin ≤ resistencia compresiva/2, filtro elástico ideal. No hay pandeo local del cascarón, imperfecciones, excentricidad, plasticidad, pospandeo ni norma de diseño.

### Presión

Cilindros delgados cerrados: radio medio r = (D−t)/2, σθ = Δp r/t y σz = σθ/2. La barra incorpora fuerzas equivalentes σz A y deformación transversal de Poisson −ν12 σθ/E1. Desplazamiento axial = L(σz−ν12σθ)/E1 para cilindro uniforme. En UD la expansión radial usa σθ/E2−ν12σz/E1 (reciprocidad). La ojiva, aletas, tapas y esfuerzos de transición no están analizados. Se admite únicamente presión diferencial interior positiva, t/D ≤ 1/40; no presión exterior ni implosión.

Esfera metálica: σθ = σφ = Δp R/(2t); δR = (1−ν)σR/E. Libre con ΔT: δR=αΔT R; dilatación totalmente impedida biaxial: σ=−EαΔT/(1−ν). t/R ≤ 1/20. UD esférico: masa/forma disponibles, campo y factor no calculados porque falta orientación global de fibras. No se informa un factor infinito en este caso.

### Criterios y masa

Metales isotrópicos en tensión plana sin cortante: σVM = √(σz²+σθ²−σzσθ); índice = σVM/límite elástico. UD: max(|σ1|/Xtracción-compresión, |σ2|/Ytracción-compresión). No Von Mises, no límite elástico único; faltan interacción, cortante y delaminación. Factor = menor de 1/índice y Pcr/P cuando aplicable. A carga nula puede indicarse infinito; ningún factor>1 prueba seguridad global. Valores sobre la referencia generan advertencia, sin predecir fallo/postfallo.

Cilindros y esfera: volumen hueco exacto. Ala: 128 tiras por semiala, área de sección delgada multiplicada por longitud/diedro; aproximación de piel por tiras, sin jacobiano completo de superficie barrida. Fuselaje: diferencia entre elipsoides concéntricos con semiejes reducidos t, no espesor normal uniforme. Ojiva: cuadratura de 256 segmentos de área × pared; aletas: volumen de prismas triangulares. Se excluyen tapas, motores, interiores, uniones y carga útil. Se usa un material para todas las piezas, sin solapes internos ni masa de ensamblaje.

## Propiedades declaradas

Valores orientativos ilustrativos, no mínimos certificados ni datos trazables de un producto. Verifica fichas del material real antes de cualquier uso de ingeniería.

| Material | E1 / E2 (GPa) | ρ (kg/m³) | ν12 | α1 / α2 (10⁻⁶/K) | X tensión / compresión (MPa) | Y tensión / compresión (MPa) |
|---|---:|---:|---:|---:|---:|---:|
| Aluminio 7075-T6 | 71,7 / 71,7 | 2810 | 0,33 | 23,6 / 23,6 | 503 / 503 | 503 / 503 |
| Carbono UD **hipotético** | 135 / 10 | 1600 | 0,30 | −0,2 / 30 | 1500 / 900 | 40 / 150 |
| Ti-6Al-4V | 114 / 114 | 4430 | 0,34 | 8,6 / 8,6 | 830 / 830 | 830 / 830 |
| Inoxidable 301 recocido orientativo | 193 / 193 | 8030 | 0,29 | 16,9 / 16,9 | 205 / 205 | 205 / 205 |

Los presets antiguos de carbono y acero S355 permanecen exclusivamente en el banco de pruebas. Ningún registro anterior se convierte silenciosamente en inoxidable 301 o lámina UD.

## Algoritmo, errores y validación

Ensamblaje y LU densa con pivoteo parcial escalado (umbral de pivote relativo 10⁻¹⁴), doble precisión JavaScript. Sistemas pequeños: aproximadamente 98 grados de libertad; Rocket puede tener más elementos al respetar fronteras de secciones. Se comprueba finitud y residuo relativo max|Ku−f|/max(1,max|f|); >10⁻⁶ genera advertencia. Ese residuo verifica equilibrio discreto, no error del continuo. Riesgos: redondeo, condicionamiento de secciones extremas, discretización del contorno, propiedades a mitad del elemento, cuadratura y autovalor iterativo. Aumentar elementos no corrige hipótesis físicas incorrectas.

Casos automatizados independientes de UI: viga uniforme δ=FL³/(8EI) y σraíz=FLc/(2I); Euler K=2; barra PL/EA; temperatura libre/impedida; cilindro y esfera presurizados; criterios direccionales UD; masa annular, bordes de secciones, malla 8/16/32, carga nula, invalidaciones, sistemas singulares y transferencias. Las fórmulas cerradas se evaluan separadamente del ensamblaje FEM. La validación cubre estos modelos ideales, no vehículos reales ni un FEM volumétrico.

## Importación/exportación y almacenamiento

Instantáneas puente versionadas `aerolab.bridge.snapshot.{aircraft,calculator,launch}.v1`; se publican únicamente casos válidos, incluso sin guardar. Se recalculan fuerzas al importar. No se publican al servidor. Si no hay instantánea, se intenta el guardado anterior compatible; almacenamiento bloqueado produce error visible al importar/exportar, sin impedir cálculo.

Aircraft aporta span y cuerdas derivadas de S/taper, sustentación actual; no aporta NACA, flecha, diedro ni dimensiones de fuselaje. Rocket geométrico se mapea explícitamente a cilindro 80 % + ojiva 20 % de su longitud. Lanzamiento aporta empuje inicial, conservando geometría existente porque no dispone de dimensiones. Un valor fuera del dominio del diseñador se rechaza y se explica; no se recorta ni inventa.

Exportar genera propuesta `aerolab.bridge.mass.{destino}.v1`. En destino, revisión con masa actual y botones Aplicar/Descartar. Aplicar valida, recalcula solo masa total Aircraft, masa seca calculador o masa seca etapa indicada; conserva demás entradas vigentes e invalida trayectoria anterior. Añadir utiliza masa vigente al aplicar; no un valor obsoleto. No guarda automáticamente. Una propuesta aplicada/descartada se elimina; si el almacenamiento no permite eliminarla, no se anuncia consumo correcto. Abre el enlace de destino para revisar una nueva propuesta; una página destino ya abierta no agrega automáticamente un panel receptor.

Nuevo guardado `aerolab.structure.design.v2`, sin cambiar `aerolab.structure.v1`. Compartir incluye diseñador, opciones visuales y banco anterior; reproducción restaurada en pausa. Enlaces antiguos del banco siguen admitidos.

## Ejecución y pruebas manuales

```sh
cd /workspace/Cole
python3 -m http.server 8001 --bind 0.0.0.0
```

Abre `http://localhost:8001/structure.html` (o acceso al puerto remoto del proveedor). Sin instalación de dependencias; necesita HTTP para módulos JS. Node20+ para `npm test`. Pruebas de navegador requieren Playwright y Chromium, solo herramientas de desarrollo, no dependencias del producto.

1. Avión: cambia span, cuerdas, perfil, flecha/diedro y pared. Rota/zoom/pan con ratón y teclado. Comprueba forma, masa por piezas, leyenda y nodos amarillos.
2. En Cargas, cambia fuerza de 14700 a 29400 N: en el modelo lineal δ y esfuerzo duplican. Pasa la fracción a 0, anima/pausa y modifica amplificación: las métricas siguen a carga completa.
3. Cohete: añade secciones y cambia D/t. Presión: duplicar Δp duplica esfuerzo/deformación. Térmica libre: desplazamiento distinto de cero y esfuerzo casi nulo; impedida: desplazamiento cero y esfuerzo térmico.
4. Carbono: no se ofrece Von Mises. Esfera UD no da factor/esfuerzo; metal sí. Vacía radio o espesor: métricas/gráfica/3D anteriores se retiran; corregir recupera.
5. Guarda y descarga JSON/CSV, cambia configuración, carga. Comparte URL y abre: estado exacto sin reproducción. Prueba enlace antiguo; banco anterior sigue con sus datos aislados.
6. Abre Aircraft, cambia área/span sin guardar, regresa a Structure e importa. Confirma dimensiones/fuerza y nota de geometría conservada.
7. Exporta masa: abre Aircraft, revisa añadir/sustituir, modifica su masa actual y aplica. Solo cambia ese campo; no guarda automáticamente y al recargar no reaplica. Rocket permite seleccionar etapa; trayectoria anterior se invalida.
8. Prueba 320 px, 390 px, 768 px y escritorio; pestañas por flechas/Home/End. Activa movimiento reducido: rampa queda fija, fracción manual operativa. Si WebGL falla, sigue con tablas, gráfico SVG y cálculos.
9. Abre banco anterior en Cargas y verifica guardado, referencia, fórmulas, JSON y CSV. Space/Aircraft/Rocket siguen calculando con sus modelos existentes.

## Completado y pendiente

Completado: geometría, materiales declarados, FEM 1D/modelos membrana, visor, campos/tablas, nodos, validación, persistencia, URL compatible e intercambio revisado. Las ejecuciones verificadas y cifras se registran en TESTING.md.

Pendiente: FEM 2D/3D de cascarones/volúmenes, laminados compuestos, cargas combinadas, torsión, presión externa/pandeo local, uniones, mapas térmicos, ensayos experimentales, datos trazables y publicación en un hosting. No se anuncian estas capacidades como existentes. GitHub almacena el código; no equivale a sitio desplegado.
