import { setupPresentation, framingBoxDistance } from '../rendering/presentation.js';
import * as THREE from 'three';
import { OrbitControls } from '../../vendor/three/OrbitControls.js';
import { aircraftGeometry, forceArrows, plumePower } from './vehicle-geometry.js';
const colors={lift:0x8edfcc,weight:0xffae92,thrust:0xc0afff,drag:0xffcf70};
const names={lift:'Sustentación',weight:'Peso',thrust:'Empuje',drag:'Arrastre'};
export function createVehicleViewer(canvas,yawInput,pitchInput,kind,report) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  canvas.dataset.webgl='true';
  const scene=new THREE.Scene();scene.background=new THREE.Color('#080f1c');
  const camera=new THREE.PerspectiveCamera(45,1,.01,10000);camera.up.set(0,0,1);
  const controls=new OrbitControls(camera,canvas);controls.enablePan=true;controls.enableDamping=false;
  setupPresentation(THREE, renderer, scene);
  const grid=new THREE.GridHelper(120,40,0x347b89,0x18283d);grid.rotation.x=Math.PI/2;grid.position.z=-3;scene.add(grid);
  const model=new THREE.Group();scene.add(model);
  let extent=10,valid=false,lost=false,plume=null,power=0,animation=false,raf=null,phase=0,last=null,previousSize=null;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const toggle=document.getElementById('plume-animation');
  const legend=document.getElementById('vehicle-legend');
  function render(){if(!lost)renderer.render(scene,camera);}
  function snapshot(){canvas.dataset.camera=JSON.stringify([...camera.position.toArray(),...controls.target.toArray()]);}
  function angles(){const a=Number(yawInput.value)*Math.PI/180,b=Number(pitchInput.value)*Math.PI/180,d=camera.position.distanceTo(controls.target)||extent*2.8;camera.position.set(controls.target.x+d*Math.cos(b)*Math.cos(a),controls.target.y+d*Math.cos(b)*Math.sin(a),controls.target.z+d*Math.sin(b));controls.update();snapshot();render();}
  controls.addEventListener('change',()=>{const v=camera.position.clone().sub(controls.target),d=v.length();yawInput.value=(Math.atan2(v.y,v.x)*180/Math.PI+360)%360;pitchInput.value=Math.max(-80,Math.min(80,Math.asin(v.z/d)*180/Math.PI));snapshot();render();});
  yawInput.addEventListener('input',angles);pitchInput.addEventListener('input',angles);
  function fit(){
    const box=new THREE.Box3().setFromObject(model);
    const center=box.isEmpty()?new THREE.Vector3():box.getCenter(new THREE.Vector3());
    const size=box.isEmpty()?[extent,extent,extent]:box.getSize(new THREE.Vector3()).toArray();
    const yaw=Number(yawInput.value)*Math.PI/180,pitch=Number(pitchInput.value)*Math.PI/180;
    const direction=[Math.cos(pitch)*Math.cos(yaw),Math.cos(pitch)*Math.sin(yaw),Math.sin(pitch)];
    const distance=framingBoxDistance(size,camera.aspect,direction,[0,0,1],camera.fov);
    controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(...direction).multiplyScalar(distance));
    controls.minDistance=extent*.25;controls.maxDistance=extent*20;camera.near=extent/1000;camera.far=extent*100;camera.updateProjectionMatrix();angles();
  }
  function resize(){const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;canvas.dataset.viewport=JSON.stringify([width,height]);camera.updateProjectionMatrix();render();}
  new ResizeObserver(resize).observe(canvas);
  function disposeModel(){model.traverse(node=>{node.geometry?.dispose();if(node.material){const materials=Array.isArray(node.material)?node.material:[node.material];materials.forEach(m=>{m.map?.dispose();m.dispose();});}});model.clear();plume=null;}
  function mesh(geometry,color,position=[0,0,0]){const value=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,metalness:.55,roughness:.35,side:THREE.DoubleSide}));value.position.set(...position);model.add(value);return value;}
  function polygon(points,color){const positions=[];for(let i=1;i<points.length-1;i++)positions.push(...points[0],...points[i],...points[i+1]);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return mesh(geometry,color);}
  function label(text,position,color){const source=document.createElement('canvas');source.width=text==='CG'?96:384;source.height=64;const ctx=source.getContext('2d');ctx.fillStyle='#080f1cee';ctx.fillRect(0,0,source.width,64);ctx.fillStyle=color;ctx.font='bold 28px system-ui';ctx.fillText(text,12,43);const texture=new THREE.CanvasTexture(source);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,transparent:true,sizeAttenuation:false}));sprite.position.copy(position);const width=(text==='CG'?48:154)*2*Math.tan(camera.fov*Math.PI/360)/420;sprite.scale.set(width,width*64/source.width,1);model.add(sprite);}
  function drawAircraft(c,r){
    const g=aircraftGeometry(c,r);extent=Math.max(g.length,c.span);polygon(g.wing,0x599fad);
    const body=mesh(new THREE.CylinderGeometry(.15,.45,g.length,24),0x90b9d0);body.rotation.z=-Math.PI/2;
    polygon([[-g.length*.3,-1.8,.05],[-g.length*.48,0,.05],[-g.length*.3,1.8,.05],[-g.length*.22,0,.05]],0x9d8fe2);
    polygon([[-g.length*.45,0,0],[-g.length*.38,0,1.4],[-g.length*.23,0,0]],0x9d8fe2);
    const origin=new THREE.Vector3(...g.cg);mesh(new THREE.SphereGeometry(extent*.012,12,8),0xffe4a3,g.cg);
    label('CG',origin.clone().add(new THREE.Vector3(0,extent*.12,extent*.02)),'#ffe4a3');
    const arrows=forceArrows(r,extent);canvas.dataset.forces=JSON.stringify(arrows);canvas.dataset.cg=JSON.stringify(g.cg);
    arrows.forEach(item=>{if(item.magnitude===0)return;const direction=new THREE.Vector3(...item.vector).normalize();const arrow=new THREE.ArrowHelper(direction,origin,item.length,colors[item.name],Math.min(item.length*.25,extent*.09),Math.min(item.length*.12,extent*.04));arrow.line.material.depthTest=false;arrow.cone.material.depthTest=false;model.add(arrow);label(`${names[item.name]} ${item.magnitude.toFixed(0)} N`,origin.clone().addScaledVector(direction,item.length+extent*.06).add(new THREE.Vector3(0,0,item.name==='thrust'?extent*.16:item.name==='drag'?-extent*.16:0)),`#${colors[item.name].toString(16)}`);});
    legend.textContent=arrows.length?'CG dorado · Sustentación verde · Peso coral · Empuje violeta · Arrastre ámbar. Longitudes a escala común, normalizada al vector mayor; +x delante, +y lateral, +z arriba. Vectores trasladados al CG para comparar, sin calcular momentos.':'Viento lateral: solo magnitudes disponibles. Se ocultan las flechas porque el modelo no calcula direcciones 3D.';
  }
  function drawRocket(c,r){
    extent=c.length;const radius=c.diameter/2;
    const body=mesh(new THREE.CylinderGeometry(radius,radius,c.length*.8,32),0x91a6c1,[0,0,-c.length*.1]);body.rotation.x=Math.PI/2;
    const nose=mesh(new THREE.ConeGeometry(radius,c.length*.2,32),0x8edfcc,[0,0,c.length*.4]);nose.rotation.x=Math.PI/2;
    // Cone axis is Y: rotate to +Z for the nose, -Z for exhaust.
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;polygon([[radius*Math.cos(a),radius*Math.sin(a),-c.length*.5],[radius*2*Math.cos(a),radius*2*Math.sin(a),-c.length*.5],[radius*Math.cos(a),radius*Math.sin(a),-c.length*.3]],0xb2a2ec);}
    const nozzle=mesh(new THREE.CylinderGeometry(radius*.45,radius*.65,c.length*.05,24),0x3f536c,[0,0,-c.length*.51]);nozzle.rotation.x=Math.PI/2;
    power=plumePower(c);plume=new THREE.Group();plume.position.z=-c.length*.535;model.add(plume);
    for(const [factor,color,opacity] of [[1,0xff6a31,.45],[.65,0xffcb63,.75],[.35,0xe1f8ff,.95]]){const geometry=new THREE.ConeGeometry(radius*.6*factor,c.length*.35*factor,24);geometry.translate(0,c.length*.35*factor/2,0);const fire=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));fire.rotation.x=-Math.PI/2;plume.add(fire);}
    const glow=new THREE.PointLight(0xff9b45,power*20,extent*2);glow.position.z=-extent*.6;model.add(glow);
    plume.visible=power>0;
    // Scale longitudinal Z after rotation of cone children.
    plume.scale.set(Math.sqrt(power),Math.sqrt(power),power);
    canvas.dataset.plumePower=String(power);canvas.dataset.appliedThrust=String(r.appliedThrust);canvas.dataset.forces='[]';
    legend.textContent=`Empuje aplicado: ${r.appliedThrust.toFixed(1)} N (${c.thrustPercent??100} % del nominal). Pluma ilustrativa ${power?'activa':'apagada: propelente agotado'}; no calcula temperatura, presión ni expansión de gases.`;
    toggle.disabled=!power;
  }
  function stop(){animation=false;if(raf!==null)cancelAnimationFrame(raf);raf=null;last=null;if(toggle){toggle.textContent='Animar pluma';toggle.setAttribute('aria-pressed','false');}canvas.dataset.animating='false';}
  function tick(now){if(!animation||lost||document.hidden||canvas.closest('[role=tabpanel]')?.hidden){stop();return;}if(last!==null)phase+=Math.min((now-last)/1000,.1);last=now;if(plume){const pulse=1+.07*Math.sin(phase*27);plume.scale.set(Math.sqrt(power)*pulse,Math.sqrt(power)*pulse,power*(1+.1*Math.sin(phase*19)));}render();canvas.dataset.frame=String(now);raf=requestAnimationFrame(tick);}
  toggle?.addEventListener('click',()=>{if(animation)stop();else if(power&&!lost){animation=true;toggle.textContent='Pausar pluma';toggle.setAttribute('aria-pressed','true');canvas.dataset.animating='true';raf=requestAnimationFrame(tick);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});document.addEventListener('aerolab:tabchange',event=>{if(event.detail.tab!=='simulation')stop();});motion.addEventListener('change',()=>{if(motion.matches)stop();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;stop();canvas.dataset.state='lost';yawInput.disabled=true;pitchInput.disabled=true;canvas.parentElement.querySelectorAll('[data-vehicle-camera]').forEach(button=>button.disabled=true);if(toggle)toggle.disabled=true;report('Contexto WebGL perdido. Los resultados numéricos siguen disponibles; recarga para recuperar el visor.');});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;canvas.dataset.state='ready';yawInput.disabled=false;pitchInput.disabled=false;canvas.parentElement.querySelectorAll('[data-vehicle-camera]').forEach(button=>button.disabled=false);if(toggle)toggle.disabled=!power||!valid;render();report('Contexto WebGL recuperado.');});
  resize();fit();
  return {
    update(config,result){stop();disposeModel();valid=!!result;canvas.dataset.valid=String(valid);if(!valid){legend.textContent='Corrige los parámetros para ver el modelo y sus fuerzas.';canvas.dataset.forces='[]';canvas.dataset.plumePower='0';if(toggle)toggle.disabled=true;render();return;}
      if(kind==='aircraft')drawAircraft(config,result);else drawRocket(config,result);
      grid.scale.setScalar(extent*2.4/120);
    grid.position.z=-extent*.6;const size=kind==='aircraft'?Math.max(extent,config.span):extent;if(size!==previousSize){fit();previousSize=size;}render();
      if(kind==='rocket'&&power&&!motion.matches){animation=true;toggle.textContent='Pausar pluma';toggle.setAttribute('aria-pressed','true');canvas.dataset.animating='true';raf=requestAnimationFrame(tick);}
    },
    action(action){if(lost)return;if(action==='reset'){yawInput.value=30;pitchInput.value=20;fit();}else if(action==='in'||action==='out'){const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*(action==='in'?.8:1.25),controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();render();}else{const delta=new THREE.Vector3(action==='left'?-extent*.1:action==='right'?extent*.1:0,0,action==='up'?extent*.1:-extent*.1);camera.position.add(delta);controls.target.add(delta);controls.update();render();}}
  };
}
