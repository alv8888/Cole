/** Educational presets, not certified material allowables. GPa and MPa. */
export const MATERIALS = Object.freeze({
  aluminum: {name:'Aluminio 7075-T6', modulus:71.7, tensile:503, compressive:503, note:'Valores típicos orientativos: E=71,7 GPa y fluencia=503 MPa. Se supone igual fluencia en tracción/compresión; producto, espesor, dirección y temperatura pueden cambiarla.'},
  carbon: {name:'Fibra de carbono · laminado hipotético', modulus:70, tensile:600, compressive:400, note:'Laminado equivalente hipotético: E=70 GPa, resistencia longitudinal a tracción 600 MPa y compresión 400 MPa. No son límites elásticos ni propiedades universales de la fibra. No calcula anisotropía, delaminación ni criterios de fallo de laminados.'},
  titanium: {name:'Titanio · Ti-6Al-4V orientativo', modulus:114, tensile:830, compressive:830, note:'Ejemplo orientativo Ti-6Al-4V: E=114 GPa y fluencia=830 MPa; misma referencia en compresión supuesta. No identifica producto, tratamiento ni lote certificado.'},
  steel: {name:'Acero · ejemplo S355', modulus:210, tensile:355, compressive:355, note:'Ejemplo E=210 GPa y fluencia nominal=355 MPa. El límite de un producto S355 depende de espesor y especificación; aquí se supone igual referencia en compresión.'},
});
export const DEFAULT = Object.freeze({material:'aluminum',mode:'tip',modulus:71.7,tensile:503,compressive:503,length:3,width:.08,height:.12,diameter:.16,thickness:.003,force:5000,distributed:1500,support:'pinned'});
export const SUPPORTS = Object.freeze({pinned:{name:'Articulado–articulado',k:1},fixed:{name:'Empotrado–empotrado',k:.5},mixed:{name:'Empotrado–articulado',k:.699},cantilever:{name:'Empotrado–libre',k:2}});
export const FIELDS = Object.freeze({
  length:{label:'Longitud',unit:'m',min:.1,max:30},
  width:{label:'Ancho de sección rectangular',unit:'m',min:.005,max:2},
  height:{label:'Altura de sección rectangular',unit:'m',min:.005,max:2},
  diameter:{label:'Diámetro exterior del tubo',unit:'m',min:.01,max:5},
  thickness:{label:'Espesor de pared',unit:'m',min:.0001,max:.2},
  force:{label:'Fuerza aplicada',unit:'N',min:0,max:1e7,minPositive:1e-6},
  distributed:{label:'Carga uniforme por longitud',unit:'N/m',min:0,max:1e6,minPositive:1e-6},
  modulus:{label:'Módulo de Young equivalente',unit:'GPa',min:1,max:500},
  tensile:{label:'Referencia resistente a tracción',unit:'MPa',min:1,max:3000},
  compressive:{label:'Referencia resistente a compresión',unit:'MPa',min:1,max:3000},
});
export function activeKeys(mode) {return ['length','modulus','tensile','compressive',...(mode==='compression'?['diameter','thickness','force']:['width','height',mode==='uniform'?'distributed':'force'])];}
