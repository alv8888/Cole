# Entrega 16 · Experimentos del catálogo (0.16)

## Objetivo y diagnóstico

Convertir los ejemplos fijos de la entrega 15 en experimentos calculados y permitir continuar el mismo caso en el laboratorio. Al comenzar, Git estaba limpio, sin modificaciones ni archivos nuevos pendientes; base `4de9a4c69328811220f8eca69ac11da1c29a7db7`. Se mantuvo la portada, sus filtros, la demostración Kepler, las rutas y los modelos existentes. No se creó una segunda aplicación, backend ni dependencia.

## Alcance y modelos

Cada ejemplo acepta una variable continua dentro de un rango estrecho. Mantiene los demás parámetros iniciales fijos y muestra la entrada, los resultados con unidades y las hipótesis. La curva contiene 21 casos independientes distribuidos uniformemente en el intervalo. Es sensibilidad a un parámetro, no una trayectoria temporal. La línea que une los casos es visual; no introduce un integrador ni interpolación física validada.

| Laboratorio | Variable | Rango | Curva y condiciones fijas |
| --- | --- | --- | --- |
| Space | Altitud circular | 100–2000 km | Periodo (min); Tierra, e=0. T=2π√(r³/μ), velocidad √(μ/r). |
| Aircraft | Velocidad respecto al suelo | 30–90 m/s | Sustentación (N); viento cero, ρ=1,225 kg/m³, S=16 m², CL=0,6; L=½ρV²SCL. Masa 1200 kg y los otros campos iniciales conservados. |
| Rocket | Propelente | 100–600 kg | Δv ideal (m/s); masa seca 100 kg, empuje 6000 N y duración 40 s. ṁ=mprop/40; ve=6000/ṁ; Δv=ve ln[(100+mprop)/100]. |
| Structure | Espesor alar | 1–4 mm | Deflexión de punta (mm); semiala FEM Euler–Bernoulli 1D del editor, 16 elementos, envergadura 10 m, cuerdas 2/1,2 m, carga total 14700 N y aluminio orientativo. Se convierte el espesor a metros antes de calcular. |

Las advertencias de Aircraft se obtienen del perfil existente; una fuerza distinta del peso no demuestra vuelo nivelado. El experimento Rocket **no mantiene un motor fijo**: aumentar propelente con empuje y duración fijos cambia ṁ y ve. No se representa el Δv como altitud o velocidad real de lanzamiento. El ejemplo estructural calcula la masa de las superficies modeladas, incluyendo el fuselaje predeterminado de 8 × 1,2 m y pared 2 mm, sin equipos. No usa FEM 3D ni certifica seguridad. La malla gráfica no sustituye el solucionador.

## Interacciones e integración

- Entrada numérica con límites/unidades, cálculo al editar y botón para restablecer el ejemplo.
- Esfuerzos, masa, fuerzas y resultados se obtienen de los modelos ya probados. Los módulos matemáticos no se reescriben.
- Gráfica SVG reutilizada con ejes/unidades y cursor por puntero/teclado: flechas, Inicio y Fin. Sus muestras se llaman **Caso**, mientras Structure mantiene **Nodo** para su gráfica FEM anterior. La curva se almacena en memoria por laboratorio porque sus condiciones fijas no cambian; no se repiten 21 soluciones al editar un solo valor.
- Entrada vacía/no finita/fuera de rango limpia métricas, curva y continuación. Un resultado atrasado no puede reemplazar un caso nuevo. El cierre y los filtros invalidan operaciones pendientes.
- **Space:** continuar aplica explícitamente el ejemplo a A, conserva B y guardados y reinicia el tiempo. No recarga la página.
- **Aircraft:** un enlace versionado carga el caso exacto, sin referencia comparativa y con cámara inicial.
- **Rocket:** el enlace carga la calculadora ideal de una etapa. El panel de lanzamiento recibe su configuración inicial, sin trayectoria calculada ni reproducción. No se finge que ese lanzamiento corresponde al ejemplo ideal.
- **Structure:** el enlace carga el editor con el espesor elegido; el banco analítico independiente empieza con sus valores iniciales. Deformación inicialmente estática, amplificación visual 10×; no modifica el resultado físico.
- Los enlaces se construyen con `encodeLink` existente y los destinos validan todas sus partes antes de aplicarlas. Las URL de laboratorio y los formatos previos siguen vigentes.
- No se sobrescriben guardados ni propuestas de masa. Al entrar en Aircraft/Rocket, las instantáneas de intercambio se actualizan con el caso activo, como ya ocurría antes. Son claves distintas de los guardados explícitos del usuario.
- Si falla la importación, no se muestran resultados viejos; queda disponible **Abrir laboratorio sin ejemplo**, que no promete transferir un caso calculado.

## Archivos

Nuevos: `src/home/experiments.js` (definiciones, límites y transporte URL), `tests/home-experiments.test.js`, `tests/home-experiments-browser.mjs`, este documento.

Modificados: `src/home/models.js` (adaptadores parametrizados y muestras), `src/home/ui.js` (interacciones, error y continuación), `index.html`, `home.css`, `src/charts/line.js` (etiqueta opcional para reutilizar el cursor), `tools/test-browser.mjs`. README, ROADMAP y TESTING describen la entrega; package y etiquetas HTML pasan a 0.16. Los HTML internos solo cambian su versión; no se sustituyen sus vistas ni controles.

## Ejecución

```sh
cd /workspace/Cole
python3 -m http.server 8000 --bind 0.0.0.0
```

En tu equipo local abre `http://localhost:8000`; en una máquina remota utiliza su mecanismo de acceso al puerto. No uses `file://`. `npm start` también sirve la aplicación; no necesita instalar dependencias de runtime. Detén el servidor con Ctrl+C.

## Pruebas manuales

1. Abre un ejemplo del catálogo. En Aircraft cambia 50 a 60 m/s: L pasa de 14700 a 21168 N; el peso permanece 11767,98 N. Restablece: vuelve a 50.
2. Enfoca la curva y pulsa Fin: caso 21 a 90 m/s. Inicio: primer caso a 30 m/s. Los ejes deben mostrar m/s y N, sin llamar a estos casos nodos FEM.
3. Vacía el campo y escribe 100 m/s: no deben quedar métricas, curva ni continuación. Escribe 70: recupera 28812 N, sin resultados de entradas anteriores.
4. Guarda un caso diferente en cada laboratorio. Desde el catálogo continúa un ejemplo modificado. Comprueba el parámetro recibido y pulsa Cargar: recupera tu guardado anterior. Rocket debe distinguir calculadora ideal de lanzamiento radial, que queda sin calcular.
5. Modifica B en Space. Continúa un ejemplo circular a 1500 km: A recibe 1500 y e=0; B se conserva.
6. En Structure aumenta espesor de 1 a 4 mm: aumenta masa y disminuye deflexión. El fuselaje no cambia. Comprueba que el editor recibe el espesor convertido a metros.
7. Cambia rápidamente de ejemplo, de valor y de filtro: no deben aparecer resultados atrasados de otro laboratorio. Cierra con Escape y revisa la devolución del foco.
8. Prueba 320, 390, 768, 1440 px y zoom 200 %. Solo la gráfica tiene desplazamiento horizontal local en móvil; la página completa no debe desbordarse.

## Estado y pendientes

Se completan el diagnóstico acotado, diseño, implementación y pruebas de esta ampliación; los resultados ejecutados figuran en TESTING.md. Se conserva la validación anterior. No se añaden nuevos materiales, CFD, trayectorias 3D físicas ni FEM 3D.

Pendiente: comparar más de una variable simultáneamente si el uso lo justifica; mejoras basadas en sesiones con usuarios; Safari/Firefox, dispositivos físicos, auditoría WCAG completa y benchmark de GPU/carga. La curva no muestra intervalos de incertidumbre ni mediciones experimentales. Los perfiles y propiedades siguen siendo ejemplos educativos, con límites documentados.
