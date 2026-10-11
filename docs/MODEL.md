# Modelos circular y elíptico: especificación científica

## Objetivo y usuarios

Para estudiantes y personas que exploran mecánica orbital. Se busca observar cómo μ, el periapsis y la excentricidad modifican la velocidad y el periodo. Se excluyen diseño de misiones, predicción de satélites concretos, transferencias, órbitas abiertas y otros módulos.

## Fenómeno, ecuaciones y dimensiones

La aceleración gravitatoria iguala la centrípeta para una órbita circular:

| Magnitud | Ecuación | Dimensión SI |
| --- | --- | --- |
| Parámetro gravitatorio | μ = GM | m³/s² |
| Radio orbital | r = R + h | m |
| Aceleración | a = μ/r² = v²/r | m/s² |
| Velocidad tangencial | v = √(μ/r) | m/s |
| Velocidad angular | n = v/r | s⁻¹ |
| Periodo | T = 2π/n = 2π√(r³/μ) | s |
| Energía específica | ε = v²/2 − μ/r = −μ/(2r) | m²/s² = J/kg |
| Posición | x = r cos(nt), y = r sen(nt) | m |

Por ejemplo, μ/r tiene dimensiones m²/s²; su raíz da m/s. r³/μ tiene dimensiones s²; su raíz da s. Los ángulos se expresan en radianes (adimensionales).

La interfaz recibe km y km³/s²: 1 km = 1000 m y 1 km³/s² = 10⁹ m³/s². La física recibe solo SI; las conversiones están fuera del modelo. La comparación calcula 100(B/A − 1). Para energía negativa, un porcentaje negativo significa un valor menos negativo, no una menor magnitud de energía de escape certificada.

## Parámetros y límites de interfaz

| Entrada | Unidad visible | Mínimo | Máximo |
| --- | --- | ---: | ---: |
| μ | km³/s² | 0,001 | 10¹² |
| R, radio medio del cuerpo | km | 1 | 10⁶ |
| hₚ, altura del periapsis sobre R | km | 1 | 10⁶ |
| e, excentricidad | adimensional | 0 | 0,9 |

Estos límites evitan entradas singulares y permiten exploración; **no delimitan una región físicamente validada**. hₚ = 0 está excluido por el formulario y el modelo; no se admite una órbita sobre o debajo de la superficie. El límite e=0,9 mantiene el solucionador lejos de la singularidad e=1; no es una frontera física para todas las elipses. La esfera matemática no describe terreno ni atmósfera. No se requiere la masa del satélite.

## Extensión elíptica: ecuaciones y condiciones

Sea rₚ=R+hₚ, a=rₚ/(1−e), rₐ=a(1+e) y b=a√(1−e²). El cuerpo central ocupa el foco (0,0). La elipse tiene centro (−ae,0). a y b son semiejes en metros; e es adimensional. Radio y altitud se diferencian explícitamente: la tabla muestra radios al centro, y la entrada es altura sobre R.

Velocidad vis-viva: v²=μ(2/r−1/a), dimensión m²/s². En periapsis vₚ=√[μ(1+e)/rₚ]; en apoapsis vₐ=√[μ(1−e)/rₐ]. Periodo T=2π√(a³/μ) en segundos; energía específica ε=−μ/(2a) en J/kg. El periodo depende del semieje mayor, no del radio instantáneo. En e=0 estos resultados recuperan las fórmulas circulares anteriores.

Se comienza en periapsis: posición (rₚ,0), velocidad (0,vₚ). n=√(μ/a³) es el movimiento medio, en s⁻¹; M=nt es la anomalía media. Se resuelve M=E−e sen E y se evalúa x=a(cos E−e), y=b sen E. La rapidez angular física no es constante en una elipse. Con dE/dt=n/(1−e cos E), se calcula vx=−a sen E dE/dt y vy=b cos E dE/dt, en m/s. r=a(1−e cos E).

## Presets y procedencia

| Cuerpo | μ (km³/s²) | Radio medio (km) |
| --- | ---: | ---: |
| Tierra | 398600.435507 | 6371 |
| Luna | 4902.800118 | 1737.4 |
| Marte | 42828.375816 | 3389.5 |

Fuentes declaradas: [JPL Astrodynamic Parameters](https://ssd.jpl.nasa.gov/astro_par.html), parámetros GM de DE440, y [NASA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/), radios medios redondeados. μ terrestre incluye la definición del parámetro de referencia JPL, sin sustituirlo por un cálculo a partir de una masa redondeada. No se usa el GM del sistema Tierra-Luna como GM de la Tierra. Modificar μ o R convierte el cuerpo a Personalizado para no atribuir parámetros inventados a un preset.

Los enlaces permiten consultar las fuentes; su descarga desde la máquina de desarrollo fue bloqueada por la política de red (HTTP 403). No se afirma haber verificado en vivo la última revisión de esas páginas.

## Supuestos y condiciones iniciales

- Cuerpo central esférico y fijo; campo exterior equivalente al de una masa puntual. Satélite de masa despreciable: se aproxima G(M+m) por GM.
- En t=0: posición (rₚ,0), velocidad (0,vₚ); órbita antihoraria en un plano, circular si e=0. El SVG invierte el eje vertical para representar ese sentido físico.
- Sin inclinación relativa a un ecuador definido, rotación del cuerpo, lanzamiento, maniobras o transferencia.
- Sin arrastre, achatamiento J2, presión de radiación, terceros cuerpos ni relatividad. No se calcula estabilidad a largo plazo, colisión con terreno, esfera de influencia o vida útil.
- La masa central y μ son constantes; no hay gasto de propelente.

Se avisa del arrastre terrestre para hₚ < 150 km; no implica que por encima de ese umbral el arrastre sea nulo. Para rₐ−R > 10R se avisa de perturbaciones externas; ese umbral es una alerta pedagógica, no una frontera física calculada. Para velocidades de periapsis superiores al 1 % de c se avisa de revisar la aproximación newtoniana; tampoco constituye una validación relativista.

## Algoritmo, visualización y precisión

La trayectoria es la solución de Kepler de dos cuerpos. No hay integración Euler, Runge–Kutta ni paso temporal que produzca deriva orbital. El reloj de `requestAnimationFrame` determina el tiempo simulado. Se reduce el tiempo módulo T antes de calcular M para limitar pérdida de precisión a tiempos enormes. Cambiar parámetros reinicia t=0; la pestaña oculta pausa el reloj.

Para M normalizado a [0,2π), la raíz E está en [0,2π]. Se usan 50 bisecciones. La derivada 1−e cos E es al menos 0,1 para e≤0,9: hay una única raíz y el intervalo nunca pierde su acotación. El error angular teórico máximo del punto medio es 2π/2⁵¹ (aproximadamente 2,8×10⁻¹⁵ rad), más redondeo de doble precisión. Las pruebas observan residuos inferiores a 2×10⁻¹⁴ rad en los casos seleccionados, sin convertir ese resultado en una cota universal de exactitud física. Bisección es más lenta que Newton pero evita fallos de convergencia por una mala estimación inicial; para dos vistas y 50 pasos el coste es pequeño. Las pruebas de energía y momento angular cubren 120 fases para e=0, 0,1, 0,5 y 0,9.

Los cálculos usan números IEEE-754 de doble precisión. Las pruebas usan tolerancias relativas de 10⁻¹⁰ para los casos de referencia, no como afirmación sobre el mundo físico. No se propagan incertidumbres de μ, R o h. La presentación a dos decimales pierde resolución en valores muy pequeños; esos valores pueden verse como 0,00 aunque internamente sean positivos.

Las dos vistas comparten escala de distancia; pueden diferir los tamaños de los cuerpos. El satélite, ejes y líneas tienen tamaño ilustrativo, y una alerta identifica detalles demasiado pequeños. Las barras parten de cero y comparan valores, no un barrido de parámetros. La animación representa la solución ideal; su apariencia no valida la física real.

## Qué está y qué no está validado

Validación interna: dimensiones, conversiones, regresiones circulares, leyes de Kepler, vis-viva, energía, momento angular, geometría, periodicidad y migración del guardado. Un cálculo independiente Python empleó las mismas constantes y ecuaciones; la raíz de Kepler se comparó con Newton implementado por separado. Detecta errores de implementación o conversión, pero no demuestra la exactitud del modelo en una misión real.

Referencia ideal terrestre a h=400 km: r=6 771 000 m; v=7672.598587818517 m/s; T=5544.8551397511565 s. Radio geosíncrono redondeado de 42164 km: T=86163.5712307423 s, aproximadamente el día sidéreo terrestre de 86164.0905 s. No se identifica con una órbita geoestacionaria: el MVP no representa inclinación, rotación ni longitud.

Referencia elíptica terrestre a hₚ=400 km y e=0,5: a=13 542 000 m, rₐ=20 313 000 m, vₚ=9396.975770677078 m/s, vₐ=3132.3252568923594 m/s y T=15683.218680060498 s. Para M=π/2 y e=0,5, Newton Python da E=2.0209799380897704 rad.

No validado: efemérides observadas, perturbaciones, e>0,9, órbitas abiertas, precisión profesional, modelos relativistas, planetas personalizados reales, trayectorias de vuelo, seguridad de sistemas o certificación.

## Exploración y visualización de la entrega 3

El control temporal usa fracción de tiempo (t mod T)/T de la referencia A o B, no anomalía verdadera ni excéntrica. El 0 % representa periapsis y el 50 % apoapsis; completar exactamente una vuelta muestra 100 %, con posición equivalente a 0 %. Cambiar referencia conserva el tiempo simulado. Mover el control o utilizar accesos de apsis pausa el reloj; no aplica maniobras.

Las gráficas y el CSV muestrean 241 instantes igualmente espaciados entre 0 y T de cada órbita. Cada estado se evalúa directamente por Kepler. Unir muestras con líneas es una aproximación gráfica, especialmente visible cerca de periapsis con e grande; no hay una cota validada de error de interpolación. Las lecturas actuales y los marcadores se calculan directamente, sin interpolar la curva. Los ejes parten de cero; los valores extremos pueden usar notación científica. Las curvas no representan tiempos iguales entre A y B cuando sus periodos difieren.

Escenarios hipotéticos: dos círculos terrestres de distinta altura; misma Tierra y periapsis con diferente excentricidad; dos elipses con μ y a idénticos, para comprobar T²/a³; y Tierra/Luna a la misma altura, con radios orbitales y μ diferentes. En el escenario de semieje mayor, a=13542 km para e=0,5 y e=0,2, con hₚ de 400 y 4462,6 km. No hay correspondencia afirmada con satélites reales.

La actividad de predicción compara periodo, vₚ o vₐ de B respecto a A. Considera igualdad si |B/A−1|≤10⁻¹⁰ para evitar diferencias de redondeo; es una tolerancia de evaluación numérica, no incertidumbre física. La respuesta se vuelve a calcular al pulsar Comprobar y se borra al cambiar parámetros o la pregunta. No mide competencia profesional ni éxito de una misión.
