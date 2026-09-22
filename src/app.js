import {createRealityLattice} from './core/reality-engine.js';
import {createMatumboReality} from './core/matumbo-reality.js';
import {createRealityProjection} from './render/reality-projection.js';

const engine=createRealityLattice();
const workspace=createMatumboReality(engine);
const $=selector=>document.querySelector(selector);
const pretty=value=>JSON.stringify(value,null,2);
const categoryColor={A:'#69cfff',B:'#f0c56b',C:'#91a4ff',D:'#ff91c0',E:'#b98dff'};
const SURFACES=new Set(workspace.state.surfaces.map(surface=>surface.id));

const projection=createRealityProjection($('#scene'),engine,workspace);

let toastTimer=0;
function toast(message){
  const node=$('#toast');
  if(!node)return;
  node.textContent=message;
  node.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>node.classList.remove('visible'),1700);
}

function openDrawer(id){
  const node=$(id);
  if(node)node.dataset.open='true';
}
function closeDrawer(id){
  const node=$(id);
  if(node)node.dataset.open='false';
}
function toggleDrawer(id){
  const node=$(id);
  if(node)node.dataset.open=node.dataset.open==='true'?'false':'true';
}
function syncPanels(){
  const map=$('.world-orbit');
  const dock=$('.surface-dock');
  if(map&&!map.dataset.open)map.dataset.open='true';
  if(dock&&!dock.dataset.open)dock.dataset.open='true';
}

function renderSurfaces(){
  const list=$('#surface-list');
  list.replaceChildren();
  for(const surface of workspace.state.surfaces){
    const b=document.createElement('button');
    b.className='surface-item'+(surface.id===workspace.state.activeSurface?' active':'');
    b.title=surface.description;
    b.innerHTML='<span class="surface-icon"></span><span class="surface-text"><span class="surface-name"></span><span class="surface-kind"></span></span>';
    b.querySelector('.surface-icon').style.color=surface.id===workspace.state.activeSurface?'#8edbff':'#62708b';
    b.querySelector('.surface-name').textContent=surface.label;
    b.querySelector('.surface-kind').textContent=surface.kind;
    b.onclick=()=>{
      workspace.selectSurface(surface.id);
      toast(surface.label+' surface');
      renderAll();
    };
    list.append(b);
  }
  document.querySelectorAll('[data-surface]').forEach(button=>{
    button.classList.toggle('active',button.dataset.surface===workspace.state.activeSurface);
  });
}

function renderWorlds(){
  const list=$('#reality-list');
  list.replaceChildren();
  for(const state of engine.list()){
    const b=document.createElement('button');
    b.className='reality-item'+(state.id===engine.selectedId?' active':'');
    b.innerHTML='<span class="reality-dot"></span><span class="reality-text"><span class="reality-name"></span><span class="reality-kind"></span></span>';
    b.querySelector('.reality-dot').style.color=categoryColor[state.category]||'#9fb6d8';
    b.querySelector('.reality-name').textContent=state.name;
    b.querySelector('.reality-kind').textContent=state.kind+' · '+state.lawSetId;
    b.onclick=()=>{
      projection.select(state.id);
      toast('Selected '+state.name);
      renderAll();
    };
    list.append(b);
  }
}

function renderWorldState(){
  const state=engine.get(engine.selectedId);
  $('#selected-title').textContent=state.name;
  $('#selected-meta').textContent=
    'kind '+state.kind+' · category '+state.category+' · '+state.lawSetId+
    ' · t='+state.time.toFixed(2)+' · entropy='+state.entropy.toFixed(2)+
    ' · dimensions='+state.dimension.spatial+'+1';
  $('#state-output').textContent=pretty({
    id:state.id,
    name:state.name,
    laws:state.lawSetId,
    dimension:state.dimension,
    time:state.time,
    entropy:state.entropy,
    information:state.information,
    energy:state.energy,
    entities:state.entities.map(entity=>({
      id:entity.id,
      lineageId:entity.lineageId,
      type:entity.type,
      matterKind:entity.matterKind,
      charge:entity.charge,
      position:entity.position
    })),
    lineage:state.lineage,
    metadata:state.metadata
  });
  $('#mode-pill').textContent=state.kind.toUpperCase();
  $('#breadcrumb').textContent='Living Reality Ω · '+workspace.surface.label+' · '+state.name;
  $('#world-count').textContent=engine.realties.size;
  $('#edge-count').textContent=engine.edges.size;
  $('#entity-count').textContent=engine.list().reduce((sum,reality)=>sum+reality.entities.length,0);
  $('#contract-count').textContent=workspace.contracts.list().length;
}

function contractSurface(){
  const contracts=workspace.contracts.list();
  if(!contracts.length){
    return '<div class="surface-card"><strong>No contracts yet</strong><span>Contract Atelier is ready for local rehearsal.</span></div>';
  }
  return contracts.map(contract=>{
    const first=contract.outcomes[0];
    const provider=contract.metadata?.quotes?.provider||'local rehearsal';
    return '<div class="contract-card">'+
      '<strong>'+contract.eventLabel+'</strong>'+
      '<div class="contract-meta">'+contract.id+' · '+contract.status+' · '+contract.realityId+' · '+provider+'</div>'+
      '<div class="contract-actions">'+
        '<button data-contract-grade="'+contract.id+'" data-result="'+first+'">Grade '+first+'</button>'+
        '<button data-contract-attach="'+contract.id+'">Attach</button>'+
      '</div>'+
    '</div>';
  }).join('');
}

function renderSurfaceState(){
  const surface=workspace.surface;
  const out=$('#surface-state');

  if(surface.id==='contracts'){
    out.innerHTML=
      '<div class="surface-card"><strong>Contract Atelier</strong><span>Deterministic local outcome books · '+workspace.state.contractUnit+' · no custody</span></div>'+
      contractSurface();
    out.querySelectorAll('[data-contract-grade]').forEach(button=>{
      button.onclick=()=>{
        const result=workspace.rehearse(button.dataset.contractGrade,button.dataset.result);
        $('#console-output').textContent=pretty(result);
        toast('Contract rehearsal recorded');
        renderAll();
      };
    });
    out.querySelectorAll('[data-contract-attach]').forEach(button=>{
      button.onclick=()=>{
        const contract=workspace.contracts.get(button.dataset.contractAttach);
        workspace.attachContract(contract.id,engine.selectedId);
        toast('Contract attached to '+engine.selectedId);
        renderAll();
      };
    });
    return;
  }

  if(surface.id==='rooms'){
    out.innerHTML=workspace.state.rooms.map(room=>
      '<div class="surface-card"><strong>'+room.name+'</strong><span>'+room.purpose+' · '+room.realityId+'</span></div>'
    ).join('');
    return;
  }

  if(surface.id==='wardrobe'){
    out.innerHTML=workspace.state.wardrobe.map(outfit=>
      '<div class="surface-card"><strong>'+outfit.name+(workspace.state.profile.outfitId===outfit.id?' · EQUIPPED':'')+
      '</strong><span>'+outfit.effect+'</span><button data-outfit="'+outfit.id+'">Equip</button></div>'
    ).join('');
    out.querySelectorAll('[data-outfit]').forEach(button=>{
      button.onclick=()=>{
        workspace.equip(button.dataset.outfit);
        toast('Equipped '+button.dataset.outfit);
        renderAll();
      };
    });
    return;
  }

  if(surface.id==='arena'){
    out.innerHTML=
      '<div class="surface-card"><strong>Embodiment · '+workspace.state.profile.chessRole+
      '</strong><span>Person appearance mapped to a chess role inside the avatar arena.</span>'+
      '<div class="overlay-actions">'+
      ['pawn','knight','bishop','rook','queen-king'].map(role=>
        '<button data-role="'+role+'">'+role+'</button>'
      ).join('')+
      '</div></div>';
    out.querySelectorAll('[data-role]').forEach(button=>{
      button.onclick=()=>{
        workspace.setChessRole(button.dataset.role);
        toast('Embodiment set to '+button.dataset.role);
        renderAll();
      };
    });
    return;
  }

  if(surface.id==='profile'){
    out.innerHTML=
      '<div class="surface-card"><strong>'+workspace.state.profile.displayName+
      '</strong><span>avatar: '+workspace.state.profile.avatar+' · outfit: '+workspace.state.profile.outfitId+
      ' · role: '+workspace.state.profile.chessRole+'</span></div>'+
      '<div class="surface-card"><strong>Floorless identity</strong><span>Profile, embodiment and Reality Lens are one continuous workspace.</span></div>';
    return;
  }

  if(surface.id==='lens'){
    out.innerHTML=
      '<div class="surface-card"><strong>Reality Lens Ω</strong><span>semantic zoom · 2-hand VIDEO mode · air keyboard · finger navigation</span></div>'+
      '<div class="surface-row"><strong>Camera</strong><span>'+(
        workspace.state.lens.cameraEnabled?'EXPLICITLY ON':'OFF BY DEFAULT'
      )+'</span></div>'+
      '<div class="surface-row"><strong>Input</strong><span>'+
        workspace.input.airTyping.getState().schemaVersion+' · '+(workspace.input.handLens.enabled?'ACTIVE':'READY')+
      '</span></div>'+
      '<button id="camera-toggle">'+(workspace.state.lens.cameraEnabled?'Disable camera':'Enable camera')+'</button>'+
      '<div class="overlay-actions"><button id="air-demo">Air-type A</button><button id="hand-demo">Simulate pinch</button></div>';
    $('#camera-toggle').onclick=()=>{
      workspace.toggleCamera(!workspace.state.lens.cameraEnabled);
      toast(workspace.state.lens.cameraEnabled?'Camera explicitly enabled':'Camera OFF');
      renderAll();
    };
    $('#air-demo').onclick=()=>{
      workspace.input.airTyping.setKeyMap([{key:'a',rect:{x:0,y:0,w:1,h:1}}]);
      workspace.input.airTyping.registerTap(1,.5,.5,0);
      const event=workspace.input.airTyping.poll(100)[0];
      $('#console-output').textContent=pretty({surface:'Reality Lens Ω',airTyping:event});
      toast('Air typing rehearsal emitted');
    };
    $('#hand-demo').onclick=()=>{
      const hands=[Array.from({length:21},()=>({x:.5,y:.5,z:0}))];
      hands[0][4]={x:.5,y:.5,z:0};
      hands[0][8]={x:.52,y:.52,z:0};
      workspace.input.handLens.setEnabled(true);
      const sample=workspace.input.handLens.update(hands);
      $('#console-output').textContent=pretty({surface:'Reality Lens Ω',handEvent:sample.events[0]});
      toast('Two-hand lens gesture rehearsed');
    };
    return;
  }

  if(surface.id==='nft'){
    out.innerHTML=
      '<div class="surface-card"><strong>Frozen Relic / NFT Atelier</strong><span>Local simulated assets · no chain custody · rehearsal-only claims.</span></div>'+
      workspace.state.blocks.filter(block=>block.type==='nft').map(block=>
        '<div class="surface-card"><strong>'+block.name+'</strong><span>'+block.id+' · '+block.roomId+'</span></div>'
      ).join('');
    return;
  }

  if(surface.id==='ledger'){
    out.innerHTML=
      '<div class="surface-card"><strong>Prime Ledger</strong><span>'+workspace.state.primeChain.dimensions+' · '+workspace.state.primeChain.fabric+'</span></div>'+
      workspace.state.ledger.slice(0,8).map(entry=>
        '<div class="surface-row"><strong>'+entry.action+'</strong><span>'+JSON.stringify(entry.detail).slice(0,70)+'</span></div>'
      ).join('');
    return;
  }

  if(surface.id==='prime'){
    out.innerHTML=
      '<div class="surface-card"><strong>Prime Chain / Link</strong><span>status: '+workspace.state.primeChain.status+'</span></div>'+
      workspace.state.primeChain.principles.map(principle=>'<span class="tag">'+principle+'</span>').join('')+
      '<div class="surface-card"><strong>Settlement boundary</strong><span>realSettlement='+workspace.state.primeChain.realSettlement+' · realCustody='+workspace.state.primeChain.realCustody+'</span></div>';
    return;
  }

  if(surface.id==='commerce'){
    out.innerHTML=
      '<div class="surface-card"><strong>t402 / PAYCORE</strong><span>payment-required rehearsal rail · '+workspace.state.contractUnit+' · no real value</span></div>'+
      '<div class="surface-row"><strong>Network</strong><span>LOCAL ONLY</span></div>'+
      '<div class="surface-row"><strong>Settlement</strong><span>SIMULATED / OFF</span></div>'+
      '<button id="pay-test">Rehearse payment</button>';
    $('#pay-test').onclick=()=>{
      const result=workspace.rehearsePayment({resource:'reality://'+engine.selectedId,amount:12});
      $('#console-output').textContent=pretty(result);
      toast('t402 rehearsal recorded');
      renderAll();
    };
    return;
  }

  if(surface.id==='agents'){
    out.innerHTML=
      '<div class="surface-card"><strong>Agent Fabric</strong><span>'+workspace.state.agents.controller+' coordinates a bounded local plan.</span></div>'+
      '<div class="surface-card"><strong>Workers</strong><span>'+workspace.state.agents.workers.join(' · ')+'</span></div>'+
      '<div class="surface-card"><strong>Reviewer</strong><span>'+workspace.state.agents.reviewer+' · execution '+workspace.state.agents.autonomy+'</span></div>'+
      '<button id="agent-plan">Generate local plan</button>';
    $('#agent-plan').onclick=()=>{
      const result=workspace.agentPlan('coordinate the selected maTumbo surface');
      $('#console-output').textContent=pretty(result);
      toast('Local agent plan created');
      renderAll();
    };
    return;
  }

  out.innerHTML=
    '<div class="surface-card"><strong>Reality substrate</strong><span>'+surface.description+'</span></div>'+
    '<div class="surface-row"><strong>Selected</strong><span>'+engine.selectedId+'</span></div>'+
    '<div class="surface-row"><strong>Engine history</strong><span>'+engine.history.length+' actions</span></div>';
}

function renderOverlay(){
  const surface=workspace.surface;
  $('#surface-kicker').textContent=surface.kind.toUpperCase()+' SURFACE';
  $('#surface-title').textContent=surface.label;
  $('#surface-copy').textContent=surface.description;
  const actions=$('#surface-actions');
  actions.replaceChildren();

  const quick={
    lattice:[['Fork selected','fork'],['Mirror selected','mirror'],['Advance selected','advance']],
    contracts:[['Grade HOME','contract-home'],['Grade SHIP','contract-ship'],['Open Prime Ledger','ledger']],
    arena:[['Queen / King','queen-king'],['Knight','knight'],['Profile','profile']],
    rooms:[['Profile','profile'],['Contracts','contracts'],['Prime','prime']],
    profile:[['Wardrobe','wardrobe'],['Reality Lens','lens'],['Arena','arena']],
    wardrobe:[['Obsidian','obsidian'],['Ivory / Gold','ivory-gold'],['Explorer','explorer']],
    nft:[['Contracts','contracts'],['Prime Ledger','ledger']],
    ledger:[['Contracts','contracts'],['Prime Chain','prime']],
    lens:[['Toggle Camera','camera'],['Profile','profile'],['Air Keyboard','air-keyboard']],
    prime:[['Prime Ledger','ledger'],['Reality Lattice','lattice'],['Contracts','contracts']],
    commerce:[['Rehearse t402','pay'],['Prime Ledger','ledger'],['Contracts','contracts']],
    agents:[['Generate Plan','agent-plan'],['Memory / Docs','agents'],['Reality Lattice','lattice']]
  }[surface.id]||[];

  for(const [label,action] of quick){
    const button=document.createElement('button');
    button.textContent=label;
    button.onclick=()=>quickAction(action);
    actions.append(button);
  }
}

function quickAction(action){
  try{
    if(SURFACES.has(action)){
      workspace.selectSurface(action);
      toast(workspace.surface.label);
    }else if(action==='fork'||action==='mirror'){
      apply(action);
    }else if(action==='advance'){
      engine.advanceTime(engine.selectedId,.5);
      projection.rebuild();
      toast('Selected reality advanced');
    }else if(action==='contract-home'){
      workspace.rehearse('OCT-SOCCER-001','HOME');
      toast('HOME rehearsal graded');
    }else if(action==='contract-ship'){
      workspace.rehearse('OCT-LENS-001','SHIP');
      toast('SHIP rehearsal graded');
    }else if(['pawn','knight','bishop','rook','queen-king'].includes(action)){
      workspace.setChessRole(action);
      toast('Embodiment set to '+action);
    }else if(['obsidian','ivory-gold','explorer','research'].includes(action)){
      workspace.equip(action);
      toast('Equipped '+action);
    }else if(action==='camera'){
      workspace.toggleCamera(!workspace.state.lens.cameraEnabled);
      toast(workspace.state.lens.cameraEnabled?'Camera explicitly enabled':'Camera OFF');
    }else if(action==='air-keyboard'){
      workspace.selectSurface('lens');
    }else if(action==='pay'){
      workspace.rehearsePayment({resource:'reality://'+engine.selectedId,amount:12});
      toast('t402 rehearsal recorded');
    }else if(action==='agent-plan'){
      workspace.agentPlan('coordinate the selected maTumbo surface');
      toast('Agent plan created');
    }
    renderAll();
  }catch(error){
    $('#console-output').textContent='ERROR: '+error.message;
    toast(error.message);
  }
}

function apply(action){
  try{
    const id=engine.selectedId;
    const state=engine.get(id);
    let result=null;
    if(action==='fork')result=engine.forkReality(id,{name:state.name+' · Alternate History'});
    if(action==='mirror')result=engine.mirrorReality(id);
    if(action==='anti')result=engine.invertMatter(id);
    if(action==='custom')result=engine.transformReality(id,'custom-laws');
    if(action==='rewind')result=engine.rewindSimulation(id,5);
    if(action==='observe')result=engine.observeReality(id,{branch:true,label:'manual observation'});
    if(result?.id){
      engine.select(result.id);
      projection.rebuild();
      $('#console-output').textContent=pretty(result);
      toast('Reality '+result.id+' created');
    }
    renderAll();
  }catch(error){
    $('#console-output').textContent='ERROR: '+error.message;
    toast(error.message);
  }
}

function renderSystem(){
  $('#model-status').innerHTML=[
    ['Reality','programmable world state','graph = relationship layer'],
    ['Contracts','local rehearsal only','no wallet / custody / real money'],
    ['Lens','camera '+(workspace.state.lens.cameraEnabled?'enabled':'OFF'),'local device / explicit toggle'],
    ['Luna','scripted guide','no model / network / session memory'],
    ['Prime','simulated fabric','ledger + information receipts'],
    ['Commerce','t402 / PAYCORE rehearsal','no real settlement'],
    ['Agents','Controller + workers + reviewer','local-plan-only']
  ].map(row=>'<div class="model-row"><strong>'+row[0]+' · '+row[1]+'</strong><span>'+row[2]+'</span></div>').join('');
}

function renderAll(){
  projection.rebuild();
  renderSurfaces();
  renderWorlds();
  renderWorldState();
  renderSurfaceState();
  renderOverlay();
  renderSystem();
}

function wireShell(){
  syncPanels();

  $('#toggle-console').onclick=()=>closeDrawer('#console-drawer');
  $('#open-console').onclick=()=>toggleDrawer('#console-drawer');
  $('#toggle-inspector').onclick=()=>closeDrawer('#inspector-drawer');
  $('#open-inspector').onclick=()=>toggleDrawer('#inspector-drawer');

  $('#toggle-map').onclick=()=>{
    const map=$('.world-orbit');
    map.dataset.open=map.dataset.open==='true'?'false':'true';
  };
  $('#toggle-dock').onclick=()=>{
    const dock=$('.surface-dock');
    dock.dataset.open=dock.dataset.open==='true'?'false':'true';
  };

  document.querySelectorAll('[data-surface]').forEach(button=>{
    button.addEventListener('click',()=>{
      workspace.selectSurface(button.dataset.surface);
      toast(workspace.surface.label);
      renderAll();
    });
  });

  document.querySelectorAll('[data-action]').forEach(button=>{
    button.addEventListener('click',()=>apply(button.dataset.action));
  });

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      closeDrawer('#console-drawer');
      closeDrawer('#inspector-drawer');
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
      event.preventDefault();
      openDrawer('#console-drawer');
      $('#command')?.focus();
    }
  });
}

$('#command-form').addEventListener('submit',event=>{
  event.preventDefault();
  const input=$('#command');
  const tokens=input.value.trim().split(/\s+/);
  const command=(tokens.shift()||'').toUpperCase();
  try{
    let result;
    if(command==='FORK')result=engine.forkReality(tokens[0]||engine.selectedId,{name:tokens.slice(1).join(' ')||'Alternate Branch'});
    else if(command==='MIRROR')result=engine.mirrorReality(tokens[0]||engine.selectedId);
    else if(command==='ANTI')result=engine.invertMatter(tokens[0]||engine.selectedId);
    else if(command==='REWIND')result=engine.rewindSimulation(tokens[0]||engine.selectedId,Number(tokens[1]||1));
    else if(command==='OBSERVE')result=engine.observeReality(tokens[0]||engine.selectedId,{branch:true});
    else if(command==='TRACE')result=engine.traceLineage(tokens[0]||'observer-1');
    else if(command==='COMPARE')result=engine.compareReality(tokens[0]||engine.selectedId,tokens[1]||'R-OBSERVED');
    else if(command==='MERGE')result=engine.mergeReality(tokens[0]||engine.selectedId,tokens[1]||'R-OBSERVED');
    else if(command==='TRANSFORM')result=engine.transformReality(tokens[0]||engine.selectedId,tokens[1]||'custom-laws');
    else if(command==='ADVANCE')result=engine.advanceTime(tokens[0]||engine.selectedId,Number(tokens[1]||.25));
    else if(command==='SURFACE'){workspace.selectSurface(tokens[0]||'lattice');result=workspace.snapshot()}
    else if(command==='CONTRACT'){
      result=workspace.contracts.get(tokens[0]);
      if(tokens[1]&&tokens[2])result=workspace.rehearse(tokens[0],tokens[2]);
    }else if(command==='EQUIP')result=workspace.equip(tokens[0]||'obsidian');
    else if(command==='ROLE')result=workspace.setChessRole(tokens[0]||'queen-king');
    else if(command==='CAMERA')result=workspace.toggleCamera((tokens[0]||'off').toLowerCase()==='on');
    else if(command==='PAY')result=workspace.rehearsePayment({resource:'reality://'+engine.selectedId,amount:Number(tokens[0]||12)});
    else if(command==='AGENT')result=workspace.agentPlan(tokens.slice(0).join(' ')||'coordinate the selected maTumbo surface');
    else if(command==='LUNA'){
      result=workspace.companionResponse(tokens.join(' '));
      $('#luna-output').textContent=result;
    }else throw new Error('Unknown command: '+command);

    $('#console-output').textContent=pretty(result);
    if(result?.id&&engine.realties.has(result.id)){
      engine.select(result.id);
    }
    toast('Command '+command+' applied');
    renderAll();
  }catch(error){
    $('#console-output').textContent='ERROR: '+error.message;
    toast(error.message);
  }
  input.select();
});

$('#luna-form').addEventListener('submit',event=>{
  event.preventDefault();
  const input=$('#luna-input');
  $('#luna-output').textContent=workspace.companionResponse(input.value);
  toast('Luna responded locally');
  input.select();
});

wireShell();
renderAll();

let previous=performance.now();
function frame(now){
  const delta=now-previous;
  previous=now;
  if(delta>0&&delta<120)engine.advanceAll(delta/10000);
  projection.animate(now/1000);
  if(Math.floor(now/1000)%2===0)renderWorldState();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
