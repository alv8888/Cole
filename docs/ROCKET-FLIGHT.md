# Rocket Lab 0.6 · lanzamiento multietapa radial

## Objetivo, usuarios y alcance

Modelo educativo para estudiantes y docentes. Se puede variar número de etapas (1–4), carga útil, masa seca, propelente, empuje y duración por etapa, cuerpo central Tierra/Luna y horizonte de cálculo. Ofrece presupuesto de Δv, trayectoria radial, reproducción con gráficas de altura/velocidad, eventos, guardado local y CSV. No hay diseño de motores, formulaciones de combustibles, guiado ni uso armamentístico.

La calculadora anterior de una etapa permanece independiente abajo. Su geometría 3D y sus controles no alimentan este lanzamiento. El esquema multietapa indica etapas retenidas/separadas, sin representar dimensiones ni altitud a escala.

## Condiciones iniciales y supuestos

h=0 m, v=0 m/s, plataforma en reposo, cuerpo central esférico sin rotación y con μ/R declarados. Tierra: μ=3,98600435507×10¹⁴ m³/s², R=6371000 m. Luna: μ=4,902800118×10¹² m³/s², R=1737400 m. Son referencias del laboratorio, no efemérides actualizadas. μ tiene unidades m³/s² y R/h unidades m.

Vuelo radial vertical, vacío, empuje constante y flujo constante por etapa. Cada etapa consume todo su propelente antes de encender la siguiente. Se desprende su masa seca salvo la última, que permanece con la carga útil. Separación instantánea sin impulso ni retraso. Las etapas superiores se transportan con todo su propelente hasta encenderse. La plataforma sostiene el vehículo mientras T≤mμ/R², aunque el motor sigue consumiendo. Puede despegar tardíamente al reducirse su masa. Si regresa a h=0 en vuelo descendente se detiene el cálculo, incluso si quedan motores activos. No se calcula rebote o relanzamiento.

## Ecuaciones y dimensiones

Por etapa i, ṁᵢ=mpropᵢ/tfuncᵢ (kg/s), veᵢ=Tᵢ/ṁᵢ (m/s). El escape efectivo se deriva de esos controles y no es un dato independiente. Masa antes del funcionamiento incluye carga útil, etapa activa y todas las superiores; masa después conserva la masa seca activa y resta solo el propelente. Δvᵢ=veᵢ ln(mantes/mdespués), en m/s. La suma de estos valores es presupuesto ideal sin gravedad, distinto de la velocidad integrada. Descartar masa seca cambia la masa para la etapa siguiente, sin un salto instantáneo de velocidad.

En vuelo:

- dh/dt=v (m/s).
- dv/dt=T/m−μ/(R+h)² (m/s²); T=0 tras la última etapa.
- dm/dt=−ṁ (kg/s); flujo cero tras la última etapa.

Tras terminar la propulsión, ε=v²/2−μ/(R+h), en J/kg=m²/s². Con v>0 y ε>0 el vehículo es no ligado y escapará en este modelo radial; la gravedad sigue actuando. La velocidad de escape local √(2μ/(R+h)) se expresa en m/s. No se declara escape durante una etapa todavía activa, ni por superar una altura arbitraria. Se exige ε>10⁻⁷ μ/R para declarar escape; esta banda evita una afirmación categórica muy próxima a cero, sin constituir una cota universal del error numérico. ε negativa fuera de esa banda, sin motores, indica que regresará: si no se observa impacto dentro del horizonte se informa trayectoria ligada, no un impacto ya calculado. Energía marginal o motores pendientes al alcanzar el horizonte se informan como desenlace sin resolver.

La interfaz limita ve derivada a 1–50000 m/s y muestra los rangos de masa, empuje, duración, carga útil y horizonte. Son restricciones de entrada, no rangos certificados de un sistema de propulsión. La simulación termina al impacto, no despegue tras agotamientos, escape energético tras agotamientos o horizonte máximo (60–7200 s).

## Método numérico, estabilidad y errores

Runge–Kutta explícito clásico de cuarto orden para (h,v), evaluando la masa linealmente decreciente en las cuatro subetapas. Paso máximo 0,1 s, acortado en fin de etapa, cruce de T=mg en plataforma y horizonte. Se fija exactamente la masa de fin de etapa para evitar acumulación de redondeo; después se descarta la masa seca correspondiente. Al cruzar h=0 se busca el evento con 35 bisecciones del último intervalo usando RK4; la altura final se fija en cero. El instante del paso por apogeo se registra al detectar cambio de signo de velocidad, con resolución del paso, no con precisión de una efeméride.

El método es de orden global cuatro para segmentos suaves. Los eventos se tratan aparte; no se atraviesan agotamientos con flujo incorrecto. No es un integrador adaptativo ni simpléctico. La estabilidad y exactitud no se garantizan para toda combinación admitida: fuerzas extremas, cambios rápidos de masa y situaciones cercanas al escape pueden requerir más resolución. La precisión de coma flotante, el paso temporal y la localización de eventos añaden error. Reducir paso no corrige atmósfera, guiado u otros fenómenos omitidos.

Se probó reducción de pasos de 0,2 a 0,1 y 0,05 s en el escenario inicial hasta 1200 s. Las alturas finales observadas fueron 1662383,8041965829; 1662383,8041875605; 1662383,8041863563 m. Son resultados numéricos de ese caso, no una precisión física defendible para un vehículo real. En los estados balísticos probados se conservó ε con error relativo inferior a 10⁻⁹.

## Casos comprobados

Escenario inicial: carga útil 100 kg; etapa 1: seca 300 kg, propelente 2000 kg, T=60000 N, 100 s; etapa 2: seca 100 kg, propelente 600 kg, T=15000 N, 100 s. Masa inicial 3100 kg, tras consumir etapa 1: 1100 kg, después de separarla: 800 kg; masa final retenida 200 kg. Presupuesto ideal: 3000 ln(3100/1100)+2500 ln(800/200)=6574,011697860054 m/s.

Con Tierra: al terminar motores, h≈381207,827918 m y v≈4678,573729 m/s. El impacto calculado ocurre alrededor de 1685,294484 s; altura máxima muestreada alrededor de 1917,965 km. Es un lanzamiento en vacío, muy diferente de un lanzamiento terrestre real. Con las mismas entradas en Luna se declara escape al terminar motores, a 200 s, con v≈6299,521250 m/s, por encima del escape local ≈2072,965138 m/s.

Referencia independiente: integración de punto medio explícito en Python con paso 0,001 s dio h=381207,82789451675 m y v=4678,573728593203 m/s a 200 s. Usa la misma física con otro algoritmo; no son mediciones experimentales. Se reproduce así:

```python
from math import log
mu = 3.98600435507e14
radius = 6371000.0
mass, h, v, dt = 3100.0, 0.0, 0.0, 0.001
for index, (dry, prop, thrust, duration) in enumerate([
    (300, 2000, 60000, 100), (100, 600, 15000, 100)
]):
    flow = prop / duration
    for _ in range(round(duration / dt)):
        acceleration = thrust / mass - mu / (radius + h)**2
        hm, vm = h + v * dt / 2, v + acceleration * dt / 2
        am = thrust / (mass - flow * dt / 2) - mu / (radius + hm)**2
        h += vm * dt
        v += am * dt
        mass -= flow * dt
    print(h, v, mass)
    if index == 0:
        mass -= dry
print(3000 * log(3100 / 1100) + 2500 * log(800 / 200))
```

También se comprueban presupuesto analítico de dos etapas normalizadas, consumo sin despegue, despegue exactamente a 5 s en un caso preparado, energía balística, entradas corruptas, masa positiva, horizontes incompletos y persistencia independiente. Las pruebas no validan todos los valores permitidos ni escape marginal.

## Arquitectura y reproducción

- `src/rocket/model.js`: validación, presupuesto de masa/Δv y trayectoria; no requiere DOM.
- `src/rocket/storage.js`: guardado versionado validado, clave exclusiva `aerolab.rocket.launch.v1`.
- `src/rocket/visualization.js`: gráficas SVG y esquema de etapas.
- `src/rocket/ui.js`: formulario, reloj de reproducción, pausa, exploración de estados, eventos y CSV.
- `tests/rocket-flight.test.js`: casos físicos y persistencia.
- `tests/rocket-flight-browser.mjs`: controles reales, reproducción, caída/escape, CSV y adaptación.

`Calcular y lanzar` obtiene la trayectoria; el reloj reproduce estados calculados y las gráficas se actualizan durante la reproducción, a 1/10/60/300 segundos simulados por segundo real. No hay telemetría, simulación de motores o datos en vivo. Se respeta movimiento reducido: empieza pausado. Ocultar la pestaña pausa. La selección temporal muestra el último estado calculado anterior al tiempo elegido. Cada edición invalida trayectoria y descargas previas. CSV incluye todos los estados, unidades SI y `stage_index` desde 0; número de etapas significa propulsión terminada. El tiempo guardado es el horizonte de cálculo, no el estado de reproducción. La calculadora anterior y Aircraft/Space conservan sus claves y lógica.

Ejecuta el servidor como indica README, visita `/rocket.html` y prueba con `npm test`. Reproducción del navegador y pruebas manuales: TESTING.md. Sin bibliotecas nuevas en la aplicación; Playwright solo sirve para verificarla.

## Lo no validado y siguientes fases

Sin atmósfera, resistencia, calentamiento, viento, curvatura o control de trayectoria, rotación terrestre, órbitas, incertidumbre de entradas, tolerancias de hardware o separación física. No predice una misión viable ni certifica seguridad. No se contrastó con telemetría real. Pendiente: validación amplia de extremos y energía marginal, integrador adaptativo con estimación de error, arrastre identificado con referencias, revisión de accesibilidad completa y navegadores distintos de Chromium. Consultar ENGINEERING.md para el modelo anterior de una etapa y sus fuentes de principios generales; no hay actualización automática de referencias externas.
