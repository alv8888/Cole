import { MATERIALS, SUPPORTS, FIELDS, activeKeys } from './materials.js';
export function validate(config) {
  if(!config || !Object.hasOwn(MATERIALS,config.material) || !['tip','uniform','compression'].includes(config.mode))throw new RangeError('Material o tipo de carga inválido.');
  for(const key of activeKeys(config.mode)){
    const f=FIELDS[key],value=config[key];
    if(f.minPositive&&value>0&&value<f.minPositive)throw new RangeError(`${f.label}: usa cero o al menos ${f.minPositive} ${f.unit} para evitar valores numéricos despreciables.`);
    if(!Number.isFinite(value)||value<f.min||value>f.max)throw new RangeError(`${f.label}: introduce ${f.min}–${f.max} ${f.unit}.`);
  }
  if(config.mode==='compression'){
    if(!Object.hasOwn(SUPPORTS,config.support))throw new RangeError('Apoyos de columna inválidos.');
    if(config.thickness>=config.diameter/2)throw new RangeError('El espesor debe ser menor que la mitad del diámetro exterior.');
  }
  return config;
}
export function cleanConfiguration(config){validate(config);return Object.fromEntries(['material','mode',...activeKeys(config.mode),...(config.mode==='compression'?['support']:[])].map(key=>[key,config[key]]));}
const factor=(limit,demand)=>demand===0?null:limit/demand;
/** SI closed-form models. Factors are comparisons with input references, not certification. */
export function analyze(config) {
  const c=cleanConfiguration(config),L=c.length,E=c.modulus*1e9,ft=c.tensile*1e6,fc=c.compressive*1e6;
  let A,I,stress,moment=0,deflection=null,shortening=null,criticalLoad=null,bucklingFactor=null,slenderness=null,eulerApplicable=false;
  const warnings=[];
  if(c.material==='carbon')warnings.push('Compuesto equivalente hipotético: el coeficiente compara resistencias supuestas, no un límite elástico. Falta análisis del laminado real.');
  let samples;
  if(c.mode==='compression'){
    const D=c.diameter,d=D-2*c.thickness;
    A=Math.PI/4*(D-d)*(D+d);I=Math.PI/64*(D-d)*(D+d)*(D*D+d*d);
    stress=c.force/A;shortening=c.force*L/(E*A);
    const K=SUPPORTS[c.support].k;
    slenderness=K*L/Math.sqrt(I/A);criticalLoad=Math.PI**2*E*I/(K*L)**2;
    // A conservative elastic applicability screen, not a structural design code.
    eulerApplicable=criticalLoad/A<=fc/2;
    bucklingFactor=eulerApplicable?factor(criticalLoad,c.force):null;
    if(!eulerApplicable)warnings.push('Euler no aplicable según el filtro elástico Pcr/A ≤ referencia de compresión/2. No se calcula un margen global de pandeo para esta columna.');
    if(eulerApplicable && c.force>=criticalLoad && c.force>0)warnings.push('La carga alcanza/supera el pandeo ideal de Euler. El acortamiento lineal no describe el estado posterior al pandeo.');
    warnings.push('Compresión axial centrada; no calcula presión interna, excentricidad, flexión, pandeo local de pared ni abolladuras del fuselaje.');
    samples=Array.from({length:81},(_,i)=>({x:L*i/80,displacement:shortening*i/80,moment:0,stress}));
  } else {
    A=c.width*c.height;I=c.width*c.height**3/12;
    moment=c.mode==='tip'?c.force*L:c.distributed*L*L/2;
    stress=moment*(c.height/2)/I;
    deflection=c.mode==='tip'?c.force*L**3/(3*E*I):c.distributed*L**4/(8*E*I);
    if(L/c.height<10)warnings.push('L/altura < 10: la deformación por cortante puede ser relevante; Euler–Bernoulli no la incluye.');
    if(deflection/L>.05)warnings.push('Deflexión superior al 5 % de la longitud: revisar pequeñas deformaciones. La curva es una extrapolación lineal.');
    samples=Array.from({length:81},(_,i)=>{
      const x=L*i/80,M=c.mode==='tip'?c.force*(L-x):c.distributed*(L-x)**2/2;
      const displacement=c.mode==='tip'?c.force*x*x*(3*L-x)/(6*E*I):c.distributed*x*x*(6*L*L-4*L*x+x*x)/(24*E*I);
      return {x,displacement,moment:M,stress:M*c.height/2/I};
    });
    warnings.push('Viga rectangular maciza uniforme; no representa el cajón alar, revestimiento, torsión, uniones ni cargas dinámicas de un ala real.');
  }
  const referenceStrength=c.mode==='compression'?fc:Math.min(ft,fc),materialFactor=factor(referenceStrength,stress);
  if(stress>=referenceStrength)warnings.push('El esfuerzo alcanza/supera la referencia resistente. El modelo elástico lineal no predice el fallo ni el comportamiento posterior.');
  const governingFactor=materialFactor===null?null:eulerApplicable?Math.min(materialFactor,bucklingFactor):materialFactor;
  return {config:c,area:A,inertia:I,moment,stress,deflection,shortening,criticalLoad,bucklingFactor,slenderness,eulerApplicable,referenceStrength,materialFactor,governingFactor,samples,warnings};
}
