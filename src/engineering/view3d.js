/** Orthographic projection of actual 3D vertices; illustrative geometry, not CFD/CAD. */
function geometry(kind, c, r) {
  if (kind === 'aircraft') {
    const length = Math.max(8, r.rootChord * 4);
    const front = r.rootChord / 4;
    const tipFront = front - c.span * 0.16;
    const wing = [[front,0,0],[tipFront,c.span/2,0],[tipFront-r.tipChord,c.span/2,0],[front-r.rootChord,0,0],[tipFront-r.tipChord,-c.span/2,0],[tipFront,-c.span/2,0]];
    const nose=[length/2,0,0], tail=[-length/2,0,0];
    const ring=[[length*0.15,0.4,0],[length*0.15,0,0.45],[length*0.15,-0.4,0],[length*0.15,0,-0.3]];
    const faces=[{points:wing,color:'#6fb2bb'}, {points:[[-length*.32,-1.8,0],[-length*.47,0,0],[-length*.32,1.8,0],[-length*.25,0,0]],color:'#82b5d0'}, {points:[[-length*.45,0,0],[-length*.4,0,1.4],[-length*.25,0,0]],color:'#b4b6e8'}];
    ring.forEach((point,i)=>{
      faces.push({points:[nose,point,ring[(i+1)%4]],color:'#98c5d5'});
      faces.push({points:[tail,point,ring[(i+1)%4]],color:'#557f9c'});
    });
    const meanChordY=c.span/6*(1+2*c.taper)/(1+c.taper);
    return {faces,marker:[front-0.32*meanChordY-r.meanChord*c.cg/100,0,0.15]};
  }
  const faces=[];
  const radius=c.diameter/2, bottom=-c.length/2, top=c.length*.3, apex=[0,0,c.length/2];
  for(let i=0;i<24;i++){
    const a=i*2*Math.PI/24,b=(i+1)*2*Math.PI/24;
    const lowA=[radius*Math.cos(a),radius*Math.sin(a),bottom], lowB=[radius*Math.cos(b),radius*Math.sin(b),bottom];
    const highA=[lowA[0],lowA[1],top],highB=[lowB[0],lowB[1],top];
    faces.push({points:[lowA,lowB,highB,highA],color:i%4===0?'#b3abda':'#708aa7'});
    faces.push({points:[highA,highB,apex],color:'#8edfcc'});
  }
  for(let i=0;i<3;i++){
    const a=i*2*Math.PI/3;
    faces.push({points:[[radius*Math.cos(a),radius*Math.sin(a),bottom],[radius*2*Math.cos(a),radius*2*Math.sin(a),bottom],[radius*Math.cos(a),radius*Math.sin(a),bottom+c.length*.18]],color:'#9cb5d9'});
  }
  return {faces,marker:null};
}

export function createView3D(canvas, yawInput, pitchInput, kind) {
  const ctx=canvas.getContext('2d');
  let current=null;
  function draw(){
    const width=canvas.clientWidth,height=360,dpr=Math.min(devicePixelRatio||1,2);
    if(!width)return;
    canvas.width=Math.round(width*dpr);canvas.height=height*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    ctx.fillStyle='#0c1420';ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='#202f42';
    for(let x=0;x<width;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
    for(let y=0;y<height;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
    if(!current){ctx.fillStyle='#ffb2ac';ctx.fillText('Corrige los parámetros para ver el modelo.',20,180);return;}
    const {config,result}=current;
    const {faces,marker}=geometry(kind,config,result);
    const yaw=Number(yawInput.value)*Math.PI/180,pitch=Number(pitchInput.value)*Math.PI/180;
    function rotate([x,y,z]){
      const horizontal=x*Math.cos(yaw)-y*Math.sin(yaw), transverse=x*Math.sin(yaw)+y*Math.cos(yaw);
      return [horizontal,z*Math.cos(pitch)-transverse*Math.sin(pitch),z*Math.sin(pitch)+transverse*Math.cos(pitch)];
    }
    const rotated=faces.map(face=>({color:face.color,points:face.points.map(rotate)}));
    const points=rotated.flatMap(face=>face.points);
    const scale=Math.min((width-60)/Math.max(...points.map(p=>Math.abs(p[0])*2),1),(height-90)/Math.max(...points.map(p=>Math.abs(p[1])*2),1));
    const project=p=>[width/2+p[0]*scale,height/2-p[1]*scale];
    rotated.sort((a,b)=>a.points.reduce((sum,p)=>sum+p[2],0)/a.points.length-b.points.reduce((sum,p)=>sum+p[2],0)/b.points.length);
    rotated.forEach(face=>{
      ctx.beginPath();face.points.map(project).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
      ctx.fillStyle=face.color;ctx.globalAlpha=.8;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#d2e3ec';ctx.lineWidth=.7;ctx.stroke();
    });
    ctx.font='12px system-ui';ctx.fillStyle='#a1afc2';
    ctx.fillText('Geometría 3D · proyección ortográfica · arrastra para rotar',16,22);
    if(marker){const [x,y]=project(rotate(marker));ctx.fillStyle='#ffd698';ctx.beginPath();ctx.arc(x,y,4,0,2*Math.PI);ctx.fill();ctx.fillText('CG',x+8,y);}
    if(kind==='aircraft') ctx.fillText(`L ${Math.round(result.lift)} N · D ${Math.round(result.drag)} N · W ${Math.round(result.weight)} N`,16,height-16);
    else ctx.fillText(`Propelente restante: ${(100-config.burnPercent).toFixed(1)} % (masa, no volumen)`,16,height-16);
  }
  yawInput.addEventListener('input',draw);pitchInput.addEventListener('input',draw);
  let drag=null;
  canvas.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY,yaw:Number(yawInput.value),pitch:Number(pitchInput.value)};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!drag)return;yawInput.value=(drag.yaw+(event.clientX-drag.x)*.5+720)%360;pitchInput.value=Math.max(-80,Math.min(80,drag.pitch-(event.clientY-drag.y)*.5));draw();});
  canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
  new ResizeObserver(draw).observe(canvas);
  return {update(config,result){current=result?{config,result}:null;draw();}};
}
