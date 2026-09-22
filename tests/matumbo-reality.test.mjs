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
