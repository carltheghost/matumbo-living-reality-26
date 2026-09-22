import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const COLORS={A:0x69cfff,B:0xf0c56b,C:0x91a4ff,D:0xff91c0,E:0xb98dff};
const color=category=>COLORS[category]||0x9fb6d8;
const ENTITY_COLORS={matter:0xdde9ff,antimatter:0xff789f};

function entityColor(entity){
  return ENTITY_COLORS[entity.matterKind]||0xb8c6dc;
}

function seeded(seed){
  let x=0x9e3779b9;
  for(const ch of seed)x=((x^ch.charCodeAt(0))*1664525+1013904223)>>>0;
  return()=>{
    x=(x*1664525+1013904223)>>>0;
    return x/4294967296;
  };
}

export function createRealityProjection(canvas,engine,workspace=null){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.setClearColor(0x000000,0);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(42,1,.1,1000);
  camera.position.set(0,4.8,14.8);

  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;
  controls.dampingFactor=.055;
  controls.minDistance=4.2;
  controls.maxDistance=30;
  controls.target.set(0,0,0);
  controls.update();

  scene.add(new THREE.AmbientLight(0x7894bd,1.12));
  const key=new THREE.PointLight(0xffffff,155,45,2);
  key.position.set(4,8,8);
  scene.add(key);
  const rim=new THREE.PointLight(0x7aaeff,115,40,2);
  rim.position.set(-8,-3,-7);
  scene.add(rim);

  const root=new THREE.Group();
  root.name='Reality Lattice Omega';
  scene.add(root);

  const lens=new THREE.Group();
  lens.name='Reality Lens Omega';
  scene.add(lens);

  const surfaceRoot=new THREE.Group();
  surfaceRoot.name='maTumbo Spatial Surfaces';
  scene.add(surfaceRoot);

  const workspaceRoot=new THREE.Group();
  workspaceRoot.name='maTumbo Workspace Objects';
  scene.add(workspaceRoot);

  const starGeometry=new THREE.BufferGeometry();
  const rand=seeded('reality-lattice-omega-026');
  const starPositions=new Float32Array(1100*3);
  for(let i=0;i<1100;i++){
    starPositions[i*3]=(rand()-.5)*80;
    starPositions[i*3+1]=(rand()-.5)*48;
    starPositions[i*3+2]=(rand()-.5)*80;
  }
  starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));
  scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({
    color:0x90a7c6,size:.035,transparent:true,opacity:.4
  })));

  const nodeGeometry=new THREE.IcosahedronGeometry(.34,2);
  const ringGeometry=new THREE.RingGeometry(.5,.53,48);
  const lensGeometry=new THREE.SphereGeometry(1.05,32,24);
  const entityGeometry=new THREE.SphereGeometry(.075,10,8);
  const blockGeometry=new THREE.BoxGeometry(.26,.18,.26);
  const surfaceGeometry=new THREE.IcosahedronGeometry(.19,1);
  const surfaceRingGeometry=new THREE.RingGeometry(.27,.30,32);

  const nodes=new Map();
  const edges=new Map();
  const surfaceNodes=new Map();
  const nodeMaterials=new Set();
  const edgeMaterials=new Set();
  const entityMaterials=new Set();
  const surfaceMaterials=new Set();
  let entityObjects=[];
  const workspaceObjects=new Map();
  const workspaceMaterials=new Set();
  let surfaceSelectHandler=null;
  let semanticFocusHandler=null;

  const lensMaterial=new THREE.MeshBasicMaterial({
    color:0x79d9ff,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false
  });
  const lensRingMaterial=new THREE.MeshBasicMaterial({
    color:0xb7ecff,transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false
  });
  const lensCore=new THREE.Mesh(lensGeometry,lensMaterial);
  const lensRing=new THREE.Mesh(ringGeometry,lensRingMaterial);
  lensRing.rotation.x=Math.PI/2;
  lens.add(lensCore,lensRing);

  function worldPosition(index,total){
    const angle=index*Math.PI*2/Math.max(1,total);
    const radius=Math.min(7.5,5.1+total*.22);
    return new THREE.Vector3(
      Math.cos(angle)*radius,
      Math.sin(index*2.1)*1.55,
      Math.sin(angle)*radius
    );
  }

  function surfacePosition(index,total){
    const angle=index*Math.PI*2/Math.max(1,total)-Math.PI/2;
    const radius=3.05+Math.min(.55,total*.035);
    return new THREE.Vector3(
      Math.cos(angle)*radius,
      Math.sin(index*1.7)*.34,
      Math.sin(angle)*radius
    );
  }

  function clearEntityLens(){
    for(const object of entityObjects)object.removeFromParent();
    for(const material of entityMaterials)material.dispose?.();
    entityMaterials.clear();
    entityObjects=[];
  }

  function clearWorldProjection(){
    for(const group of nodes.values())group.removeFromParent();
    for(const material of nodeMaterials)material.dispose?.();
    nodeMaterials.clear();
    for(const line of edges.values())line.removeFromParent();
    for(const material of edgeMaterials)material.dispose?.();
    for(const line of edges.values())line.geometry.dispose?.();
    nodes.clear();
    edges.clear();
    clearEntityLens();
  }

  function clearSurfaceProjection(){
    for(const group of surfaceNodes.values())group.removeFromParent();
    for(const material of surfaceMaterials)material.dispose?.();
    surfaceNodes.clear();
    surfaceMaterials.clear();
  }

  function clearWorkspaceProjection(){
    for(const object of workspaceObjects.values())object.removeFromParent();
    for(const material of workspaceMaterials)material.dispose?.();
    workspaceObjects.clear();
    workspaceMaterials.clear();
  }

  function workspaceColor(block){
    if(block.type==='contract')return 0xf1c76b;
    if(block.type==='nft')return 0xff91c0;
    if(block.type==='input'||block.type==='lens')return 0x8edbff;
    if(block.type==='fabric')return 0xb88dff;
    if(block.type==='service-block')return 0x91a4ff;
    return 0xaebed8;
  }

  function surfaceColor(surface){
    if(surface.id==='contracts')return 0xf1c76b;
    if(surface.id==='arena')return 0xff91c0;
    if(surface.id==='rooms')return 0x91a4ff;
    if(surface.id==='profile')return 0x8edbff;
    if(surface.id==='wardrobe')return 0xf0d28e;
    if(surface.id==='nft')return 0xff91c0;
    if(surface.id==='ledger'||surface.id==='prime')return 0xb88dff;
    if(surface.id==='lens')return 0x8edbff;
    if(surface.id==='commerce')return 0x91a4ff;
    if(surface.id==='agents')return 0xc1a7ff;
    return 0x8aaee0;
  }

  function rebuildSurfaces(){
    clearSurfaceProjection();
    if(!workspace?.state?.surfaces)return;
    const surfaces=workspace.state.surfaces;
    surfaces.forEach((surface,index)=>{
      const group=new THREE.Group();
      group.position.copy(surfacePosition(index,surfaces.length));
      group.userData.surfaceId=surface.id;
      group.userData.baseY=group.position.y;

      const active=surface.id===workspace.state.activeSurface;
      const baseColor=surfaceColor(surface);
      const material=new THREE.MeshStandardMaterial({
        color:baseColor,
        emissive:baseColor,
        emissiveIntensity:active?.8:.22,
        metalness:.5,
        roughness:.22,
        transparent:true,
        opacity:active?.96:.72
      });
      surfaceMaterials.add(material);

      const mesh=new THREE.Mesh(surfaceGeometry,material);
      mesh.userData.surfaceId=surface.id;
      mesh.scale.setScalar(active?1.35:1);
      group.add(mesh);

      const haloMaterial=new THREE.MeshBasicMaterial({
        color:baseColor,
        transparent:true,
        opacity:active?.52:.16,
        side:THREE.DoubleSide,
        depthWrite:false
      });
      surfaceMaterials.add(haloMaterial);
      const halo=new THREE.Mesh(surfaceRingGeometry,haloMaterial);
      halo.rotation.x=Math.PI/2;
      halo.userData.surfaceId=surface.id;
      group.add(halo);

      surfaceRoot.add(group);
      surfaceNodes.set(surface.id,group);
    });
  }

  function rebuildLens(){
    clearEntityLens();
    const selected=engine.get(engine.selectedId);
    const selectedColor=color(selected.category);
    lensMaterial.color.setHex(selectedColor);
    lensRingMaterial.color.setHex(selectedColor);
    const entities=selected.entities.slice(0,96);
    const count=Math.max(1,entities.length);
    entities.forEach((entity,index)=>{
      const material=new THREE.MeshBasicMaterial({
        color:entityColor(entity),transparent:true,opacity:.92
      });
      entityMaterials.add(material);
      const mesh=new THREE.Mesh(entityGeometry,material);
      mesh.userData.entityId=entity.id;
      mesh.userData.lineageId=entity.lineageId;
      const angle=index*Math.PI*2/count;
      const fourth=Number(entity.position?.[3]||0);
      const radius=1.25+Math.min(.7,Math.abs(fourth)*.18);
      mesh.position.set(
        Math.cos(angle)*radius,
        fourth*.08+Math.sin(angle*2)*.22,
        Math.sin(angle)*radius
      );
      lens.add(mesh);
      entityObjects.push(mesh);
    });
  }

  function rebuildWorkspace(){
    clearWorkspaceProjection();
    if(!workspace?.state?.blocks)return;
    const blocks=workspace.state.blocks.slice(0,80);
    blocks.forEach((block,index)=>{
      const baseColor=workspaceColor(block);
      const material=new THREE.MeshStandardMaterial({
        color:baseColor,
        emissive:baseColor,
        emissiveIntensity:block.type==='lens'?.8:.25,
        metalness:.55,
        roughness:.24,
        transparent:true,
        opacity:.9
      });
      workspaceMaterials.add(material);
      const mesh=new THREE.Mesh(blockGeometry,material);
      const p=Array.isArray(block.position)?block.position:[0,.7,0];
      mesh.position.set(
        Number(p[0]||0),
        Number(p[1]||.7)+.05*(index%3),
        Number(p[2]||0)
      );
      mesh.userData.baseY=mesh.position.y;
      mesh.rotation.set(.22*index,.31*index,.17*index);
      mesh.scale.setScalar(block.type==='lens'?1.35:1);
      mesh.userData.blockId=block.id;
      mesh.userData.blockType=block.type;
      workspaceRoot.add(mesh);
      workspaceObjects.set(block.id,mesh);
    });
  }

  function rebuild(){
    clearWorldProjection();
    const realities=engine.list();

    realities.forEach((state,index)=>{
      const group=new THREE.Group();
      group.position.copy(worldPosition(index,realities.length));
      group.userData.realityId=state.id;

      const material=new THREE.MeshStandardMaterial({
        color:color(state.category),
        emissive:color(state.category),
        emissiveIntensity:state.id===engine.selectedId?.7:.2,
        metalness:.35,
        roughness:.28
      });
      nodeMaterials.add(material);

      const mesh=new THREE.Mesh(nodeGeometry,material);
      mesh.userData.realityId=state.id;
      group.add(mesh);

      const ringMaterial=new THREE.MeshBasicMaterial({
        color:color(state.category),
        transparent:true,
        opacity:state.id===engine.selectedId?.4:.18,
        side:THREE.DoubleSide
      });
      nodeMaterials.add(ringMaterial);
      const ring=new THREE.Mesh(ringGeometry,ringMaterial);
      ring.rotation.x=Math.PI/2;
      group.add(ring);

      root.add(group);
      nodes.set(state.id,group);
    });

    for(const edge of engine.edges.values()){
      const from=nodes.get(edge.from);
      const to=nodes.get(edge.to);
      if(!from||!to||!edge.active)continue;
      const edgeColor=edge.type==='mirror'?0xf1c76b:
        edge.type==='anti'?0xff6f9f:
        edge.type==='fork'?0x8fb6ff:
        edge.type==='research'?0x91a4ff:
        edge.type==='transform'?0xb68dff:
        edge.type==='rewind'?0xb7d7ff:0x80dfff;
      const material=new THREE.LineBasicMaterial({
        color:edgeColor,
        transparent:true,
        opacity:edge.type==='merge'?.42:.7
      });
      edgeMaterials.add(material);
      const line=new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([from.position,to.position]),
        material
      );
      line.userData.edgeId=edge.id;
      line.userData.relation=edge.type;
      root.add(line);
      edges.set(edge.id,line);
    }

    rebuildSurfaces();
    rebuildLens();
    rebuildWorkspace();
  }

  function resize(){
    const rect=canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);
    camera.aspect=Math.max(1,rect.width)/Math.max(1,rect.height);
    camera.updateProjectionMatrix();
  }

  const ray=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  const dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const dragPoint=new THREE.Vector3();
  let dragging=null;
  let wasDragged=false;

  function updatePointer(event){
    const rect=canvas.getBoundingClientRect();
    pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
    pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
    ray.setFromCamera(pointer,camera);
  }

  function beginDrag(event){
    updatePointer(event);
    const hit=ray.intersectObjects([...workspaceObjects.values()],true)[0];
    if(!hit)return false;
    const object=hit.object;
    const blockId=object.userData?.blockId;
    if(!blockId||!workspace?.moveBlock)return false;
    dragging={blockId,object,pointerId:event.pointerId};
    wasDragged=false;
    dragPlane.set(new THREE.Vector3(0,1,0),-object.position.y);
    controls.enabled=false;
    canvas.setPointerCapture?.(event.pointerId);
    return true;
  }

  function moveDrag(event){
    if(!dragging)return false;
    updatePointer(event);
    if(!ray.ray.intersectPlane(dragPlane,dragPoint))return false;
    const block=workspace.moveBlock(
      dragging.blockId,
      [dragPoint.x,dragging.object.position.y,dragPoint.z]
    );
    dragging.object.position.set(block.position[0],block.position[1],block.position[2]);
    dragging.object.userData.baseY=block.position[1];
    wasDragged=true;
    return true;
  }

  function endDrag(){
    if(!dragging)return false;
    canvas.releasePointerCapture?.(dragging.pointerId);
    dragging=null;
    controls.enabled=true;
    return true;
  }

  function pick(event){
    if(wasDragged){
      wasDragged=false;
      return false;
    }
    updatePointer(event);

    const objectHit=ray.intersectObjects([...workspaceObjects.values()],true)[0];
    if(objectHit){
      const objectId=objectHit.object.userData?.blockId;
      if(objectId&&workspace?.semanticLens?.focusObject){
        const focus=workspace.semanticLens.focusObject(objectId);
        semanticFocusHandler?.(focus);
        return true;
      }
    }

    const surfaceHit=ray.intersectObjects([...surfaceNodes.values()],true)[0];
    if(surfaceHit){
      const surfaceId=surfaceHit.object.userData?.surfaceId||surfaceHit.object.parent?.userData?.surfaceId;
      if(surfaceId&&workspace?.selectSurface){
        workspace.selectSurface(surfaceId);
        surfaceSelectHandler?.(surfaceId);
        return true;
      }
    }

    const worldHit=ray.intersectObjects(
      [...nodes.values()].flatMap(group=>group.children),
      true
    )[0];
    if(!worldHit)return false;
    const id=worldHit.object.userData?.realityId||worldHit.object.parent?.userData?.realityId;
    if(!id)return false;
    engine.select(id);
    if(workspace?.semanticLens?.focusWorld) semanticFocusHandler?.(workspace.semanticLens.focusWorld(id));
    rebuild();
    return true;
  }

  canvas.addEventListener('pointerdown',beginDrag);
  canvas.addEventListener('pointermove',moveDrag);
  canvas.addEventListener('pointerup',endDrag);
  canvas.addEventListener('pointercancel',endDrag);
  canvas.addEventListener('click',pick);
  window.addEventListener('resize',resize);

  rebuild();
  resize();

  function animate(t){
    root.rotation.y=t*.025;
    lens.rotation.y=-t*.08;
    lens.rotation.x=Math.sin(t*.27)*.06;
    surfaceRoot.rotation.y=-t*.018;

    for(const [id,group] of nodes){
      const selected=id===engine.selectedId;
      group.rotation.y=-t*(selected?.16:.08);
      group.scale.setScalar((selected?1.16:1)*(1+Math.sin(t*2+id.length)*.03));
    }

    for(const [id,group] of surfaceNodes){
      const focus=workspace?.semanticLens?.snapshot?.();
      const focused=focus?.level==='surface'&&focus.targetId===id;
      const active=id===workspace?.state?.activeSurface;
      const pulse=1+Math.sin(t*2.2+id.length)*.045;
      group.position.y=Number(group.userData.baseY||0)+Math.sin(t*1.2+id.length)*.12;
      group.scale.setScalar(((focused||active)?1.23:1)*pulse);
      group.rotation.y=t*(active?.28:.08);
    }

    entityObjects.forEach((object,index)=>{
      const angle=t*(.18+.015*index)+index*1.7;
      const radius=1.3+(index%3)*.16;
      object.position.x=Math.cos(angle)*radius;
      object.position.z=Math.sin(angle)*radius;
      object.scale.setScalar(1+Math.sin(t*3+index)*.18);
    });

    workspaceObjects.forEach((object,index)=>{
      const base=object.userData.blockId?.length||index;
      object.position.y=Number(object.userData.baseY||0)+Math.sin(t*1.4+base)*.06;
      object.rotation.y+=.0015*(index+1);
      const active=workspace?.surface?.id;
      const type=object.userData.blockType;
      const focus=workspace?.semanticLens?.snapshot?.();
      const objectFocused=focus?.level==='object'&&focus.targetId===object.userData.blockId;
      const interactionFocused=focus?.level==='interaction'&&focus.parentId===object.userData.blockId;
      const roomFocused=focus?.level==='room'&&workspace?.state?.blocks?.find(item=>item.id===object.userData.blockId)?.roomId===focus.targetId;
      const boost=
        active==='contracts'&&type==='contract' ||
        active==='lens'&&(type==='lens'||type==='input') ||
        active==='nft'&&type==='nft' ||
        active==='prime'&&type==='fabric';
      const semanticBoost=objectFocused||interactionFocused?2.05:roomFocused?1.48:1;
      if(object.material?.opacity!==undefined) object.material.opacity=(objectFocused||interactionFocused)?.98:roomFocused?.58:.9;
      object.scale.setScalar((boost?1.35:1)*semanticBoost*(type==='lens'?1.1:1));
    });

    controls.update();
    renderer.render(scene,camera);
  }

  return {
    rebuild,
    resize,
    animate,
    setSurfaceHandler(handler){
      surfaceSelectHandler=typeof handler==='function'?handler:null;
      return this;
    },
    setSemanticFocusHandler(handler){
      semanticFocusHandler=typeof handler==='function'?handler:null;
      return this;
    },
    select(id){
      engine.select(id);
      rebuild();
      return engine.get(id);
    },
    destroy(){
      clearWorldProjection();
      clearSurfaceProjection();
      clearWorkspaceProjection();
      starGeometry.dispose();
      lensGeometry.dispose();
      nodeGeometry.dispose();
      ringGeometry.dispose();
      entityGeometry.dispose();
      blockGeometry.dispose();
      surfaceGeometry.dispose();
      surfaceRingGeometry.dispose();
      lensMaterial.dispose();
      lensRingMaterial.dispose();
      renderer.dispose();
    }
  };
}
