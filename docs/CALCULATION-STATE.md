# Entrega 18 · Estado del cálculo (0.18)

## Objetivo y diagnóstico

Base inspeccionada: `13533d8142fa15ffc6d1edf3f457c2bede1d15dc`, sin cambios pendientes. Aircraft recalcula automáticamente; Rocket tiene una calculadora ideal independiente y un lanzamiento radial que exige cálculo explícito. Sus mensajes de cálculo se compartían con notificaciones de guardar/cargar. Se añade un panel compacto sobre cada formulario para distinguir ambos conceptos, conservando todos los controles y modelos.

## Funciones implementadas

- Aircraft y calculadora ideal: cálculo vigente o configuración inválida. Explican que no integran una trayectoria de vuelo/lanzamiento.
- Lanzamiento: trayectoria pendiente, cálculo vigente o configuración inválida. Cambiar entradas sigue eliminando trayectoria, gráficos y exportación temporal previos; guardar no convierte un diseño pendiente en una trayectoria calculada.
- Revisar campos abre el grupo plegado y enfoca el primer campo inválido habilitado. Si el error es entre parámetros y ninguno está marcado individualmente, enfoca el primer control para revisar el conjunto. No atribuye arbitrariamente un error físico a un campo.
- Estado anunciado con región polite solo cuando cambia su texto; reproducción no genera anuncios por cada frame. Mensajes de archivos y guardado siguen separados.

## Archivos

`src/navigation/calculation-state.js`: componente DOM común, estados explícitos y foco accesible.
`src/engineering/ui.js`: conexión con el cálculo existente y errores del modelo.
`src/rocket/ui.js`: conexión con invalidación, presupuesto y cálculo de trayectoria.
`workbench.css`: panel compacto con texto y borde; el color no es el único indicador.
`tests/calculation-state-browser.mjs`: regresiones de estados, errores, teclado y móvil.
`tools/test-browser.mjs`: incorpora la suite. README, ROADMAP, TESTING, package y etiquetas de las cuatro páginas registran la versión. No se modifican ecuaciones, formatos de guardado, datos compartidos ni rutas. Sin dependencias nuevas.

## Ejecutar

```sh
cd /workspace/Cole
python3 -m http.server 8000 --bind 0.0.0.0
```

Abre `http://localhost:8000` y entra en Aircraft o Rocket desde el catálogo. En nube usa el acceso al puerto del proveedor. Alternativa: `npm start`. No requiere npm install; no abras módulos con file://. Ctrl+C detiene el servidor.

## Pruebas manuales

1. En Aircraft, guarda: el estado sigue vigente aunque la notificación diga guardado. Vacía superficie alar: se retiran los cálculos y aparece Revisar campos. Pliega Configuración, enfoca el botón y pulsa Enter: abre el grupo y enfoca la superficie. Recupera 16 m².
2. Introduce viento longitudinal mayor que velocidad respecto al suelo, dentro de los rangos: debe aparecer la explicación del error físico. Restablece.
3. En Rocket, la calculadora ideal puede estar vigente mientras el lanzamiento está pendiente. Calcula el lanzamiento: pasa a vigente. Guarda: sigue vigente. Cambia carga útil: vuelve a pendiente; reproducción/CSV quedan deshabilitados.
4. Vacía propelente de la primera etapa y pliega su grupo: Revisar campos lo abre y enfoca el valor. Recupera un valor válido: pendiente hasta volver a calcular.
5. Comprueba textos y controles a 320, 390, 768 y 1440 px, por teclado y con movimiento reducido. Conserva la posibilidad de regresar al catálogo y acceder a análisis/teoría.

## Completado y límites

Implementación, integración y pruebas descritas en TESTING.md. Esta entrega se limita a Aircraft y Rocket; Space y Structure conservan sus indicadores anteriores. Pendientes: extender el patrón respetando la validez independiente de A/B y los borradores geométricos inactivos de Structure. No cambia la validación científica ni convierte estos modelos educativos en herramientas certificadas. No se ha verificado esta mejora en Firefox/Safari, hardware físico o lectores de pantalla reales; la prueba de teclado no constituye auditoría WCAG completa.
