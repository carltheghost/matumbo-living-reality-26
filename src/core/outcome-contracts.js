const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

export const OUTCOME_CONTRACT_SCHEMA = "matumbo-outcome-contract-0.26";
export const SIMULATION_UNIT = "simulated TUMBO points";
export const STATUSES = Object.freeze(["draft","open","locked","graded","settled","claimed","voided"]);
const TRANSITIONS = Object.freeze({
  draft:["open","voided"],
  open:["locked","graded","voided"],
  locked:["graded","voided"],
  graded:["settled"],
  settled:["claimed"],
  claimed:[],
  voided:[]
});

function text(value,fallback=""){return value == null ? fallback : String(value).trim()}
function cents(value){
  const n = Number(value);
  if(!Number.isFinite(n) || n <= 0) throw new TypeError("amount must be positive");
  return Math.round(n * 100);
}
function hash(value){
  let h = 0x811c9dc5;
  const s = text(value,"matumbo");
  for(const ch of s){h ^= ch.charCodeAt(0);h=Math.imul(h,0x01000193)>>>0}
  return h.toString(16).padStart(8,"0");
}

export function createOutcomeContracts({seed="matumbo-contracts",now=()=>new Date().toISOString()}={}){
  const contracts = new Map();
  const awards = new Map();
  let sequence = 0;

  function timestamp(){return typeof now === "function" ? now() : text(now)}
  function id(prefix,input){sequence += 1; return prefix+":"+hash(seed+":"+input+":"+sequence)}

  function transition(contract,to,reason){
    const allowed = TRANSITIONS[contract.status] || [];
    if(!allowed.includes(to)) throw new TypeError(`illegal contract transition: ${contract.status} → ${to}`);
    const next = {
      ...contract,
      status:to,
      lifecycle:[...contract.lifecycle,{status:to,at:timestamp(),reason:text(reason)}]
    };
    contracts.set(contract.id,next);
    return clone(next);
  }

  function createContract({id=null,eventId,eventLabel,outcomes,creator="maTumbo",realityId="R-OBSERVED",kind="outcome",status="open",metadata={}}={}){
    const normalized=[...new Set((outcomes||[]).map(x=>text(x).toUpperCase()).filter(Boolean))];
    if(normalized.length < 2) throw new TypeError("a contract needs at least two outcomes");
    const contract = {
      schemaVersion:OUTCOME_CONTRACT_SCHEMA,
      id:id || idFor("contract",eventId,eventLabel),
      eventId:text(eventId,"event"),
      eventLabel:text(eventLabel,"Untitled Event"),
      outcomes:normalized,
      creator:text(creator,"maTumbo"),
      realityId,
      kind,
      status:status === "draft" ? "draft" : "open",
      lifecycle:[{status:status === "draft" ? "draft" : "open",at:timestamp(),reason:"created"}],
      participants:[],
      result:null,
      grading:null,
      awards:[],
      simulation:true,
      realMoney:false,
      wagering:false,
      custody:false,
      settlement:false,
      claimNeverExpires:true,
      metadata:clone(metadata)
    };
    contracts.set(contract.id,contract);
    return clone(contract);
  }
  function idFor(prefix,a="",b=""){sequence += 1; return prefix+":"+hash(seed+":"+a+":"+b+":"+sequence)}

  function get(contractId){
    const value=contracts.get(text(contractId));
    if(!value) throw new TypeError("unknown contract id");
    return clone(value);
  }

  function publish(contractId){return transition(get(contractId),"open","published")}
  function lock(contractId){
    const c=get(contractId);
    if(c.status==="open") return transition(c,"locked","joining closed");
    return c;
  }

  function join(contractId,{participant,outcome,amount,idempotencyKey=null}={}){
    const c=get(contractId);
    if(!["open","draft"].includes(c.status)) throw new TypeError("contract is not accepting joins");
    const who=text(participant,"anonymous"), pick=text(outcome).toUpperCase(), key=text(idempotencyKey,who+":"+pick+":"+amount);
    const existing=c.participants.find(p=>p.idempotencyKey===key && p.participant===who);
    if(existing) return clone(c);
    if(!c.outcomes.includes(pick)) throw new TypeError("outcome is not in the contract");
    const row={
      participant:who,
      outcome:pick,
      amount:Number((cents(amount)/100).toFixed(2)),
      idempotencyKey:key,
      joinedAt:timestamp()
    };
    const next={...c,participants:[...c.participants,row]};
    contracts.set(c.id,next);
    return clone(next);
  }

  function grade(contractId,result){
    const c=lock(contractId);
    if(c.status==="graded" || c.status==="settled" || c.status==="claimed") return clone(c);
    const landed=text(result).toUpperCase();
    if(!c.outcomes.includes(landed) && landed!=="DRAW" && landed!=="VOID") throw new TypeError("result is not a declared outcome");
    const pool=c.participants.reduce((sum,p)=>sum+cents(p.amount),0);
    const winners=landed==="DRAW" || landed==="VOID" ? [] : c.participants.filter(p=>p.outcome===landed);
    const payouts=new Map();
    if(winners.length){
      const winningTotal=winners.reduce((sum,p)=>sum+cents(p.amount),0);
      let allocated=0;
      winners.forEach((p,index)=>{
        const share=Math.floor(cents(p.amount)*pool/winningTotal);
        payouts.set(index,share);allocated+=share;
      });
      for(let remainder=pool-allocated,i=0;remainder>0;remainder--,i++) payouts.set(i,payouts.get(i)+1);
    }else{
      c.participants.forEach((_,index)=>payouts.set(index,cents(c.participants[index].amount)));
    }
    const awardRows=c.participants.map((p,index)=>({
      participant:p.participant,
      outcome:p.outcome,
      amount:Number((payouts.get(index)/100).toFixed(2)),
      kind:winners.length ? (p.outcome===landed ? "award":"no_award") : "refund",
      unit:SIMULATION_UNIT,
      expiresAt:null
    })).filter(row=>row.amount>0);
    const digest=hash(JSON.stringify({eventId:c.eventId,outcomes:c.outcomes,result:landed,participants:c.participants}));
    const next={
      ...c,
      status:"graded",
      result:landed,
      grading:{digest,pool:Number((pool/100).toFixed(2)),awards:awardRows,at:timestamp()},
      awards:awardRows.map((row,index)=>({...row,id:"award:"+hash(c.id+":"+row.participant+":"+index),claimed:false})),
      lifecycle:[...c.lifecycle,{status:"graded",at:timestamp(),reason:"deterministic result grading"}]
    };
    contracts.set(c.id,next);
    return clone(next);
  }

  function settle(contractId){
    const c=get(contractId);
    if(c.status==="settled" || c.status==="claimed") return c;
    if(c.status!=="graded") throw new TypeError("contract must be graded before settlement");
    const next={...c,status:"settled",settlement:true,lifecycle:[...c.lifecycle,{status:"settled",at:timestamp(),reason:"local rehearsal settlement"}]};
    contracts.set(c.id,next);
    return clone(next);
  }

  function claim(contractId,awardId){
    const c=settle(contractId);
    const award=c.awards.find(a=>a.id===awardId);
    if(!award) throw new TypeError("unknown award");
    if(award.claimed) return clone(award);
    const nextAwards=c.awards.map(a=>a.id===awardId ? {...a,claimed:true,claimedAt:timestamp()} : a);
    const next={...c,status:"claimed",awards:nextAwards,lifecycle:[...c.lifecycle,{status:"claimed",at:timestamp(),reason:"local holder claim"}]};
    contracts.set(c.id,next);
    awards.set(awardId,{contractId:c.id,amount:award.amount,unit:SIMULATION_UNIT});
    return clone(nextAwards.find(a=>a.id===awardId));
  }

  function attach(contractId,realityId){
    const c=get(contractId);
    const next={...c,realityId:text(realityId,"R-OBSERVED")};
    contracts.set(c.id,next);
    return clone(next);
  }

  function quote(contractId,quotes={}){
    const c=get(contractId);
    const next={...c,metadata:{...c.metadata,quotes:clone(quotes),quoteSimulation:true}};
    contracts.set(c.id,next);
    return clone(next);
  }

  return {
    createContract,
    get,
    list:()=>[...contracts.values()].map(clone),
    publish,
    lock,
    join,
    grade,
    settle,
    claim,
    attach,
    quote,
    snapshot:()=>({schemaVersion:OUTCOME_CONTRACT_SCHEMA,contracts:[...contracts.values()].map(clone)})
  };
}
