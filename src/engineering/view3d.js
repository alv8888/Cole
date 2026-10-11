/** Lazy WebGL adapter: renderer failure never blocks the physical calculations. */
export function createView3D(canvas,yaw,pitch,kind) {
  const host=canvas.parentElement, status=document.getElementById('vehicle-status');
  const buttons=[...host.querySelectorAll('[data-vehicle-camera]')];
  let viewer=null,latest=null;
  canvas.dataset.state='loading';buttons.forEach(button=>button.disabled=true);yaw.disabled=true;pitch.disabled=true;
  const report=message=>status.textContent=message;
  import('./vehicle-viewer.js').then(({createVehicleViewer})=>{
    try {
      viewer=createVehicleViewer(canvas,yaw,pitch,kind,report);
      buttons.forEach(button=>button.disabled=false);yaw.disabled=false;pitch.disabled=false;canvas.dataset.state='ready';
      if(latest)viewer.update(...latest);
      report('WebGL listo: arrastra para girar, rueda para zoom, botón derecho o dos dedos para desplazar.');
    } catch(error){canvas.dataset.state='unavailable';report(`Visor 3D no disponible: ${error.message}. Los cálculos y gráficas siguen disponibles.`);}
  }).catch(error=>{canvas.dataset.state='unavailable';report(`No se pudo cargar el visor: ${error.message}. Los cálculos siguen disponibles.`);});
  buttons.forEach(button=>button.addEventListener('click',()=>viewer?.action(button.dataset.vehicleCamera)));
  return {update(config,result){latest=[config,result];viewer?.update(config,result);}};
}
