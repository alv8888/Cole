# Entrega 13 · Correcciones de auditoría (0.13)

## Objetivo de la fase

Cerrar los cinco defectos confirmados en la auditoría 0.12 antes de ampliar la interfaz. Se trabaja sobre la aplicación existente, conservando sus cuatro módulos, controles, modelos, guardados y navegación. No se incorporan dependencias.

## Funciones implementadas

1. Rocket multietapa acepta únicamente cuerpos propios del catálogo (Tierra/Luna), rechaza nombres heredados como `constructor` y comprueba que cada estado registrado sea finito. Los enlaces inválidos se rechazan antes de aplicar cualquiera de sus partes.
2. Las propuestas de masa v2 contienen identificador, destino y configuración completa de origen. El receptor muestra qué caso se revisará: origen o entradas abiertas. Solo un clic explícito aplica la propuesta; no guarda configuraciones automáticamente. Propuestas v1 siguen funcionando con el caso abierto. Se comprueba la vigencia antes de consumirlas y se coordinan receptores mediante Web Locks cuando está disponible.
3. Structure calcula únicamente la geometría activa. Los borradores inactivos inválidos permanecen editables; impiden guardar/exportar JSON/compartir el documento completo, pero no calcular ni exportar CSV del objeto válido. El mensaje identifica el borrador pendiente.
4. El tubo deformado incorpora el efecto transversal de Poisson, tanto en presión/compresión como en expansión térmica restringida. La visualización utiliza el campo calculado y no cambia las métricas al amplificarse.
5. En la calculadora Rocket, consumo del 100 % representa el instante posterior al corte: empuje actual cero, pluma apagada y aceleración −g. El empuje configurado durante combustión y el Δv acumulado se conservan y se muestran por separado.

## Archivos y arquitectura

- `src/rocket/model.js`: catálogo, validación y estados finitos del vuelo.
- `src/engineering/models.js`, `profiles.js`: estado poscorte y resultados/unidades.
- `src/integration/bridge.js`: protocolo revisable de masa y compatibilidad v1.
- `src/structure/design/data.js`, `model.js`, `ui.js`: documento completo frente a análisis activo.
- `src/structure/design/deformation.js`: adaptación del campo físico al visor, sin DOM ni WebGL.
- `src/structure/design/viewer.js`: consume el adaptador probado.
- `styles.css`: controles del receptor de masa.
- `tests/audit-regressions.test.js`, `audit-regressions-browser.mjs`: nuevas regresiones.
- `tests/structure-design-browser.mjs`: elección explícita del caso abierto y espera de aplicación asíncrona.
- Cuatro HTML, `package.json`, README y documentos: identificación y registro de entrega.

Los modelos matemáticos siguen independientes de la interfaz. Las ecuaciones orbitales y los modelos previos de Aircraft no cambian.

## Ecuaciones y casos verificables

La deformación circunferencial lineal del cilindro es εθ = αθ ΔT + σθ/Eθ − ν12 σz/Ez, con tensión en Pa y módulos en Pa; ε es adimensional. El término térmico se aplica al caso térmico. Se supone reciprocidad ortotrópica ν21/Eθ = ν12/Ez, sin restricción circunferencial. Para aluminio con ΔT=40 K y extremos axiales fijos: σz=−67,6848 MPa y εθ=0,00125552. Con extremo libre εθ=0,000944. Se comprueban ambas expresiones independientes del visor, presión, compresión y carbono UD.

La aceleración instantánea de la calculadora ideal es a=Tactual/m−g. Antes del corte Tactual=Tconfigurado; al agotarse el propelente Tactual=0. La integral de Tsiolkovski sigue siendo Δv=ve ln(m0/mf). No se introduce un modelo adicional de encendido, apagado transitorio ni caudal variable.

## Ejecución exacta

Desde la raíz del repositorio:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

En tu equipo abre `http://localhost:8000` y selecciona el módulo; no uses `file://`. No se requiere `npm install` para la aplicación.

```bash
npm test
```

En este entorno el aislamiento de procesos del runner solo mostraba nombres de archivos. Para ejecutar las 94 pruebas individuales se utilizó Node 24:

```bash
node --test --test-isolation=none tests/*.test.js
```

Pruebas de navegador con Playwright instalado fuera del proyecto y Chromium en `/usr/bin/chromium`:

```bash
AEROLAB_URL=http://127.0.0.1:8000 PLAYWRIGHT_MODULE=/ruta/node_modules/playwright/index.mjs node tests/audit-regressions-browser.mjs
```

Las nueve suites anteriores se ejecutan de la misma manera, sustituyendo el nombre del archivo; véase TESTING.md. El puerto de esta verificación fue 8013 por un servidor previo que ocupaba 8001 sin responder.

## Pruebas manuales

1. Aircraft: masa 2500 kg y área 24 m². Importa en Structure, exporta masa y abre destino. Revisa origen: debe indicar 2500 kg antes de la suma; al aplicar conserva área 24. El guardado anterior permanece intacto. Repite eligiendo caso abierto para conservar sus entradas.
2. Structure: espesor alar 0,02 m, cambia a cohete. Debe calcular el cohete, avisar del borrador pendiente e impedir guardar/JSON; vuelve al avión, corrige a 0,002 m y comprueba recuperación.
3. Rocket calculadora: mueve consumo desde 99 % hasta 100 %. El empuje actual pasa a cero, se apaga la pluma y la aceleración pasa a −g; Δv alcanza el total.
4. Structure: cilindro, aluminio, térmica, ΔT 40 K, ambos extremos fijos. Activa deformación; el crecimiento radial incluye Poisson. Cambiar amplificación solo modifica el dibujo.
5. Abre dos receptores de una propuesta y aplica uno: el otro debe rechazar la propuesta consumida. Una propuesta reemplazada no debe borrar la nueva.
6. Revisa pestañas, cámara, gráficos, entradas inválidas, guardados y anchura de 360 px en los cuatro módulos.

## Validación y límites

94 pruebas individuales Node aprobadas; 86 grupos Chromium aprobados (83 anteriores y 3 nuevos). Se verifican propiedades heredadas, estados finitos, ramas activas/inactivas, referencia termoelástica, corte, compatibilidad v1, origen completo, consumo obsoleto, URLs atómicas, almacenamiento y regresiones de los cuatro módulos. No son ensayos físicos ni certificación.

El FEM sigue siendo 1D; membranas y malla superficial no son un FEM volumétrico. Las superficies inactivas siguen formando parte del documento guardado. Las propuestas de masa representan superficies idealizadas; el usuario debe evitar doble contabilización. Web Locks coordina pestañas donde esté disponible; no se promete transacción distribuida ni atomicidad entre navegadores/orígenes. LocalStorage puede fallar por política o cuota. No se han probado otros navegadores ni validado hardware móvil real. GitHub almacena código; esta entrega no configura ni verifica un hosting público.

## Completado y pendiente

Completado: cinco correcciones, regresiones numéricas y de navegador, documentación y compatibilidad de la aplicación existente.

Pendiente: siguiente fase de diseño visual y renderizado según auditoría; revisión de accesibilidad completa, otros navegadores y hardware, rendimiento medido, despliegue HTTPS y validación experimental. No se añadió FEM 3D ni CFD ni nuevas bibliotecas durante esta fase.
