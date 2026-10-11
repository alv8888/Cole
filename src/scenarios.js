import { BODIES } from './data.js';

function config(body, altitude, eccentricity = 0) {
  return Object.freeze({ body, mu: BODIES[body].mu, radius: BODIES[body].radius, altitude, eccentricity });
}

export const SCENARIOS = Object.freeze([
  Object.freeze({ id: 'altitude', title: '01 · Más alto, ¿más rápido?', tag: 'FUNDAMENTOS',
    description: 'Compara círculos terrestres a 400 y 1000 km. Solo cambia la altitud. Predice el periodo de B y comprueba la relación con el radio orbital.',
    configurations: Object.freeze([config('earth', 400), config('earth', 1000)]) }),
  Object.freeze({ id: 'eccentricity', title: '02 · Estirar una órbita', tag: 'EXCENTRICIDAD',
    description: 'Mismo cuerpo y periapsis, pero B tiene e=0,5. Recorre periapsis y apoapsis: la distancia y la rapidez cambian, aunque la energía específica permanece constante.',
    configurations: Object.freeze([config('earth', 400), config('earth', 400, 0.5)]) }),
  Object.freeze({ id: 'kepler', title: '03 · Distinta forma, mismo periodo', tag: 'TERCERA LEY',
    description: 'A y B tienen el mismo μ y semieje mayor de 13542 km, con e=0,5 y e=0,2. Sus periapsis son distintos. ¿Qué predice T²/a³ para sus periodos?',
    configurations: Object.freeze([config('earth', 400, 0.5), config('earth', 4462.6, 0.2)]) }),
  Object.freeze({ id: 'moon', title: '04 · Un laboratorio lunar', tag: 'OTRO CUERPO',
    description: 'Compara círculos alrededor de la Tierra y la Luna a 100 km sobre sus radios medios. Cambian μ y R: la misma altura no significa el mismo radio ni la misma velocidad. El caso terrestre omite un arrastre importante.',
    configurations: Object.freeze([config('earth', 100), config('moon', 100)]) }),
]);
