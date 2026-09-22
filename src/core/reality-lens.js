export const SEMANTIC_LENS_SCHEMA="matumbo-semantic-lens-0.26";

export const LENS_LEVELS=Object.freeze({
  WORLD:"world",
  SURFACE:"surface",
  ROOM:"room",
  OBJECT:"object",
  INTERACTION:"interaction"
});

const ORDER=Object.freeze([
  LENS_LEVELS.WORLD,
  LENS_LEVELS.SURFACE,
  LENS_LEVELS.ROOM,
  LENS_LEVELS.OBJECT,
  LENS_LEVELS.INTERACTION
]);

const SCALE=Object.freeze({
  world:1,
  surface:2,
  room:3,
  object:4,
  interaction:5
});

const text=value=>String(value??"").trim();

export function createSemanticLens({
  getSelectedWorldId,
  getWorld,
  getSurface,
  listSurfaces,
  getRoom,
  listRooms,
  getObject,
  listObjects,
  getInteractions,
  onSurfaceFocus,
  onRoomFocus
}={}){
  const required=[
    ["getSelectedWorldId",getSelectedWorldId],
    ["getWorld",getWorld],
    ["getSurface",getSurface],
    ["listSurfaces",listSurfaces],
    ["getRoom",getRoom],
    ["listRooms",listRooms],
    ["getObject",getObject],
    ["listObjects",listObjects]
  ];
  for(const [name,fn] of required){
    if(typeof fn!=="function") throw new TypeError(name+" must be a function");
  }

  const state={
    schemaVersion:SEMANTIC_LENS_SCHEMA,
    level:LENS_LEVELS.WORLD,
    targetId:null,
    parentId:null,
    scale:SCALE.world
  };

  function selectedWorld(){
    const id=text(getSelectedWorldId());
    if(!id) throw new TypeError("no selected world");
    const world=getWorld(id);
    if(!world) throw new TypeError("unknown selected world");
    return world;
  }

  function validate(level,targetId){
    const id=text(targetId);
    if(!id) throw new TypeError("lens target id is required");
    if(level===LENS_LEVELS.WORLD && !getWorld(id)) throw new TypeError("unknown world target");
    if(level===LENS_LEVELS.SURFACE && !getSurface(id)) throw new TypeError("unknown surface target");
    if(level===LENS_LEVELS.ROOM && !getRoom(id)) throw new TypeError("unknown room target");
    if(level===LENS_LEVELS.OBJECT && !getObject(id)) throw new TypeError("unknown object target");
    if(level===LENS_LEVELS.INTERACTION && typeof getInteractions==="function"){
      const match=getInteractions(id);
      if(!Array.isArray(match)) throw new TypeError("interaction lookup must return an array");
    }
    return id;
  }

  function setFocus(level,targetId,{parentId=null}={}){
    if(!ORDER.includes(level)) throw new TypeError("unknown semantic lens level");
    const id=validate(level,targetId);
    state.level=level;
    state.targetId=id;
    state.parentId=parentId?text(parentId):null;
    state.scale=SCALE[level];

    if(level===LENS_LEVELS.SURFACE) onSurfaceFocus?.(id);
    if(level===LENS_LEVELS.ROOM){
      const room=getRoom(id);
      onRoomFocus?.(room);
    }
    return snapshot();
  }

  function focusWorld(worldId=getSelectedWorldId()){
    return setFocus(LENS_LEVELS.WORLD,worldId);
  }

  function focusSurface(surfaceId="lattice"){
    return setFocus(LENS_LEVELS.SURFACE,surfaceId,{parentId:text(getSelectedWorldId())||null});
  }

  function focusRoom(roomId){
    const room=getRoom(roomId);
    return setFocus(LENS_LEVELS.ROOM,roomId,{parentId:room?.realityId||text(getSelectedWorldId())||null});
  }

  function focusObject(objectId){
    const object=getObject(objectId);
    return setFocus(LENS_LEVELS.OBJECT,objectId,{parentId:object?.roomId||null});
  }

  function focusInteraction(interactionId,objectId=null){
    return setFocus(LENS_LEVELS.INTERACTION,interactionId,{parentId:objectId||state.targetId||null});
  }

  function firstSurface(){
    const surfaces=listSurfaces();
    return surfaces.find(surface=>surface.id==="lattice")||surfaces[0];
  }

  function roomForSurface(surfaceId){
    const rooms=listRooms();
    const mapping={
      lattice:null,
      contracts:"room-contract",
      arena:"room-arena",
      rooms:"room-profile",
      profile:"room-profile",
      wardrobe:"room-profile",
      nft:"room-nft",
      ledger:"room-prime",
      lens:"room-profile",
      prime:"room-prime",
      commerce:"room-contract",
      agents:"room-profile"
    };
    const wanted=mapping[surfaceId];
    return rooms.find(room=>room.id===wanted)||rooms[0];
  }

  function firstObjectForRoom(roomId){
    return listObjects().find(object=>object.roomId===roomId)||listObjects()[0];
  }

  function firstInteractionForObject(objectId){
    if(typeof getInteractions==="function"){
      const interactions=getInteractions(objectId);
      if(Array.isArray(interactions)&&interactions.length) return interactions[0];
    }
    return {id:"inspect:"+objectId,label:"Inspect object"};
  }

  function zoomIn(){
    if(state.level===LENS_LEVELS.WORLD){
      const surface=firstSurface();
      return surface?focusSurface(surface.id):snapshot();
    }
    if(state.level===LENS_LEVELS.SURFACE){
      const room=roomForSurface(state.targetId);
      return room?focusRoom(room.id):snapshot();
    }
    if(state.level===LENS_LEVELS.ROOM){
      const object=firstObjectForRoom(state.targetId);
      return object?focusObject(object.id):snapshot();
    }
    if(state.level===LENS_LEVELS.OBJECT){
      const interaction=firstInteractionForObject(state.targetId);
      return focusInteraction(interaction.id,state.targetId);
    }
    return snapshot();
  }

  function zoomOut(){
    if(state.level===LENS_LEVELS.WORLD) return snapshot();
    if(state.level===LENS_LEVELS.SURFACE) return focusWorld();
    if(state.level===LENS_LEVELS.ROOM){
      const surface=state.parentId?listSurfaces().find(item=>item.id===state.parentId):firstSurface();
      return focusSurface(surface?.id||"lattice");
    }
    if(state.level===LENS_LEVELS.OBJECT){
      const roomId=getObject(state.targetId)?.roomId;
      return roomId?focusRoom(roomId):focusWorld();
    }
    if(state.level===LENS_LEVELS.INTERACTION){
      return state.parentId?focusObject(state.parentId):focusWorld();
    }
    return snapshot();
  }

  function breadcrumb(){
    const parts=[];
    if(state.level!==LENS_LEVELS.WORLD){
      const world=selectedWorld();
      parts.push({level:LENS_LEVELS.WORLD,id:world.id,label:world.name});
    }
    if(state.level===LENS_LEVELS.SURFACE){
      const surface=getSurface(state.targetId);
      parts.push({level:LENS_LEVELS.SURFACE,id:surface.id,label:surface.label});
    }
    if(state.level===LENS_LEVELS.ROOM){
      const room=getRoom(state.targetId);
      parts.push({level:LENS_LEVELS.SURFACE,id:"rooms",label:"Living Rooms"});
      parts.push({level:LENS_LEVELS.ROOM,id:room.id,label:room.name});
    }
    if(state.level===LENS_LEVELS.OBJECT){
      const object=getObject(state.targetId);
      parts.push({level:LENS_LEVELS.SURFACE,id:"rooms",label:"Living Rooms"});
      const room=getRoom(object.roomId);
      if(room) parts.push({level:LENS_LEVELS.ROOM,id:room.id,label:room.name});
      parts.push({level:LENS_LEVELS.OBJECT,id:object.id,label:object.name});
    }
    if(state.level===LENS_LEVELS.INTERACTION){
      parts.push(...breadcrumbForObject(state.parentId));
      const interaction=typeof getInteractions==="function"?
        getInteractions(state.parentId||"").find(item=>item.id===state.targetId):null;
      parts.push({level:LENS_LEVELS.INTERACTION,id:state.targetId,label:interaction?.label||state.targetId});
    }
    if(state.level===LENS_LEVELS.WORLD) return parts.length?parts:[{level:"world",id:selectedWorld().id,label:selectedWorld().name}];
    return parts;
  }

  function breadcrumbForObject(objectId){
    if(!objectId) return [];
    const object=getObject(objectId);
    if(!object) return [];
    const parts=[{level:LENS_LEVELS.SURFACE,id:"rooms",label:"Living Rooms"}];
    const room=getRoom(object.roomId);
    if(room) parts.push({level:LENS_LEVELS.ROOM,id:room.id,label:room.name});
    parts.push({level:LENS_LEVELS.OBJECT,id:object.id,label:object.name});
    return parts;
  }

  function describe(){
    const item=state.level===LENS_LEVELS.WORLD?selectedWorld():
      state.level===LENS_LEVELS.SURFACE?getSurface(state.targetId):
      state.level===LENS_LEVELS.ROOM?getRoom(state.targetId):
      state.level===LENS_LEVELS.OBJECT?getObject(state.targetId):
      ({id:state.targetId,label:state.targetId});
    return {
      level:state.level,
      scale:state.scale,
      targetId:state.targetId,
      label:item?.label||item?.name||item?.title||state.targetId
    };
  }

  function snapshot(){
    return {
      schemaVersion:SEMANTIC_LENS_SCHEMA,
      level:state.level,
      targetId:state.targetId,
      parentId:state.parentId,
      scale:state.scale,
      breadcrumb:breadcrumb(),
      description:describe()
    };
  }

  focusWorld();

  return {
    focusWorld,
    focusSurface,
    focusRoom,
    focusObject,
    focusInteraction,
    zoomIn,
    zoomOut,
    snapshot,
    get level(){return state.level},
    get targetId(){return state.targetId},
    get scale(){return state.scale}
  };
}
