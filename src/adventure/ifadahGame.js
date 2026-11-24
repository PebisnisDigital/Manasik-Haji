import * as THREE from 'three';
import { createAdventureFeel } from './feel.js';
import { createAdventureVisuals } from './visuals.js';
import { createAvatarUpgrade } from './avatarUpgrade.js';
const avatars=createAvatarUpgrade(THREE);
const visuals=createAdventureVisuals(THREE);
const feel=createAdventureFeel(THREE);
// Level 10 — Haji Tamattu': playable Tawaf Ifadah (7 loops) + Sa'i Haji (7 traversals).
// Fictional scale and checkpoints; successful game progress never establishes ritual validity.
const $=id=>document.getElementById(id);
const SAVE='manasik-ifadah-quest-v1',PREV='manasik-aqabah-quest-v1',TAU=Math.PI*2;
const TW_GATES=10,SA_GATES=5,TR=19,SA_START=-36,SA_END=36;
const demo=new URLSearchParams(location.search).has('demo');
function unlocked(){try{const p=JSON.parse(localStorage.getItem(PREV)||'null');return p?.version===1&&p.stage===8&&p.throws===7;}catch{return false;}}
if(!unlocked()&&!demo){location.replace('./adventure-map.html');throw new Error('Level 09 must be completed');}
const QUEST=[
 {world:'mina',x:-18,z:0,title:'Temui pembimbing Mina',hint:'Cari pembimbing A07 sebelum berangkat menuju Makkah.',action:'Bicara'},
 {world:'mina',x:18,z:0,title:'Naik bus ke Makkah',hint:'Cari bus hijau A07 di halaman Mina.',action:'Naik bus'},
 {world:'haram',x:0,z:32,title:'Masuk Masjidil Haram',hint:'Temukan pintu masuk yang ditandai cahaya emas.',action:'Masuk'},
 {world:'haram',x:TR,z:0,title:'Mulai Tawaf Ifadah',hint:'Datangi titik awal sejajar Hajar Aswad, lalu mulai 7 putaran.',action:'Mulai Tawaf'},
 {world:'haram',x:TR,z:0,title:'Tawaf Ifadah · 7 putaran',hint:'Ikuti penanda melingkar. Ka’bah tetap di sebelah kiri.',action:''},
 {world:'haram',x:0,z:29,title:'Temui pembimbing setelah Tawaf',hint:'Tujuh putaran selesai. Cari pembimbing menuju area Sa’i.',action:'Lanjut Sa’i'},
 {world:'sai',x:0,z:SA_START,title:'Sa’i Haji · 7 lintasan',hint:'Mulai dari Safa dan akhiri lintasan ketujuh di Marwah.',action:''},
 {world:'sai',x:6,z:SA_END,title:'Temui pembimbing di Marwah',hint:'Tujuh lintasan selesai. Datangi pembimbing di Marwah.',action:'Lapor'},
 {world:'sai',x:6,z:SA_END,title:'Level 10 selesai',hint:'Misi Tawaf Ifadah dan Sa’i Haji telah selesai.',action:''}
];
let state={version:1,stage:0,avatar:'male',laps:0,twGate:0,legs:0,saGate:0};
let scene,renderer,camera,world,player,marker,guide,gateObject,worldNpcs=[],stars=[],twilight=false;
let px=-32,pz=6,yaw=Math.PI/2,heading=0,active=false,transitioning=false,voice=false,last=0,toastEnd=0;
const keys=new Set(),joy={pointer:null,x:0,y:0},look={pointer:null,x:0},cameraGoal=new THREE.Vector3(),cameraLook=new THREE.Vector3(),materials=new Map();
const box=(x,y,z)=>new THREE.BoxGeometry(x,y,z),sphere=(r=.4)=>new THREE.SphereGeometry(r,11,9);
function material(color,glow=0){const k=color+':'+glow;if(!materials.has(k))materials.set(k,new THREE.MeshStandardMaterial({color,roughness:.82,metalness:.02,emissive:color,emissiveIntensity:glow}));return materials.get(k);}
function mesh(geo,color,x,y,z,parent=world,glow=0){const m=new THREE.Mesh(geo,material(color,glow));m.position.set(x,y,z);parent.add(m);return m;}
function npc(parent,color=0xf6f1e6,hijab=false){const r=new THREE.Group();parent.add(r);mesh(new THREE.CylinderGeometry(.34,.48,1.48,9),color,0,1.08,0,r);mesh(sphere(.245),0xa77b59,0,2.07,0,r);for(const x of [-.19,.19])mesh(new THREE.CylinderGeometry(.12,.14,.6,8),0xdfdacf,x,.31,0,r);if(hijab)mesh(new THREE.ConeGeometry(.46,.89,10),color,0,2.14,0,r);else mesh(new THREE.SphereGeometry(.26,10,8,0,TAU,0,Math.PI*.45),0xf9f4e9,0,2.15,0,r);return r;}
function sign(label,x,y,z,w=6,angle=0){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=178;const ctx=canvas.getContext('2d');ctx.fillStyle='#215a45';ctx.fillRect(0,0,512,178);ctx.strokeStyle='#f4d58b';ctx.lineWidth=12;ctx.strokeRect(8,8,496,162);ctx.font='bold 60px system-ui';ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillStyle='#faf0d0';ctx.fillText(label,256,90,489);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.347),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));p.position.set(x,y,z);p.rotation.y=angle;world.add(p);return p;}
function makeBus(x,z){const r=new THREE.Group();r.position.set(x,0,z);world.add(r);mesh(box(4.7,4.1,11),0xe9e7df,0,2.55,0,r);mesh(box(4.8,.95,11.1),0x44806a,0,2.52,0,r);mesh(box(4.85,1.01,9.5),0x5f8890,0,3.48,0,r);for(const side of [-1,1])for(const length of [-3.6,3.6]){const wheel=mesh(new THREE.CylinderGeometry(.8,.8,.4,14),0x29302d,side*2.34,1,length,r);wheel.rotation.z=Math.PI/2;}sign('BUS A07',x,5,z+5.5,3.1);}
function tent(x,z){mesh(box(7.3,3.0,6.3),0xe7decb,x,1.5,z);const roof=mesh(new THREE.ConeGeometry(4.8,2.8,4),0xf6f1e4,x,4.1,z);roof.rotation.y=Math.PI/4;roof.scale.set(1,.86,.9);}
function floor(color,sizeX,sizeZ){const f=mesh(new THREE.PlaneGeometry(sizeX,sizeZ),color,0,-.02,0);f.rotation.x=-Math.PI/2;return f;}
function buildMina(){scene.background=new THREE.Color(0xb7c4b2);scene.fog=new THREE.Fog(0xb7c4b2,70,155);floor(0xd0c8b9,115,100);
for(const x of [-35,-25,-15,-5,5,15,25,35])for(const z of [-24,-13,17,28])tent(x,z);
makeBus(18,0);npc(world,0x487e63,true).position.set(-18,0,0);
for(let i=0;i<26;i++){const p=npc(world,i%5===0?0xd4cfbd:0xf5efe7,i%3===0);p.position.set(-39+i*3.3,0,11+(i%4)*2);worldNpcs.push({mesh:p,vel:(i%2?.22:-.26),axis:'x',lo:-42,hi:42});}
for(const z of [-36,35]){for(let x=-42;x<=42;x+=9){mesh(new THREE.CylinderGeometry(.27,.3,5,10),0xbab6a5,x,2.5,z);mesh(sphere(.45),0xffe2b3,x,5.2,z,world,.45);}}
sign('ROMBONGAN A07',-18,4,3,7);
}
function buildHaram(){scene.background=new THREE.Color(0xc9d0c1);scene.fog=new THREE.Fog(0xcbd5c5,69,142);floor(0xdfdcd3,123,123);
for(let i=-6;i<=6;i++){for(const z of [-54,54]){mesh(new THREE.CylinderGeometry(.66,.81,14,12),0xece2d1,i*8.5,7,z);mesh(box(8.3,.9,3),0xc4b087,i*8.5,14.3,z);}for(const x of [-54,54]){mesh(new THREE.CylinderGeometry(.66,.81,14,12),0xece2d1,x,7,i*8.5);mesh(box(3,.9,8.3),0xc6af82,x,14.3,i*8.5);}}
for(const r of [29,39]){const ring=mesh(new THREE.RingGeometry(r,r+.2,96),0xe6d9b9,0,.05,0);ring.rotation.x=-Math.PI/2;}
mesh(box(13.6,13.5,13.6),0x141515,0,6.75,0);
mesh(box(13.9,.57,13.9),0xc6a05b,0,9.1,0);
for(const y of [3.6,8.6,10.2]){for(const z of [-6.9,6.9])mesh(box(13.8,.10,.09),0x9f834c,0,y,z);for(const x of [-6.9,6.9])mesh(box(.09,.10,13.8),0x9f834c,x,y,0);}
const goldenDoor=mesh(box(2.9,5.2,.16),0xc9a34d,0,4.05,6.91);goldenDoor.material=material(0xc9a34d,.12);
const blackStone=mesh(sphere(.48),0x33312e,6.91,3.2,6.91);blackStone.scale.set(.6,.7,.6);
const path=mesh(new THREE.RingGeometry(16.1,23.7,96),0xb1c4b8,0,.07,0);path.rotation.x=-Math.PI/2;
const start=mesh(new THREE.RingGeometry(1.2,1.38,32),0xe8c978,TR,.10,0);start.rotation.x=-Math.PI/2;
sign('PINTU HARAM',0,5.2,34,7);
npc(world,0x407c68,true).position.set(0,0,29);
for(let i=0;i<44;i++){const angle=i/44*TAU,radius=27+(i%3)*2.9;const p=npc(world,i%5===0?0xe4dac7:0xf5f2e7,i%7===0);p.position.set(Math.cos(angle)*radius,0,Math.sin(angle)*radius);worldNpcs.push({mesh:p,vel:.10+(i%4)*.035,axis:'circle',radius,angle});}
}
function buildSai(){scene.background=new THREE.Color(0xb5c8bb);scene.fog=new THREE.Fog(0xb9cbbd,65,132);floor(0xe2ded3,43,98);
for(const x of [-17.9,17.9]){mesh(box(.8,12,98),0xc5c5b5,x,6,0);for(let z=-43;z<=43;z+=9.5){mesh(new THREE.CylinderGeometry(.55,.64,11,12),0xf2eee4,x-Math.sign(x)*1.1,5.5,z);mesh(box(3.1,.6,2.1),0xc8af83,x-Math.sign(x)*1.1,11.1,z);}}
for(let z=-46;z<=46;z+=9){mesh(box(41,.8,1.1),0xd9c6a5,0,13,z);}
for(const z of [-40,40]){mesh(box(15,6,.5),0xafa59b,0,3,z);const peak=mesh(new THREE.DodecahedronGeometry(3,1),0xa5a49a,0,1.3,z<0?-42:42);peak.scale.set(2,.65,1);sign(z<0?'SAFA':'MARWAH',0,7.5,z,9);}
for(const z of [-12,12]){mesh(box(33,.12,.6),0x7bddab,0,.065,z,world,.24);for(const x of [-14,14])mesh(box(.85,6,.85),0x75c59a,x,3,z,world,.16);}
for(let z=-43;z<=43;z+=8.6)mesh(box(31,.06,.13),0xd6c8ac,0,.03,z);
npc(world,0x467f6b,true).position.set(6,0,SA_END);
for(let i=0;i<30;i++){const z=-37+((i*13.7)%74),x=(i%2?1:-1)*(10.8+(i%4)*.7);const p=npc(world,i%5===0?0xccd3c4:0xf7f4e8,i%6===0);p.position.set(x,0,z);worldNpcs.push({mesh:p,vel:i%2?.25:-.25,axis:'z',lo:-38,hi:38});}
}
function current(){return QUEST[state.stage];}
function worldName(){return current().world;}
function orbitPoint(){const theta=(state.twGate+1)*TAU/TW_GATES;return {x:TR*Math.cos(theta),z:TR*Math.sin(theta)};}
function saPoint(){const d=state.legs%2===0?1:-1;return {x:0,z:(d>0?SA_START:SA_END)+d*(state.saGate+1)*(SA_END-SA_START)/SA_GATES};}
function target(){if(state.stage===4){const p=orbitPoint();return {...p,title:'Tawaf Ifadah',hint:'Checkpoint '+(state.twGate+1)+'/'+TW_GATES,action:''};}
if(state.stage===6){const p=saPoint();return {...p,title:'Sa’i Haji',hint:'Titik '+(state.saGate+1)+'/'+SA_GATES,action:''};}return current();}
function restore(){try{const p=JSON.parse(localStorage.getItem(SAVE)||'null');if(!p||p.version!==1||!Number.isInteger(p.stage)||p.stage<0||p.stage>8||!Number.isInteger(p.laps)||p.laps<0||p.laps>7||!Number.isInteger(p.legs)||p.legs<0||p.legs>7||!Number.isInteger(p.twGate)||p.twGate<0||p.twGate>=TW_GATES||!Number.isInteger(p.saGate)||p.saGate<0||p.saGate>=SA_GATES||!['male','female'].includes(p.avatar))return;
state={version:1,stage:p.stage,avatar:p.avatar,laps:p.laps,legs:p.legs,twGate:p.twGate,saGate:p.saGate};const s=state.stage;
if(s===0){px=-32;pz=6;}else if(s===1){px=-18;pz=0;}else if(s===2){px=0;pz=40;}else if(s===3){px=0;pz=30;}else if(s===4){const theta=state.twGate*TAU/TW_GATES;px=TR*Math.cos(theta);pz=TR*Math.sin(theta);}else if(s===5){px=19;pz=0;}else if(s===6){const d=state.legs%2===0?1:-1;px=0;pz=(d>0?SA_START:SA_END)+d*state.saGate*(SA_END-SA_START)/SA_GATES;}else{px=s===7?0:6;pz=SA_END;}
yaw=s<=1?Math.PI/2:s===6?(state.legs%2===0?0:Math.PI):0;
}catch{}}
function persist(){try{localStorage.setItem(SAVE,JSON.stringify(state));}catch{}}
function stage(n){state.stage=n;persist();updateHud();}
function say(text){$('voiceText').textContent=text;if(voice&&'speechSynthesis' in window){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='id-ID';u.rate=.93;u.volume=.62;speechSynthesis.speak(u);}catch{}}}
function toast(text,duration=2.5){$('toast').textContent=text;$('toast').hidden=false;toastEnd=performance.now()+duration*1000;}
function hudDescription(){if(state.stage===4)return 'IKUTI CAHAYA EMAS · PUTARAN '+state.laps+'/7';if(state.stage===6)return (state.legs%2===0?'SAFA → MARWAH':'MARWAH → SAFA')+' · '+state.legs+'/7';return current().hint;}
function updateHud(){const s=state.stage,t=target();$('mission').textContent=current().title;$('zone').textContent=worldName()==='mina'?'MINA → MAKKAH':worldName()==='haram'?'MASJIDIL HARAM':'MAS’A · SAFA–MARWAH';$('hint').textContent=hudDescription();$('lap').textContent=state.laps+'/7';$('leg').textContent=state.legs+'/7';$('lapBar').style.width=100*state.laps/7+'%';$('legBar').style.width=100*state.legs/7+'%';$('step').textContent=Math.min(s,8)+'/8';$('hintName').textContent=s===4?'TITIK '+(state.twGate+1)+'/'+TW_GATES:s===6?'TITIK '+(state.saGate+1)+'/'+SA_GATES:current().title.toUpperCase();$('action').textContent=current().action;$('action').hidden=!active||[4,6,8].includes(s)||Math.hypot(px-t.x,pz-t.z)>3.3;if(marker)marker.visible=s<8;}
function getArea(){return current().world;}
function build(){if(world){scene.remove(world);world.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material?.map instanceof THREE.CanvasTexture)o.material.map.dispose();});}
world=new THREE.Group();scene.add(world);worldNpcs=[];world.add(new THREE.HemisphereLight(0xe9fcf0,0x857966,3.1));const sun=new THREE.DirectionalLight(0xffeac3,3.6);sun.position.set(-25,60,16);world.add(sun);
if(getArea()==='mina')buildMina();else if(getArea()==='haram')buildHaram();else buildSai();
player=npc(world,state.avatar==='female'?0x56836f:0xf3eee2,state.avatar==='female');player.position.set(px,0,pz);
marker=new THREE.Group();world.add(marker);mesh(new THREE.CylinderGeometry(.16,.26,2.1,12),0xffd384,0,1.5,0,marker,.5);mesh(new THREE.OctahedronGeometry(.5),0xffde97,0,2.8,0,marker,.7);const light=new THREE.PointLight(0xffd28b,4,11);light.position.y=2.2;marker.add(light);
updateHud();}
function advanceAfterRoute(){if(state.stage===4){state.twGate++;if(state.twGate===TW_GATES){state.twGate=0;state.laps++;toast('TAWAF · PUTARAN '+state.laps+'/7',2.1);if(state.laps===7){stage(5);say('Tujuh putaran Tawaf Ifadah disimulasikan. Cari pembimbing menuju Sa’i.');toast('TUJUH PUTARAN TUNTAS',3);}}else if(state.laps===0&&state.twGate===2)toast('IKUTI PENANDA EMAS',1.2);persist();updateHud();return;}
if(state.stage===6){state.saGate++;if(state.saGate===SA_GATES){state.saGate=0;state.legs++;toast('SA’I · LINTASAN '+state.legs+'/7',2.1);if(state.legs===7){stage(7);say('Tujuh lintasan Sa’i Haji berakhir di Marwah. Sekarang temui pembimbing.');toast('TUJUH LINTASAN TUNTAS',3);}else{yaw=state.legs%2===0?0:Math.PI;say('Lintasan '+state.legs+' selesai. Sekarang menuju '+(state.legs%2===0?'Marwah.':'Safa.'));}}persist();updateHud();}}
function walk(dt,now){if(!active||transitioning)return;const f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-joy.y,r=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+joy.x,len=Math.hypot(f,r);if(len<.08)return;const ux=(Math.sin(yaw)*f+Math.cos(yaw)*r)/Math.max(1,len),uz=(Math.cos(yaw)*f-Math.sin(yaw)*r)/Math.max(1,len),speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?8.1:6.35;
let x=px+ux*speed*dt,z=pz+uz*speed*dt;const area=getArea();
if(area==='haram'){x=Math.max(-47,Math.min(47,x));z=Math.max(-47,Math.min(47,z));const radius=Math.hypot(x,z);const minR=state.stage===4?16.7:10.4;if(radius<minR&&radius>.01){x=x/radius*minR;z=z/radius*minR;}if(radius<=.01){x=minR;z=0;}if(state.stage===4&&radius>24){x=x/radius*24;z=z/radius*24;}}
else if(area==='sai'){x=Math.max(-11,Math.min(11,x));z=Math.max(-38,Math.min(38,z));}
else{x=Math.max(-42,Math.min(42,x));z=Math.max(-36,Math.min(36,z));}
for(const n of worldNpcs){const dx=x-n.mesh.position.x,dz=z-n.mesh.position.z,d=Math.hypot(dx,dz);if(d>.01&&d<.72){x+=dx/d*(.72-d)*.5;z+=dz/d*(.72-d)*.5;}}
px=x;pz=z;heading=Math.atan2(ux,uz);player.rotation.y+=Math.atan2(Math.sin(heading-player.rotation.y),Math.cos(heading-player.rotation.y))*Math.min(1,dt*11);player.position.set(px,Math.sin(now*.014)*.048,pz);
if(state.stage===4||state.stage===6){const t=target();if(Math.hypot(px-t.x,pz-t.z)<3.2)advanceAfterRoute();}
updateHud();}
function frame(now){const dt=Math.min(.045,(now-(last||now))/1000);last=now;if(renderer&&!document.hidden){walk(dt,now);for(const n of worldNpcs){if(n.axis==='circle'){n.angle+=n.vel*dt;n.mesh.position.set(Math.cos(n.angle)*n.radius,0,Math.sin(n.angle)*n.radius);n.mesh.rotation.y=n.angle+Math.PI/2;}else{n.mesh.position[n.axis]+=n.vel*dt;if(n.mesh.position[n.axis]>n.hi)n.mesh.position[n.axis]=n.lo;else if(n.mesh.position[n.axis]<n.lo)n.mesh.position[n.axis]=n.hi;n.mesh.rotation.y=n.vel>0?(n.axis==='x'?Math.PI/2:0):(n.axis==='x'?-Math.PI/2:Math.PI);}}
const t=target();marker.position.set(t.x,.15+Math.sin(now*.003)*.17,t.z);marker.rotation.y=now*.0008;cameraGoal.set(px-Math.sin(yaw)*10,6.1,pz-Math.cos(yaw)*10);camera.position.lerp(cameraGoal,Math.min(1,dt*5));cameraLook.set(px,1.45,pz);camera.lookAt(cameraLook);avatars.update({player,sex:state.avatar,active,dt,now,npcs:worldNpcs});feel.update({scene,renderer,camera,player,dt,now,active,aiming:false});visuals.update({scene,root:world,player,mode:getArea(),now});renderer.render(scene,camera);
const scale=getArea()==='sai'?47:52;$('minPlayer').setAttribute('cx',String(100+px/scale*81));$('minPlayer').setAttribute('cy',String(100-pz/scale*81));$('minTarget').setAttribute('cx',String(100+t.x/scale*81));$('minTarget').setAttribute('cy',String(100-t.z/scale*81));if(!$('toast').hidden&&now>toastEnd)$('toast').hidden=true;}requestAnimationFrame(frame);}
function sceneTransition(next,placeX,placeZ,headingText){transitioning=true;active=false;$('travel').hidden=false;$('travelTitle').textContent=headingText;stage(next);window.setTimeout(()=>{px=placeX;pz=placeZ;yaw=next===6?0:Math.PI;build();transitioning=false;$('travel').hidden=true;active=true;updateHud();say(current().hint);},1900);}
function interact(){if(!active||transitioning||state.stage>=8||[4,6].includes(state.stage))return;const q=target();if(Math.hypot(px-q.x,pz-q.z)>3.3)return;
switch(state.stage){
case 0:stage(1);toast('ARAHAN ROMBONGAN A07');say('Ikuti pembimbing. Bus A07 menuju Makkah. Waktu pelaksanaan Ifadah dapat berbeda sesuai pengaturan penyelenggara.');break;
case 1:sceneTransition(2,0,40,'MINA → MAKKAH');break;
case 2:stage(3);toast('MASJIDIL HARAM');say('Cari titik awal sejajar Hajar Aswad. Ka’bah berada di sebelah kiri saat tawaf.');break;
case 3:stage(4);toast('MULAI TAWAF IFADAH');say('Mulai tujuh putaran Tawaf Ifadah. Ikuti cahaya emas satu per satu.');break;
case 5:sceneTransition(6,0,SA_START,'HARAM → MAS’A');break;
case 7:stage(8);active=false;$('end').hidden=false;toast('LEVEL 10 SELESAI!',3);say('Tawaf Ifadah dan Sa’i Haji selesai disimulasikan. Ikuti arahan pembimbing untuk manasik selanjutnya.');break;
}updateHud();}
function begin(){for(const id of ['intro','pause','help','prayer'])$(id).hidden=true;active=state.stage<8;updateHud();say(current().hint);if(state.stage===8){active=false;$('end').hidden=false;}}
function pause(){active=false;$('pause').hidden=false;$('checkpoint').textContent='Tahap '+state.stage+'/8 · Tawaf '+state.laps+'/7 · Sa’i '+state.legs+'/7';updateHud();}
function reset(){if(!confirm('Ulangi Level 10 dari awal?'))return;state={version:1,stage:0,avatar:state.avatar,laps:0,twGate:0,legs:0,saGate:0};px=-32;pz=6;yaw=Math.PI/2;active=false;transitioning=false;persist();for(const id of ['pause','end','travel','prayer'])$(id).hidden=true;$('intro').hidden=false;build();}
function controls(){const stick=$('joy'),knob=$('knob'),view=$('world');
function onStick(e){if(e.pointerId!==joy.pointer)return;const b=stick.getBoundingClientRect(),radius=b.width*.35;let x=(e.clientX-b.left-b.width/2)/radius,y=(e.clientY-b.top-b.height/2)/radius;const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}joy.x=x;joy.y=y;knob.style.left=(50+x*35)+'%';knob.style.top=(50+y*35)+'%';}
stick.addEventListener('pointerdown',e=>{if(joy.pointer!==null)return;joy.pointer=e.pointerId;stick.setPointerCapture(e.pointerId);onStick(e);});stick.addEventListener('pointermove',onStick);function stop(e){if(e.pointerId!==joy.pointer)return;joy.pointer=null;joy.x=joy.y=0;knob.style.left='50%';knob.style.top='50%';}for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,stop);
view.addEventListener('pointerdown',e=>{if(look.pointer!==null)return;look.pointer=e.pointerId;look.x=e.clientX;view.setPointerCapture(e.pointerId);});view.addEventListener('pointermove',e=>{if(e.pointerId!==look.pointer)return;yaw-=(e.clientX-look.x)*.004;look.x=e.clientX;});for(const name of ['pointerup','pointercancel','lostpointercapture'])view.addEventListener(name,e=>{if(e.pointerId===look.pointer)look.pointer=null;});
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='Escape'&&active)pause();keys.add(e.code);});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();joy.x=joy.y=0;});document.addEventListener('visibilitychange',()=>{if(document.hidden){active=false;keys.clear();}else if(!transitioning&&['intro','pause','help','prayer','end','travel'].every(id=>$(id).hidden))active=true;});}
$('start').onclick=begin;$('resume').onclick=begin;$('action').onclick=interact;$('menu').onclick=pause;$('reset').onclick=reset;$('replay').onclick=reset;$('helpButton').onclick=()=>{active=false;$('help').hidden=false;};$('helpClose').onclick=begin;$('camera').onclick=()=>{yaw=heading;};
$('prayerButton').onclick=()=>{active=false;$('prayer').hidden=false;const isSai=state.stage>=6;$('prayerTitle').textContent=isSai?'Panduan doa Sa’i':'Panduan zikir Tawaf';$('prayerText').textContent=isSai?'Selama Sa’i, berdoa dan berzikir sesuai kemampuan. Perjalanan dimulai dari Safa dan berakhir di Marwah.':'Tawaf dimulai sejajar Hajar Aswad, Ka’bah di sebelah kiri. Perbanyak zikir dan doa; tidak ada doa khusus wajib untuk setiap putaran.';};$('prayerClose').onclick=begin;
$('voiceButton').onclick=()=>{voice=!voice;$('voiceButton').textContent=voice?'Suara ON':'Suara OFF';say(current().hint);};
$('avatar').onchange=e=>{if(state.stage!==0)return;state.avatar=e.target.value;persist();if(world){world.remove(player);player=npc(world,state.avatar==='female'?0x56836f:0xf3eee2,state.avatar==='female');player.position.set(px,0,pz);}};
restore();$('avatar').value=state.avatar;updateHud();
try{renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.35,devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.32;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(67,1,.1,230);build();function fit(){const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}fit();addEventListener('resize',fit);controls();requestAnimationFrame(frame);if(state.stage===8){$('intro').hidden=true;$('end').hidden=false;}}catch(e){const box=document.createElement('div');box.className='error';box.textContent='Dunia 3D belum dapat dibuka. Periksa WebGL dan coba browser terbaru.';document.body.append(box);console.error(e);}
