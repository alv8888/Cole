# AEROLAB · registro de fases y entregas

Entrega 1: MVP circular. Entrega 2 (0.2): extensión elíptica. Entrega 3 (0.3): experimentos y archivos portables. Entrega 4 (0.4): barridos y análisis de sensibilidad. Se mantiene el alcance en Space Lab.

## Fase 1 · concepto y alcance — completada

Objetivo: estudiar relaciones físicas identificables entre μ, r, velocidad y periodo. Usuarios: estudiantes y docentes. Funciones: dos configuraciones circulares, presets explícitos, parámetros propios, comparación, representación SVG y guardado local.

Riesgos identificados: confundir el resultado ideal con órbita real; confundir altitud con radio orbital; unidades inconsistentes; guardar valores inválidos; confundir tiempo acelerado con tiempo real. Tratamiento: unidades visibles, capa SI aislada, avisos, validación y etiquetas temporales. Límite importante: no hay viabilidad ni propagación de misiones.

## Fase 2 · arquitectura e identidad — completada

Diseño técnico oscuro con verde para A y violeta para B; las letras acompañan a los colores. HTML semántico, foco visible, SVG con nombres accesibles, etiquetas de entrada y mensajes de estado. Módulos científicos independientes de la interfaz. No se necesitan 3D, servidor de aplicación ni bibliotecas numéricas para una solución circular analítica.

Problemas identificados: comparaciones de cuerpos distintos requieren considerar μ además de h; escalas extremas pueden hacer ilegible una órbita. Tratamiento: explicación contextual y escala compartida con alerta de detalle pequeño.

## Fase 3 · primera versión funcional — completada

- Inicio y selector con solo Space Lab activo.
- Dos configuraciones editables; Tierra, Luna, Marte y parámetros personalizados.
- Cálculo SI, velocidad, periodo, energía específica y aceleración.
- Órbitas SVG con posición analítica, reproducción, pausa, velocidad temporal y tiempo a cero.
- Tabla, porcentajes y dos gráficas comparativas.
- Guardado/carga locales, reset que conserva el guardado y gestión de almacenamiento bloqueado o dañado.
- Ecuaciones, supuestos, fuentes, límites y documentación.

Problemas tratados antes de cerrar la fase: resultados anteriores ocultos al invalidar entradas; cuerpos personalizados tras editar referencias; una pestaña oculta pausa la animación. No hay controles que anuncien otros módulos implementados.

## Fase 4 · validación — ver registro TESTING.md

Pruebas científicas, persistencia y navegador; comprobaciones de anchura en móvil y escritorio. No se ha realizado una auditoría completa con lectores de pantalla, navegadores alternativos ni dispositivos físicos. Esas limitaciones no se presentan como pruebas completadas.

## Fase 5 · ampliaciones — órbitas elípticas completadas

Objetivo de la entrega 2: añadir excentricidad entre 0 y 0,9, periapsis, apoapsis, semieje mayor, velocidades extremas y estado orbital dependiente del tiempo. Arquitectura: módulo puro elliptic.js sobre la base circular, con solucionador Kepler por bisección y pruebas independientes. No se requieren bibliotecas.

Completado: modelo, representación con foco correcto, comparación, estado instantáneo, guardado v2 con migración de v1 y regresiones. Pasaron 23 pruebas unitarias y 11 checks de navegador. Se documentan algoritmo, dimensiones y error numérico en MODEL.md.

Problemas identificados y tratados antes de avanzar: una elipse no tiene velocidad angular uniforme; se resuelve Kepler. La altitud ahora se define en periapsis para evitar ambigüedad. Las advertencias de perturbaciones consideran el apoapsis. Los guardados anteriores se migran sin sobrescribirlos automáticamente.

Entrega 3 completada: cuatro escenarios con objetivos explícitos; control de tiempo con referencia A/B y accesos de apsis; curvas de distancia y rapidez en una vuelta; actividad de predicción verificada contra cálculos; JSON portable con importación validada y CSV con unidades. Arquitectura: configuration.js para intercambio y persistencia, exploration.js para muestreo y evaluación, scenarios.js para datos educativos y files.js para descargas locales. La física existente conserva las regresiones.

Problemas tratados: distinguir porcentaje de tiempo y ángulo; explicar que cada curva usa su propio periodo; conservar el estado ante importaciones inválidas; borrar respuestas obsoletas al cambiar parámetros; indicar que interpolar curvas no mejora la precisión del modelo. No se añaden dependencias ni datos de misiones inventados. Validación: 30 pruebas unitarias y 17 checks de Chromium.

Pendiente: accesibilidad completa, otros navegadores, incertidumbre de parámetros y eventual modelo de perturbaciones con referencias nuevas. Aircraft, Rocket y Structure Lab permanecen fuera de esta entrega.

Entrega 4 completada: barridos de hₚ/e con base A o B; selección de periodo o velocidades extremas; gráfica, tabla y CSV; aplicación de una muestra a la base elegida. Arquitectura: sensitivity.js puro y sensitivity-ui.js independiente de los eventos del laboratorio. Validación: 34 pruebas unitarias y 20 comprobaciones Chromium.

Antes de cerrar esta ampliación se trataron intervalos fuera de límites, resultados obsoletos tras cambios, conservación de variables fijas, modificación exclusiva de la base y diferencia entre explorar configuraciones y simular una maniobra. La interpolación gráfica y la precisión física permanecen limitadas por el modelo original. No se incorporaron librerías ni servicios nuevos.

## Fase 6 · publicación y mantenimiento — preparación inicial, publicación pendiente

Aplicación estática, sin claves ni dependencias en runtime. README documenta ejecución y publicación. Falta elegir y probar hosting HTTPS, revisar políticas de seguridad, comprobar navegadores objetivos y realizar revisión de accesibilidad. No hay despliegue efectuado. Las configuraciones se pueden transportar manualmente mediante JSON; no hay sincronización remota ni cuentas.
