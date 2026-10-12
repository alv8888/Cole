# Entrega 21 · Refinamiento de discretización FEM (0.21)

## Objetivo y diagnóstico

Base inspeccionada: `4436e0d2b650a06e875c1993a6ed71858554afb6`, Git limpio. El solucionador ya permite refinar elementos y las pruebas incluyen un ala variable 8/16/32, pero la interfaz no ofrecía un estudio visible. Se reutilizan `analyzeDesign`, el servicio de gráfica científica y descarga existentes. No se introducen métodos numéricos, bibliotecas ni ecuaciones nuevos.

## Funciones y arquitectura

Panel plegable **Refinar la discretización · estudio de convergencia**, en Análisis Finito y Resultados, cerrado inicialmente. Calcular estudio resuelve el mismo caso con objetivos 4, 8, 16, 32 y 48. Abrir el panel no ejecuta cálculos. No cambia parámetros, elementos activos, referencia de comparación, guardados ni reloj visual.

Se muestran objetivo y número real de elementos, desplazamiento extremo firmado en mm, máximo resistente en MPa, variaciones sucesivas y residuo relativo de equilibrio. La gráfica puede alternar desplazamiento/esfuerzo sin resolver de nuevo. Tiene ejes/unidades, selección de las cinco soluciones por teclado/puntero y desplazamiento local en móvil. Las advertencias de todas las soluciones se muestran en una sección plegable, sin repeticiones; se conservan también en CSV.

Las ediciones físicas invalidan tabla, gráfica, advertencias y descarga. Opciones del visor conservan el estudio porque no cambian el modelo. Capturar/eliminar una referencia de comparación no afecta al estudio. El documento completo debe ser válido para producir configuraciones reproducibles; los borradores inactivos inválidos lo bloquean. Esfera excluida: su membrana analítica no tiene discretización FEM.

Nuevos: `src/structure/design/convergence.js` (estudio/CSV sin DOM), `convergence-ui.js` (estado y presentación), `tests/convergence.test.js`, `tests/convergence-browser.mjs`, este documento. Modificados: `src/structure/design/ui.js` (conexión e invalidación), `structure.html` (panel), `workbench.css` (gráfica/tabla), `tools/test-browser.mjs` (suite). README, ROADMAP, TESTING, package y etiquetas HTML registran la versión. Las otras tres páginas HTML solo actualizan su etiqueta.

## Interpretación científica

Son cinco soluciones estáticas del modelo actual, no una evolución temporal ni una secuencia de mallas superficiales. Se mantienen material, geometría y carga; cambia únicamente `elements`. Ala: elementos de una semiala. Cohete: cada sección recibe ceil(n × longitud de sección / longitud total), mínimo uno, preservando empalmes; número real puede exceder el objetivo. La curva usa el número real; no supone que objetivo y real coincidan.

```
Cambio sucesivo (%) = 100 × |resultado actual − anterior| / |anterior|
```

Primer caso y anterior cero: porcentaje indefinido (— en pantalla, vacío en CSV), incluso si ambos resultados son cero. El desplazamiento y el esfuerzo conservan sus unidades; porcentaje/residuo adimensionales. La pantalla usa cinco cifras significativas y notación científica para valores no nulos menores que 10⁻⁴ o mayores/iguales a 10⁶ como formato, sin afirmar precisión física. CSV conserva números sin redondeo de pantalla.

Una diferencia pequeña entre dos soluciones no es el error respecto a una solución exacta ni demuestra convergencia asintótica, precisión de la geometría o validación experimental. No se establece un umbral automático de aprobación. Se observan cambios de desplazamiento extremo y máximo resistente (Von Mises en metales, axial en UD), no campos nodales superpuestos. Los máximos pueden variar por discretización y muestreo. No se estudia convergencia del autovalor de pandeo/factor de seguridad.

El residuo relativo procede del solucionador existente: comprueba equilibrio algebraico, no error de discretización ni adecuación física. Contorno NACA y cuadratura de masa conservan sus discretizaciones propias. No se refinan geometría superficial, integración de masa, espesor de pared, apoyos, fuerzas ni hipótesis del modelo. Los detalles de Euler–Bernoulli/axial, LU con pivoteo y criterios se documentan en STRUCTURE-DESIGN.md; no se reemplazan por otra aproximación.

Caso conocido: ala de sección constante con carga uniforme reproduce el desplazamiento del modelo de viga con pequeños cambios numéricos entre discretizaciones; no exige que refinar siempre cambie el resultado. Carga cero puede producir cero firmado IEEE-754; se trata como cero al calcular porcentajes. Ala variable muestra reducción de diferencias en el caso de prueba, sin generalizarla a todas las configuraciones.

## CSV

`aerolab-structure-convergence.csv`: UTF-8, separador coma, comillas duplicadas para escape y CRLF. Cabecera más cinco filas, con metros y pascales SI sin formato local:

```text
target_elements,actual_elements,tip_displacement_m,maximum_stress_Pa,displacement_change_percent,stress_change_percent,relative_equilibrium_residual,configuration_json,warnings_json,model_note
```

Cada fila contiene su configuración completa con el objetivo usado, advertencias y límites. No modifica los CSV existentes de campo/comparación. Requiere el estudio vigente; no exporta resultados de entradas anteriores.

## Ejecutar y pruebas manuales

```sh
cd /workspace/Cole
python3 -m http.server 8000 --bind 0.0.0.0
```

Abre `http://localhost:8000/structure.html`; en nube usa el acceso al puerto del proveedor. `npm start` es equivalente. Sin npm install para ejecutar; no abrir con file://. Ctrl+C detiene el servidor.

1. En Resultados abre Refinar la discretización. Debe estar pendiente. Calcula: cinco filas objetivo 4/8/16/32/48; el caso activo sigue con 16 elementos y sus resultados originales.
2. Alterna desplazamiento/esfuerzo. Enfoca la gráfica, pulsa Home/End y flechas: cada cursor identifica una de cinco soluciones y sus unidades. La línea es guía visual entre muestras.
3. Descarga CSV: cinco configuraciones completas, elementos reales, valores SI y advertencias. La primera variación está vacía. Prueba carga cero: porcentajes contra cero no se inventan.
4. Cambia amplificación visual: estudio conservado. Cambia carga física: tabla/gráfica limpias y descarga deshabilitada hasta recalcular.
5. Cohete predeterminado: objetivo 4 genera 5 elementos reales por sus secciones 3 y 2 m. Esfera: acción deshabilitada, explicación de modelo analítico.
6. Prueba 320–1440 px y teclado: gráficos/tablas se desplazan localmente. Los guardados, comparación de referencias y transferencia de masa siguen funcionando.

## Completado y pendientes

Estudio acotado a cinco cálculos bajo demanda, integración y pruebas documentadas en TESTING.md. Conservados todos los modelos y funciones anteriores. Pendientes: refinamiento del contorno e integración, estimación de error con justificación, estudios separados de pandeo y campos en coordenadas compatibles. No disponibles en esta fase. Sin validación experimental, FEM 3D, certificación, pruebas de hardware real o auditoría WCAG completa; pendientes Firefox/Safari, lectores de pantalla y rendimiento medido.
