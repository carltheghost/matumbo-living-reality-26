import {getRuleSet} from './physics-rules.js';
import {recalculateSummaries} from './reality-state.js';
import {addCausalEvent} from './causality.js';

const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;

export function stepReality(state,dt=0.05,{gravity=true}={}){
  const rule=getRuleSet(state.lawSetId);
  const delta=Number(dt);
  if(!Number.isFinite(delta)||delta<0)throw new RangeError('dt must be a finite non-negative number');

  const dimensions=Math.min(state.dimension.spatial,4);
  const maxSpeed=Math.max(0,finite(rule.causality.maxSignalSpeed,Infinity));
  const accelerations=new Map(state.entities.map(e=>[e.id,new Array(dimensions).fill(0)]));

  if(gravity&&rule.interactions.gravity!=='disabled'){
    const softening=Math.max(0.05,finite(rule.simulation?.gravitySoftening,0.35));
    const gravityScale=finite(rule.simulation?.gravityScale,0.08);
    for(let i=0;i<state.entities.length;i++){
      const a=state.entities[i];
      if(!(a.mass>0))continue;
      for(let j=i+1;j<state.entities.length;j++){
        const b=state.entities[j];
        if(!(b.mass>0))continue;
        const deltaVec=new Array(dimensions);
        let dist2=softening*softening;
        for(let axis=0;axis<dimensions;axis++){
          deltaVec[axis]=finite(b.position[axis])-finite(a.position[axis]);
          dist2+=deltaVec[axis]*deltaVec[axis];
        }
        const invDist=1/Math.sqrt(dist2);
        const forceScale=gravityScale*a.mass*b.mass/(dist2);
        for(let axis=0;axis<dimensions;axis++){
          const unit=deltaVec[axis]*invDist;
          accelerations.get(a.id)[axis]+=forceScale*unit/Math.max(1,a.mass);
          accelerations.get(b.id)[axis]-=forceScale*unit/Math.max(1,b.mass);
        }
      }
    }
  }

  for(const entity of state.entities){
    const acceleration=accelerations.get(entity.id);
    for(let axis=0;axis<dimensions;axis++){
      entity.velocity[axis]=finite(entity.velocity[axis])+acceleration[axis]*delta;
      if(Number.isFinite(maxSpeed)){
        const speed=Math.hypot(...entity.velocity.slice(0,dimensions));
        if(speed>maxSpeed&&speed>0){
          const scale=maxSpeed/speed;
          for(let i=0;i<dimensions;i++)entity.velocity[i]*=scale;
        }
      }
      entity.position[axis]=finite(entity.position[axis])+entity.velocity[axis]*delta;
      entity.momentum[axis]=entity.velocity[axis]*Math.max(0,finite(entity.mass,1));
    }
  }

  const direction=rule.timeModel.direction;
  state.time+=delta*direction;
  const entropyRate=finite(rule.simulation?.entropyRate,0.5);
  state.entropy=Math.max(0,state.entropy+delta*entropyRate*direction);
  addCausalEvent(state,{
    type:'simulation-step',
    causes:state.entities.map(e=>e.id),
    effects:state.entities.map(e=>e.id),
    actorIds:state.entities.map(e=>e.id),
    time:state.time,
    metadata:{dt:delta,gravity,lawSetId:state.lawSetId}
  });
  recalculateSummaries(state);
  return state;
}

export function simulationInfo(state){
  const rule=getRuleSet(state.lawSetId);
  return {
    lawSetId:rule.id,
    gravityMode:rule.interactions.gravity,
    maxSignalSpeed:rule.causality.maxSignalSpeed,
    dimensions:rule.dimensions,
    timeDirection:rule.timeModel.direction,
    reversible:rule.timeModel.reversible,
  };
}
