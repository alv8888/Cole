# AEROLAB · registro de fases y entregas

Entrega 1: MVP circular. Entrega 2 (0.2): extensión elíptica. Entrega 3 (0.3): experimentos y archivos portables. Entrega 4 (0.4): barridos y análisis de sensibilidad. Entrega 5 (0.5): primera versión Aircraft Lab, seguida de Rocket Lab, con geometría 3D ilustrativa. Las entregas anteriores describen el alcance de su momento.

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

Pendiente: accesibilidad completa, otros navegadores, incertidumbre de parámetros y eventual modelo de perturbaciones con referencias nuevas. Aircraft, Rocket y Structure Lab permanecían fuera de la entrega 3.

Entrega 4 completada: barridos de hₚ/e con base A o B; selección de periodo o velocidades extremas; gráfica, tabla y CSV; aplicación de una muestra a la base elegida. Arquitectura: sensitivity.js puro y sensitivity-ui.js independiente de los eventos del laboratorio. Validación: 34 pruebas unitarias y 20 comprobaciones Chromium.

Antes de cerrar esta ampliación se trataron intervalos fuera de límites, resultados obsoletos tras cambios, conservación de variables fijas, modificación exclusiva de la base y diferencia entre explorar configuraciones y simular una maniobra. La interpolación gráfica y la precisión física permanecen limitadas por el modelo original. No se incorporaron librerías ni servicios nuevos.

## Entrega 5 · Aircraft y Rocket — fases 1 a 4 completadas para modelos iniciales

Objetivo: incorporar aerodinámica, viento uniforme, estructura alar ideal y energía a Aircraft; después, conservación de masa y Tsiolkovski a Rocket. Usuarios: estudiantes y docentes; propósito educativo, sin diseño de motores ni aplicaciones armamentísticas.

Antes de implementar se identificaron riesgos: confundir geometría con CFD; introducir coeficientes sin datos; considerar una viga segura sin resistencia del material; llamar sustentable a un simple factor de carbono; convertir Δv en trayectoria real. Se resolvieron con modelos identificables, unidades SI, coeficientes hipotéticos declarados, avisos de rango y límites explícitos en ENGINEERING.md y la interfaz.

Arquitectura: páginas independientes con modelos puros comunes, perfiles declarados, interfaz, persistencia por módulo y renderizador de vértices 3D en Canvas 2D. No se añade Three.js: una proyección ortográfica con cámara giratoria basta para esta geometría y evita dependencias innecesarias. No hay integrador numérico; las gráficas muestrean expresiones analíticas.

Completado: controles con validación, resultados, comparación con referencia, gráficas, reset, JSON exportable, guardados separados, viento relativo, viga en voladizo, métricas energéticas y balance de propelente. Validación: 40 pruebas unitarias en total y 30 grupos de comprobaciones Chromium, conservando Space Lab. Casos independientes de fuerzas, flexión y Δv se calcularon con Python. Se comprobó anchura de 320 a 1440 px y se inspeccionaron capturas.

Problemas importantes antes de ampliar: la fidelidad física no está contrastada con ensayos; CL no depende de ángulo/Reynolds; viento uniforme sin ráfagas; CG sin estabilidad; viga sin torsión ni límite resistente; emisiones sin ciclo de vida; cohete sin trayectoria, arrastre o gravedad variable. Los resultados no certifican diseño, seguridad o sustentabilidad. No hay datos externos actualizados automáticamente.

Pendiente de fases siguientes: datos trazables y modelos aerodinámicos identificados; cargas y estructuras más completas; trayectoria educativa de cohete con algoritmo y validación propios; módulo Structure independiente; evaluación ambiental con fuentes y alcance; importación JSON Aircraft/Rocket; auditoría de accesibilidad y otros navegadores. Cada ampliación necesita sus propios casos de prueba antes de anunciarse funcional.

## Fase 6 · publicación y mantenimiento — preparación inicial, publicación pendiente

Aplicación estática sin claves; desde la entrega 8 hay dependencia Three.js local para WebGL. README documenta ejecución y publicación. Falta elegir y probar hosting HTTPS, revisar políticas de seguridad, comprobar navegadores objetivos y realizar revisión de accesibilidad. No hay despliegue efectuado. Las configuraciones se pueden transportar manualmente mediante JSON; no hay sincronización remota ni cuentas.

## Entrega 6 · lanzamiento multietapa (0.6)

Fases 1/2: alcance radial en vacío, estudiantes/docentes, riesgo de confundir Δv con velocidad, escape con altura y geometría con física. Modelo definido antes de implementar: Tsiolkovski por etapas; gravedad central variable; consumo y descarte; soporte de plataforma; RK4 y eventos. Arquitectura independiente en src/rocket, sin dependencias nuevas. Los modelos previos se conservan.

Fase 3: editor 1–4 etapas, carga útil, cuerpo central, presupuesto, trayectoria, gráficas en reproducción, pausa y exploración temporal, eventos, guardado exclusivo y CSV. Fase 4: casos independientes Python, invariantes, reducción de paso, despegue tardío, caída, escape y entradas inválidas; controles y diseño responsive comprobados en Chromium. Problemas tratados: evento de separación sin salto de velocidad; no declarar escape con motores activos; no inventar impacto fuera del horizonte; control temporal capaz de alcanzar el instante final fraccionario.

Problemas actuales antes de ampliar: vacío sin arrastre; solo radial; paso fijo sin cota adaptativa de error; banda marginal sin validación exhaustiva; ninguna telemetría ni precisión física certificada. Pendiente de fase 5: arrastre con datos identificables y método adaptativo validado, sin mezclar con una trayectoria orbital. Fase 6: código publicado en GitHub; hosting y auditoría de accesibilidad pendientes. ROCKET-FLIGHT.md define casos y límites.

## Entrega 7 · Aircraft lateral y cuatro fuerzas (0.7)

Fases 1/2: objetivo S/W/CL/CD/T editables y balance físico identificable. Riesgos: confundir masa y peso, sumar resistencia inducida dos veces, derivar CL de una silueta arbitraria, llamar equilibrio de vuelo a magnitudes parecidas o afirmar CFD por una animación. Modelo definido antes de implementar: W=mg, dos modos CD, proyecciones L/D con viento vertical, T horizontal y fuerzas netas sobre masa. Con viento lateral se informa balance 2D no resuelto. Arquitectura: fuerzas puras, SVG ilustrativo y migración versionada en src/aircraft, conservando modelos previos.

Fase 3 completada: peso/masa vinculados, empuje editable, polar/CD directo, perfil lateral, cuatro flechas/barras a escala común, residuos y aceleraciones, animación opcional separada, persistencia v2 y migración v1 sin sobrescritura automática. Fase 4: 54 pruebas unitarias y 44 grupos de comprobaciones Chromium; referencia independiente Python, equilibrio preparado, casos cero/invalidación y proyecciones. Se comprobó escritura gradual del peso, carga/exportación v2, animación que no altera resultados, anchuras 320–1440 px y capturas móvil/escritorio.

Problemas tratados antes de cerrar: vincular un único parámetro de masa/peso; CD directo sin sumar inducida; fuerzas con componentes en viento vertical; guardados incompletos conservan interfaz; resultados inválidos limpian flechas/barras; panel visual deja de ser fijo para que su mayor altura se pueda recorrer. La banda del 0,5 % es pedagógica y los datos de perfiles siguen hipotéticos.

Pendiente para fase 5: coeficientes trazables, ángulo de ataque, momentos y estabilidad, movimiento integrado con validación y modelo lateral 3D. Fase 6: código publicado en GitHub; sitio y auditoría completa de accesibilidad todavía pendientes. Las limitaciones se describen en AIRCRAFT-FORCES.md.

## Entrega 8 · Three.js y vistas planetarias (0.8)

Fases 1/2: alcance de visualización con textura y cámara, conservando los modelos existentes. Riesgos identificados: falsear trayectoria radial como curva orbital, texturizar cuerpos distintos como Tierra, mezclar unidades y dejar cálculos bloqueados por WebGL. Se eligió dependencia Three.js r180 local con licencia/procedencia, conversión pura SI/radio y carga diferida con fallback. Sin CDN ni API nueva.

Fase 3 completada: esfera texturizada, líneas de órbita/lanzamiento, marcador sincronizado, configuración A/B, arrastre/zoom y botones de cámara, radios relativos del cuerpo, limpieza de estados inválidos y avisos de contexto. La órbita sigue siendo plana en espacio 3D; el cohete sigue radial y no adquiere guiado u órbita por dibujarse en WebGL.

Fase 4: 57 pruebas unitarias y 51 grupos de navegador; conversiones y extremos, renderizado WebGL con SwiftShader, textura y recursos locales, imagen cambia al girar/acercar, estados sincronizados, diseño 320–1440 px, pérdida/ausencia de WebGL, fallo de textura y regresiones anteriores. Capturas inspeccionadas. Problemas importantes antes de ampliar: muestreo de dibujo, precisión Float32/escala extrema, textura estática sin geolocalización, carga de recursos y GPU no probada físicamente.

Fases 5/6 pendientes: trayectoria no radial validada, pruebas en otros navegadores y hardware, accesibilidad completa y hosting con compresión/caché. Código actualizado en GitHub; no se ha desplegado un sitio. THREE-VIEWS.md registra límites y pruebas no realizadas.

## Entrega 9 · Navegación y enlaces (0.9)

Fases 1–4 completadas: tres pestañas por laboratorio, teclado y anclas, pausa al ocultar simulaciones, URL versionada con parámetros/referencias/tiempo y recuperación conjunta validada antes de aplicar. No cambia la física ni agrega dependencias. 61 pruebas unitarias y 56 grupos Chromium pasaron. Problemas tratados: conservar nodos/listeners, evitar restauraciones parciales y gestionar el portapapeles bloqueado. Pendientes: otros navegadores, accesibilidad completa y hosting HTTPS. Véase NAVIGATION.md.

## Entrega 10 · Vehículos WebGL (0.10)

Fases 1–4 completadas: sustitución de proyección manual por Three.js, OrbitControls, zoom/pan y teclado; flechas desde CG con componentes válidos; porcentaje de empuje real en calculadora ideal y pluma ilustrativa controlada. Reutiliza dependencia local. 65 pruebas unitarias y 64 grupos Chromium; giro, imagen, rueda/pan, vectores, animación, persistencia/enlaces, móviles y fallo/restauración de WebGL. Problemas resueltos: sin direcciones inventadas con viento lateral, porcentaje diferente del consumo y compatibilidad de guardados. Pendiente hardware, otros navegadores, accesibilidad completa y hosting. Detalles: VEHICLE-VIEWS.md.

## Entrega 11 · Cuarto laboratorio (0.11)

Fases 1–4 completadas: Structure independiente, voladizo rectangular con fuerza puntual/uniforme, compresión tubular y filtro de Euler, cuatro materiales declarados/editables, deformación SVG con escala indicada, esfuerzo/coeficientes, referencias, persistencia, archivos y enlaces. Cuatro menús activos; ninguna dependencia nueva. 73 pruebas unitarias y 72 grupos Chromium. Antes de ampliar se resolvieron: carbono sin fluencia universal, falta de pandeo en análisis axial, no aplicabilidad de Euler, condiciones de borde, recortes del dibujo y estados inválidos. Pendiente: propiedades trazables, estructuras de pared delgada/laminados, cargas combinadas y validación experimental; también hosting y pruebas adicionales de accesibilidad/navegadores. STRUCTURE.md describe lo calculado y lo no validado.

## Entrega 12 · Diseñador estructural (0.12)

Fase 5: Structure Lab ampliado con geometría paramétrica, visor Three.js, FEM 1D y membranas analíticas, criterios UD y materiales declarados, masa por componentes, campos y exportaciones. Fase 4 de esta ampliación: referencias cerradas, convergencia, casos límite, entradas inválidas, pruebas de navegador, almacenamiento, URL compatible, transferencia de masa y regresiones de todos los laboratorios.

Problemas tratados: distinguir malla superficial de elementos calculados; carbono sin criterio isotrópico; geometrías ausentes en módulos fuente; masas parciales frente a masa total; cambio exclusivo del campo de masa y propuesta consumida una sola vez. No se modifica la física previa. Banco de pruebas y guardados anteriores conservados.

Pendiente de fase 6: hosting y comprobación allí; auditoría de accesibilidad y navegadores adicionales. FEM de cascarones/volúmenes, laminados, cargas combinadas y validación experimental requieren otro alcance. Modelos y entrega completa en STRUCTURE-DESIGN.md; ejecuciones en TESTING.md.

## Entrega 13 · Correcciones posteriores a auditoría (0.13)

Cinco defectos confirmados corregidos y comprobados: catálogo Rocket, continuidad del caso en transferencia de masa, validación del objeto activo, deformación radial termoelástica y corte de motor. 94 pruebas unitarias y 86 grupos Chromium aprobados. Se conservan módulos y compatibilidad de formatos anteriores, sin dependencias adicionales. CORRECTIONS.md describe entrega y límites. Próxima fase: diseño visual y renderizado según diagnóstico, conservando modelos comprobados.

## Entrega 14 · Cierre de interfaz y renderizado (0.14)

Completadas las fases de reorganización y presentación posteriores a la auditoría: banco de trabajo en los cuatro módulos, agrupación plegable, reproducción próxima al visor, servicios comunes de iluminación/cámara, campo independiente de iluminación, normales/bounds coherentes con deformación y opciones visuales sin repetir FEM. Gráfica estructural con escala firmada/cursor y legibilidad de los gráficos en móvil; reproducción bajo demanda, runner y tarea CI de navegador.

Validación: 101 pruebas unitarias y 96 grupos Chromium. Problemas resueltos antes de cerrar: preservar DOM/listeners/formatos, evitar que el sombreado altere el campo, encuadrar según orientación y bounds, no programar frames pausados y comprobar la amplitud deformada efectiva. WORKBENCH.md documenta entrega; DEPLOYMENT.md prepara hosting. Quedan fuera de este cierre: modelos físicos nuevos, FEM 3D/CFD, otros navegadores/hardware, auditoría WCAG completa y despliegue HTTPS realmente verificado.


## Entrega 15 · Inicio y exploración (0.15)

Diagnóstico presentado antes de editar: checkout limpio y cuatro módulos disponibles, portada débil y carga orbital 3D prematura. Se implementa hero orbital calculado con el modelo existente, catálogo por datos con filtros temáticos y ejemplos numéricos a demanda, regreso desde los laboratorios y carga orbital WebGL al acercarse al visor. La aplicación de la demo modifica A explícitamente, conservando B y guardados. No se reescriben páginas internas ni se agregan dependencias. HOME.md registra las fases, estructura, ejecución, pruebas manuales y pendientes de validación externa.
