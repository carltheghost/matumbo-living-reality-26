/** Local-only Social + Social Mirror model. No credentials or financial execution. */
export const VERSION = 1;
export const STORAGE_KEY = 'matumbo.social-mirror.v1';
export const PROVIDERS = Object.freeze([
  ['x','X','𝕏',['x.com','twitter.com']], ['youtube','YouTube','▶',['youtube.com','youtu.be']],
  ['instagram','Instagram','◎',['instagram.com']], ['facebook','Facebook','f',['facebook.com']],
  ['threads','Threads','@',['threads.com','threads.net']], ['tiktok','TikTok','♪',['tiktok.com']],
  ['snapchat','Snapchat','◉',['snapchat.com']], ['reddit','Reddit','r',['reddit.com']],
  ['bluesky','Bluesky','⋈',['bsky.app']], ['mastodon','Mastodon','m',['mastodon.social','mastodon.online','mstdn.social']],
  ['twitch','Twitch','▣',['twitch.tv']], ['discord','Discord','◌',['discord.com','discord.gg']],
  ['linkedin','LinkedIn','in',['linkedin.com']]
].map(([id,name,mark,hosts])=>Object.freeze({id,name,mark,hosts:Object.freeze(hosts)})));
export const RELICS = Object.freeze([
  {id:'pocket-world',title:'Pocket World',kind:'World reference',description:'A local reference to your explorable-world concept. No remote world is loaded.'},
  {id:'genesis-slip',title:'Genesis Slip Relic',kind:'Slip collection concept',description:'Selections, contract, history and evidence belong together. This reference contains no active wager, payout or NFT.'},
  {id:'living-contract',title:'Living Contract',kind:'Contract reference',description:'Sharing a reference never executes a contract, transfers ownership or grants video rights.'}
]);
const fail = (message)=>{throw new Error(message);};
const text = (v,max,allowEmpty=false)=>{
  if(typeof v!=='string' || v.length>max || (!allowEmpty && !v.trim())) fail(`Enter text between 1 and ${max} characters.`);
  return v.trim();
};
const ident = v=>typeof v==='string' && /^[a-zA-Z0-9_-]{1,90}$/.test(v) ? v : fail('Invalid identifier.');
const date = v=>typeof v==='string' && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : fail('Invalid timestamp.');
export const provider = id=>PROVIDERS.find(p=>p.id===id) || fail('Unknown provider.');
export function sourceURL(id,value){
  const p=provider(id); let u;
  try{u=new URL(value);}catch{fail('Enter a full HTTPS link.');}
  const host=u.hostname.replace(/^www\./,'');
  if(u.protocol!=='https:' || u.username || u.password || u.port || !p.hosts.includes(host)) fail(`Use a public HTTPS link on ${p.hosts.join(' or ')}.`);
  if(/(?:oauth|authorize|callback|login|signin|reset|password)/i.test(u.pathname) || [...u.searchParams.keys()].some(k=>/token|secret|auth|code|password|key/i.test(k))) fail('Do not save sign-in, callback, password or secret links.');
  const out=new URL(`https://${host}${u.pathname}`);
  if(id==='youtube' && u.searchParams.has('v')) out.searchParams.set('v',u.searchParams.get('v'));
  return out.href;
}
export function youtubeEmbed(value){
  const u=new URL(sourceURL('youtube',value));
  const parts=u.pathname.split('/').filter(Boolean);
  const id=u.hostname==='youtu.be' ? parts[0] : (u.searchParams.get('v') || (['shorts','embed'].includes(parts[0])?parts[1]:null));
  if(!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) fail('Use a YouTube video link, not a channel or playlist.');
  return `https://www.youtube.com/embed/${id}?autoplay=0&playsinline=1`;
}
export function createState(){return {version:VERSION,revision:0,profile:{name:'Tumbo',handle:'tumbo'},posts:[],sources:[],drafts:[],receipts:[]};}
function canonical(v){if(Array.isArray(v))return v.map(canonical);if(v && typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));return v;}
function fingerprint(v){return JSON.stringify(canonical(v));}
/** Validates persisted content; strips unknown fields and never restores connection claims. */
export function restoreState(raw){
  const s=typeof raw==='string'?JSON.parse(raw):raw;
  if(!s || s.version!==VERSION) fail('Unsupported Social Mirror backup version.');
  const out=createState();
  out.revision=Number.isSafeInteger(s.revision)&&s.revision>=0?s.revision:0;
  out.profile={name:text(s.profile?.name,60),handle:ident(s.profile?.handle)};
  for(const key of ['posts','sources','drafts','receipts']) if(!Array.isArray(s[key]) || s[key].length>2000) fail('Invalid or oversized backup.');
  out.sources=s.sources.map(x=>({id:ident(x.id),provider:provider(x.provider).id,label:text(x.label,80),url:sourceURL(x.provider,x.url),createdAt:date(x.createdAt),mode:'saved-link'}));
  const sourceIds=new Set(out.sources.map(x=>x.id));
  if(sourceIds.size!==out.sources.length) fail('Duplicate source identifier.');
  out.posts=s.posts.map(p=>({id:ident(p.id),text:text(p.text,3000,true),relicId:p.relicId==null?null:(RELICS.some(r=>r.id===p.relicId)?p.relicId:fail('Unknown relic.')),replyTo:p.replyTo==null?null:ident(p.replyTo),createdAt:date(p.createdAt),liked:p.liked===true,saved:p.saved===true,scope:'device-only'}));
  const postIds=new Set(out.posts.map(p=>p.id));
  if(postIds.size!==out.posts.length) fail('Duplicate post identifier.');
  for(const p of out.posts){if((!p.text&&!p.relicId)||p.replyTo===p.id||(p.replyTo && !postIds.has(p.replyTo)))fail('Invalid post or reply.');let q=p;const seen=new Set();while(q?.replyTo){if(seen.has(q.id))fail('Reply cycle.');seen.add(q.id);q=out.posts.find(x=>x.id===q.replyTo);}}
  out.drafts=s.drafts.map(d=>({id:ident(d.id),sourceId:sourceIds.has(d.sourceId)?d.sourceId:fail('Draft source is missing.'),text:text(d.text,3000),threadURL:d.threadURL?sourceURL(out.sources.find(x=>x.id===d.sourceId).provider,d.threadURL):null,createdAt:date(d.createdAt),status:'unsent'}));
  if(new Set(out.drafts.map(d=>d.id)).size!==out.drafts.length)fail('Duplicate draft identifier.');
  out.receipts=s.receipts.map(r=>({id:ident(r.id),operation:text(r.operation,40),fingerprint:text(r.fingerprint,16000),resultId:ident(r.resultId),createdAt:date(r.createdAt),mode:'local'}));
  if(new Set(out.receipts.map(r=>r.id)).size!==out.receipts.length)fail('Duplicate receipt identifier.');
  return out;
}
export function dispatch(state,command,{requestId,now=new Date().toISOString()}={}){
  ident(requestId);date(now);
  const fp=fingerprint(command), old=state.receipts.find(r=>r.id===requestId);
  if(old){if(old.operation==='retired')fail('This request was retired after local deletion.');if(old.fingerprint!==fp)fail('Request ID already used for different content.');return {state,resultId:old.resultId,replayed:true};}
  const s=restoreState(state), p=command.payload||{};let resultId=requestId;
  const post=id=>s.posts.find(x=>x.id===id)||fail('Post not found.');
  const retire=ids=>s.receipts.forEach(r=>{if(ids.has(r.resultId)){r.operation='retired';r.fingerprint='redacted-after-deletion';}});
  switch(command.type){
    case 'post': {
      const body=text(p.text??'',3000,true),relicId=p.relicId||null;
      if(!body&&!relicId)fail('Write a post or attach a relic reference.');
      if(relicId&&!RELICS.some(r=>r.id===relicId))fail('Unknown relic.');
      if(p.replyTo)post(p.replyTo);
      s.posts.unshift({id:requestId,text:body,relicId,replyTo:p.replyTo||null,createdAt:date(now),liked:false,saved:false,scope:'device-only'});break;
    }
    case 'like':post(p.id).liked=!post(p.id).liked;resultId=p.id;break;
    case 'save':post(p.id).saved=!post(p.id).saved;resultId=p.id;break;
    case 'post.delete':{
      post(p.id);const ids=new Set([p.id]);let count;
      do{count=ids.size;s.posts.forEach(x=>{if(ids.has(x.replyTo))ids.add(x.id);});}while(count!==ids.size);
      s.posts=s.posts.filter(x=>!ids.has(x.id));retire(ids);resultId=p.id;break;
    }
    case 'profile':s.profile={name:text(p.name,60),handle:ident(p.handle)};break;
    case 'source.add':{
      const url=sourceURL(p.provider,p.url);
      if(s.sources.some(x=>x.provider===p.provider&&x.url===url))fail('This source is already saved.');
      s.sources.push({id:requestId,provider:provider(p.provider).id,url,label:text(p.label||provider(p.provider).name,80),createdAt:date(now),mode:'saved-link'});break;
    }
    case 'source.remove':{
      if(!s.sources.some(x=>x.id===p.id))fail('Source not found.');
      const ids=new Set([p.id,...s.drafts.filter(d=>d.sourceId===p.id).map(d=>d.id)]);
      s.sources=s.sources.filter(x=>x.id!==p.id);s.drafts=s.drafts.filter(x=>x.sourceId!==p.id);retire(ids);resultId=p.id;break;
    }
    case 'draft':{
      const source=s.sources.find(x=>x.id===p.sourceId)||fail('Select a saved source.');
      s.drafts.unshift({id:requestId,sourceId:source.id,text:text(p.text,3000),threadURL:p.threadURL?sourceURL(source.provider,p.threadURL):null,createdAt:date(now),status:'unsent'});break;
    }
    case 'draft.remove':{
      if(!s.drafts.some(d=>d.id===p.id))fail('Draft not found.');s.drafts=s.drafts.filter(d=>d.id!==p.id);retire(new Set([p.id]));resultId=p.id;break;
    }
    default:fail('Unsupported action. No action was sent.');
  }
  if(Math.max(s.posts.length,s.sources.length,s.drafts.length)>=2000 || s.receipts.length>=2000)fail('Local storage limit reached. Export and archive this workspace before continuing.');
  s.revision++;s.receipts.push({id:requestId,operation:command.type,fingerprint:fp,resultId,createdAt:date(now),mode:'local'});
  return {state:s,resultId,replayed:false};
}
export function externalCapabilities(id){provider(id);return {authenticated:false,read:false,publish:false,replies:false,messages:false,notifications:false};}
export function assertExternalAction(id,action){provider(id);fail(`External ${action} is unavailable: no authorized adapter is configured. Nothing was sent.`);}
export function exportState(state,{includeDrafts=false}={}){
  const out=restoreState(state);if(!includeDrafts){out.drafts=[];out.receipts=[];}return JSON.stringify(out,null,2);
}
/** Save first, then expose the new state. A failed write must never report success. */
export function persistTransaction(storage,state,command,options){
  const result=dispatch(state,command,options);storage.setItem(STORAGE_KEY,JSON.stringify(result.state));return result;
}
