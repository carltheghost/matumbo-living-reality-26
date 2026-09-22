import {createRealityLattice} from './core/reality-engine.js';
import {createMatumboReality} from './core/matumbo-reality.js';
import {createRealityProjection} from './render/reality-projection.js';

const engine=createRealityLattice();
const workspace=createMatumboReality(engine);
const projection=createRealityProjection(document.querySelector('#scene'),engine);
const $=s=>document.querySelector(s);
const pretty=value=>JSON.stringify(value,null,2);
const categoryColor={A:'#69cfff',B:'#f0c56b',C:'#91a4ff',D:'#ff91c0',E:'#b98dff'};

function renderSurfaces(){
  const list=$('#surface-list');
  list.replaceChildren();
  for(const surface of workspace.state.surfaces){
    const b=document.createElement('button');
    b.className='surface-item'+(surface.id===workspace.state.activeSurface?' active':'');
    b.innerHTML='<span class="surface-icon"></span><span class="surface-text"><span class="surface-name"></span><span class="surface-kind"></span></span>';
    b.querySelector('.surface-icon').style.color=surface.id===workspace.state.activeSurface?'#8edbff':'#62708b';
    b.querySelector('.surface-name').textContent=surface.label;
    b.querySelector('.surface-kind').textContent=surface.description;
    b.onclick=()=>{workspace.selectSurface(surface.id);renderAll()};
    list.append(b);
  }
}

function renderWorlds(){
  const list=$('#reality-list');
  list.replaceChildren();
  for(const r of engine.list()){
    const b=document.createElement('button');
    b.className='reality-item'+(r.id===engine.selectedId?' active':'');
    b.innerHTML='<span class="reality-dot"></span><span class="reality-text"><span class="reality-name"></span><span class="reality-kind"></span></span>';
    b.querySelector('.reality-dot').style.color=categoryColor[r.category]||'#9fb6d8';
    b.querySelector('.reality-name').textContent=r.name;
    b.querySelector('.reality-kind').textContent=r.kind+' · '+r.category+' · '+r.lawSetId;
    b.onclick=()=>{projection.select(r.id);renderAll()};
    list.append(b);
  }
}

function renderWorldState(){
  const s=engine.get(engine.selectedId);
  $('#selected-title').textContent=s.name;
  $('#selected-meta').textContent='kind '+s.kind+' · category '+s.category+' · laws '+s.lawSetId+' · t='+s.time.toFixed(2)+' · entropy='+s.entropy.toFixed(2)+' · dimensions='+s.dimension.spatial+'+1';
  $('#state-output').textContent=pretty({
    id:s.id,
    laws:s.lawSetId,
    dimension:s.dimension,
    time:s.time,
    entropy:s.entropy,
    information:s.information,
    energy:s.energy,
    entities:s.entities.map(e=>({id:e.id,lineageId:e.lineageId,type:e.type,matterKind:e.matterKind,charge:e.charge,position:e.position})),
    lineage:s.lineage,
    metadata:s.metadata
  });
  $('#mode-pill').textContent=s.kind.toUpperCase();
  $('#breadcrumb').textContent='Living Reality Ω · '+workspace.surface.label+' · '+s.name;
  $('#world-count').textContent=engine.realties.size;
  $('#edge-count').textContent=engine.edges.size;
  $('#entity-count').textContent=engine.list().reduce((sum,r)=>sum+r.entities.length,0);
  $('#contract-count').textContent=workspace.contracts.list().length;
}

function contractSurface(){
  const contracts=workspace.contracts.list();
  const html=contracts.map(c=>{
    const first=c.outcomes[0];
    return '<div class="contract-card"><strong>'+c.eventLabel+'</strong><div class="contract-meta">'+c.id+' · '+c.status+' · '+c.realityId+' · '+(c.metadata?.quotes?.provider||'local rehearsal')+'</div><div class="contract-actions"><button data-contract-grade="'+c.id+'" data-result="'+first+'">Grade '+first+'</button><button data-contract-attach="'+c.id+'">Attach</button></div></div>';
  }).join('');
  return html||'<div class="surface-card"><strong>No contracts</strong><span>Contract Atelier is ready for local rehearsal.</span></div>';
}

function renderSurfaceState(){
  const surface=workspace.surface;
  const out=$('#surface-state');
  if(surface.id==='contracts'){
    out.innerHTML='<div class="surface-card"><strong>Contract Atelier</strong><span>Deterministic local outcome books. Unit: '+workspace.state.profile.displayName+' · '+workspace.state.contractUnit+'</span></div>'+contractSurface();
    [...out.querySelectorAll('[data-contract-grade]')].forEach(btn=>btn.onclick=()=>{
      const c=workspace.rehearse(btn.dataset.contractGrade,btn.dataset.result);
      $('#console-output').textContent=pretty(c);
      renderAll();
    });
    [...out.querySelectorAll('[data-contract-attach]')].forEach(btn=>btn.onclick=()=>{
      const c=workspace.contracts.get(btn.dataset.contractAttach);
      workspace.attachContract(c.id,engine.selectedId);
      renderAll();
    });
  } else if(surface.id==='rooms'){
    out.innerHTML=workspace.state.rooms.map(r=>'<div class="surface-card"><strong>'+r.name+'</strong><span>'+r.purpose+' · '+r.realityId+'</span></div>').join('');
  } else if(surface.id==='wardrobe'){
    out.innerHTML=workspace.state.wardrobe.map(o=>'<div class="surface-card"><strong>'+o.name+(workspace.state.profile.outfitId===o.id?' · EQUIPPED':'')+'</strong><span>'+o.effect+'</span><button data-outfit="'+o.id+'" style="margin-top:6px;font-size:8px">Equip</button></div>').join('');
    out.querySelectorAll('[data-outfit]').forEach(b=>b.onclick=()=>{workspace.equip(b.dataset.outfit);renderAll()});
  } else if(surface.id==='arena'){
    out.innerHTML='<div class="surface-card"><strong>Current embodiment · '+workspace.state.profile.chessRole+'</strong><span>Person appearance mapped to a chess role inside the arena.</span><div class="overlay-actions">'+['pawn','knight','bishop','rook','queen-king'].map(role=>'<button data-role="'+role+'">'+role+'</button>').join('')+'</div></div>';
    out.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{workspace.setChessRole(b.dataset.role);renderAll()});
  } else if(surface.id==='profile'){
    out.innerHTML='<div class="surface-card"><strong>'+workspace.state.profile.displayName+'</strong><span>avatar: '+workspace.state.profile.avatar+' · outfit: '+workspace.state.profile.outfitId+' · role: '+workspace.state.profile.chessRole+'</span></div><div class="surface-card"><strong>Floating identity</strong><span>Floorless profile studio with a semantic reality lens.</span></div>';
  } else if(surface.id==='lens'){
    out.innerHTML='<div class="surface-card"><strong>Reality Lens Ω</strong><span>semantic zoom · 2-hand VIDEO mode · air keyboard · finger navigation</span></div><div class="surface-row"><strong>Camera</strong><span>'+((workspace.state.lens.cameraEnabled)?'EXPLICITLY ON':'OFF BY DEFAULT')+'</span></div><button id="camera-toggle">'+(workspace.state.lens.cameraEnabled?'Disable camera':'Enable camera')+'</button>';
    $('#camera-toggle').onclick=()=>{workspace.toggleCamera(!workspace.state.lens.cameraEnabled);renderAll()};
  } else if(surface.id==='nft'){
    out.innerHTML='<div class="surface-card"><strong>Frozen Relic / NFT Atelier</strong><span>Local simulated assets. No chain custody. Claims remain rehearsal-only.</span></div>'+workspace.state.blocks.filter(b=>b.type==='nft').map(b=>'<div class="surface-card"><strong>'+b.name+'</strong><span>'+b.id+' · '+b.roomId+'</span></div>').join('');
  } else if(surface.id==='ledger'){
    out.innerHTML='<div class="surface-card"><strong>Prime Ledger</strong><span>'+workspace.state.primeChain.dimensions+' · '+workspace.state.primeChain.fabric+'</span></div>'+workspace.state.ledger.slice(0,8).map(e=>'<div class="surface-row"><strong>'+e.action+'</strong><span>'+JSON.stringify(e.detail).slice(0,70)+'</span></div>').join('');
  } else if(surface.id==='prime'){
    out.innerHTML='<div class="surface-card"><strong>Prime Chain / Link</strong><span>status: '+workspace.state.primeChain.status+'</span></div>'+workspace.state.primeChain.principles.map(p=>'<span class="tag">'+p+'</span>').join('')+'<div class="surface-card"><strong>Settlement boundary</strong><span>realSettlement='+workspace.state.primeChain.realSettlement+' · realCustody='+workspace.state.primeChain.realCustody+'</span></div>';
  } else {
    out.innerHTML='<div class="surface-card"><strong>Reality substrate</strong><span>'+surface.description+'</span></div><div class="surface-row"><strong>Selected</strong><span>'+engine.selectedId+'</span></div><div class="surface-row"><strong>History</strong><span>'+engine.history.length+' engine actions</span></div>';
  }
}

function renderOverlay(){
  const surface=workspace.surface;
  $('#surface-kicker').textContent=surface.kind.toUpperCase()+' SURFACE';
  $('#surface-title').textContent=surface.label;
  $('#surface-copy').textContent=surface.description;
  const actions=$('#surface-actions');
  actions.innerHTML='';
  const quick={
    lattice:[['Fork selected','fork'],['Mirror selected','mirror'],['Advance selected','advance']],
    contracts:[['Grade HOME','contract-home'],['Grade SHIP','contract-ship'],['Open Ledger','ledger']],
    arena:[['Queen / King','queen-king'],['Knight','knight'],['Open Profile','profile']],
    rooms:[['Open Profile','profile'],['Open Contracts','contracts'],['Open Prime','prime']],
    profile:[['Wardrobe','wardrobe'],['Reality Lens','lens'],['Avatar Arena','arena']],
    wardrobe:[['Obsidian','obsidian'],['Ivory / Gold','ivory-gold'],['Explorer','explorer']],
    nft:[['Open Contract Atelier','contracts'],['Prime Ledger','ledger']],
    ledger:[['Contract Atelier','contracts'],['Prime Chain','prime']],
    lens:[['Toggle Camera','camera'],['Profile Studio','profile'],['Air Keyboard','air-keyboard']],
    prime:[['Prime Ledger','ledger'],['Reality Lattice','lattice'],['Contracts','contracts']]
  }[surface.id]||[];
  for(const [label,action] of quick){
    const b=document.createElement('button');b.textContent=label;b.onclick=()=>quickAction(action);actions.append(b);
  }
}

function quickAction(action){
  try{
    if(['lattice','contracts','arena','rooms','profile','wardrobe','nft','ledger','lens','prime'].includes(action)){workspace.selectSurface(action)}
    else if(action==='fork'||action==='mirror')apply(action)
    else if(action==='advance'){engine.advanceTime(engine.selectedId,.5);projection.rebuild()}
    else if(action==='contract-home'){workspace.rehearse('OCT-SOCCER-001','HOME')}
    else if(action==='contract-ship'){workspace.rehearse('OCT-LENS-001','SHIP')}
    else if(['pawn','knight','bishop','rook','queen-king'].includes(action))workspace.setChessRole(action)
    else if(['obsidian','ivory-gold','explorer','research'].includes(action))workspace.equip(action)
    else if(action==='camera')workspace.toggleCamera(!workspace.state.lens.cameraEnabled)
    else if(action==='air-keyboard')workspace.selectSurface('lens');
    renderAll();
  }catch(err){$('#console-output').textContent='ERROR: '+err.message}
}

function apply(action){
  try{
    const id=engine.selectedId,s=engine.get(id);let r=null;
    if(action==='fork')r=engine.forkReality(id,{name:s.name+' · Alternate History'});
    if(action==='mirror')r=engine.mirrorReality(id);
    if(action==='anti')r=engine.invertMatter(id);
    if(action==='custom')r=engine.transformReality(id,'custom-laws');
    if(action==='rewind')r=engine.rewindSimulation(id,5);
    if(action==='observe')r=engine.observeReality(id,{branch:true,label:'manual observation'});
    if(r?.id){engine.select(r.id);projection.rebuild();$('#console-output').textContent=pretty(r)}
    renderAll();
  }catch(err){$('#console-output').textContent='ERROR: '+err.message}
}

function renderSystem(){
  $('#model-status').innerHTML=[
    ['Reality','programmable world state','graph = relationship layer'],
    ['Contracts','local rehearsal only','no wallet / custody / real money'],
    ['Lens','camera '+(workspace.state.lens.cameraEnabled?'enabled':'OFF'),'local device / explicit toggle'],
    ['Luna','scripted guide','no model / network / session memory'],
    ['Prime','simulated fabric','ledger + information receipts']
  ].map(x=>'<div class="model-row"><strong>'+x[0]+' · '+x[1]+'</strong><span>'+x[2]+'</span></div>').join('');
}

function renderAll(){renderSurfaces();renderWorlds();renderWorldState();renderSurfaceState();renderOverlay();renderSystem()}
document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>apply(button.dataset.action)));

$('#command-form').addEventListener('submit',event=>{
  event.preventDefault();
  const input=$('#command'),tokens=input.value.trim().split(/\s+/),command=(tokens.shift()||'').toUpperCase();
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
    else if(command==='CONTRACT'){result=workspace.contracts.get(tokens[0]);if(tokens[1]&&tokens[2])result=workspace.rehearse(tokens[0],tokens[2])}
    else if(command==='EQUIP'){result=workspace.equip(tokens[0]||'obsidian')}
    else if(command==='ROLE'){result=workspace.setChessRole(tokens[0]||'queen-king')}
    else if(command==='CAMERA'){result=workspace.toggleCamera((tokens[0]||'off').toLowerCase()==='on')}
    else if(command==='LUNA'){result=workspace.companionResponse(tokens.join(' '));$('#luna-output').textContent=result}
    else throw new Error('Unknown command');
    $('#console-output').textContent=pretty(result);
    if(result?.id&&engine.realties.has(result.id)){engine.select(result.id);projection.rebuild()}
    renderAll();
  }catch(error){$('#console-output').textContent='ERROR: '+error.message}
  input.select();
});

$('#luna-form').addEventListener('submit',event=>{
  event.preventDefault();
  $('#luna-output').textContent=workspace.companionResponse($('#luna-input').value);
});

renderAll();
let previous=performance.now();
function frame(now){
  const delta=now-previous;previous=now;
  if(delta>0&&delta<120)engine.advanceAll(delta/10000);
  projection.animate(now/1000);
  if(Math.floor(now/1000)%2===0)renderWorldState();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
