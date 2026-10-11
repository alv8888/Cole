# AEROLAB · registro de fases y entregas

Entrega 1: MVP circular. Entrega 2 (0.2): extensión elíptica de dos cuerpos, sin añadir otros módulos.

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

Pendiente: accesibilidad completa, otros navegadores, incertidumbre de parámetros, exportación de configuraciones y eventual modelo de perturbaciones con referencias nuevas. Aircraft, Rocket y Structure Lab permanecen fuera de esta entrega.

## Fase 6 · publicación y mantenimiento — preparación inicial, publicación pendiente

Aplicación estática, sin claves ni dependencias en runtime. README documenta ejecución y publicación. Falta elegir y probar hosting HTTPS, revisar políticas de seguridad, comprobar navegadores objetivos y realizar revisión de accesibilidad. No hay despliegue efectuado. Las configuraciones locales no se comparten entre dispositivos ni orígenes; no se anuncia sincronización remota.
