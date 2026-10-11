# Entrega 17 · Comparación y exportación de experimentos (0.17)

## Objetivo y diagnóstico

Los experimentos de la entrega 16 ya modificaban una variable, calculaban 21 casos y podían continuar el caso en los laboratorios. Faltaba comparar de forma explícita con un estado de referencia y exportar los datos desde el catálogo. Se inspeccionó la base `6bb228d6f6264933e4bd4c2cc9e072b9b9d5b2d7`: Git limpio, sin cambios pendientes ni archivos nuevos. Esta ampliación se limita a la exploración; conserva modelos, rutas, guardados y visores.

## Funciones

La sección **Comparar con una referencia y exportar datos** es plegable y está cerrada inicialmente. Para cada magnitud muestra referencia, actual, diferencia absoluta en sus unidades y cambio porcentual. Las métricas se calculan con los modelos existentes; no son resultados de ensayos.

- Referencia inicial: el parámetro predeterminado de cada experimento.
- **Usar actual como referencia:** captura el resultado y su configuración completa; no guarda datos en localStorage.
- **Referencia inicial:** recupera la referencia predeterminada sin cambiar el caso actual.
- **Restablecer ejemplo:** recupera el caso actual predeterminado y conserva una referencia personalizada. Son acciones distintas.
- Cada laboratorio tiene una referencia independiente. Se conserva al cerrar, cambiar de filtro o elegir otro ejemplo hasta recargar/cerrar la página. No se transfiere como referencia de los módulos completos.
- **Descargar datos CSV:** genera comparación y barrido del caso vigente. Queda deshabilitado durante el cálculo o ante entradas inválidas. No exporta resultados anteriores engañosos.
- Comparación inválida limpia la tabla y oculta el panel. Los resultados atrasados siguen siendo descartados por la revisión de la operación.

Para una referencia R y un resultado C:

```
Δ = C − R
Cambio (%) = 100 × (C − R) / |R|, cuando R ≠ 0
```

La diferencia tiene las unidades de la magnitud; el porcentaje es adimensional. Si R=0, el porcentaje está indefinido: aparece «— (referencia cero)» y queda vacío en CSV. El denominador absoluto mantiene el sentido de la diferencia para referencias negativas; las métricas actuales de estos experimentos son positivas. No se comparan etiquetas/unidades incompatibles o valores no finitos. La pantalla redondea a dos decimales, sin implicar precisión física de dos decimales; el CSV conserva los valores numéricos calculados.

Un aumento o disminución no demuestra una mejora del diseño, vuelo estable o seguridad estructural. Los modelos, coeficientes y propiedades orientativos mantienen los límites descritos en EXPERIMENTS.md y las especificaciones científicas. Las curvas no muestran incertidumbre ni validación experimental.

## Formato CSV

Archivo UTF-8 `aerolab-<lab>-experimento.csv`, coma como separador, campos entre comillas, comillas interiores duplicadas y finales CRLF. Valores numéricos con punto decimal, sin formato de miles. Una sola cabecera rectangular:

```text
lab,kind,parameter,parameter_unit,reference_input,current_input,metric,metric_unit,reference_value,current_value,delta,change_percent,model_note,reference_config_json,current_config_json
```

`kind=comparison` contiene una fila por métrica, parámetros de referencia/actual y las dos configuraciones JSON completas. Los JSON usan los mismos campos/unidades que los enlaces de laboratorio; no se convierten indiscriminadamente a SI. Consulta las definiciones del laboratorio y esta versión del código para propiedades de materiales y parámetros fijos.

`kind=sweep` contiene los 21 casos independientes del barrido: `current_input` es la entrada de esa muestra y `current_value` su resultado. Los campos de comparación/configuración quedan vacíos. Las condiciones restantes son las mismas del experimento, descritas en las filas de comparación y EXPERIMENTS.md. No son estados temporales ni medidas experimentales. Las hipótesis del caso vigente se incluyen en `model_note`.

## Archivos

Nuevos: `src/home/comparison.js` (comparación/CSV sin DOM), `tests/home-comparison.test.js`, `tests/home-comparison-browser.mjs`, este documento. Modificados: `src/home/ui.js` (referencias en memoria, renderizado y exportación), `index.html`, `home.css`, `tools/test-browser.mjs`. README, ROADMAP, TESTING, package y etiquetas HTML registran 0.17. En las otras tres páginas HTML solo se actualiza la versión.

No se modifican los modelos físicos, la navegación compartida, la transferencia de masa ni los formatos de guardado. Se reutiliza `downloadFile`; no se añade una dependencia ni un servicio externo.

## Ejecutar y probar

```sh
cd /workspace/Cole
python3 -m http.server 8000 --bind 0.0.0.0
```

En tu equipo abre `http://localhost:8000`; en un entorno remoto usa su acceso al puerto. `npm start` es equivalente. No se requiere npm install para la aplicación. No abras módulos con `file://`. Detén el servidor con Ctrl+C.

1. Abre el ejemplo Aircraft y despliega la comparación. Cambia 50 a 60 m/s: sustentación 14700 → 21168 N, diferencia +6468 N, +44 %. El peso no cambia.
2. Captura 60 como referencia y cambia a 70: incremento de sustentación +36,11 %. Restablece el ejemplo: el actual vuelve a 50 y la referencia permanece en 60. Recupera referencia inicial: vuelve a 50 sin cambiar el actual.
3. Captura una referencia, abre Rocket y vuelve a Aircraft: cada referencia debe permanecer aislada. Recarga: vuelven las referencias iniciales. Los guardados de los laboratorios no cambian.
4. Descarga CSV. Debe incluir las métricas comparadas, 21 filas sweep, unidades, notas y los dos JSON de configuración. Verifica que coincida con el valor actual y la referencia capturada.
5. Vacía el parámetro o sal del rango: tabla limpia, comparación oculta y descarga deshabilitada. Recupera un valor válido: vuelve el cálculo con la referencia anterior.
6. Enfoca el resumen y usa Enter para abrir/cerrar. Prueba 320–1440 px y zoom 200 %. La tabla se desplaza dentro de su contenedor en móvil, sin desbordamiento global.

## Estado y pendientes

Implementación y pruebas de esta fase completadas; resultados ejecutados en TESTING.md. Se conservan los controles y las funciones anteriores. Pendientes: contraste/lectores de pantalla evaluados en una auditoría completa, Firefox/Safari, hardware real, validación con usuarios y rendimiento medido. Las referencias de catálogo son temporales; guardar/comparar configuraciones completas sigue correspondiendo a cada laboratorio.
