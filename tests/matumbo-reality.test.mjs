import test from 'node:test';
import assert from 'node:assert/strict';
import {createRealityLattice} from '../src/core/reality-engine.js';
import {createMatumboReality,SURFACES} from '../src/core/matumbo-reality.js';

test('maTumbo workspace boots all major surfaces',()=>{
  const engine=createRealityLattice();
  const workspace=createMatumboReality(engine);
  assert.equal(workspace.state.surfaces.length,SURFACES.length);
  assert.ok(workspace.state.surfaces.some(x=>x.id==='contracts'));
  assert.ok(workspace.state.surfaces.some(x=>x.id==='lens'));
  assert.ok(workspace.state.surfaces.some(x=>x.id==='prime'));
});

test('starter contracts are attached to realities and remain simulated',()=>{
  const engine=createRealityLattice();
  const workspace=createMatumboReality(engine);
  const contracts=workspace.contracts.list();
  assert.equal(contracts.length,5);
  assert.equal(contracts[0].simulation,true);
  assert.equal(contracts[0].realMoney,false);
  assert.ok(engine.realties.has(contracts[0].realityId));
});

test('outcome rehearsal grades deterministically and conserves the pool',()=>{
  const workspace=createMatumboReality(createRealityLattice());
  const graded=workspace.rehearse('OCT-SOCCER-001','HOME');
  assert.equal(graded.status,'settled');
  assert.equal(graded.grading.pool,200);
  assert.equal(graded.grading.awards.reduce((s,a)=>s+a.amount,0),200);
  assert.ok(graded.grading.digest);
});

test('profile, wardrobe, rooms and blocks are executable local state',()=>{
  const workspace=createMatumboReality(createRealityLattice());
  workspace.equip('ivory-gold');
  workspace.setChessRole('knight');
  const room=workspace.createRoom('Floating Test Room','local test space','R-CUSTOM');
  const block=workspace.addBlock('Amazon Prime','service-block',room.id);
  assert.equal(workspace.state.profile.outfitId,'ivory-gold');
  assert.equal(workspace.state.profile.chessRole,'knight');
  assert.equal(room.realityId,'R-CUSTOM');
  assert.equal(block.simulated,true);
});

test('Reality Lens camera remains explicit and off by default',()=>{
  const workspace=createMatumboReality(createRealityLattice());
  assert.equal(workspace.state.lens.cameraEnabled,false);
  workspace.toggleCamera(true);
  assert.equal(workspace.state.lens.cameraEnabled,true);
  workspace.toggleCamera(false);
  assert.equal(workspace.state.lens.cameraEnabled,false);
});

test('scripted Luna is local and network-free',()=>{
  const workspace=createMatumboReality(createRealityLattice());
  assert.match(workspace.companionResponse('open contract'),/Contract Atelier/);
  assert.equal(workspace.state.companion.network,false);
});


import {createAirTyping} from '../src/input/air-typing.js';
import {createHandLens,classifyHandGesture,normalizeHandLandmarks} from '../src/input/hand-lens.js';

test('t402 and agent fabric stay local and simulated',()=>{
  const workspace=createMatumboReality(createRealityLattice());
  const receipt=workspace.rehearsePayment({resource:'reality://R-OBSERVED',amount:12});
  const plan=workspace.agentPlan('wire contracts into reality');
  assert.equal(receipt.protocol,'t402');
  assert.equal(receipt.rail,'PAYCORE');
  assert.equal(receipt.realMoney,false);
  assert.equal(receipt.realSettlement,false);
  assert.equal(plan.network,false);
  assert.equal(plan.execution,'local-plan-only');
});

test('Air Keyboard emits a delayed character and supports one-shot shift',()=>{
  const typing=createAirTyping();
  typing.setKeyMap([{key:'a',rect:{x:0,y:0,w:1,h:1}},{key:'Shift',rect:{x:1,y:0,w:1,h:1}}]);
  typing.registerTap(1,0.5,0.5,0);
  assert.deepEqual(typing.poll(100),[{type:'char',char:'a'}]);
  typing.registerTap(1,1.5,0.5,200);
  typing.poll(300);
  typing.registerTap(1,0.5,0.5,400);
  assert.deepEqual(typing.poll(500),[{type:'char',char:'A'}]);
});

test('Hand Lens normalizes two hands and recognizes pinch',()=>{
  const hands=[Array.from({length:21},()=>({x:.5,y:.5,z:0})),Array.from({length:21},()=>({x:.2,y:.3,z:0}))];
  hands[0][4]={x:.50,y:.50,z:0};
  hands[0][8]={x:.52,y:.52,z:0};
  const normalized=normalizeHandLandmarks(hands);
  assert.equal(normalized.length,2);
  assert.equal(classifyHandGesture(normalized[0]),'pinch');
  const lens=createHandLens({now:()=>123});
  lens.setEnabled(true);
  assert.equal(lens.update(hands).events[0].gesture,'pinch');
});

test("floating blocks persist movement in workspace state",()=>{
  const workspace=createMatumboReality(createRealityLattice());
  const block=workspace.state.blocks.find(item=>item.id==="block-prime");
  const moved=workspace.moveBlock(block.id,[3,1.25,-2]);
  assert.deepEqual(moved.position,[3,1.25,-2]);
  assert.deepEqual(workspace.state.blocks.find(item=>item.id===block.id).position,[3,1.25,-2]);
});
test("award claims remain independently claimable",()=>{
  const workspace=createMatumboReality(createRealityLattice());
  const contract=workspace.contracts.createContract({id:"OCT-MULTI-001",eventId:"multi",eventLabel:"Multi award rehearsal",outcomes:["YES","NO"],realityId:"R-OBSERVED"});
  workspace.contracts.join(contract.id,{participant:"alice",outcome:"YES",amount:50,idempotencyKey:"alice"});
  workspace.contracts.join(contract.id,{participant:"bob",outcome:"YES",amount:50,idempotencyKey:"bob"});
  workspace.contracts.join(contract.id,{participant:"carol",outcome:"NO",amount:100,idempotencyKey:"carol"});
  workspace.contracts.grade(contract.id,"YES");
  workspace.contracts.settle(contract.id);
  const graded=workspace.contracts.get(contract.id);
  const first=graded.awards[0];
  const second=graded.awards[1];
  workspace.contracts.transferAward(contract.id,second.id,"holder-b");
  workspace.contracts.claim(contract.id,first.id);
  assert.equal(workspace.contracts.get(contract.id).status,"settled");
  const claimed=workspace.contracts.claim(contract.id,second.id);
  assert.equal(claimed.claimed,true);
  assert.equal(workspace.contracts.get(contract.id).status,"claimed");
});

import {LENS_LEVELS,SEMANTIC_LENS_SCHEMA} from '../src/core/reality-lens.js';

test('Reality Lens exposes a semantic five-level focus path',()=>{
  const workspace=createMatumboReality(createRealityLattice());
  const lens=workspace.semanticLens;
  assert.equal(lens.snapshot().schemaVersion,SEMANTIC_LENS_SCHEMA);
  assert.equal(lens.level,LENS_LEVELS.WORLD);

  let focus=lens.zoomIn();
  assert.equal(focus.level,LENS_LEVELS.SURFACE);
  assert.equal(workspace.state.activeSurface,'lattice');

  focus=lens.zoomIn();
  assert.equal(focus.level,LENS_LEVELS.ROOM);
  assert.equal(workspace.state.activeSurface,'rooms');

  focus=lens.zoomOut();
  assert.equal(focus.level,LENS_LEVELS.SURFACE);
  assert.equal(focus.targetId,'lattice');
  focus=lens.zoomIn();
  assert.equal(focus.level,LENS_LEVELS.ROOM);
  assert.equal(workspace.state.activeSurface,'rooms');

  focus=lens.zoomIn();
  assert.equal(focus.level,LENS_LEVELS.OBJECT);
  assert.ok(focus.targetId);

  focus=lens.zoomIn();
  assert.equal(focus.level,LENS_LEVELS.INTERACTION);
  assert.equal(focus.parentId,focus.breadcrumb[focus.breadcrumb.length-2].id);

  focus=lens.zoomOut();
  assert.equal(focus.level,LENS_LEVELS.OBJECT);
  focus=lens.zoomOut();
  assert.equal(focus.level,LENS_LEVELS.ROOM);
  focus=lens.zoomOut();
  assert.equal(focus.level,LENS_LEVELS.SURFACE);
  focus=lens.zoomOut();
  assert.equal(focus.level,LENS_LEVELS.WORLD);
  assert.equal(workspace.state.activeSurface,'lattice');
});

test('Reality Lens directly focuses surfaces, rooms and floating objects',()=>{
  const workspace=createMatumboReality(createRealityLattice());
  workspace.semanticLens.focusSurface('contracts');
  assert.equal(workspace.semanticLens.level,LENS_LEVELS.SURFACE);
  assert.equal(workspace.state.activeSurface,'contracts');

  workspace.semanticLens.focusRoom('room-contract');
  assert.equal(workspace.semanticLens.level,LENS_LEVELS.ROOM);
  assert.equal(workspace.state.activeSurface,'rooms');

  const block=workspace.state.blocks.find(item=>item.roomId==='room-contract');
  workspace.semanticLens.focusObject(block.id);
  assert.equal(workspace.semanticLens.level,LENS_LEVELS.OBJECT);
  assert.equal(workspace.semanticLens.targetId,block.id);
  assert.equal(workspace.state.activeSurface,'rooms');
});
