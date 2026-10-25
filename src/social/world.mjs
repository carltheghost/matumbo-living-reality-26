/** Dependency-free, software-rendered 3D geometry. This is not a remote social feed. */
export function createWorld(canvas){
  const ctx=canvas.getContext('2d'); if(!ctx)return {open(){},enter(){},reset(){},destroy(){}};
  let yaw=.52,pitch=.24,distance=10,targetDistance=10,opening=0,targetOpen=0,drag=null,frame,dead=false,last=0;
  let w=1,h=1;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gold='#b98c48',dark='#151e24',pearl='#bdb395',cyan='#4fb7b5';
  const v=(x,y,z)=>[x,y,z];
  function rotate(p,a){return [p[0]*Math.cos(a)-p[2]*Math.sin(a),p[1],p[0]*Math.sin(a)+p[2]*Math.cos(a)];}
  function project(p){const q=rotate(p,yaw),y=q[1]*Math.cos(pitch)-q[2]*Math.sin(pitch),z=q[1]*Math.sin(pitch)+q[2]*Math.cos(pitch)+distance;return [w*.52+q[0]*h*1.65/z,h*.57-y*h*1.65/z,z];}
  const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  const faces=[[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[1,5,6,2],[0,3,7,4]];
  function box(list,c,s,color,angle=0,pivot=null){
    const points=vertices.map(a=>{let p=a.map((n,i)=>n*s[i]/2+c[i]);if(pivot){p=p.map((n,i)=>n-pivot[i]);p=rotate(p,angle);p=p.map((n,i)=>n+pivot[i]);}return project(p);});
    faces.forEach((indices,index)=>{const ps=indices.map(i=>points[i]);if(ps.some(p=>p[2]<.2))return;list.push({ps,z:ps.reduce((n,p)=>n+p[2],0)/4,color,alpha:[.83,.9,.7,1,.85,.7][index]});});
  }
  function line(points,color,width=1){ctx.beginPath();points.map(project).forEach((p,i)=>{if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function ring(y,r,color){line(Array.from({length:81},(_,i)=>v(Math.cos(i/80*Math.PI*2)*r,y,Math.sin(i/80*Math.PI*2)*r)),color,1.3);}
  function render(time){
    if(dead)return;frame=requestAnimationFrame(render);if(time-last<32||document.hidden||canvas.getClientRects().length===0)return;last=time;
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    if(rect.width!==w||rect.height!==h){w=Math.max(1,rect.width);h=Math.max(1,rect.height);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
    opening+=(targetOpen-opening)*(reduced?1:.12);distance+=(targetDistance-distance)*(reduced?1:.12);
    ctx.clearRect(0,0,w,h);const bg=ctx.createRadialGradient(w*.52,h*.45,10,w*.52,h*.45,w*.5);bg.addColorStop(0,'#20393b88');bg.addColorStop(.5,'#171e2288');bg.addColorStop(1,'#080d1500');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    for(let i=-7;i<=7;i++){line([v(i,-1.5,-7),v(i,-1.5,7)],'#c59c4a1b');line([v(-7,-1.5,i),v(7,-1.5,i)],'#c59c4a1b');}
    ring(-1.45,2.8,'#84602e');ring(-1.42,2.65,'#e3be75');ring(-1.4,2.55,'#536b6b');ring(-1.37,1.8,'#b78f4c');
    const scene=[];
    box(scene,v(0,-1.23,0),v(3.2,.25,3.2),dark);box(scene,v(0,-1.08,0),v(2.9,.06,2.9),gold);
    for(const x of [-1.4,1.4])for(const z of [-1.4,1.4])box(scene,v(x,.1,z),v(.07,2.4,.07),gold);
    for(const y of [-1.1,1.3]){box(scene,v(0,y,0),v(3,.08,3),dark);for(const z of [-1.5,1.5])box(scene,v(0,y,z),v(3,.05,.05),gold);for(const x of [-1.5,1.5])box(scene,v(x,y,0),v(.05,.05,3),gold);}
    // Terraced inner city: towers, balconies, bridges and a luminous water channel.
    const sites=[[-.95,-.75,.7],[.9,-.7,1.2],[-.8,.6,1.65],[.85,.7,.9],[0,-.2,.8]];
    for(const [x,z,height]of sites){box(scene,v(x,-.95+height/2,z),v(.4,height,.4),pearl);box(scene,v(x,-.9+height,z),v(.58,.08,.58),gold);box(scene,v(x,-.75+height,z),v(.28,.25,.28),dark);box(scene,v(x,-.8+height,z),v(.12,.27,.43),cyan);}
    box(scene,v(0,-.58,.65),v(1.8,.07,.24),gold);box(scene,v(0,-.94,0),v(.25,.1,2.5),cyan);box(scene,v(0,-.72,0),v(.35,.4,.35),gold);
    const a=opening*1.38;
    for(const sign of [-1,1]){
      const pivot=v(sign*1.5,0,-1.51),c=v(sign*.75,.1,-1.51);
      box(scene,c,v(1.48,2.25,.09),dark,sign*a,pivot);
      box(scene,v(sign*.75,1.21,-1.58),v(1.48,.035,.04),gold,sign*a,pivot);
      box(scene,v(sign*.75,-1.01,-1.58),v(1.48,.035,.04),gold,sign*a,pivot);
      box(scene,v(sign*.07,.1,-1.58),v(.04,2.2,.04),gold,sign*a,pivot);
      box(scene,v(sign*.75,.1,-1.61),v(.4,.4,.07),gold,sign*a,pivot);
      box(scene,v(sign*.75,.1,-1.67),v(.23,.23,.04),cyan,sign*a,pivot);
    }
    scene.sort((a,b)=>b.z-a.z).forEach(f=>{ctx.beginPath();f.ps.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.globalAlpha=f.alpha;ctx.fillStyle=f.color;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#edd29b30';ctx.lineWidth=.6;ctx.stroke();});
    ring(1.66,1.6,'#d5b16c99');ring(1.7,1.52,'#57c1c366');
  }
  const down=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};
  const move=e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.009;pitch=Math.max(-.3,Math.min(.9,pitch+(e.clientY-drag[1])*.005));drag=[e.clientX,e.clientY];};
  const up=()=>{drag=null;};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  frame=requestAnimationFrame(render);
  return {open(value=true){targetOpen=value?1:0;},enter(value=true){targetOpen=1;targetDistance=value?6.5:10;},rotate(){yaw+=Math.PI/4;},reset(){yaw=.52;pitch=.24;targetDistance=10;targetOpen=0;},destroy(){dead=true;cancelAnimationFrame(frame);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);}};
}
