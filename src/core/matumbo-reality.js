import {createOutcomeContracts,SIMULATION_UNIT} from './outcome-contracts.js';
import {addCausalEvent} from './causality.js';
import {createAirTyping} from '../input/air-typing.js';
import {createHandLens} from '../input/hand-lens.js';
import {createSemanticLens} from './reality-lens.js';

const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));

export const MATUMBO_REALITY_SCHEMA="matumbo-reality-workspace-0.26";
export const SURFACES=Object.freeze([
  {id:"lattice",label:"Reality Lattice",kind:"reality",description:"Worlds, branches, mirrors, antimatter, research and custom laws."},
  {id:"contracts",label:"Contract Atelier",kind:"contract",description:"Deterministic local outcome contracts and rehearsal books."},
  {id:"arena",label:"Avatar Chess Arena",kind:"avatar",description:"Person-to-chess embodiment: pawn, knight, bishop, rook, queen/king."},
  {id:"rooms",label:"Living Rooms",kind:"room",description:"Named spaces and floating blocks inside a programmable world."},
  {id:"profile",label:"Profile Studio",kind:"profile",description:"Floorless identity, avatar, wardrobe and personal reality lens."},
  {id:"wardrobe",label:"Wardrobe Atelier",kind:"wardrobe",description:"Composable starter outfits carried by the avatar."},
  {id:"nft",label:"NFT Atelier",kind:"asset",description:"Local simulated relics and contract awards; no chain custody."},
  {id:"ledger",label:"Prime Ledger",kind:"ledger",description:"Multidimensional simulated ledger and event receipts."},
  {id:"lens",label:"Reality Lens Ω",kind:"input",description:"Semantic zoom, hand lens, AR glasses and air keyboard controls."},
  {id:"prime",label:"Prime Chain / Link",kind:"fabric",description:"Intelligence fabric status across reality, contracts and events."},
  {id:"commerce",label:"t402 / PAYCORE",kind:"commerce",description:"Payment-required rehearsal rail. No real settlement, custody or money."},
  {id:"agents",label:"Agent Fabric",kind:"agents",description:"Controller, memory, documentation and review agents coordinating local work."}
]);

export const ROOMS=Object.freeze([
  {id:"room-profile",name:"Profile Studio",purpose:"identity + reality lens",realityId:"R-OBSERVED"},
  {id:"room-contract",name:"Contract Atelier",purpose:"contracts + rehearsal",realityId:"R-OBSERVED"},
  {id:"room-arena",name:"Avatar Chess Arena",purpose:"embodiment + strategy",realityId:"R-QUANTUM"},
  {id:"room-nft",name:"NFT Atelier",purpose:"local relics + awards",realityId:"R-CUSTOM"},
  {id:"room-prime",name:"Prime Chain Observatory",purpose:"ledger + event horizon",realityId:"R-RESEARCH"}
]);

export const WARDROBE=Object.freeze([
  {id:"obsidian",name:"Obsidian",tone:"dark",effect:"default-maTumbo"},
  {id:"ivory-gold",name:"Ivory / Gold",tone:"light",effect:"ceremonial"},
  {id:"explorer",name:"Explorer",tone:"field",effect:"research"},
  {id:"research",name:"Research",tone:"technical",effect:"frontier"}
]);

export const BLOCKS=Object.freeze([
  {id:"block-lens",name:"Reality Lens Ω",type:"lens",roomId:"room-profile"},
  {id:"block-keyboard",name:"Air Keyboard",type:"input",roomId:"room-profile"},
  {id:"block-prime",name:"Amazon Prime",type:"service-block",roomId:"room-contract",simulated:true},
  {id:"block-contract",name:"Contract Book",type:"contract",roomId:"room-contract"},
  {id:"block-relic",name:"Frozen Relic",type:"nft",roomId:"room-nft"},
  {id:"block-prime-link",name:"Prime Link",type:"fabric",roomId:"room-prime"}
]);

function event(id,title,realityId,kind){
  return {id,title,realityId,kind,status:"rehearsal",source:"local-fixture",simulation:true,truthClaim:false};
}

export function createMatumboReality(engine,{seed="matumbo-reality"}={}){
  const contracts=createOutcomeContracts({seed});
  const input={airTyping:createAirTyping(),handLens:createHandLens()};
  const state={
    schemaVersion:MATUMBO_REALITY_SCHEMA,
    activeSurface:"lattice",
    surfaces:clone(SURFACES),
    rooms:clone(ROOMS),
    blocks:clone(BLOCKS).map((b,i)=>({...b,position:[-2+i*.8,.45+(i%2)*.35,-.8+(i%3)*.45]})),
    events:[
      event("event-soccer","Football / match outcome rehearsal","R-OBSERVED","sports"),
      event("event-basketball","Basketball / home-away rehearsal","R-QUANTUM","sports"),
      event("event-baseball","Baseball / series state rehearsal","R-MIRROR","sports"),
      event("event-lens","Reality Lens release gate","R-CUSTOM","product")
    ],
    profile:{id:"profile-matumbo",displayName:"maTumbo Profile",avatar:"person",outfitId:"obsidian",chessRole:"queen-king"},
    wardrobe:clone(WARDROBE),
    lens:{mode:"semantic-zoom",cameraEnabled:false,deviceLocalOnly:true,hands:2,videoMode:"VIDEO",airKeyboard:true,fingerNavigation:true,focus:null},
    input:{airTypingSchema:"matumbo-air-typing-0.26",handLensSchema:"matumbo-hand-lens-0.26"},
    contractUnit:SIMULATION_UNIT,
    commerce:{protocol:"t402",rail:"PAYCORE",status:"rehearsal",paymentRequired:true,realMoney:false,realSettlement:false,custody:false},
    agents:{controller:"Controller",workers:["MemoryFileAgent","DocumentationFileAgent"],reviewer:"Reviewer",network:false,autonomy:"local-plan-only"},
    companion:{name:"Luna",mode:"scripted-local-guide",network:false,sessionMemory:false},
    ledger:[],
    primeChain:{
      status:"simulated",
      dimensions:"multidimensional ledger",
      fabric:"Apollo intelligence fabric",
      principles:["dark-matter analogy","entropy accounting","event-horizon boundary","information conservation"],
      realSettlement:false,
      realCustody:false
    },
    odds:[
      {eventId:"event-soccer",provider:"rehearsal-kalshi",quote:"home 0.54 / away 0.31 / draw 0.15"},
      {eventId:"event-basketball",provider:"rehearsal-polymarket",quote:"home 0.58 / away 0.42"},
      {eventId:"event-baseball",provider:"rehearsal",quote:"home 0.51 / away 0.49"},
      {eventId:"event-football",provider:"rehearsal-market",quote:"home 0.47 / away 0.34 / draw 0.19"}
    ]
  };

  function log(action,detail={}){
    state.ledger.unshift({id:"ledger-"+(state.ledger.length+1),time:state.profile.id+":"+state.ledger.length,action,detail:clone(detail),simulation:true});
    state.ledger=state.ledger.slice(0,100);
  }
  function selectSurface(id){
    if(!state.surfaces.some(x=>x.id===id)) throw new TypeError("unknown maTumbo surface");
    state.activeSurface=id;
    log("surface-opened",{id});
    if(semanticLens && semanticLens.targetId!==id) semanticLens.focusSurface(id);
    return snapshot();
  }
  function createStarterContracts(){
    if(contracts.list().length) return contracts.list();
    const soccer=contracts.createContract({id:"OCT-SOCCER-001",eventId:"event-soccer",eventLabel:"Football match outcome rehearsal",outcomes:["HOME","AWAY","DRAW"],realityId:"R-OBSERVED",kind:"sports"});
    contracts.join(soccer.id,{participant:"operator",outcome:"HOME",amount:100,idempotencyKey:"starter-home"});
    contracts.join(soccer.id,{participant:"simulated-counterparty",outcome:"AWAY",amount:100,idempotencyKey:"starter-away"});
    contracts.quote(soccer.id,{provider:"rehearsal-odds",home:0.54,away:0.31,draw:0.15});
    const basket=contracts.createContract({id:"OCT-BASKET-001",eventId:"event-basketball",eventLabel:"Basketball home-away rehearsal",outcomes:["HOME","AWAY"],realityId:"R-QUANTUM",kind:"sports"});
    contracts.join(basket.id,{participant:"operator",outcome:"HOME",amount:75,idempotencyKey:"basket-home"});
    contracts.join(basket.id,{participant:"simulated-counterparty",outcome:"AWAY",amount:75,idempotencyKey:"basket-away"});
    contracts.quote(basket.id,{provider:"rehearsal-market",home:0.58,away:0.42});
    const baseball=contracts.createContract({id:"OCT-BASEBALL-001",eventId:"event-baseball",eventLabel:"Baseball series outcome rehearsal",outcomes:["HOME","AWAY"],realityId:"R-MIRROR",kind:"sports"});
    contracts.join(baseball.id,{participant:"operator",outcome:"AWAY",amount:60,idempotencyKey:"baseball-away"});
    contracts.join(baseball.id,{participant:"simulated-counterparty",outcome:"HOME",amount:60,idempotencyKey:"baseball-home"});
    contracts.quote(baseball.id,{provider:"rehearsal-market",home:0.51,away:0.49});
    const football=contracts.createContract({id:"OCT-FOOTBALL-001",eventId:"event-football",eventLabel:"Football home-away-draw rehearsal",outcomes:["HOME","AWAY","DRAW"],realityId:"R-ANTIMATTER",kind:"sports"});
    contracts.join(football.id,{participant:"operator",outcome:"HOME",amount:90,idempotencyKey:"football-home"});
    contracts.join(football.id,{participant:"simulated-counterparty",outcome:"DRAW",amount:90,idempotencyKey:"football-draw"});
    contracts.quote(football.id,{provider:"rehearsal-market",home:0.47,away:0.34,draw:0.19});
    const feature=contracts.createContract({id:"OCT-LENS-001",eventId:"event-lens",eventLabel:"Reality Lens feature gate",outcomes:["SHIP","HOLD"],realityId:"R-CUSTOM",kind:"product"});
    contracts.join(feature.id,{participant:"operator",outcome:"SHIP",amount:25,idempotencyKey:"lens-ship"});
    contracts.join(feature.id,{participant:"simulated-reviewer",outcome:"HOLD",amount:25,idempotencyKey:"lens-hold"});
    return contracts.list();
  }
  const semanticLens=createSemanticLens({
    getSelectedWorldId:()=>engine.selectedId,
    getWorld:id=>engine.get(id),
    getSurface:id=>state.surfaces.find(surface=>surface.id===id),
    listSurfaces:()=>state.surfaces,
    getRoom:id=>state.rooms.find(room=>room.id===id),
    listRooms:()=>state.rooms,
    getObject:id=>state.blocks.find(block=>block.id===id),
    listObjects:()=>state.blocks,
    getInteractions:objectId=>[
      {id:"inspect:"+objectId,label:"Inspect object"},
      {id:"use:"+objectId,label:"Interact"},
      {id:"move:"+objectId,label:"Move in space"}
    ],
    onSurfaceFocus:id=>{state.activeSurface=id;},
    onRoomFocus:()=>{state.activeSurface="rooms";},
    onFocus:focus=>{
      state.lens.focus=clone(focus);
      if(focus.level==="world") state.activeSurface="lattice";
      else if(focus.level==="surface") state.activeSurface=focus.targetId;
      else if(focus.level==="room"||focus.level==="object"||focus.level==="interaction") state.activeSurface="rooms";
      log("lens-focus",{level:focus.level,targetId:focus.targetId,scale:focus.scale});
    }
  });

  createStarterContracts();

  function rehearse(contractId,result){
    const graded=contracts.grade(contractId,result);
    const settled=contracts.settle(contractId);
    const reality=engine.get(settled.realityId);
    addCausalEvent(reality,{id:"contract:"+contractId+":"+reality.historyLog.length,type:"contract-graded",actorIds:["operator"],causes:reality.entities.map(entity=>entity.id).slice(0,4),effects:[contractId],time:reality.time,metadata:{result:graded.result,digest:graded.grading?.digest,simulation:true}});
    log("contract-graded",{contractId,result:graded.result,digest:graded.grading?.digest});
    return settled;
  }
  function attachContract(contractId,realityId){
    const next=contracts.attach(contractId,realityId);
    log("contract-attached",{contractId,realityId});
    return next;
  }
  function equip(outfitId){
    if(!state.wardrobe.some(x=>x.id===outfitId)) throw new TypeError("unknown outfit");
    state.profile.outfitId=outfitId; log("wardrobe-equipped",{outfitId}); return clone(state.profile);
  }
  function setChessRole(role){
    const roles=["pawn","knight","bishop","rook","queen-king"];
    if(!roles.includes(role)) throw new TypeError("unknown chess role");
    state.profile.chessRole=role; log("avatar-embodiment",{role}); return clone(state.profile);
  }
  function createRoom(name,purpose,realityId=engine.selectedId){
    const room={id:"room-"+(state.rooms.length+1),name:String(name||"New Room"),purpose:String(purpose||"programmable space"),realityId};
    state.rooms.push(room); log("room-created",{roomId:room.id}); return clone(room);
  }
  function moveBlock(blockId,position){
    const block=state.blocks.find(item=>item.id===blockId);
    if(!block) throw new TypeError("unknown block id");
    if(!Array.isArray(position)||position.length<3) throw new TypeError("position must contain x, y and z");
    block.position=[Number(position[0])||0,Number(position[1])||0,Number(position[2])||0];
    log("block-moved",{blockId,position:block.position});
    return clone(block);
  }
  function moveRoom(roomId,realityId){
    const room=state.rooms.find(item=>item.id===roomId);
    if(!room) throw new TypeError("unknown room id");
    if(!engine.realties.has(realityId)) throw new TypeError("unknown reality id");
    room.realityId=realityId;
    log("room-rebound",{roomId,realityId});
    return clone(room);
  }

  function addBlock(name,type="object",roomId=state.rooms[0].id){
    const block={id:"block-"+(state.blocks.length+1),name:String(name||"Floating Block"),type,roomId,position:[0,.8,0],simulated:true};
    state.blocks.push(block); log("block-created",{blockId:block.id}); return clone(block);
  }
  function companionResponse(input=""){
    const q=String(input||"").trim().toLowerCase();
    if(/help|what can/.test(q)) return "I can navigate worlds, explain a selected reality, open the Contract Atelier, inspect the Prime Ledger, or describe Reality Lens Ω.";
    if(/contract/.test(q)) return "Contract Atelier is local rehearsal: deterministic grading, simulated TUMBO points, no wallet, custody, settlement or real money.";
    if(/lens|hand|keyboard/.test(q)) return "Reality Lens Ω is semantic zoom. Camera is OFF by default; hand tracking and air typing are explicitly local device modes.";
    if(/prime|ledger|chain/.test(q)) return "Prime Chain is the simulated multidimensional ledger/fabric connecting worlds, contracts and information receipts.";
    if(/mirror|cpt/.test(q)) return "CPT Mirror is a software mapping: charge, spatial parity and time direction are transformed inside this sandbox.";
    if(/hello|hi|hey/.test(q)) return "Welcome home. Pick a surface and let's move through the reality.";
    return "I can see the workspace. Try: contracts, lens, prime, mirror, or help.";
  }
  function toggleCamera(enabled){
    state.lens.cameraEnabled=Boolean(enabled);
    state.lens.cameraStatus=state.lens.cameraEnabled ? "explicitly enabled / local device" : "OFF by default";
    log("lens-camera",{enabled:state.lens.cameraEnabled});
    return clone(state.lens);
  }
  function rehearsePayment({resource="reality://selected",amount=1,participant="operator"}={}){
    const value=Math.max(0,Number(amount)||0);
    const receipt={
      id:"t402:"+String(state.ledger.length+1).padStart(4,"0"),
      protocol:"t402",
      rail:"PAYCORE",
      resource,
      amount:value,
      unit:SIMULATION_UNIT,
      participant,
      status:"rehearsed",
      simulation:true,
      realMoney:false,
      realSettlement:false,
      custody:false
    };
    const reality=engine.get(engine.selectedId);
    addCausalEvent(reality,{id:receipt.id,type:"payment-rehearsal",actorIds:[participant],causes:[],effects:[resource],time:reality.time,metadata:receipt});
    log("t402-payment-rehearsal",receipt);
    return clone(receipt);
  }
  function agentPlan(task="integrate a reality capability"){
    const plan={
      task:String(task),
      controller:state.agents.controller,
      workers:state.agents.workers.slice(),
      reviewer:state.agents.reviewer,
      steps:[
        "Controller decomposes the request into bounded tasks.",
        "MemoryFileAgent records durable local context.",
        "DocumentationFileAgent records the architecture contract.",
        "Reviewer checks invariants before anything is promoted."
      ],
      execution:"local-plan-only",
      network:false
    };
    const reality=engine.get(engine.selectedId);
    addCausalEvent(reality,{id:"agent:"+String(state.ledger.length+1),type:"agent-plan",actorIds:[state.agents.controller],causes:[],effects:["workspace:"+state.activeSurface],time:reality.time,metadata:{task:plan.task,execution:plan.execution}});
    log("agent-plan",plan);
    return clone(plan);
  }

  function createAwardRelic(contractId){
    const c=contracts.get(contractId);
    if(c.status!=="graded" && c.status!=="settled" && c.status!=="claimed") throw new TypeError("grade the contract before minting its simulated award relic");
    const relic={id:"relic-"+contracts.list().length+":"+contractId,contractId,title:"Frozen Relic Award",immutableCore:{eventId:c.eventId,terms:c.outcomes,unit:SIMULATION_UNIT},holder:c.awards.find(a=>a.amount>0)?.participant||"unclaimed",simulation:true,realAsset:false};
    state.blocks.push({id:relic.id,name:relic.title,type:"nft",roomId:"room-nft",position:[.4,.9,.2],simulated:true});
    log("relic-minted",{relicId:relic.id,contractId});
    return relic;
  }
  function snapshot(){
    return {
      schemaVersion:MATUMBO_REALITY_SCHEMA,
      workspace:clone(state),
      contracts:contracts.snapshot(),
      selectedReality:engine.selectedId,
      realityCount:engine.realties.size
    };
  }
  return {
    state,
    contracts,
    selectSurface,
    createStarterContracts,
    rehearse,
    attachContract,
    equip,
    setChessRole,
    createRoom,
    addBlock,
    moveBlock,
    moveRoom,
    companionResponse,
    toggleCamera,
    createAwardRelic,
    rehearsePayment,
    agentPlan,
    input,
    semanticLens,
    snapshot,
    get surface(){return state.surfaces.find(x=>x.id===state.activeSurface)}
  };
}
