import * as THREE from 'three';
import { OrbitControls } from '../../vendor/three/OrbitControls.js';
import { visibleCount } from './geometry.js';

export function createViewer(host, report) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Planeta y línea tridimensional; datos numéricos disponibles en las tablas.');
  renderer.domElement.dataset.webgl='true';host.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#080f1c');
  const camera=new THREE.PerspectiveCamera(45,1,.005,1000);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=false;controls.enablePan=true;
  scene.add(new THREE.HemisphereLight(0xc4e3ff,0x162b45,2));
  const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(5,3,5);scene.add(light);
  const material=new THREE.MeshStandardMaterial({color:0x83bdd8,roughness:1});
  const planet=new THREE.Mesh(new THREE.SphereGeometry(1,64,32),material);scene.add(planet);
  const marker=new THREE.Mesh(new THREE.SphereGeometry(.018,12,8),new THREE.MeshBasicMaterial({color:0xffe4a3}));marker.visible=false;scene.add(marker);
  let path=null, times=null, extent=1, texture=null, state=null, unavailable=false, disposed=false, textureFailed=false;
  let yaw=35,pitch=22,distance=5;
  function render(){if(!disposed&&!unavailable)renderer.render(scene,camera);}
  function cameraFromAngles(){
    const a=yaw*Math.PI/180,b=pitch*Math.PI/180;
    camera.position.set(controls.target.x+distance*Math.cos(b)*Math.sin(a),controls.target.y+distance*Math.sin(b),controls.target.z+distance*Math.cos(b)*Math.cos(a));
    controls.update();render();
  }
  function fit(){
    controls.target.set(0,0,0);distance=Math.max(4,extent*3.4);yaw=35;pitch=22;
    camera.near=.005;camera.far=Math.max(1000,extent*100);camera.updateProjectionMatrix();
    controls.minDistance=1.15;controls.maxDistance=Math.max(25,extent*30);cameraFromAngles();
  }
  controls.addEventListener('change',()=>{
    const offset=camera.position.clone().sub(controls.target);distance=offset.length();yaw=Math.atan2(offset.x,offset.z)*180/Math.PI;pitch=Math.asin(offset.y/distance)*180/Math.PI;render();
  });
  function resize(){const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();render();}
  const observer=new ResizeObserver(resize);observer.observe(host);fit();resize();
  const loader=new THREE.TextureLoader();
  loader.load(new URL('../../assets/textures/earth-atmos-2048.jpg',import.meta.url).href,value=>{
    if(disposed){value.dispose();return;}texture=value;texture.colorSpace=THREE.SRGBColorSpace;
    if(state?.body==='earth'){material.map=texture;material.needsUpdate=true;host.dataset.texture='ready';render();report('Tierra con textura local estática cargada.');}
  },undefined,()=>{textureFailed=true;if(state?.body==='earth'){host.dataset.texture='error';report('No se pudo cargar la textura; se conserva esfera simple y modelos 2D.');}});
  renderer.domElement.addEventListener('webglcontextlost',event=>{
    event.preventDefault();unavailable=true;host.dataset.state='lost';host.closest('.globe-panel').querySelectorAll('[data-camera]').forEach(button=>button.disabled=true);report('Se perdió el contexto WebGL. Recarga para recuperar 3D; los cálculos y vistas 2D siguen disponibles.');
  });
  renderer.domElement.addEventListener('webglcontextrestored',()=>{unavailable=false;host.dataset.state='ready';host.closest('.globe-panel').querySelectorAll('[data-camera]').forEach(button=>button.disabled=false);render();report('Contexto WebGL recuperado.');});
  function removePath(){if(path){scene.remove(path);path.geometry.dispose();path.material.dispose();path=null;}marker.visible=false;times=null;}
  return {
    setPath(data){
      removePath();state=data;
      if(!data){planet.visible=false;host.dataset.pathPoints='0';render();return;}
      planet.visible=true;material.map=data.body==='earth'?texture:null;
      material.color.set(data.body==='earth'?0xffffff:data.body==='moon'?0xa4a9b3:data.body==='mars'?0xc17553:0x7094b0);material.needsUpdate=true;
      host.dataset.texture=data.body==='earth'?(texture?'ready':textureFailed?'error':'loading'):'not-applicable';
      const geometry=new THREE.BufferGeometry().setFromPoints(data.points.map(p=>new THREE.Vector3(...p)));
      const lineMaterial=new THREE.LineBasicMaterial({color:data.color??0x8edfcc});
      path=data.closed?new THREE.LineLoop(geometry,lineMaterial):new THREE.Line(geometry,lineMaterial);
      times=data.times??null;if(times)geometry.setDrawRange(0,1);
      scene.add(path);extent=Math.max(1,...data.points.map(p=>Math.hypot(...p)));
      marker.scale.setScalar(Math.max(1,extent*.7));marker.material.color.set(data.color??0xffe4a3);
      host.dataset.pathPoints=String(data.points.length);host.dataset.body=data.body;
      fit();render();
    },
    setPosition(position,time){
      if(!path||!position){marker.visible=false;render();return;}
      marker.position.set(...position);marker.visible=true;
      if(times){const count=visibleCount(times,time);path.geometry.setDrawRange(0,count);host.dataset.visiblePoints=String(count);}
      host.dataset.marker=JSON.stringify(position);render();
    },
    reset:fit,
    turn(dx,dy){yaw+=dx;pitch=Math.max(-85,Math.min(85,pitch+dy));cameraFromAngles();},
    zoom(factor){distance=THREE.MathUtils.clamp(distance*factor,controls.minDistance,controls.maxDistance);cameraFromAngles();},
    dispose(){disposed=true;observer.disconnect();controls.dispose();removePath();planet.geometry.dispose();material.dispose();texture?.dispose();marker.geometry.dispose();marker.material.dispose();renderer.dispose();renderer.domElement.remove();},
  };
}
