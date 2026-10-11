# Modelo circular: especificación científica

## Objetivo y usuarios

Para estudiantes y personas que exploran mecánica orbital. Se busca observar cómo μ y el radio orbital modifican la velocidad y el periodo. Se excluyen diseño de misiones, predicción de satélites concretos, órbitas elípticas, transferencias y otros módulos.

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
| h, altura sobre R | km | 1 | 10⁶ |

Estos límites evitan entradas singulares y permiten exploración; **no delimitan una región físicamente validada**. h = 0 está excluido por el formulario y el modelo; no se admite una órbita sobre o debajo de la superficie. La esfera matemática no describe terreno ni atmósfera. μ determina la gravedad sin asumir un valor universal de masa del cuerpo. No se requiere la masa del satélite.

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
- En t=0: posición (r,0), velocidad (0,√(μ/r)); órbita circular antihoraria en un plano. El SVG invierte el eje vertical para representar ese sentido físico.
- Sin inclinación relativa a un ecuador definido, rotación del cuerpo, lanzamiento, maniobras o transferencia.
- Sin arrastre, achatamiento J2, presión de radiación, terceros cuerpos ni relatividad. No se calcula estabilidad a largo plazo, colisión con terreno, esfera de influencia o vida útil.
- La masa central y μ son constantes; no hay gasto de propelente.

Se avisa del arrastre terrestre para h < 150 km; no implica que por encima de ese umbral el arrastre sea nulo. Para h > 10R se avisa de perturbaciones externas; ese umbral es una alerta pedagógica, no una frontera física calculada. Para velocidades superiores al 1 % de c se avisa de revisar la aproximación newtoniana; tampoco constituye una validación relativista.

## Algoritmo, visualización y precisión

La solución es analítica. No hay integración Euler, Runge–Kutta ni paso temporal que produzca deriva orbital. El reloj de `requestAnimationFrame` determina el tiempo simulado; la posición se obtiene con seno y coseno. Se reduce el tiempo módulo T antes de evaluar el ángulo para limitar pérdida de precisión a ángulos enormes. Cambiar parámetros reinicia t=0; la pestaña oculta pausa el reloj.

Los cálculos usan números IEEE-754 de doble precisión. Las pruebas usan tolerancias relativas de 10⁻¹⁰ para los casos de referencia, no como afirmación sobre el mundo físico. No se propagan incertidumbres de μ, R o h. La presentación a dos decimales pierde resolución en valores muy pequeños; esos valores pueden verse como 0,00 aunque internamente sean positivos.

Las dos vistas comparten escala de distancia; pueden diferir los tamaños de los cuerpos. El satélite, ejes y líneas tienen tamaño ilustrativo, y una alerta identifica detalles demasiado pequeños. Las barras parten de cero y comparan valores, no un barrido de parámetros. La animación representa la solución ideal; su apariencia no valida la física real.

## Qué está y qué no está validado

Validación interna: dimensiones, conversiones, cálculo circular, ley de Kepler, escalamiento con μ y r, balance centrípeto, energía y periodicidad. Un cálculo independiente Python empleó las mismas constantes y ecuaciones: detecta errores de implementación o conversión, pero no demuestra la exactitud del modelo en una misión real.

Referencia ideal terrestre a h=400 km: r=6 771 000 m; v=7672.598587818517 m/s; T=5544.8551397511565 s. Radio geosíncrono redondeado de 42164 km: T=86163.5712307423 s, aproximadamente el día sidéreo terrestre de 86164.0905 s. No se identifica con una órbita geoestacionaria: el MVP no representa inclinación, rotación ni longitud.

No validado: efemérides observadas, perturbaciones, órbitas elípticas, precisión profesional, modelos relativistas, planetas personalizados reales, trayectorias de vuelo, seguridad de sistemas o certificación.
