// Shared visual/gameplay feel for all 3D Manasik Adventure chapters.
// No external models, trackers, assets, or UI required. Never changes mission/save state.
// Designed for existing low-poly characters and phone landscape controls.
export function createAdventureFeel(THREE){
  let actor=null,arms=null,legs=[],torso=null,shadow=null,shadowTexture=null,shadowScene=null;
  let lastPosition=null,phase=0,smoothSpeed=0,stepDistance=0,sound=false,audio=null;
  let baseFov=null,frameSamples=0,sampleStart=0,fps=60,currentPixelRatio=null,stats=null,lastRatioChange=0;
  const reducedMotion=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const debug=typeof location!=='undefined'&&new URLSearchParams(location.search).has('stats');
  function makeShadow(){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(32,32,1,32,32,31);
    g.addColorStop(0,'rgba(0,0,0,.42)');g.addColorStop(.52,'rgba(0,0,0,.15)');g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
    shadowTexture=new THREE.CanvasTexture(canvas);shadowTexture.colorSpace=THREE.SRGBColorSpace;
    shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.25),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity:.62,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
    shadow.rotation.x=-Math.PI/2;shadow.renderOrder=2;
  }
  function attachActor(player,scene){
    if(arms){for(const arm of arms){if(arm.parent)arm.parent.remove(arm);arm.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();});}}
    arms=null;actor=player;legs=[];torso=null;lastPosition=null;phase=0;smoothSpeed=0;stepDistance=0;
    if(!actor)return;
    torso=actor.children.find(c=>c.isMesh&&c.position.y>.85&&c.position.y<1.5&&Math.abs(c.position.x)<.1)||null;
    legs=actor.children.filter(c=>c.isMesh&&c.position.y<.65&&c.position.y>.1&&Math.abs(c.position.x)>.12&&Math.abs(c.position.x)<.28).slice(0,2);
    const robe=torso?.material;
    const head=actor.children.find(c=>c.isMesh&&c.position.y>1.9&&c.position.y<2.15)?.material;
    if(robe&&head&&!reducedMotion){
      arms=[];
      for(const side of [-1,1]){
        const pivot=new THREE.Group();pivot.position.set(side*.46,1.62,.015);
        const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.135,.155,.64,8),robe);
        sleeve.position.set(side*.075,-.31,.025);sleeve.rotation.z=side*.13;pivot.add(sleeve);
        const hand=new THREE.Mesh(new THREE.SphereGeometry(.105,9,7),head);
        hand.position.set(side*.11,-.68,.045);pivot.add(hand);
        actor.add(pivot);arms.push(pivot);
      }
    }
    if(shadow){
      if(shadow.parent)shadow.parent.remove(shadow);
      scene.add(shadow);shadowScene=scene;
    }
  }
  function connectVoiceButton(){
    const b=document.getElementById('voice')||document.getElementById('voiceButton');
    if(!b||b.dataset.adventureFootstepsBound==='true')return;
    b.dataset.adventureFootstepsBound='true';
    b.addEventListener('click',()=>{
      sound=String(b.textContent).includes('ON');
      if(sound&&!audio){try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)audio=new Audio();}catch{sound=false;}}
      if(sound&&audio?.state==='suspended')audio.resume().catch(()=>{});
    });
  }
  function playStep(speed){
    if(!sound||!audio||audio.state!=='running')return;
    try{
      const t=audio.currentTime,osc=audio.createOscillator(),vol=audio.createGain();
      osc.type='triangle';osc.frequency.setValueAtTime(speed>6?135:100,t);
      osc.frequency.exponentialRampToValueAtTime(65,t+.055);
      vol.gain.setValueAtTime(.0001,t);vol.gain.exponentialRampToValueAtTime(.011,t+.008);
      vol.gain.exponentialRampToValueAtTime(.0001,t+.075);
      osc.connect(vol).connect(audio.destination);osc.start(t);osc.stop(t+.079);
    }catch{}
  }
  function update({scene,renderer,camera,player,dt,now,active=true,aiming=false}){
    if(!scene||!renderer||!camera||!player)return;
    if(!shadow)makeShadow();
    if(player!==actor||shadowScene!==scene)attachActor(player,scene);
    if(!lastPosition)lastPosition=new THREE.Vector3(player.position.x,0,player.position.z);
    const delta=Math.hypot(player.position.x-lastPosition.x,player.position.z-lastPosition.z);
    lastPosition.set(player.position.x,0,player.position.z);
    const validMove=active&&delta>0&&delta<1.4&&dt>.001;
    const rawSpeed=validMove?Math.min(10,delta/dt):0;
    smoothSpeed+=(rawSpeed-smoothSpeed)*Math.min(1,Math.max(.05,dt*9));
    const strength=reducedMotion?0:Math.min(1,smoothSpeed/5.5);
    phase+=dt*(3.9+smoothSpeed*1.35);
    const wave=Math.sin(phase);
    if(legs.length===2){legs[0].rotation.x=wave*.37*strength;legs[1].rotation.x=-wave*.37*strength;}
    if(arms?.length===2){arms[0].rotation.x=-wave*.4*strength+.035;arms[1].rotation.x=wave*.4*strength+.035;
      arms[0].rotation.z=-.035+Math.sin(now*.001)*.015;
      arms[1].rotation.z=.035-Math.sin(now*.001)*.015;}
    if(torso){torso.rotation.z=Math.sin(phase)*.012*strength;torso.scale.y=1+(!reducedMotion?Math.sin(now*.002)*.009:0);}
    if(shadow){shadow.position.set(player.position.x,.105,player.position.z);const scale=1+strength*.11;shadow.scale.set(scale,scale,scale);shadow.material.opacity=.62-strength*.07;shadow.visible=true;}
    if(validMove&&!reducedMotion){stepDistance+=delta;if(stepDistance>=1.38){stepDistance%=1.38;playStep(rawSpeed);}}
    if(baseFov===null)baseFov=camera.fov;
    if(!reducedMotion){const desired=baseFov+(!aiming&&active?Math.min(4.3,smoothSpeed*.49):0);
      camera.fov+=(desired-camera.fov)*Math.min(1,dt*2.8);
      if(Math.abs(desired-camera.fov)>.006)camera.updateProjectionMatrix();}
    if(!sampleStart)sampleStart=now;
    frameSamples++;
    const elapsed=now-sampleStart;
    if(elapsed>=2100){
      fps=Math.round(frameSamples*1000/Math.max(elapsed,1));
      frameSamples=0;sampleStart=now;
      // Responsiveness matters more than max resolution on phones.
      const dpr=window.devicePixelRatio||1,cap=Math.min(dpr,/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)?1.2:1.55);
      if(currentPixelRatio===null)currentPixelRatio=Math.min(cap,renderer.getPixelRatio?.()||cap);
      let next=currentPixelRatio;
      if(fps<31)next=Math.max(.75,next-.14);
      else if(fps>55)next=Math.min(cap,next+.06);
      if(Math.abs(next-currentPixelRatio)>.025&&now-lastRatioChange>2100){
        currentPixelRatio=next;lastRatioChange=now;renderer.setPixelRatio(next);
        renderer.setSize(Math.max(1,window.innerWidth),Math.max(1,window.innerHeight),false);
      }
      if(debug){
        if(!stats){stats=document.createElement('div');stats.style.cssText='position:fixed;z-index:100;left:50%;bottom:4px;transform:translateX(-50%);padding:4px 8px;border-radius:6px;background:#0d2824d9;color:#f6e9c4;font:11px monospace;pointer-events:none';document.body.append(stats);}
        stats.textContent='FPS '+fps+' · DPR '+(renderer.getPixelRatio?.()||1).toFixed(2)+' · MOVE '+smoothSpeed.toFixed(1);
      }
    }
    connectVoiceButton();
  }
  return {update};
}
