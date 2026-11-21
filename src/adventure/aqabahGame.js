import * as THREE from 'three';
import { createAdventureFeel } from './feel.js';
const feel=createAdventureFeel(THREE);
// Mission-based Jamrah Aqabah learning: 7 individual throws, never a determination of ritual validity.
const $=id=>document.getElementById(id);
const SAVE='manasik-aqabah-quest-v1', PREV='manasik-muzdalifah-quest-v1';
const demo=new URLSearchParams(location.search).has('demo');
function previousComplete(){try{const saved=JSON.parse(localStorage.getItem(PREV)||'null');return saved?.version===1&&saved.stage===9;}catch{return false;}}
if(!previousComplete()&&!demo){location.replace('./adventure-map.html');throw new Error('Complete Level 08 first');}
const TARGETS=[
 {x:-39,z:8,label:'Temui petugas Mina',hint:'Cari petugas di titik kedatangan kawasan Jamarat.',action:'Bicara'},
 {x:-26,z:8,label:'Cari jalur rombongan',hint:'Ikuti tanda jalur masuk A07 menuju kompleks Jamarat.',action:'Periksa rute'},
 {x:-15,z:8,label:'Periksa petunjuk masuk',hint:'Temui petugas dan pilih arah masuk rombongan.',action:'Tanya jalur'},
 {x:6,z:8,label:'Kenali Jamrah Aqabah',hint:'Temukan pembimbing dan kenali jamrah yang dilontar pada 10 Dzulhijjah.',action:'Tanya pembimbing'},
 {x:22,z:8,label:'Masuk area lontar',hint:'Menuju titik aman di depan Jamrah Aqabah.',action:'Siap melontar'},
 {x:22,z:8,label:'Simulasi 7 lontaran',hint:'Bidik sasaran marma dan lontar kerikil satu per satu.',action:'Buka bidikan'},
 {x:40,z:8,label:'Keluar melalui jalur resmi',hint:'Ikuti tanda KELUAR, jangan berbalik melawan arus.',action:'Lanjut keluar'},
 {x:46,z:8,label:'Lapor kepada pembimbing',hint:'Cari pembimbing A07 di ujung jalur keluar.',action:'Lapor'},
 {x:46,z:8,label:'Level 09 selesai',hint:'Petualangan Aqabah selesai.',action:''}
];
let state={version:1,stage:0,throws:0,avatar:'male'};
let scene,renderer,camera,world,player,beacon,aimMarker,goalWall,guide,travelers=[],projectile=null,shootStart=0,shootEnd=null,particles=[],soundContext=null;
let px=-46,pz=8,yaw=Math.PI*.5,heading=0,active=false,voice=false,launching=false,aim=0,last=0,toastUntil=0;
const keys=new Set(),stick={id:null,x:0,y:0},look={id:null,x:0},cameraPos=new THREE.Vector3(),cameraTarget=new THREE.Vector3(),cache=new Map();
const BOX=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
function material(color,emission=0){const key=color+'-'+emission;if(!cache.has(key))cache.set(key,new THREE.MeshStandardMaterial({color,roughness:.83,metalness:.02,emissive:color,emissiveIntensity:emission}));return cache.get(key);}
function add(geo,color,x,y,z,parent=world,emission=0){const m=new THREE.Mesh(geo,material(color,emission));m.position.set(x,y,z);parent.add(m);return m;}
function person(parent,robe=0xf1efe6,headwear=false){const root=new THREE.Group();parent.add(root);add(new THREE.CylinderGeometry(.32,.49,1.46,9),robe,0,1.08,0,root);add(new THREE.SphereGeometry(.26,11,8),0xa67d5e,0,2.04,0,root);for(const x of [-.19,.19])add(new THREE.CylinderGeometry(.12,.15,.61,7),0xe0ded3,x,.32,0,root);if(headwear)add(new THREE.ConeGeometry(.48,.87,10),robe,0,2.1,0,root);else add(new THREE.SphereGeometry(.267,10,8,0,Math.PI*2,0,Math.PI*.47),0xf7f4e9,0,2.16,0,root);return root;}
function label(text,x,y,z,width=7,green=true){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=180;const ctx=canvas.getContext('2d');ctx.fillStyle=green?'#22614c':'#516965';ctx.fillRect(0,0,512,180);ctx.strokeStyle='#efd18b';ctx.lineWidth=10;ctx.strokeRect(8,8,496,164);ctx.fillStyle='#fbf5dd';ctx.font='bold 62px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,93,490);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(width,width*.3516),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));sign.position.set(x,y,z);world.add(sign);return sign;}
function buildEnvironment(){scene.background=new THREE.Color(0xafc2b8);scene.fog=new THREE.Fog(0xafc2b8,60,146);
add(BOX(111,.25,33),0xd4d0c7,0,-.13,0);
for(const z of [-15.8,15.8]){add(BOX(110,2.4,.6),0xabb0a9,0,1.1,z);add(BOX(110,.28,.8),0xe4e2da,0,2.5,z);}
for(let x=-53;x<=52;x+=12){for(const z of [-13.7,13.7]){add(new THREE.CylinderGeometry(.55,.64,11,10),0xd4d2c9,x,5.5,z);add(BOX(2.2,.65,2.2),0xb5b6b0,x,11.2,z);}add(BOX(12.1,.36,31),0xced3d1,x,12.4,0);}
for(const z of [-11,11])for(let x=-48;x<=48;x+=9){add(BOX(2.8,.035,.18),0xe3dfd1,x,.03,z);}
for(const x of [-42,-24,-10,6,22,39])add(BOX(.22,.03,29),0xb4b7b2,x,.015,0);
for(let x=-52;x<=52;x+=8){add(BOX(.16,.06,30),0xe6dfd0,x,.035,0);}
for(const x of [-27,-14,6,39]){for(const z of [4,11])add(new THREE.CylinderGeometry(.18,.2,3.1,10),0x9fa99f,x,1.55,z);add(BOX(.25,.18,7.5),0xb4bcaf,x,3.15,7.4);}
label('MASUK A07',-27,4.3,7.4,5.7);
label('ARAH JAMARAT',-14,4.3,7.4,6.3);
label('IKUTI PETUGAS',6,4.3,7.4,5.8);
label('KELUAR',39,4.3,7.4,5.4);
for(let i=0;i<3;i++){const x=[-3,10,29][i];const isAqabah=i===2;
const wall=add(BOX(.8,7.6,9.3),isAqabah?0xc5c1b5:0xb4b7b1,x,3.8,-2);
const cap=add(BOX(1.08,.35,9.65),isAqabah?0xd2bb80:0xbcc4bf,x,7.78,-2);cap.visible=true;
const basin=add(new THREE.TorusGeometry(6.0,.28,10,50),isAqabah?0xc8a666:0xa2aaa4,x,.23,-2);basin.rotation.x=-Math.PI/2;basin.scale.set(.6,1,1.12);
label(['JUMRAH ULA','JUMRAH WUSTHA','JUMRAH AQABAH'][i],x,10.9,-2,8.4,isAqabah);
if(isAqabah)goalWall=wall;
}
const markerRing=add(new THREE.RingGeometry(2.5,2.63,48),0xe9cb7d,22,.12,8);markerRing.rotation.x=-Math.PI/2;
const bus=new THREE.Group();bus.position.set(-48,0,-7);world.add(bus);add(BOX(4.3,3.8,9.8),0xece9e1,0,2.2,0,bus);add(BOX(4.38,.94,9.9),0x4b846f,0,2.3,0,bus);add(BOX(4.4,.88,8),0x547d83,0,3.24,0,bus);
for(const x of [-2.13,2.13])for(const z of [-3.1,3.1]){const wheel=add(new THREE.CylinderGeometry(.73,.73,.36,12),0x29302d,x,.97,z,bus);wheel.rotation.z=Math.PI/2;}
person(world,0x458168,true).position.set(-39,0,8);
person(world,0x46816e,true).position.set(-15,0,8);
person(world,0x3f7864,true).position.set(6,0,8);
person(world,0x4b8671,true).position.set(46,0,8);
for(let i=0;i<28;i++){const m=person(world,i%5===0?0xc6c9bf:i%2?0xf5f2e9:0xe2e0d8,i%4===0);const x=-42+((i*13.97)%84),z=i%2?11.9:-11.9;m.position.set(x,0,z);travelers.push({mesh:m,vel:(i%2?1:-1)*(.32+(i%3)*.18)});}
for(const x of [-48,-30,-12,8,29,47]){const lamp=add(new THREE.CylinderGeometry(.12,.13,3.6,8),0xc0c5ba,x,1.8,13);lamp.position.z=13;add(new THREE.SphereGeometry(.37,10,8),0xfff0c1,x,3.75,13,world,.6);}
player=person(world,state.avatar==='female'?0x54826f:0xf5eee3,state.avatar==='female');player.position.set(px,0,pz);
beacon=new THREE.Group();world.add(beacon);add(new THREE.CylinderGeometry(.12,.26,2.0,10),0xffd27b,0,1.45,0,beacon,.66);add(new THREE.OctahedronGeometry(.48),0xffda84,0,2.71,0,beacon,.8);const light=new THREE.PointLight(0xffd391,4.2,9);light.position.y=2.4;beacon.add(light);
aimMarker=add(new THREE.RingGeometry(.42,.56,24),0xffdf86,28.53,3.9,-2,world,.85);
aimMarker.rotation.y=Math.PI/2;aimMarker.visible=false;
}
function init(){scene=new THREE.Scene();world=new THREE.Group();scene.add(world);scene.add(new THREE.HemisphereLight(0xe7fbf3,0x8c796a,3));const sun=new THREE.DirectionalLight(0xffefd1,3.9);sun.position.set(-27,55,23);scene.add(sun);renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.35,devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.32;camera=new THREE.PerspectiveCamera(67,1,.08,220);buildEnvironment();fit();window.addEventListener('resize',fit);controls();requestAnimationFrame(frame);}
function fit(){if(!renderer)return;const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
function save(){try{localStorage.setItem(SAVE,JSON.stringify(state));}catch{}}
function restore(){try{const p=JSON.parse(localStorage.getItem(SAVE)||'null');if(!p||p.version!==1||!Number.isInteger(p.stage)||p.stage<0||p.stage>8||!Number.isInteger(p.throws)||p.throws<0||p.throws>7||!['male','female'].includes(p.avatar))return;state.stage=p.stage;state.throws=p.throws;state.avatar=p.avatar;px=[-46,-39,-26,-15,6,22,22,40,46][state.stage];pz=8;yaw=Math.PI*.5;if(state.stage>=5&&state.stage<7)px=22;if(state.stage===8)px=46;if(state.stage===6)px=22;}catch{}}
function say(t){$('voiceText').textContent=t;if(voice&&'speechSynthesis' in window){try{speechSynthesis.cancel();const utt=new SpeechSynthesisUtterance(t);utt.lang='id-ID';utt.rate=.96;utt.volume=.65;speechSynthesis.speak(utt);}catch{}}}
function toast(message,time=2.1){$('toast').textContent=message;$('toast').hidden=false;toastUntil=performance.now()+time*1000;}
function refresh(){const q=TARGETS[state.stage];$('mission').textContent=q.label;$('hint').textContent=q.hint;$('missionIndex').textContent=Math.min(state.stage,8)+'/8';$('routeBar').style.width=state.stage/8*100+'%';$('count').textContent=state.throws+'/7';$('targetName').textContent=q.label.toUpperCase();$('action').textContent=q.action;$('action').hidden=!active||state.stage>=8||Math.hypot(px-q.x,pz-q.z)>3.2;if(beacon)beacon.visible=state.stage<8;if(aimMarker)aimMarker.visible=!$('aimPanel').hidden;}
function begin(){for(const id of ['intro','pause','help','lanePanel','wallPanel'])$(id).hidden=true;active=state.stage<8;if(state.stage===5){openAim();return;}if(state.stage===8){active=false;$('end').hidden=false;}refresh();say(TARGETS[state.stage].hint);}
function pause(){active=false;$('pause').hidden=false;$('checkpoint').textContent='Tahap '+state.stage+'/8 · lontaran berhasil '+state.throws+'/7';refresh();}
function reset(){if(!confirm('Mulai ulang Level 09?'))return;state={version:1,stage:0,throws:0,avatar:state.avatar};px=-46;pz=8;yaw=Math.PI*.5;launching=false;clearProjectile();save();for(const id of ['end','pause','lanePanel','wallPanel','aimPanel'])$(id).hidden=true;$('intro').hidden=false;active=false;if(player)player.position.set(px,0,pz);refresh();}
function step(){state.stage++;save();refresh();}
function interact(){if(!active||state.stage>=8)return;const q=TARGETS[state.stage];if(Math.hypot(px-q.x,pz-q.z)>3.2)return;
switch(state.stage){
case 0:step();toast('PETUGAS DIHUBUNGI');say('Ikuti jalur resmi A07. Jangan melawan arus dan jaga jarak antarjemaah.');break;
case 1:step();toast('JALUR A07 DITEMUKAN');say('Ikuti arah petugas menuju pintu masuk Jamarat.');break;
case 2:active=false;$('lanePanel').hidden=false;refresh();break;
case 3:active=false;$('wallPanel').hidden=false;refresh();break;
case 4:step();openAim();break;
case 5:openAim();break;
case 6:step();toast('JALUR KELUAR');say('Terus menuju titik kumpul A07 dan jangan berbalik arah.');break;
case 7:step();active=false;$('end').hidden=false;toast('LEVEL 09 TUNTAS',3);say('Selesai latihan Jumrah Aqabah. Laporkan diri dan ikuti arahan pembimbing untuk manasik berikutnya.');break;
}refresh();}
function chooseLane(correct){if(state.stage!==2)return;if(!correct){toast('IKUTI JALUR A07',2);return;}$('lanePanel').hidden=true;step();active=true;toast('JALUR TERVERIFIKASI');say('Petugas memberi izin melanjutkan. Kenali Jamrah Aqabah pada 10 Dzulhijjah.');refresh();}
function chooseWall(correct){if(state.stage!==3)return;if(!correct){toast('PADA 10 DZULHIJJAH: AQABAH',2.2);return;}$('wallPanel').hidden=true;step();active=true;toast('JUMRAH AQABAH');say('Pada 10 Dzulhijjah dilakukan lontar Jamrah Aqabah sebanyak tujuh kali, satu kerikil setiap lontaran.');refresh();}
function aimZ(){return -2+aim*.10;}
function refreshAim(){const z=aimZ();if(aimMarker){aimMarker.position.z=z;aimMarker.material.emissiveIntensity=Math.abs(aim)<=36?1:.25;}$('aimValue').textContent=aim===0?'TENGAH':aim<0?'KIRI '+Math.abs(aim):'KANAN '+aim;$('aimHint').textContent=Math.abs(aim)<=36?'Sasaran terarah ke marma.':'Arah keluar sasaran. Geser ke tengah.';$('pebbles').textContent=state.throws+'/7';$('throwButton').disabled=launching||state.throws>=7;}
function openAim(){active=false;$('aimPanel').hidden=false;$('pause').hidden=true;$('intro').hidden=true;aimMarker.visible=true;refreshAim();refresh();say('Bidik area sasaran. Lontar satu kerikil per aksi. Tidak ada penalti bila meleset dalam simulasi.');}
function closeAim(){if(launching)return;$('aimPanel').hidden=true;active=true;aimMarker.visible=false;refresh();}
function clearProjectile(){if(!projectile)return;scene.remove(projectile);projectile.geometry.dispose();projectile.material.dispose();projectile=null;}
function spark(x,y,z){for(let i=0;i<13;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.065,5,4),new THREE.MeshBasicMaterial({color:i%2?0xf6d289:0xf9e7bb}));p.position.set(x,y,z);scene.add(p);particles.push({mesh:p,life:.75,dx:(Math.random()-.5)*2.4,dy:Math.random()*2.7,dz:(Math.random()-.5)*2.3});}}
function beep(){if(!voice)return;try{const a=soundContext||new AudioContext();soundContext=a;const tone=a.createOscillator(),gain=a.createGain();tone.type='sine';tone.frequency.setValueAtTime(520,a.currentTime);tone.frequency.exponentialRampToValueAtTime(800,a.currentTime+.11);gain.gain.setValueAtTime(.0001,a.currentTime);gain.gain.exponentialRampToValueAtTime(.05,a.currentTime+.018);gain.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.22);tone.connect(gain).connect(a.destination);tone.start();tone.stop(a.currentTime+.23);}catch{}}
function throwStone(){if($('aimPanel').hidden||state.stage!==5||launching||state.throws>=7)return;launching=true;$('throwButton').disabled=true;shootStart=performance.now();shootEnd=new THREE.Vector3(28.5,3.2,aimZ());projectile=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,0),new THREE.MeshStandardMaterial({color:0xead5ab,roughness:1}));projectile.position.set(22,2.2,8);scene.add(projectile);$('aimHint').textContent='Kerikil meluncur…';}
function landed(){const success=Math.abs(aim)<=36;clearProjectile();launching=false;if(success){state.throws++;save();spark(28.5,3.2,aimZ());beep();toast('ALLAHU AKBAR · '+state.throws+'/7',1.4);say('Allahu Akbar. Lontaran simulasi '+state.throws+' dari tujuh.');if(state.throws>=7){$('aimPanel').hidden=true;aimMarker.visible=false;step();active=true;toast('TUJUH LONTARAN TUNTAS!',3);say('Simulasi Jumrah Aqabah selesai. Ikuti petunjuk keluar dan temui pembimbing A07.');}}else{toast('BELUM KE SASARAN · BIDIK LAGI',1.6);say('Arah di luar sasaran. Sesuaikan bidikan, lalu coba lagi.');}refreshAim();refresh();}
function move(dt,now){if(!active)return;const f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-stick.y,r=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+stick.x,len=Math.hypot(f,r);if(len<.075)return;
const dx=(Math.sin(yaw)*f+Math.cos(yaw)*r)/Math.max(1,len),dz=(Math.cos(yaw)*f-Math.sin(yaw)*r)/Math.max(1,len),speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?8.6:6.25;
let x=Math.max(-49,Math.min(49,px+dx*dt*speed)),z=Math.max(-12.5,Math.min(12.5,pz+dz*dt*speed));
for(const wallX of [-3,10,29]){const vx=x-wallX;if(Math.abs(vx)<1.05&&Math.abs(z+2)<5.1)x=wallX+Math.sign(vx||1)*1.05;}
for(const c of travelers){const vx=x-c.mesh.position.x,vz=z-c.mesh.position.z,d=Math.hypot(vx,vz);if(d>.01&&d<.82){x+=vx/d*(.82-d)*.58;z+=vz/d*(.82-d)*.58;}}
px=Math.max(-49,Math.min(49,x));pz=Math.max(-12.5,Math.min(12.5,z));heading=Math.atan2(dx,dz);player.rotation.y+=Math.atan2(Math.sin(heading-player.rotation.y),Math.cos(heading-player.rotation.y))*Math.min(1,dt*10);player.position.set(px,Math.sin(now*.014)*.047,pz);refresh();}
function frame(now){const dt=Math.min(.045,(now-(last||now))/1000);last=now;if(renderer&&!document.hidden){move(dt,now);for(const npc of travelers){npc.mesh.position.x+=npc.vel*dt;if(npc.mesh.position.x>51)npc.mesh.position.x=-51;if(npc.mesh.position.x<-51)npc.mesh.position.x=51;npc.mesh.rotation.y=npc.vel>0?Math.PI/2:-Math.PI/2;}const q=TARGETS[state.stage];beacon.position.set(q.x,.16+Math.sin(now*.003)*.12,q.z);beacon.rotation.y=now*.00075;
if(!$('aimPanel').hidden){cameraPos.set(12.9,7.5,18.7);cameraTarget.set(28.2,3.2,-2);}else{cameraPos.set(px-Math.sin(yaw)*9.6,6.0,pz-Math.cos(yaw)*9.6);cameraTarget.set(px,1.5,pz);}
camera.position.lerp(cameraPos,Math.min(1,dt*5));camera.lookAt(cameraTarget);feel.update({scene,renderer,camera,player,dt,now,active,aiming:!$('aimPanel').hidden});renderer.render(scene,camera);
if(projectile){const t=Math.min(1,(now-shootStart)/720);projectile.position.set(22+(shootEnd.x-22)*t,2.2+(shootEnd.y-2.2)*t+Math.sin(Math.PI*t)*3.7,8+(shootEnd.z-8)*t);projectile.rotation.x+=dt*8;if(t>=1)landed();}
for(const s of particles){s.life-=dt;s.mesh.position.x+=s.dx*dt;s.mesh.position.y+=s.dy*dt;s.mesh.position.z+=s.dz*dt;s.mesh.scale.setScalar(Math.max(0,s.life));}particles=particles.filter(s=>{if(s.life>0)return true;scene.remove(s.mesh);s.mesh.geometry.dispose();s.mesh.material.dispose();return false;});
$('miniPlayer').setAttribute('cx',String(100+px/54*83));$('miniPlayer').setAttribute('cy',String(100-pz/17*69));$('miniTarget').setAttribute('cx',String(100+q.x/54*83));$('miniTarget').setAttribute('cy',String(100-q.z/17*69));if(!$('toast').hidden&&now>toastUntil)$('toast').hidden=true;}requestAnimationFrame(frame);}
function controls(){const joy=$('joy'),knob=$('knob'),canvas=$('world');
function stickMove(e){if(e.pointerId!==stick.id)return;const b=joy.getBoundingClientRect(),radius=b.width*.35;let x=(e.clientX-b.left-b.width/2)/radius,y=(e.clientY-b.top-b.height/2)/radius;const mag=Math.hypot(x,y);if(mag>1){x/=mag;y/=mag;}stick.x=x;stick.y=y;knob.style.left=(50+x*35)+'%';knob.style.top=(50+y*35)+'%';}
joy.addEventListener('pointerdown',e=>{if(stick.id!==null)return;stick.id=e.pointerId;joy.setPointerCapture(e.pointerId);stickMove(e);});joy.addEventListener('pointermove',stickMove);function stickEnd(e){if(e.pointerId!==stick.id)return;stick.id=null;stick.x=stick.y=0;knob.style.left='50%';knob.style.top='50%';}for(const event of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(event,stickEnd);
canvas.addEventListener('pointerdown',e=>{if(look.id!==null)return;look.id=e.pointerId;look.x=e.clientX;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(e.pointerId!==look.id)return;yaw-=(e.clientX-look.x)*.004;look.x=e.clientX;});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(e.pointerId===look.id)look.id=null;});
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(!$('aimPanel').hidden){if(e.code==='ArrowLeft'){aim=Math.max(-100,aim-5);$('aimSlider').value=String(aim);refreshAim();}if(e.code==='ArrowRight'){aim=Math.min(100,aim+5);$('aimSlider').value=String(aim);refreshAim();}if(e.code==='Space'&&!e.repeat)throwStone();if(e.code==='Escape')closeAim();return;}if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='Escape'&&active)pause();keys.add(e.code);});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();stick.x=stick.y=0;});document.addEventListener('visibilitychange',()=>{if(document.hidden){active=false;keys.clear();}else if(['intro','pause','help','lanePanel','wallPanel','aimPanel','end'].every(id=>$(id).hidden))active=true;});
}
$('start').onclick=begin;$('resume').onclick=begin;$('action').onclick=interact;$('menu').onclick=pause;$('reset').onclick=reset;$('replay').onclick=reset;$('helpButton').onclick=()=>{active=false;$('help').hidden=false;};$('helpClose').onclick=begin;$('camera').onclick=()=>{yaw=heading;};$('voiceButton').onclick=()=>{voice=!voice;$('voiceButton').textContent=voice?'Suara ON':'Suara OFF';say(TARGETS[state.stage].hint);};
$('laneCorrect').onclick=()=>chooseLane(true);$('laneWrong').onclick=()=>chooseLane(false);$('laneBack').onclick=()=>{$('lanePanel').hidden=true;begin();};
$('wallCorrect').onclick=()=>chooseWall(true);$('wallWrong').onclick=()=>chooseWall(false);$('wallBack').onclick=()=>{$('wallPanel').hidden=true;begin();};
$('aimSlider').addEventListener('input',e=>{aim=Number(e.target.value);refreshAim();});$('aimLeft').onclick=()=>{aim=Math.max(-100,aim-10);$('aimSlider').value=String(aim);refreshAim();};$('aimRight').onclick=()=>{aim=Math.min(100,aim+10);$('aimSlider').value=String(aim);refreshAim();};$('throwButton').onclick=throwStone;$('aimBack').onclick=closeAim;
$('avatar').onchange=e=>{if(state.stage!==0)return;state.avatar=e.target.value;save();if(player){world.remove(player);player=person(world,state.avatar==='female'?0x54826f:0xf5eee3,state.avatar==='female');player.position.set(px,0,pz);}};
restore();$('avatar').value=state.avatar;refresh();
try{init();if(state.stage===8){$('intro').hidden=true;$('end').hidden=false;}}catch(error){const el=document.createElement('div');el.className='error';el.textContent='Area Jamarat 3D belum dapat dibuka. Coba browser modern dengan WebGL aktif.';document.body.append(el);console.error(error);}
