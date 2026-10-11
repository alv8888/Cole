/** Lazy dependency: WebGL/library failure never prevents the physics or SVG UI. */
export function createGlobePanel(root) {
  const host=root.querySelector('.globe-host'),status=root.querySelector('.globe-status');
  const controls=[...root.querySelectorAll('[data-camera]')];
  let viewer=null,latestPath=null,latestPosition=null,latestTime=0;
  controls.forEach(button=>button.disabled=true);host.dataset.state='loading';
  const report=message=>status.textContent=message;
  controls.forEach(button=>button.addEventListener('click',()=>{
    if(!viewer||host.dataset.state!=='ready')return;
    const action=button.dataset.camera;
    if(action==='reset')viewer.reset();
    else if(action==='in')viewer.zoom(.8);else if(action==='out')viewer.zoom(1.25);
    else viewer.turn(action==='left'?-15:action==='right'?15:0,action==='up'?15:action==='down'?-15:0);
  }));
  import('./viewer.js').then(({createViewer})=>{
    try{
      viewer=createViewer(host,report);host.dataset.state='ready';controls.forEach(button=>button.disabled=false);
      viewer.setPath(latestPath);if(latestPosition)viewer.setPosition(latestPosition,latestTime);
      report('Vista WebGL lista. Arrastra para girar, rueda o gesto de pinza para acercar; botones disponibles por teclado.');
    }catch(error){host.dataset.state='unavailable';report(`Vista 3D no disponible: ${error.message}. Continúa con las gráficas y resultados 2D.`);}
  }).catch(error=>{host.dataset.state='unavailable';report(`No se pudo cargar Three.js: ${error.message}. Las vistas 2D siguen disponibles.`);});
  return {
    setPath(data){root.querySelector('.globe-caption').textContent=data?.description??'Sin trayectoria válida; calcula o corrige las entradas.';latestPath=data;latestPosition=null;viewer?.setPath(data);},
    setPosition(point,time=0){latestPosition=point;latestTime=time;viewer?.setPosition(point,time);},
  };
}
