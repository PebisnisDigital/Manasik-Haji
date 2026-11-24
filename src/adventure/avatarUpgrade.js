// Original animated GLB avatars with graceful fallback to existing procedural characters.
// Assets are built locally by tools/build-character-models.mjs before Vite builds.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const models=new Map();
const agent=typeof navigator!=='undefined'?navigator.userAgent:'';
const mobile=/Android|iPhone|iPad|Mobile/i.test(agent);
const params=new URLSearchParams(location.search);
const preference=params.get('quality')||'auto';
const disabled=preference==='low'||params.get('model')==='off';
const force=preference==='high'||params.get('model')==='glb';
const marker=params.has('stats');
const ASSET_URLS={
  male:new URL('assets/characters/pilgrim-male.glb',document.baseURI).href,
  female:new URL('assets/characters/pilgrim-female.glb',document.baseURI).href
};
const loader=new GLTFLoader();

function modelFor(sex){
  if(!models.has(sex))models.set(sex,loader.loadAsync(ASSET_URLS[sex])
    .then(data=>{
      const names=new Set(data.animations.map(c=>c.name));
      if(!['Idle','Walk','Run'].every(name=>names.has(name)))throw Error('Missing original avatar motion clips');
      data.scene.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=false;o.receiveShadow=false;}});
      return data;
    })
    .catch(error=>{console.warn('Manasik GLB unavailable; using legacy avatar',error);return null;}));
  return models.get(sex);
}
function fadeTo(entry,next,seconds=.20){
  if(!entry?.actions||entry.active===next)return;
  const target=entry.actions[next]||entry.actions.Idle;
  if(entry.current)entry.current.fadeOut(seconds);
  target.reset().fadeIn(seconds).play();
  entry.current=target;entry.active=next;
}
function equip(group,glb,sex,isNpc=false){
  if(!group||group.userData?.avatarLod==='hd')return null;
  const model=glb.scene.clone(true);
  model.name='Original Pilgrim · '+sex;
  model.userData.gameAsset=true;
  // Keep quest interactions, collisions, camera tracking and save logic on the original group.
  // Hide both meshes and legacy limb groups; retain their original visibility for fallback.
  const original=group.children.map(obj=>({obj,wasVisible:obj.visible}));
  for(const item of original)item.obj.visible=false;
  group.add(model);
  group.userData??={};
  group.userData.avatarLod='hd';
  const mixer=new glb.THREE_MIXER(model);
  const actions={};
  for(const clip of glb.animations){
    if(['Idle','Walk','Run'].includes(clip.name))actions[clip.name]=mixer.clipAction(clip);
  }
  const entry={group,model,original,mixer,actions,current:null,active:null,sex,isNpc,last:new glb.THREE_VECTOR(group.position.x,0,group.position.z)};
  fadeTo(entry,isNpc?'Walk':'Idle',0.01);
  return entry;
}
function unequip(entry){
  if(!entry)return;
  entry.mixer.stopAllAction();
  if(entry.model.parent)entry.model.parent.remove(entry.model);
  for(const item of entry.original)item.obj.visible=item.wasVisible;
  if(entry.group.userData)entry.group.userData.avatarLod='low';
}
export function createAvatarUpgrade(THREE){
  const key=s=>s==='female'?'female':'male';
  const pool={male:null,female:null};
  let activePlayer=null,lastPlayer=null,sex='male',pending=null,generation=0,npcEntries=new Map(),lastNPCScan=0;
  let fpsFrames=0,fpsStart=0,badFrames=0,recoveries=0,lastFps=60,lastScan=0;
  let indicator=null;
  const missingAssets=new Set();
  const stopRequest=()=>{
    if(activePlayer)unequip(activePlayer);
    activePlayer=null;
    for(const e of npcEntries.values())unequip(e);
    npcEntries.clear();
  };
  function canUseHD(){
    if(disabled)return false;
    if(force)return true;
    if(mobile&&((navigator.hardwareConcurrency||8)<=2))return false;
    return badFrames<2;
  }
  function load(sex){
    if(!pool[sex])pool[sex]=modelFor(sex).then(asset=>asset?{...asset,THREE_MIXER:THREE.AnimationMixer,THREE_VECTOR:THREE.Vector3}:null);
    return pool[sex];
  }
  function playerChanged(player,sexNow){
    if(player===lastPlayer&&sexNow===sex)return;
    generation++;stopRequest();lastPlayer=player;sex=sexNow;pending=null;
  }
  function tryEquipPlayer(){
    if(!lastPlayer||!canUseHD()||activePlayer||pending||missingAssets.has(sex))return;
    const who=lastPlayer,sexNow=sex,token=generation;
    pending=load(sexNow).then(asset=>{
      pending=null;
      if(!asset){missingAssets.add(sexNow);return;}
      if(token!==generation||who!==lastPlayer||!canUseHD())return;
      activePlayer=equip(who,asset,sexNow);
    }).catch(()=>{pending=null;});
  }
  function updatePlayer(dt,active,player){
    if(!activePlayer)return;
    if(activePlayer.group!==player){unequip(activePlayer);activePlayer=null;return;}
    const delta=Math.hypot(player.position.x-activePlayer.last.x,player.position.z-activePlayer.last.z);
    activePlayer.last.set(player.position.x,0,player.position.z);
    const speed=dt>.001&&delta<1.5?delta/dt:0;
    fadeTo(activePlayer,!active||speed<.4?'Idle':speed>=7.5?'Run':'Walk');
    if(activePlayer.actions.Walk)activePlayer.actions.Walk.timeScale=Math.max(.68,Math.min(1.35,speed/5.2));
    if(activePlayer.actions.Run)activePlayer.actions.Run.timeScale=Math.max(.8,Math.min(1.5,speed/8));
    activePlayer.mixer.update(Math.max(0,Math.min(.05,dt)));
  }
  function updateNPCs(npcs,player,dt,now){
    if(!npcs||!Array.isArray(npcs))return;
    const limit=mobile?1:3;
    // Existing low-poly NPCs are LOD1 by default; only the closest few become LOD0 GLB.
    if(now-lastNPCScan>650&&canUseHD()&&activePlayer){
      lastNPCScan=now;
      const nearby=npcs.map(n=>n?.mesh||n?.object||n).filter(g=>g?.isGroup&&g!==player&&g.parent)
        .map(g=>({g,d:Math.hypot(g.position.x-player.position.x,g.position.z-player.position.z)}))
        .filter(p=>p.d<17).sort((a,b)=>a.d-b.d).slice(0,limit).map(o=>o.g);
      const selected=new Set(nearby);
      for(const [g,e] of npcEntries)if(!selected.has(g)){unequip(e);npcEntries.delete(g);}
      for(const g of nearby){
        if(npcEntries.has(g)||g.userData?.avatarPending)continue;
        g.userData.avatarPending=true;const token=generation;
        load('male').then(asset=>{
          g.userData.avatarPending=false;
          if(!asset||!canUseHD()||token!==generation||!g.parent||!selected.has(g))return;
          const upgraded=equip(g,asset,'male',true);
          if(upgraded)npcEntries.set(g,upgraded);
        });
      }
    }
    for(const e of npcEntries.values())e.mixer.update(Math.min(.05,Math.max(0,dt)));
  }
  function measure(now){
    if(!fpsStart)fpsStart=now;
    fpsFrames++;
    if(now-fpsStart<2400)return;
    lastFps=Math.round(fpsFrames*1000/Math.max(1,now-fpsStart));fpsFrames=0;fpsStart=now;
    if(!force){
      if(lastFps<26){badFrames++;recoveries=0;}else if(lastFps>49){recoveries++;if(recoveries>=3){badFrames=0;recoveries=0;}}else{recoveries=0;}
      if(badFrames>=2&&activePlayer){stopRequest();}
    }
  }
  function showInfo(){
    if(!marker)return;
    if(!indicator){indicator=document.createElement('div');indicator.style.cssText='position:fixed;left:8px;bottom:5px;z-index:99;pointer-events:none;background:#12352acb;color:#fce7b1;padding:3px 6px;border-radius:5px;font:10px monospace';document.body.append(indicator);}
    indicator.textContent='AVATAR '+(activePlayer?'GLB '+sex.toUpperCase():'LOD1')+' · NPC HD '+npcEntries.size+' · '+lastFps+' FPS';
  }
  function update({player,sex:requestedSex='male',active=true,dt=0,now=0,npcs=null}){
    if(!player)return;
    playerChanged(player,key(requestedSex));
    measure(now);
    if(!canUseHD()){if(activePlayer||npcEntries.size)stopRequest();}
    else tryEquipPlayer();
    updatePlayer(dt,active,player);
    updateNPCs(npcs,player,dt,now);
    if(marker)showInfo();
  }
  return {update};
}
