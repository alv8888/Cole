import { aircraft, rocket, AIRCRAFT_RANGES, ROCKET_RANGES } from './models.js';

const field = (key, label, unit, value, group) => ({ key, label, unit, value, group });
const result = (key, label, unit, scale = 1) => ({ key, label, unit, scale });
export const PROFILES = {
  aircraft: {
    title: 'Aircraft Lab', subtitle: 'Aerodinámica, viento relativo y viga alar idealizada', compute: aircraft, ranges: AIRCRAFT_RANGES,
    fields: [
      field('mass','Masa total, vinculada al peso','kg',1200,'Configuración'),
      field('thrust','Empuje horizontal impuesto','N',1200,'Configuración'), field('area','Superficie alar','m²',16,'Configuración'),
      field('span','Envergadura','m',10,'Configuración'), field('taper','Relación cuerda punta/raíz','sin unidad',0.6,'Configuración'),
      field('cg','CG desde borde de ataque de la cuerda media','% MAC',25,'Configuración'),
      field('groundSpeed','Velocidad respecto al suelo, eje longitudinal','m/s',50,'Aire y viento'),
      field('windAlong','Viento longitudinal (+ cola, − frente)','m/s',0,'Aire y viento'),
      field('windCross','Viento lateral (+ derecha)','m/s',0,'Aire y viento'),
      field('windVertical','Viento vertical (+ arriba)','m/s',0,'Aire y viento'),
      field('density','Densidad del aire','kg/m³',1.225,'Aire y viento'),
      field('cl','CL impuesto','sin unidad',0.6,'Coeficientes hipotéticos'),
      field('clMax','CL máximo supuesto','sin unidad',1.5,'Coeficientes hipotéticos'),
      field('cdTotal','CD total impuesto (modo directo)','sin unidad',0.05,'Coeficientes hipotéticos'),
      field('cd0','CD parasitario (modo polar)','sin unidad',0.025,'Coeficientes hipotéticos'),
      field('oswald','Factor de eficiencia de Oswald','sin unidad',0.8,'Coeficientes hipotéticos'),
      field('beamWidth','Ancho de viga rectangular independiente','m',0.15,'Estructura educativa'),
      field('beamHeight','Altura de viga rectangular independiente','m',0.25,'Estructura educativa'),
      field('modulus','Módulo de Young supuesto','GPa',70,'Estructura educativa'),
      field('efficiency','Eficiencia global de propulsión','sin unidad',0.8,'Energía y sustentabilidad'),
      field('carbon','Factor de emisiones elegido','g CO₂e/kWh',200,'Energía y sustentabilidad'),
    ],
    results: [result('airSpeed','Velocidad relativa al aire','m/s'),result('dynamicPressure','Presión dinámica','Pa'),result('aspectRatio','Alargamiento','sin unidad'),result('dragCoefficient','CD total','sin unidad'),result('lift','Sustentación','N'),result('drag','Resistencia','N'),result('weight','Peso','N'),result('thrust','Empuje','N'),result('netX','Fuerza neta longitudinal','N'),result('netZ','Fuerza neta vertical','N'),result('accelerationX','Aceleración longitudinal instantánea','m/s²'),result('accelerationZ','Aceleración vertical instantánea','m/s²'),result('liftRatio','Sustentación / peso','sin unidad'),result('stallSpeed','Umbral de pérdida supuesto','m/s'),result('sideslip','Ángulo de viento relativo lateral','°'),result('flightAngle','Ángulo vertical de viento relativo','°'),result('rootMoment','Momento de viga en raíz','N·m'),result('stress','Tensión de flexión idealizada','MPa',1e-6),result('deflection','Flecha de viga idealizada','m'),result('power','Potencia de entrada estimada','kW',0.001),result('emissions','Emisiones según factor elegido','kg CO₂e/h')],
    equations: 'Vaire = |Vsuelo − Vviento|; q = ½ρVaire²; AR = b²/S; CD = CD₀ + CL²/(πeAR) en modo polar, o CD total impuesto en modo directo; L = qSCL; D = qSCD; W = mg. Con viento relativo horizontal: Fx = T − D; Fz = L − W; ax = Fx/m; az = Fz/m. Con viento vertical se proyectan L y D al plano longitudinal. Vpérdida = √(2W/(ρSCLmáx)). Para una semiala-viga en voladizo de longitud b/2 con carga uniforme L/b: I = wh³/12; Mraíz = Lb/8; σ = M(h/2)/I; δ = Lb³/(128EI). Potencia de entrada = DVaire/η. Emisiones (kg/h) = potencia (kW) × factor (g/kWh) / 1000.',
    limits: 'Modelo cuasiestático incompresible de baja velocidad. Empuje horizontal impuesto y aceleraciones instantáneas; no hay integración de trayectoria. El perfil lateral y el flujo animado son ilustrativos, sin CFD ni datos del perfil. Con viento lateral no se resuelve balance 2D. Una tolerancia pedagógica del 0,5 % por eje identifica equilibrio aproximado de fuerzas, sin demostrar estabilidad o equilibrio de momentos. CL, CLmáx, CD₀ y e son supuestos del usuario, no una base de datos de aeronaves. Viento uniforme: no calcula ráfagas, CFD, turbulencia, fuerzas laterales ni estabilidad. CG solo ubica un marcador; no se calcula momento de cabeceo ni margen estático. La viga supone elasticidad lineal, sección constante y pequeñas deformaciones; omite peso propio, torsión, uniones y cargas dinámicas. No hay límite resistente del material ni certificación. E=70 GPa es un ejemplo genérico tipo aluminio, sin aleación certificada. Las emisiones son una operación con el factor elegido, sin análisis de ciclo de vida ni datos de red eléctrica.',
    warnings(c,r) {
      const warnings = ['Escenario hipotético: no representa una aeronave real.'];
      if (r.airSpeed > 102) warnings.push('Vaire supera aproximadamente Mach 0,3 para sonido de 340 m/s: la aproximación incompresible pierde validez.');
      if (Math.abs(r.sideslip)>10 || Math.abs(r.flightAngle)>5) warnings.push('Viento oblicuo importante: la polar simplificada no modela fuerzas laterales ni efectos de ángulo de ataque.');
      if (c.cl>c.clMax || r.airSpeed<r.stallSpeed) warnings.push('El supuesto de sustentación puede exceder CLmáx o quedar por debajo del umbral de pérdida; no es una predicción de pérdida dinámica.');
      if (!r.available) warnings.push('Viento lateral distinto de cero: se conservan magnitudes, pero no se declara equilibrio longitudinal 2D.');
      if (Math.abs(r.liftRatio-1)>0.05) warnings.push('L y W no están equilibrados: este caso no demuestra vuelo nivelado.');
      if (r.deflection>c.span/2*0.05) warnings.push('Flecha superior al 5 % del semivano: revisar la hipótesis de pequeña deformación.');
      if (r.aspectRatio<3) warnings.push('Alargamiento bajo: revisar el modelo de resistencia inducida.');
      return warnings;
    },
  },
  rocket: {
    title: 'Rocket Lab', subtitle: 'Vehículo espacial de una etapa · masa y Δv ideal', compute: rocket, ranges: ROCKET_RANGES,
    fields: [field('dryMass','Masa seca, incluida carga útil','kg',100,'Balance de masa'),field('propellant','Masa de propelente','kg',200,'Balance de masa'),field('thrust','Empuje constante','N',6000,'Modelo ideal'),field('burnTime','Duración de funcionamiento','s',40,'Modelo ideal'),field('gravity','Gravedad constante de referencia','m/s²',9.80665,'Modelo ideal'),field('burnPercent','Estado del funcionamiento','%',0,'Exploración temporal'),field('diameter','Diámetro visual','m',1.8,'Geometría ilustrativa'),field('length','Longitud visual','m',10,'Geometría ilustrativa')],
    results: [result('initialMass','Masa inicial','kg'),result('finalMass','Masa final','kg'),result('massFlow','Flujo másico constante','kg/s'),result('exhaustVelocity','Velocidad efectiva de escape derivada','m/s'),result('specificImpulse','Impulso específico derivado','s'),result('deltaV','Δv total ideal','m/s'),result('time','Tiempo seleccionado','s'),result('consumed','Propelente consumido','kg'),result('currentMass','Masa actual','kg'),result('currentDeltaV','Δv ideal acumulado','m/s'),result('thrustWeight','Empuje / peso inicial','sin unidad'),result('acceleration','T/m − g en vuelo libre vertical','m/s²'),result('gravityPenalty','Término gravitatorio de referencia','m/s'),result('verticalDeltaV','Δv ideal − gt, vuelo libre vertical','m/s')],
    equations: 'm₀ = mseca + mprop; ṁ = mprop/tfunc; ve = T/ṁ; Isp = ve/g₀, g₀ = 9,80665 m/s². Δv = ve ln(m₀/mseca). Durante el funcionamiento: m(t)=m₀−ṁt y Δv(t)=ve ln[m₀/m(t)]. Referencia vertical en vacío y gravedad constante: aceleración T/m(t)−g; cambio de velocidad = Δv(t)−gt, para un vehículo ya en vuelo libre.',
    limits: 'Una etapa, empuje y flujo constantes, escape efectivo constante, sin resistencia atmosférica, presión variable, etapas ni guiado. Empuje y flujo determinan ve: no son tres controles independientes. El término −gt solo representa vuelo libre vertical en vacío; no calcula despegue desde una plataforma, altitud ni trayectoria orbital. En gravedad cero, empuje/peso está indefinido y se muestra —. La geometría no afecta la masa ni la aerodinámica. No incluye combustibles, construcción de motores, armas ni certificación de vehículos.',
    warnings(c,r) {
      const messages=['Escenario espacial hipotético; no es una trayectoria de lanzamiento.'];
      if(r.thrustWeight!==null && r.thrustWeight<=1) messages.push('Empuje/peso inicial ≤ 1: no demuestra despegue. El término vertical supone vuelo libre, sin contacto con una plataforma.');
      if(r.exhaustVelocity>100000) messages.push('Escape efectivo muy alto: las entradas requieren justificación externa; no corresponden necesariamente a un motor real.');
      return messages;
    },
  },
};
