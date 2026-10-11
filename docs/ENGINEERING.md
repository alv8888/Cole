# Aircraft Lab y Rocket Lab · modelos educativos 0.5

## Alcance y clasificación

Aircraft y Rocket son módulos nuevos, con páginas y guardados separados de Space Lab. Los escenarios iniciales son hipotéticos, no reproducciones de vehículos reales. Se distinguen cálculos físicos simplificados y geometría tridimensional ilustrativa. Ningún módulo constituye CFD, certificación estructural, validación de estabilidad, una herramienta profesional de lanzamiento o un análisis completo de ciclo de vida.

La arquitectura mantiene modelos puros en `src/engineering/models.js`, campos y supuestos en `profiles.js`, interfaz en `ui.js` y geometría/proyección en `view3d.js`. Los modelos se prueban sin DOM o Canvas. No se añadieron bibliotecas: Canvas 2D puede proyectar y ordenar los polígonos 3D de estas geometrías pequeñas. No hay integrador numérico de vuelo ni trayectoria.

## Aircraft Lab

La versión 0.7 incorpora perfil lateral, empuje, control de peso vinculado a masa, CD directo y balance de fuerzas proyectadas. [AIRCRAFT-FORCES.md](AIRCRAFT-FORCES.md) documenta esta extensión y migración de guardados; la polar original y los modelos siguientes se conservan.

Sistema de ejes: x longitudinal hacia delante, y hacia la derecha, z hacia arriba. El vehículo tiene velocidad respecto al suelo (Vsuelo,0,0) y el viento velocidades (wx,wy,wz). Se calcula Vaire=(Vsuelo−wx,−wy,−wz) y su módulo. wx positivo es viento de cola y negativo viento de frente. Una componente longitudinal Vsuelo−wx≤0 se rechaza porque la polar empleada no describe flujo invertido. No se modelan cambios de rumbo ni fuerza lateral.

Ecuaciones: q=½ρVaire², AR=b²/S, CD=CD₀+CL²/(πeAR), L=qSCL, D=qSCD y W=mg₀. g₀=9,80665 m/s² es gravedad estándar, no una gravedad local calculada. q tiene unidades Pa, AR y coeficientes son adimensionales, L/D/W se expresan en N. CL, CLmáx, CD₀ y eficiencia de Oswald son entradas explícitamente hipotéticas; no hay datos de perfil alar, Reynolds, ángulo de ataque, barrido ni compresibilidad para identificarlos experimentalmente.

La regla Vpérdida=√(2W/(ρSCLmáx)) asume vuelo nivelado y CLmáx aportado por el usuario. No predice una pérdida dinámica, ni incorpora efectos del viento o de la configuración sobre CLmáx. L/W es comparación de magnitudes, no una solución de equilibrio tridimensional. Se avisa de desequilibrio superior al 5 %; ese umbral es pedagógico y no un criterio certificado. Se avisa de Vaire>102 m/s (aproximadamente Mach 0,3 con velocidad de sonido de 340 m/s), sin calcular temperatura local.

El ala visual es trapezoidal: cuerda raíz=2S/[b(1+λ)], punta=λ·raíz y MAC=(2/3)·raíz·(1+λ+λ²)/(1+λ). Por tanto el área planiforme es S. Hay un barrido visual fijo, fuselaje y cola ilustrativos; no afectan a los coeficientes. El CG se coloca longitudinalmente en la referencia MAC; no hay momento aerodinámico ni cálculo de margen estático. La masa total es entrada del usuario e incluye todo el vehículo; no se calcula a partir de la geometría.

### Estructura alar idealizada

Cada semiala se sustituye por una viga independiente en voladizo de longitud ℓ=b/2. La sustentación se reparte uniformemente con carga por longitud w=L/b; cada semiala soporta L/2. Se omiten peso propio e inercia del ala. Sección rectangular, anchura B y altura H: I=BH³/12 (m⁴), Mraíz=Lb/8 (N·m), σ=Mraíz·H/(2I) (Pa), δ=Lb³/(128EI) (m). Son fórmulas Euler–Bernoulli para carga uniforme y elasticidad lineal.

El valor inicial E=70 GPa es una propiedad genérica orientativa tipo aluminio, no identifica una aleación, tratamiento o límite elástico. No hay factor de seguridad, fatiga, pandeo, torsión, uniones, laminados o distribución real de cargas. Se avisa si δ>5 % del semivano; no asegura validez para valores inferiores. La sección de viga es independiente del espesor del ala 3D y no representa su construcción.

### Energía y sustentabilidad

Potencia de entrada P=D·Vaire/η, en W, con eficiencia global constante elegida. Es un requerimiento estimado en el estado evaluado, no un consumo medido; un estado desequilibrado no demuestra crucero. Emisiones en kg CO₂e/h=P(kW)·factor(g CO₂e/kWh)/1000. El factor inicial de 200 g/kWh es un ejemplo arbitrario declarado; no es un factor actual de una red, combustible o región. Un factor cero produce cero en esa operación, sin demostrar impacto ambiental total nulo. No hay fabricación, mantenimiento, pasajeros, infraestructura ni ciclo de vida.

### Casos comprobados

Valores iniciales: masa=1200 kg, S=16 m², b=10 m, Vsuelo=50 m/s, viento=0, ρ=1,225 kg/m³, CL=0,6, CD₀=0,025, e=0,8. q=1531,25 Pa; L=14700 N; D=1173,9986392282067 N; W=11767,98 N. Este caso no está equilibrado. Viento de frente de 10 m/s da Vaire=60 m/s y L multiplicada por 1,44; viento de cola de 10 da 40 m/s y L multiplicada por 0,64.

Con B=0,15 m, H=0,25 m y E=70 GPa: I=0,0001953125 m⁴, Mraíz=18375 N·m, σ=11,76 MPa y δ=0,0084 m. Duplicar E divide δ por dos; duplicar H divide δ por ocho y σ por cuatro. Se comprueba área trapezoidal, escalas de densidad/velocidad, CL=0, unidades y operación energética. D se contrastó por un cálculo separado en Python, no con ensayos de túnel de viento.

## Rocket Lab · calculadora original de una etapa

La entrega 0.6 añade una sección independiente de lanzamiento multietapa y trayectoria radial. Véase [ROCKET-FLIGHT.md](ROCKET-FLIGHT.md); los supuestos siguientes corresponden únicamente a la calculadora de una etapa.

Vehículo espacial ideal de una etapa. Masa seca incluye estructura y carga útil; masa inicial m₀=mseca+mprop, final=mseca. Se asume consumo uniforme, ṁ=mprop/tfunc. El empuje T y ese flujo determinan velocidad efectiva de escape ve=T/ṁ; Isp=ve/g₀. No se permite introducir tres magnitudes independientes contradictorias. ve es efectivo e incluye el significado del empuje neto impuesto; no se resuelve una tobera ni se especifica propelente.

Ecuación de Tsiolkovski: Δv=ve·ln(m₀/mseca). En 0≤t≤tfunc: m(t)=m₀−ṁt y Δv(t)=ve·ln[m₀/m(t)]. ṁ tiene kg/s, ve y Δv m/s, Isp s, y el logaritmo tiene argumento adimensional. Se usa `log1p(mprop/mseca)` para el total, reduciendo pérdida de precisión con fracciones de masa pequeñas.

Referencia adicional: gravedad constante g y empuje alineado verticalmente, sin atmósfera, en vuelo libre desde t=0. Aceleración=T/m(t)−g; cambio de velocidad=Δv(t)−gt. No es una corrección general de pérdidas gravitatorias de una misión ni una trayectoria; no se calcula altura. Si T/(m₀g)≤1, no demuestra despegue desde una plataforma. En g=0, empuje/peso está indefinido y se muestra —. No hay estados de contacto, etapas, guiado, resistencia, presión variable, construcción de motores, armamento o transferencia orbital.

La forma 3D (longitud y diámetro) es visual y no participa en masa, resistencia o estructura. El porcentaje restante mostrado corresponde a masa de propelente, no a volumen de un tanque. Las curvas usan 81 evaluaciones analíticas, no integración.

Caso inicial: mseca=100 kg, mprop=200 kg, T=6000 N, tfunc=40 s. m₀=300 kg, ṁ=5 kg/s, ve=1200 m/s y Δv=1318,3347464017318 m/s. Al 50 %: t=20 s, masa=200 kg; al 100 %: masa=100 kg y Δv acumulado coincide con el total. Se probaron extremos, gravedad cero, escalamiento con empuje y masa conservada. El Δv se contrastó con Python de forma independiente, usando las mismas ecuaciones; no con telemetría real.

## 3D, reglas y precisión

Se construyen vértices en tres coordenadas, se rotan y se proyectan ortográficamente con ordenado de profundidad por polígonos. Es una visualización geométrica auténticamente tridimensional en un lienzo 2D, sin motor WebGL. Las caras, colores y encuadre son ilustrativos. Rotar no altera el estado físico. Se puede arrastrar o usar los rangos de cámara con teclado. No hay iluminación físicamente basada, detección de colisiones ni deformación 3D.

Los avisos son reglas de validez del modelo, no normativa de aeronavegabilidad, permiso de vuelo ni aprobación de seguridad. Se requiere normativa de una jurisdicción y análisis especializado para tales objetivos. Los cálculos usan doble precisión y las tablas presentan tres decimales; ese formato no es una garantía de exactitud física.

## Referencias y actualización

- NASA Glenn, [Lift Equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/lift-equation/).
- NASA Glenn, [Ideal Rocket Equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/).
- La viga se deriva de las ecuaciones Euler–Bernoulli para un voladizo con carga uniforme, con dimensiones e invariantes declarados arriba.

Se intentó consultar las páginas NASA durante esta entrega; el proxy de red respondió HTTP 403. Se preservan las referencias de los modelos clásicos, pero no se afirma haber revisado su última actualización. No hay descarga automática de datos meteorológicos, coeficientes aerodinámicos, factores de emisiones o materiales actuales. Actualizar documentación en GitHub no equivale a disponer de información científica en tiempo real.

Pendiente: datos de perfiles y materiales con trazabilidad, turbulencia/ráfagas, estabilidad y control, CFD, cargas dinámicas, estructuras 3D, evaluación ambiental de ciclo de vida y contraste experimental de trayectorias de cohete. ROCKET-FLIGHT.md documenta la trayectoria radial educativa incorporada en 0.6. No se anuncian como funciones implementadas.
