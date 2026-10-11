# Aircraft Lab 0.7 · perfil lateral y balance de fuerzas

## Objetivo y alcance

Se amplía Aircraft Lab para estudiantes/docentes con parámetros de avión editables, perfil lateral ilustrativo y comparación de sustentación, peso, empuje y arrastre. El modelo previo de viento, geometría 3D, viga y energía se conserva. No hay biblioteca nueva ni motor CFD; SVG basta para las flechas, gráficas y esquema.

Cada entrada muestra unidades y límites. Superficie alar S en m²; masa m en kg; peso W en N; CL/CD adimensionales; velocidad en m/s; densidad en kg/m³; empuje T en N. El control de peso y el de masa representan un mismo parámetro: W=m·g₀, con g₀=9,80665 m/s². Editar cualquiera actualiza el otro. Masa admitida: 100–100000 kg, peso equivalente: 980,665–980665 N. No se interpreta un kilogramo como unidad de fuerza. Empuje admitido: 0–1000000 N, constante, horizontal e impuesto por el usuario.

## Modelo matemático y condiciones

Estado instantáneo con velocidad respecto al suelo sobre +x, viento uniforme y densidad constante introducida. No se integra una trayectoria ni cambia automáticamente la velocidad por las fuerzas. Se evalúa Vaire=|Vsuelo−Vviento| y q=½ρVaire², en Pa. L=qSCL, D=qSCD y W=mg₀, en N. El CG visual no interviene en momentos; no hay equilibrio de cabeceo.

Dos opciones explícitas de resistencia:

1. **Polar simplificada**, opción inicial y comportamiento anterior: AR=b²/S y CD=CD₀+CL²/(πeAR). El CD total impuesto queda inactivo.
2. **CD total impuesto**, rango 0–1: CD toma directamente ese valor. No se vuelve a añadir resistencia inducida. CD₀ y e quedan inactivos. El extremo CD=0 sirve como caso límite idealizado, sin afirmar que una aeronave real tenga resistencia nula.

CL no se deriva de la silueta, de un ángulo de ataque o de datos de túnel. CL inicial 0,6, CD₀ inicial 0,025, e inicial 0,8 y CD total inicial 0,05 son entradas hipotéticas declaradas. El modelo conserva advertencias de pérdida supuesta, ángulos de viento grandes, alargamiento bajo y velocidad mayor de aproximadamente Mach 0,3. Estas advertencias no certifican validez por debajo de los umbrales.

## Balance de las cuatro fuerzas

Con viento lateral exactamente cero se calcula el plano longitudinal vertical. +x es hacia delante y +z hacia arriba. Para γ=atan2(−wv, Vsuelo−wx), ángulo de la velocidad relativa al aire:

- Sustentación: (−L sin γ, L cos γ), normal a la velocidad relativa en el plano.
- Arrastre: (−D cos γ, −D sin γ), opuesto a esa velocidad.
- Empuje: (T, 0), horizontal.
- Peso: (0, −W), vertical.
- Fx=T−D cos γ−L sin γ; Fz=L cos γ−D sin γ−W.
- ax=Fx/m; az=Fz/m, en m/s²; son aceleraciones instantáneas supuestas, sin propagación temporal.

Para γ=0 se recuperan Fx=T−D y Fz=L−W. Se presentan magnitudes, componentes netas y aceleraciones. Cuando el viento tiene componente vertical, L=W y T=D ya no bastan para equilibrio: deben compararse las componentes vectoriales.

Con viento lateral distinto de cero se conservan magnitudes del modelo anterior, pero el balance 2D se declara no resuelto. Se ocultan flechas direccionales y aparecen guiones en fuerzas netas/aceleraciones, sin inventar fuerzas laterales, una proyección 3D o un equilibrio completo.

Se llama **equilibrio aproximado** por eje a |Fnet|≤0,005·max(1 N, |componentes de las cuatro fuerzas en ese eje|). La banda del 0,5 % es pedagógica; no es un criterio de trimado, control, estabilidad o aeronavegabilidad. Se muestran residuos numéricos incluso dentro de ella. No se afirma velocidad o altura constantes en una trayectoria, porque no se ha integrado ninguna.

## Representación visual y animación

La silueta SVG es un perfil genérico con borde de ataque a la derecha. No corresponde a una familia NACA, no cambia coeficientes ni se usa para obtener presiones. Las cuatro flechas salen de un origen común para comparar direcciones/magnitudes: no son posiciones reales de aplicación y no sirven para calcular momentos. Usan una escala lineal común y se omite la flecha de una fuerza cero o de longitud inferior a 0,01 unidades SVG por resolución de presentación; su valor numérico sigue visible. La escala se ajusta a cada estado, por lo que no compara longitudes absolutas entre distintos estados. El gráfico muestra cuatro barras de magnitudes en N, con origen cero, escala común y valores. La explicación textual describe el balance vectorial.

El botón Animar aire ilustrativo mueve trazos discontinuos alrededor del perfil. No resuelve líneas de corriente, Bernoulli, separación de flujo, circulación ni turbulencia. La cadencia visual depende de Vaire con límite de presentación, no mide velocidad de partículas físicas. Empieza pausada, se puede pausar y ocultar la pestaña pausa. Activar movimiento reducido durante la animación también la pausa. Ninguna fuerza se modifica por animar, girar la cámara o cambiar tamaño de ventana.

## Dimensiones, casos conocidos y error

½ρV² tiene kg·m⁻¹·s⁻²=Pa; qS tiene N; CL/CD son adimensionales. T, D, L y W se suman solo como fuerzas; al dividir por kg se obtiene m/s². La proyección usa senos/cosenos adimensionales de ángulos convertidos a radianes. Es cálculo algebraico en doble precisión, sin error de paso de integración. Puede haber redondeo en sumas casi compensadas; los decimales mostrados no indican precisión física.

Caso inicial horizontal: m=1200 kg, S=16 m², Vaire=50 m/s, ρ=1,225 kg/m³, CL=0,6, CD₀=0,025, e=0,8, b=10 m y T=1200 N. L=14700 N; D=1173,9986392282067 N; W=11767,98 N. Fx≈26,0013607717933 N; Fz=2932,02 N; ax≈0,0216678006432 m/s²; az=2,44335 m/s². Ese estado no está equilibrado.

Caso de equilibrio preparado: m=1000 kg, S=20 m², Vaire=50 m/s, ρ=1,2 kg/m³, CL=9806,65/30000, CD total=0,03, T=900 N. L=W=9806,65 N y T=D=900 N. Los residuos son cero dentro del redondeo; no demuestra estabilidad ni corresponde a un avión real. En modo directo, duplicar CD duplica D; alterar CD₀/e no añade arrastre. CD=T=0 da Fx=0 con viento horizontal. Viento lateral bloquea el balance, sin ocultar las magnitudes.

Las referencias iniciales se contrastaron mediante un cálculo Python separado:

```python
from math import pi
m, S, b, rho, V, CL, CD0, e, T = 1200, 16, 10, 1.225, 50, .6, .025, .8, 1200
q = .5 * rho * V**2
L = q * S * CL
D = q * S * (CD0 + CL**2 / (pi * e * (b**2 / S)))
W = m * 9.80665
print(L, D, W, T, T-D, L-W, (T-D)/m, (L-W)/m)
```

Esta comparación usa las mismas ecuaciones, no mediciones de vuelo o túnel. Pruebas específicas: referencia, equilibrio y tolerancia, CD directo y cero, proyección vertical y lateral, entradas inválidas y migración. No se valida toda combinación posible ni fidelidad de los coeficientes.

## Arquitectura y guardados

- `src/engineering/models.js`: cálculo Aircraft existente y resultado de balance.
- `src/aircraft/forces.js`: suma vectorial pura y criterio de equilibrio, sin DOM.
- `src/aircraft/visualization.js`: SVG, representación de fuerzas y animación ilustrativa.
- `src/aircraft/configuration.js`: lectura validada y migración de guardados.
- `src/engineering/profiles.js`: campos, unidades, límites y explicación.
- `src/engineering/ui.js`: peso/masa vinculados, modo CD, comparación y persistencia.
- `aircraft.html`, `styles.css`: interfaz adaptable, etiquetas y controles.
- `tests/aircraft-forces.test.js`, `tests/aircraft-forces-browser.mjs`: validación científica e interacciones.

Aircraft guarda/exporta formato v2 conservando la clave `aerolab.aircraft.v1` para poder leer lo anterior. Cargar v1 preserva los parámetros existentes y añade T=1200 N hipotéticos, CD total=0,05 y modo polar. Se informa la migración; no se sobrescribe localStorage hasta pulsar Guardar. v2 exige los nuevos parámetros y modo válido. Peso no se duplica en el archivo: se guarda masa y se deriva W. Un guardado corrupto no cambia controles. Rocket conserva sus formatos y modelos. No hay nuevas dependencias de aplicación.

## Completado y pendiente

Completado: controles S/W/CL/CD/T, vista lateral, cuatro flechas/barras, balance neto, viento vertical y limitación lateral explícita, animación separada, comparación, guardado, exportación y pruebas. Pendiente: perfiles con datos identificados, CL(ángulo de ataque)/Reynolds, estabilidad y momentos, trayectoria integrada de aeronave, modelo lateral 3D, auditoría completa de accesibilidad y contraste experimental. Los límites de viga, potencia y emisiones de ENGINEERING.md siguen vigentes. La potencia DV/η representa requerimiento del estado impuesto, no consumo medido a partir del empuje elegido.
