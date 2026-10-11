# Entrega 20 · Comparación del diseñador estructural (0.20)

## Objetivo y diagnóstico

Base inspeccionada: `2b68c3852461e37ab63d7a7442b4a6013bddd739`, Git limpio. El banco analítico ya tenía referencia/comparación, pero el diseñador paramétrico FEM 1D/membranas no. Esta fase añade comparación al diseñador existente, dentro de Análisis Finito y Resultados, sin cambiar modelos, navegación, guardados ni visores.

## Funciones

Panel plegable **Comparar diseños · masa, esfuerzo y desplazamiento**, cerrado inicialmente.

- Capturar diseño como referencia: calcula y conserva una copia independiente en memoria. Una referencia por objeto (Avión, Cohete, Envolvente). Captura exige configuración completa válida; no altera entradas, guardados, referencias del banco anterior ni enlaces.
- La referencia sobrevive a editar, restablecer, importar o cargar otro diseño dentro de la página. Al volver a un objeto se recupera su referencia. Recargar/cerrar la página las elimina. No se incluyen en el guardado ni URL actuales.
- Quitar referencia afecta solo al objeto seleccionado, incluso con resultado actual inválido. Conserva el diseño.
- La tabla muestra referencia, actual, diferencia absoluta y cambio porcentual; resúmenes muestran material, carga, dimensiones principales y unidades. Los JSON del CSV contienen todas las dimensiones y condiciones.
- Cálculo activo inválido: tabla vacía y captura/CSV deshabilitados; la referencia se conserva y sigue identificada. Documento con borrador inactivo inválido: el resultado activo puede compararse, pero captura/exportación completa bloqueadas. Opciones visuales inválidas no invalidan los resultados físicos comparados.
- CSV UTF-8 descargado realmente mediante el servicio de archivos existente; no requiere servidor ni biblioteca nueva.

## Comparabilidad científica

Tres métricas: masa de superficies (kg), máximo resistente (MPa) y desplazamiento extremo firmado (mm).

La masa incluye únicamente las superficies modeladas, con los mismos límites del modelo; no es masa seca total. La diferencia de masa no determina automáticamente un diseño mejor. Esfuerzos solo comparables para el mismo objeto/carga y el mismo tipo de criterio: Von Mises metálico frente a Von Mises metálico, o máximo axial UD frente a máximo axial UD. Entre metal y UD se muestran ambos valores, pero no se calcula diferencia ni porcentaje. Esos criterios no son intercambiables.

Desplazamiento solo comparable con el mismo objeto/carga, para mantener significado del eje. Puede cambiar material, espesor, dimensiones, apoyos o magnitud de carga: los valores corresponden a los extremos de cada configuración, no a un nodo común ni a una superposición de campos. Cambios de apoyos/dimensiones no constituyen un estudio que aísle una única variable. Esfera UD mantiene magnitudes resistentes ausentes (—), no cero. Valores no calculados o casos incompatibles no generan diferencias.

```
Δ = actual − referencia
Cambio (%) = 100 × Δ / |referencia|, si referencia ≠ 0
```

La diferencia conserva unidades y signo. Para desplazamientos negativos, un porcentaje positivo puede indicar menor magnitud de contracción, no mayor deformación absoluta. Referencia cero deja porcentaje indefinido y vacío en CSV. La pantalla redondea a un máximo de cuatro decimales, sin reclamar esa precisión física. El CSV conserva números calculados sin el redondeo de pantalla.

No compara factor de seguridad: sus criterios de material/pandeo y aplicabilidad pueden diferir. La tabla tampoco aporta incertidumbre, convergencia de malla, CFD, FEM 3D, validación experimental o certificación. Conserva las advertencias científicas del laboratorio.

## Formato CSV

`aerolab-structure-comparison.csv`: coma como separador, todos los campos entre comillas, comillas interiores duplicadas, CRLF y punto decimal para números. Una cabecera y tres filas de métricas, 11 columnas:

```text
metric,unit,reference_value,current_value,delta,change_percent,compatible,reason,reference_config_json,current_config_json,model_note
```

Se vuelven a calcular ambas configuraciones completas validadas para exportar. Campos incompatibles/no calculados quedan vacíos y se informa reason. No se incluye un campo nodal o barrido: Exportar campo CSV sigue siendo una acción independiente, sin cambiar su formato. La comparación no altera los contratos de guardado ni URL.

## Archivos

Nuevos: `src/structure/design/comparison.js` (comparación/CSV sin DOM), `src/structure/design/comparison-ui.js` (referencias temporales y presentación), `tests/design-comparison.test.js`, `tests/design-comparison-browser.mjs`, este documento.
Modificados: `src/structure/design/ui.js` (conexión con resultado/documento/objeto), `structure.html` (panel), `workbench.css` (tabla con desplazamiento local), `tools/test-browser.mjs` (suite), README/ROADMAP/TESTING/package y etiquetas HTML de versión. En las otras páginas HTML solo cambia la versión. No se reemplazan archivos ni se añade una dependencia.

## Ejecutar

```sh
cd /workspace/Cole
python3 -m http.server 8000 --bind 0.0.0.0
```

Abre `http://localhost:8000/structure.html`. En nube usa el acceso al puerto del proveedor. `npm start` es equivalente. No necesita npm install para usar la aplicación; no abrir módulos con file://. Ctrl+C detiene el servidor.

## Pruebas manuales

1. Con el diseño inicial, entra en Análisis Finito y Resultados y abre Comparar diseños. Captura referencia. En Cargas cambia fuerza total de 14700 a 29400 N. Compara: masa constante y esfuerzo máximo duplicado (+100 %). La magnitud del desplazamiento se duplica; su porcentaje respeta el signo de la solución.
2. Captura 29400 como referencia y Restablece: referencia conservada y esfuerzo actual −50 %. Vacía fuerza: tabla limpia, CSV deshabilitado y referencia conservada. Recupera 14700 N.
3. Elige Cohete, captura y vuelve a Avión: referencias independientes. Cambia material a UD: esfuerzo con criterio incompatible, diferencia —. Cambia carga a térmica: desplazamientos de casos diferentes no se comparan.
4. Crea un borrador alar inválido (piel 0,02 m) y activa Cohete con referencia previa: conserva comparación activa y bloquea captura/CSV del documento completo. Corrige la piel a 0,002 m.
5. En Envolvente, captura metal y elige UD: solo masa comparable, esfuerzos/desplazamiento ausentes. No son ceros.
6. Descarga y abre CSV: debe tener tres métricas, unidades, números sin formato local y ambos JSON completos. Captura y exportación no escriben localStorage. Un cambio visual de amplificación no modifica la comparación física.
7. Usa Enter sobre el summary, navega por teclado y prueba 320–1440 px. La tabla se desplaza localmente; no genera desbordamiento global. Recarga: referencias temporales eliminadas.

## Completado y pendientes

Implementación, integración, pruebas y revisión visual documentadas en TESTING.md. Preservados los cuatro laboratorios, sus modelos, guardados, referencias anteriores, gráficos, visores y transferencia de masa. Pendientes: persistencia opcional de conjuntos comparativos con un contrato propio, campos superpuestos con coordenadas compatibles y estudios de convergencia; no se anuncian como disponibles. También quedan pendientes Firefox/Safari, dispositivos reales, auditoría de accesibilidad y rendimiento medido.
