import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const COLORS={A:0x69cfff,B:0xf0c56b,C:0x91a4ff,D:0xff91c0,E:0xb98dff};
const color=c=>COLORS[c]||0x9fb6d8;
const ENTITY_COLORS={matter:0xdde9ff,antimatter:0xff789f};

function entityColor(entity){
  return ENTITY_COLORS[entity.matterKind]||0xb8c6dc;
}

function seeded(seed){
  let x=0x9e3779b9;
  for(const ch of seed)x=((x^ch.charCodeAt(0))*1664525+1013904223)>>>0;
  return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296};
}

export function createRealityProjection(canvas,engine,workspace=null){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.setClearColor(0x000000,0);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(42,1,.1,1000);
  camera.position.set(0,5.2,15.5);

  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;
  controls.dampingFactor=.055;
  controls.minDistance=5;
  controls.maxDistance=30;
  controls.target.set(0,0,0);
  controls.update();

  scene.add(new THREE.AmbientLight(0x7795bb,1.15));
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
  const nodes=new Map();
  const edges=new Map();
  const nodeMaterials=new Set();
  const edgeMaterials=new Set();
  const entityMaterials=new Set();
  let entityObjects=[];
  const workspaceObjects=new Map();
  const workspaceMaterials=new Set();

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

  function rebuildWorkspace(){
    clearWorkspaceProjection();
    if(!workspace?.state?.blocks)return;
    const blocks=workspace.state.blocks.slice(0,80);
    blocks.forEach((block,index)=>{
      const material=new THREE.MeshStandardMaterial({
        color:workspaceColor(block),
        emissive:workspaceColor(block),
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
      mesh.rotation.set(.22*index,.31*index,.17*index);
      mesh.scale.setScalar(block.type==='lens'?1.35:1);
      mesh.userData.blockId=block.id;
      mesh.userData.blockType=block.type;
      workspaceRoot.add(mesh);
      workspaceObjects.set(block.id,mesh);
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
        opacity:.18,
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

  function pick(event){
    const rect=canvas.getBoundingClientRect();
    pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
    pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
    ray.setFromCamera(pointer,camera);
    const hit=ray.intersectObjects(
      [...nodes.values()].flatMap(group=>group.children),true
    )[0];
    if(!hit)return false;
    const id=hit.object.userData?.realityId||hit.object.parent?.userData?.realityId;
    if(!id)return false;
    engine.select(id);
    rebuild();
    return true;
  }

  canvas.addEventListener('click',pick);
  window.addEventListener('resize',resize);

  rebuild();
  resize();

  function animate(t){
    root.rotation.y=t*.025;
    lens.rotation.y=-t*.08;
    lens.rotation.x=Math.sin(t*.27)*.06;

    for(const [id,group] of nodes){
      const selected=id===engine.selectedId;
      group.rotation.y=-t*(selected?.16:.08);
      group.scale.setScalar((selected?1.16:1)*(1+Math.sin(t*2+id.length)*.03));
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
      object.position.y+=Math.sin(t*1.4+base)*.0007;
      object.rotation.y+=.0015*(index+1);
      const active=workspace?.surface?.id;
      const type=object.userData.blockType;
      const boost=active==='contracts'&&type==='contract'||active==='lens'&&(type==='lens'||type==='input')||active==='nft'&&type==='nft'||active==='prime'&&type==='fabric';
      object.scale.setScalar((boost?1.35:1)*(type==='lens'?1.1:1));
    });

    controls.update();
    renderer.render(scene,camera);
  }

  return {
    rebuild,
    resize,
    animate,
    select(id){
      engine.select(id);
      rebuild();
      return engine.get(id);
    },
    destroy(){
      clearWorldProjection();
      starGeometry.dispose();
      lensGeometry.dispose();
      nodeGeometry.dispose();
      ringGeometry.dispose();
      entityGeometry.dispose();
      blockGeometry.dispose();
      for(const material of workspaceMaterials)material.dispose?.();
      lensMaterial.dispose();
      lensRingMaterial.dispose();
      renderer.dispose();
    }
  };
}
