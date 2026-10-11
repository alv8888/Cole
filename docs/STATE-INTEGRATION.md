# Entrega 19 · Estados coherentes en Space y Structure (0.19)

## Objetivo y diagnóstico

Inspección inicial: base `b346a23da162186865954ab39f5db22aef546fd2`, Git limpio. La entrega anterior solo conectaba los indicadores explícitos a Aircraft y Rocket. Space calcula A/B independientemente: el resultado válido sobrevive a la otra configuración inválida, pero reproducción/comparación/guardado conjunto se deshabilitan. Structure valida por separado el objeto activo, el documento completo con otros borradores y las opciones de visualización. La esfera con carbono UD solo calcula masa/geometría, por no tener orientación definida para resolver esfuerzos.

La fase extiende el componente existente, sin reescribir laboratorios ni incorporar bibliotecas o ecuaciones. Los resultados siguen siendo educativos, con la validación matemática anterior, sin certificación.

## Funciones

- Indicador separado para A/B de Space. Explica qué resultado sigue vigente y qué operaciones conjuntas no están disponibles. Indicadores fuera del grupo plegable: Revisar campos puede abrirlo y enfocar el primer campo inválido. El selector de cuerpo también refleja errores de su validación existente.
- Structure muestra el mismo estado físico/documental en Geometría y Simulación de Cargas. Cambiar pestaña o revisar entradas no ejecuta un nuevo análisis por sí mismo.
- Cálculo vigente con documento pendiente: conserva la solución del objeto activo y el CSV de su campo; sigue bloqueando guardado/JSON completo cuando otro borrador es inválido. Indica el objeto pendiente cuando sus controles están marcados.
- Revisar un borrador inactivo enfoca el selector de objetos, sin seleccionar otro ni cambiar valores automáticamente. Elegir el objeto es una acción explícita del usuario. Para errores visibles de cargas/vista, selecciona la pestaña real del control y lo enfoca; abre los details ancestros.
- Vista pendiente: opciones como amplificación vacía bloquean el visor/guardado como antes, pero la solución física se conserva y se informa de ello. Recuperar la opción no repite FEM ni cambia la revisión física.
- Solo geometría y masa: etiqueta explícita para esfera/UD. No presenta resultados resistentes ausentes como cálculo completo.
- Banco analítico anterior: indicador independiente de su diseñador 3D. Sus controles, referencias y guardados no se mezclan.

El estado «vigente» indica correspondencia con las entradas actuales, no validez experimental, ausencia de advertencias o seguridad del diseño. Las advertencias científicas originales siguen disponibles. No se añaden estados o resultados simulados.

## Archivos nuevos/modificados

- `src/navigation/calculation-state.js`: opciones de montaje, etiqueta accesible y resolución del control; selecciona su pestaña real. Estados revisión pendiente/solo geometría y masa. Aircraft y Rocket mantienen sus estados anteriores.
- `src/app.js`: conecta estados A/B y errores del selector central.
- `src/structure/design/ui.js`: conexión explícita con resultado activo, documento y visualización; revisión sin activación automática de borradores.
- `src/structure/ui.js`: indicador del banco analítico independiente.
- `workbench.css`: borde de advertencia acompañado de texto e inspector de Space en una columna, con etiquetas/unidades legibles en móvil.
- `tests/calculation-state-browser.mjs`: casos nuevos de independencia, borradores, cargas, vista y análisis no disponible.
- `docs/STATE-INTEGRATION.md` nuevo. README, ROADMAP, TESTING, package y etiquetas HTML registran la entrega. Los otros HTML solo cambian su etiqueta de versión.

## Ejecutar

```sh
cd /workspace/Cole
python3 -m http.server 8000 --bind 0.0.0.0
```

Abre `http://localhost:8000`; en nube usa el acceso al puerto del proveedor. `npm start` es equivalente, sin instalar dependencias para usar la web. Ctrl+C detiene el servidor. No abrir con file://.

## Pruebas manuales

1. En Space, vacía altitud B y pliega su grupo. A sigue vigente y sus resultados permanecen; B no muestra resultados anteriores y el control de reproducción queda deshabilitado. Revisar campos sigue visible; Enter abre B y enfoca la altitud. Recupera 800 km. Prueba después A inválida y ambas inválidas.
2. En Structure/Avión, cambia espesor de piel alar a 0,02 m: aparece el error del modelo delgado. Selecciona Cohete: su cálculo sigue vigente con documento pendiente. Revisar entradas enfoca Objeto y conserva Cohete. Selecciona Avión: conserva 0,02; corrige a 0,002 y recupera guardado completo.
3. En Simulación de Cargas, vacía amplificación visual. Se indica vista pendiente; tablas físicas se conservan. En Geometría, Revisar entradas te lleva a Cargas y enfoca Amplificación. Recupera 20: no cambia los resultados físicos.
4. Vacía fuerza en Cargas: el objeto activo pierde resultados. Revisar desde Geometría lleva a esa pestaña y enfoca fuerza. Recupera 14700 N.
5. Elige envolvente esférica + carbono UD: solo geometría y masa, sin esfuerzo/deformación. El banco analítico antiguo sigue independiente; su entrada longitud inválida no afecta al diseñador.
6. Revisa 320/390/768/1440 px y zoom 200 %, navegación por teclado, enlaces y guardados. Los indicadores deben ser legibles sin desbordamiento global.

## Completado y pendiente

Completados la integración, el acceso a los controles afectados y las pruebas registradas en TESTING.md. Conservados todos los modelos, rutas, visores, guardados, campos y propuestas de transferencia de masa. No hay nuevas dependencias ni backend. Pendientes: validación con usuarios, lectores de pantalla reales, Firefox/Safari, dispositivos físicos y medición de rendimiento. Esta fase no agrega FEM 3D, CFD, validación experimental ni certificación.
