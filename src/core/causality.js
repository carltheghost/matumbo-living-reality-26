const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

export function addCausalEvent(state,{id,type,causes=[],effects=[],actorIds=[],time=state.time,metadata={}}={}){
  const event={id:id||'cause_'+state.id+'_'+(state.causalGraph.length+1),type:type||'event',causes:[...causes],effects:[...effects],actorIds:[...actorIds],time:Number(time),metadata:clone(metadata)};
  state.causalGraph.push(event);
  if(state.causalGraph.length>4000)state.causalGraph.shift();
  return event;
}

export function canReach(state,fromId,toId,{maxDepth=64}={}){
  if(fromId===toId)return true;
  const graph=new Map();
  for(const event of state.causalGraph){
    const sources=[...(event.causes||[])];
    for(const source of sources){
      const list=graph.get(source)||[];
      list.push(...(event.effects||[]));
      graph.set(source,list);
    }
  }
  const queue=[{id:fromId,depth:0}],seen=new Set([fromId]);
  while(queue.length){
    const {id,depth}=queue.shift();
    if(depth>=maxDepth)continue;
    for(const next of graph.get(id)||[]){
      if(next===toId)return true;
      if(seen.has(next))continue;
      seen.add(next);queue.push({id:next,depth:depth+1});
    }
  }
  return false;
}

export function causalSummary(state){
  return {
    events:state.causalGraph.length,
    latest:state.causalGraph.at(-1)||null,
    actors:new Set(state.causalGraph.flatMap(event=>event.actorIds||[])).size,
  };
}
