import * as THREE from 'three';
import { createAdventureFeel } from './feel.js';
const feel=createAdventureFeel(THREE);
// Hari Tasyrik educational adventure — simplified fictional environment, not a determination of valid worship.
const $=id=>document.getElementById(id),SAVE='manasik-tasyrik-quest-v1',PREV='manasik-ifadah-quest-v1';
const demo=new URLSearchParams(location.search).has('demo');
function prevDone(){try{const p=JSON.parse(localStorage.getItem(PREV)||'null');return p?.version===1&&p.stage===8&&p.laps===7&&p.legs===7;}catch{return false;}}
if(!prevDone()&&!demo){location.replace('./adventure-map.html');throw Error('Level 10 required');}
const stops=[{name:'Ula (Sughra)',x:-14},{name:'Wustha',x:13},{name:'Aqabah (Kubra)',x:40}];
const tasks=[
 {kind:'guide',x:-59,z:9,day:11,name:'Temui pembimbing A07',hint:'Cari petugas di pos Mina.',action:'Bicara'},
 {kind:'route',x:-43,z:9,day:11,name:'Cari jalur Jamarat',hint:'Ikuti tanda MASUK A07.',action:'Periksa'}
];
for(const day of [11,12,13]){
 for(let i=0;i<3;i++){const st=stops[i];tasks.push({kind:'throw',x:st.x,z:9,day,station:i,stoneIndex:(day-11)*3+i,name:'Jumrah '+st.name,hint:'Bidik marma dan lontar 7 kerikil simulasi.',action:'Buka bidikan'});}
 const kind=day===11?'nextday':day===12?'choose':'final';
 tasks.push({kind,x:59,z:9,day,name:day===11?'Kembali ke rombongan':day===12?'Pilih jalur Nafar':'Lapor ke pembimbing',hint:day===11?'Temui petugas untuk menuju hari 12.':day===12?'Pilih jalur Nafar Awal atau Nafar Tsani.':'Selesaikan misi Hari Tasyrik.',action:day===11?'Lanjut hari 12':day===12?'Pilih Nafar':'Lapor'});
}
const state={version:1,stage:0,avatar:'male',counts:Array(9).fill(0),nafar:null};
let scene,world,renderer,camera,player,beacon,aimRing,projectile=null,flightStart=0,flightEnd=null,npcs=[],sparks=[];
let x=-65,z=9,yaw=Math.PI/2,heading=0,active=false,inTransit=false,throwing=false,voice=false,lastTime=0,toastUntil=0;
const keys=new Set(),stick={id:null,x:0,y:0},look={id:null,x:0},camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),materials=new Map();
const box=(a,b,c)=>new THREE.BoxGeometry(a,b,c);
function mat(c,glow=0){const key=c+'/'+glow;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.83,emissive:c,emissiveIntensity:glow}));return materials.get(key);}
function add(geometry,c,a,b,d,parent=world,glow=0){const m=new THREE.Mesh(geometry,mat(c,glow));m.position.set(a,b,d);parent.add(m);return m;}
function pilgrim(parent,color=0xf2ece3,hijab=false){const group=new THREE.Group();parent.add(group);add(new THREE.CylinderGeometry(.33,.48,1.44,9),color,0,1.08,0,group);add(new THREE.SphereGeometry(.25,11,9),0xa87f61,0,2.04,0,group);for(const a of [-.2,.2])add(new THREE.CylinderGeometry(.12,.15,.6,8),0xd8d5ca,a,.31,0,group);
if(hijab)add(new THREE.ConeGeometry(.48,.89,10),color,0,2.1,0,group);else add(new THREE.SphereGeometry(.27,10,8,0,Math.PI*2,0,Math.PI*.46),0xf5ede3,0,2.16,0,group);return group;}
function sign(label,a,b,d,w=7){const c=document.createElement('canvas');c.width=512;c.height=188;const ctx=c.getContext('2d');ctx.fillStyle='#1a5944';ctx.fillRect(0,0,512,188);ctx.strokeStyle='#efd28b';ctx.lineWidth=11;ctx.strokeRect(8,8,496,172);ctx.fillStyle='#fff5d7';ctx.font='bold 62px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,256,96,490);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.367),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));mesh.position.set(a,b,d);world.add(mesh);}
function build(){scene=new THREE.Scene();scene.background=new THREE.Color(0xc1cbbd);scene.fog=new THREE.Fog(0xc1cbbd,65,164);camera=new THREE.PerspectiveCamera(66,1,.1,230);
world=new THREE.Group();scene.add(world);scene.add(new THREE.HemisphereLight(0xecf7f1,0x7b6b5f,3));const sun=new THREE.DirectionalLight(0xffebca,3.4);sun.position.set(-24,60,18);scene.add(sun);
const floor=add(new THREE.PlaneGeometry(150,78),0xd6d1c6,0,-.05,0);floor.rotation.x=-Math.PI/2;
for(const zc of [-19,20]){add(box(147,2.6,.8),0xb3b6b0,0,1.3,zc);add(box(147,.2,1),0xe7e2d3,0,2.72,zc);}
for(let p=-69;p<=69;p+=10){for(const zc of [-17.2,18.2]){add(new THREE.CylinderGeometry(.5,.63,10,9),0xddd9cf,p,5,zc);add(box(2,.4,2),0xbfae8b,p,10.2,zc);}for(const zc of [13.7,-12])add(box(3.5,.04,.16),0xf1e5d0,p,.015,zc);}
for(let p=-68;p<=69;p+=17)add(box(.16,.04,32),0xe6e1d6,p,.02,1);
for(let i=0;i<3;i++){const s=stops[i];add(box(7.4,8.6,1.2),i===2?0xc9bdad:0xbec2b9,s.x,4.3,-4);add(box(7.6,.35,1.6),i===2?0xd5b879:0xb0b9ad,s.x,8.78,-4);const ring=add(new THREE.RingGeometry(3.2,3.36,44),0xe6c88c,s.x,.07,9);ring.rotation.x=-Math.PI/2;sign('JUMRAH '+['ULA','WUSTHA','AQABAH'][i],s.x,11.8,-4,8.8);}
sign('MASUK A07',-43,4.7,12,6);sign('KELUAR',59,4.7,12,6);sign('ROMBONGAN A07',-59,4.7,12,7);
for(const p of [-59,-43,59])pilgrim(world,0x438269,true).position.set(p,0,9);
const tent=add(box(9,3.1,6.6),0xe9e0d0,-59,1.55,-8);tent.userData.shelter=true;const roof=add(new THREE.ConeGeometry(5.4,2.7,4),0xf4ecdf,-59,4.42,-8);roof.rotation.y=Math.PI/4;
for(let i=0;i<42;i++){const n=pilgrim(world,i%5===0?0xcbd1c4:0xf4f0e7,i%6===0);n.position.set(-67+(i*18.1)%132,0,i%2===0?15.5:-14.2);npcs.push({mesh:n,speed:i%2===0?.33:-.29});}
player=pilgrim(world,state.avatar==='female'?0x537e68:0xf4efe4,state.avatar==='female');player.position.set(x,0,z);
beacon=new THREE.Group();world.add(beacon);add(new THREE.CylinderGeometry(.14,.25,2.1,12),0xf8d18d,0,1.5,0,beacon,.6);add(new THREE.OctahedronGeometry(.49),0xffe1a0,0,2.8,0,beacon,.9);const pLight=new THREE.PointLight(0xffd390,4,10);pLight.position.y=2.5;beacon.add(pLight);
aimRing=add(new THREE.RingGeometry(.5,.65,32),0xffd88a,stops[0].x,3.8,-3.38,world,.8);aimRing.visible=false;
renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.35,devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
fit();window.addEventListener('resize',fit);controls();requestAnimationFrame(render);
}
function fit(){camera.aspect=Math.max(1,innerWidth)/Math.max(1,innerHeight);camera.updateProjectionMatrix();renderer.setSize(Math.max(1,innerWidth),Math.max(1,innerHeight),false);}
function task(){return tasks[Math.min(state.stage,13)];}
function index(){return task().kind==='throw'?task().stoneIndex:-1;}
function shots(){return state.counts.reduce((a,b)=>a+b,0);}
function dayDone(day){const base=(day-11)*3;return state.counts.slice(base,base+3).every(n=>n===7);}
function save(){try{localStorage.setItem(SAVE,JSON.stringify(state));}catch{}}
function load(){try{const p=JSON.parse(localStorage.getItem(SAVE)||'null');if(!p||p.version!==1||!Number.isInteger(p.stage)||p.stage<0||p.stage>14||!Array.isArray(p.counts)||p.counts.length!==9||!p.counts.every(n=>Number.isInteger(n)&&n>=0&&n<=7)||!['male','female'].includes(p.avatar)||![null,'awal','tsani'].includes(p.nafar))return;
state.stage=p.stage;state.avatar=p.avatar;state.counts=[...p.counts];state.nafar=p.nafar;const t=task();x=p.stage===0?-65:p.stage===1?-59:t.kind==='throw'?t.x-3.8:55;z=9;yaw=Math.PI/2;}catch{}}
function say(t){$('caption').textContent=t;if(voice&&'speechSynthesis' in window){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='id-ID';u.rate=.95;u.volume=.62;speechSynthesis.speak(u);}catch{}}}
function toast(t,seconds=2){$('toast').textContent=t;$('toast').hidden=false;toastUntil=performance.now()+seconds*1000;}
function hud(){const t=task(),idx=index();$('day').textContent=state.stage===14?'FINAL':t.day+' DZULHIJJAH';$('mission').textContent=state.stage===14?'Misi Tasyrik selesai':t.name;$('hint').textContent=state.stage===14?'Seluruh checkpoint tersimpan.':t.hint;
$('total').textContent=shots()+'/'+(state.nafar==='tsani'||state.stage>=10&&state.stage<14?63:42);
$('station').textContent=idx>=0?'JUMRAH '+stops[t.station].name.toUpperCase():'ROMBONGAN A07';$('stationCount').textContent=idx<0?'POS':state.counts[idx]+'/7';$('action').textContent=t.action;$('action').hidden=!active||state.stage>=14||Math.hypot(x-t.x,z-t.z)>3.5;if(beacon)beacon.visible=state.stage<14;}
function start(){for(const id of ['intro','pause','help','guidePanel'])$(id).hidden=true;active=state.stage<14;hud();say(task().hint);if(state.stage===14){active=false;$('end').hidden=false;}}
function pause(){active=false;$('pause').hidden=false;$('checkpoint').textContent='Tahap '+Math.min(state.stage,14)+'/14 • '+shots()+' lontaran';hud();}
function reset(){if(!confirm('Ulangi Level 11 dari awal?'))return;state.stage=0;state.counts=Array(9).fill(0);state.nafar=null;x=-65;z=9;yaw=Math.PI/2;active=false;inTransit=false;throwing=false;clearStone();save();for(const id of ['pause','end','aim','choice','dayChange'])$(id).hidden=true;$('intro').hidden=false;if(player)player.position.set(x,0,z);hud();}
function advance(){state.stage++;save();hud();}
function nextDay(stage,day){inTransit=true;active=false;$('dayChange').hidden=false;$('dayChangeTitle').textContent='HARI '+day+' DZULHIJJAH';state.stage=stage;save();setTimeout(()=>{x=-65;z=9;yaw=Math.PI/2;if(player)player.position.set(x,0,z);inTransit=false;$('dayChange').hidden=true;active=true;hud();say('Hari '+day+'. Mulai dari Ula, dilanjutkan Wustha, dan Aqabah.');toast('HARI '+day+' DZULHIJJAH',3);},2000);}
function finish(kind){state.nafar=kind;state.stage=14;save();active=false;for(const id of ['choice','aim'])$(id).hidden=true;$('end').hidden=false;$('endTitle').textContent=kind==='awal'?'Jalur Nafar Awal selesai':'Jalur Nafar Tsani selesai';$('endBody').textContent=kind==='awal'?'Dua hari Tasyrik: 42 lontaran dalam Level 11. Ikuti pembimbing untuk ketentuan keberangkatan nyata.':'Tiga hari Tasyrik: 63 lontaran dalam Level 11. Seluruh checkpoint latihan tersimpan.';toast('LEVEL 11 TUNTAS',3);hud();}
function interact(){if(!active||inTransit||state.stage>=14)return;const t=task();if(Math.hypot(x-t.x,z-t.z)>3.5)return;
if(t.kind==='guide'){advance();toast('PANDUAN DIDAPAT');say('Pada Hari Tasyrik, urutannya Ula, Wustha, lalu Aqabah. Ikuti jadwal petugas.');}
else if(t.kind==='route'){advance();toast('JALUR A07');say('Ikuti petunjuk dan jangan berbalik melawan arus jemaah.');}
else if(t.kind==='throw')openAim();
else if(t.kind==='nextday'&&dayDone(11))nextDay(6,12);
else if(t.kind==='choose'&&dayDone(12)){active=false;$('choice').hidden=false;$('nafarSummary').textContent=shots()+' lontaran simulasi pada 11–12 Dzulhijjah.';}
else if(t.kind==='final'&&dayDone(13))finish('tsani');
hud();}
function aimValue(){return Number($('aimSlider').value);}
function refreshAim(){const t=task(),i=index();if(i<0)return;aimRing.visible=!$('aim').hidden;aimRing.position.set(t.x+aimValue()*.052,3.8,-3.36);
$('aimCount').textContent=state.counts[i]+'/7';$('aimValue').textContent=aimValue()===0?'TENGAH':aimValue()<0?'KIRI '+(-aimValue()):'KANAN '+aimValue();$('aimHint').textContent=Math.abs(aimValue())<=36?'Sasaran terarah ke marma':'Geser ke tengah sasaran';$('throwButton').disabled=throwing||state.counts[i]>=7;}
function openAim(){if(index()<0)return;active=false;$('aim').hidden=false;$('intro').hidden=true;$('pause').hidden=true;refreshAim();hud();say('Bidik marma, lalu lontar tujuh kerikil, satu setiap aksi.');}
function closeAim(){if(throwing)return;$('aim').hidden=true;aimRing.visible=false;active=true;hud();}
function clearStone(){if(!projectile)return;scene.remove(projectile);projectile.geometry.dispose();projectile.material.dispose();projectile=null;}
function sparksAt(a,b,c){for(let n=0;n<14;n++){const p=new THREE.Mesh(new THREE.IcosahedronGeometry(.085,0),new THREE.MeshBasicMaterial({color:n%2?0xf7dfaa:0xe2bb72}));p.position.set(a,b,c);scene.add(p);sparks.push({mesh:p,life:.78,dx:(Math.random()-.5)*2.8,dy:.6+Math.random()*2.2,dz:(Math.random()-.5)*2.9});}}
function throwOne(){const i=index();if($('aim').hidden||i<0||throwing||state.counts[i]>=7)return;throwing=true;$('throwButton').disabled=true;flightStart=performance.now();const t=task();flightEnd=new THREE.Vector3(t.x+aimValue()*.052,3.8,-3.46);projectile=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,0),new THREE.MeshStandardMaterial({color:0xe8d2ae,roughness:1}));projectile.position.set(t.x,1.9,9);scene.add(projectile);$('aimHint').textContent='Kerikil meluncur…';}
function land(){const i=index(),q=task(),success=Math.abs(aimValue())<=36;clearStone();throwing=false;if(i<0)return;
if(success){state.counts[i]++;save();sparksAt(flightEnd.x,flightEnd.y,flightEnd.z);toast('ALLAHU AKBAR · '+state.counts[i]+'/7',1.4);
if(state.counts[i]===7){$('aim').hidden=true;aimRing.visible=false;advance();active=true;toast('JUMRAH '+stops[q.station].name.toUpperCase()+' TUNTAS',2.8);say('Tujuh lontaran selesai disimulasikan. Ikuti penanda ke tujuan berikutnya.');}}
else{toast('BELUM TEPAT • COBA LAGI',1.8);say('Geser bidikan ke tengah sasaran dan coba lagi.');}
refreshAim();hud();}
function move(dt,now){if(!active)return;const f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-stick.y,r=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+stick.x,len=Math.hypot(f,r);if(len<.08)return;
const dx=(Math.sin(yaw)*f+Math.cos(yaw)*r)/Math.max(1,len),dz=(Math.cos(yaw)*f-Math.sin(yaw)*r)/Math.max(1,len),speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?8.8:6.6;let nx=Math.max(-67,Math.min(66,x+dx*speed*dt)),nz=Math.max(-17,Math.min(18,z+dz*speed*dt));
for(const st of stops){const vx=nx-st.x,vz=nz+4;if(Math.abs(vx)<4.2&&Math.abs(vz)<1.6){if(Math.abs(vx)>Math.abs(vz))nx=st.x+Math.sign(vx||1)*4.2;else nz=-4+Math.sign(vz||1)*1.6;}}
for(const n of npcs){const vx=nx-n.mesh.position.x,vz=nz-n.mesh.position.z,d=Math.hypot(vx,vz);if(d>.01&&d<.76){nx+=vx/d*(.76-d)*.5;nz+=vz/d*(.76-d)*.5;}}
x=Math.max(-67,Math.min(66,nx));z=Math.max(-17,Math.min(18,nz));heading=Math.atan2(dx,dz);player.rotation.y+=Math.atan2(Math.sin(heading-player.rotation.y),Math.cos(heading-player.rotation.y))*Math.min(1,dt*11);player.position.set(x,Math.sin(now*.014)*.046,z);hud();}
function render(now){const dt=Math.min(.045,(now-(lastTime||now))/1000);lastTime=now;if(renderer&&!document.hidden){move(dt,now);
for(const n of npcs){n.mesh.position.x+=n.speed*dt;if(n.mesh.position.x>67)n.mesh.position.x=-67;if(n.mesh.position.x< -67)n.mesh.position.x=67;n.mesh.rotation.y=n.speed>0?Math.PI/2:-Math.PI/2;}
const t=task();beacon.position.set(t.x,.17+Math.sin(now*.0029)*.14,t.z);beacon.rotation.y=now*.0008;
if(!$('aim').hidden){camPos.set(t.x+11,7.5,18);camLook.set(t.x,3.9,-4);}else{camPos.set(x-Math.sin(yaw)*9.5,5.8,z-Math.cos(yaw)*9.5);camLook.set(x,1.5,z);}
camera.position.lerp(camPos,Math.min(1,dt*5));camera.lookAt(camLook);feel.update({scene,renderer,camera,player,dt,now,active,aiming:!$('aim').hidden});renderer.render(scene,camera);
if(projectile){const time=Math.min(1,(now-flightStart)/750),st=task();projectile.position.set(st.x+(flightEnd.x-st.x)*time,1.9+(flightEnd.y-1.9)*time+Math.sin(Math.PI*time)*4.1,9+(flightEnd.z-9)*time);projectile.rotation.x+=dt*8;if(time>=1)land();}
for(const p of sparks){p.life-=dt;p.mesh.position.x+=p.dx*dt;p.mesh.position.y+=p.dy*dt;p.mesh.position.z+=p.dz*dt;p.mesh.scale.setScalar(Math.max(0,p.life));}
sparks=sparks.filter(p=>{if(p.life>0)return true;scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();return false;});
$('miniPlayer').setAttribute('cx',String(100+x/70*84));$('miniPlayer').setAttribute('cy',String(100-z/25*83));$('miniTarget').setAttribute('cx',String(100+t.x/70*84));$('miniTarget').setAttribute('cy',String(100-t.z/25*83));if(!$('toast').hidden&&now>toastUntil)$('toast').hidden=true;
}requestAnimationFrame(render);}
function controls(){const surface=$('joy'),knob=$('knob'),canvas=$('world');
function drag(e){if(e.pointerId!==stick.id)return;const r=surface.getBoundingClientRect(),radius=r.width*.36;let a=(e.clientX-r.left-r.width/2)/radius,b=(e.clientY-r.top-r.height/2)/radius;const magnitude=Math.hypot(a,b);if(magnitude>1){a/=magnitude;b/=magnitude;}stick.x=a;stick.y=b;knob.style.left=(50+a*35)+'%';knob.style.top=(50+b*35)+'%';}
surface.addEventListener('pointerdown',e=>{if(stick.id!==null)return;stick.id=e.pointerId;surface.setPointerCapture(e.pointerId);drag(e);});surface.addEventListener('pointermove',drag);
const release=e=>{if(e.pointerId!==stick.id)return;stick.id=null;stick.x=stick.y=0;knob.style.left='50%';knob.style.top='50%';};for(const event of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(event,release);
canvas.addEventListener('pointerdown',e=>{if(look.id!==null)return;look.id=e.pointerId;look.x=e.clientX;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(e.pointerId!==look.id)return;yaw-=(e.clientX-look.x)*.004;look.x=e.clientX;});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(e.pointerId===look.id)look.id=null;});
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(!$('aim').hidden){if(e.code==='ArrowLeft'||e.code==='ArrowRight'){$('aimSlider').value=String(Math.max(-100,Math.min(100,aimValue()+(e.code==='ArrowLeft'?-7:7))));refreshAim();}if(e.code==='Space'&&!e.repeat)throwOne();if(e.code==='Escape')closeAim();return;}if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='Escape'&&active)pause();keys.add(e.code);});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();stick.x=stick.y=0;});document.addEventListener('visibilitychange',()=>{if(document.hidden){active=false;keys.clear();}else if(!inTransit&&['intro','pause','help','guidePanel','aim','choice','end','dayChange'].every(id=>$(id).hidden))active=true;});}
$('start').onclick=start;$('resume').onclick=start;$('menu').onclick=pause;$('action').onclick=interact;$('reset').onclick=reset;$('replay').onclick=reset;$('helpButton').onclick=()=>{active=false;$('help').hidden=false;};$('helpClose').onclick=start;$('camera').onclick=()=>{yaw=heading;};
$('guideButton').onclick=()=>{active=false;$('guidePanel').hidden=false;};$('guideClose').onclick=start;
$('aimSlider').addEventListener('input',refreshAim);$('aimLeft').onclick=()=>{$('aimSlider').value=String(Math.max(-100,aimValue()-10));refreshAim();};$('aimRight').onclick=()=>{$('aimSlider').value=String(Math.min(100,aimValue()+10));refreshAim();};$('throwButton').onclick=throwOne;$('aimBack').onclick=closeAim;
$('nafarAwal').onclick=()=>{if(state.stage===9&&dayDone(12))finish('awal');};$('nafarTsani').onclick=()=>{if(state.stage===9&&dayDone(12)){$('choice').hidden=true;nextDay(10,13);}};$('choiceBack').onclick=()=>{$('choice').hidden=true;start();};
$('voiceButton').onclick=()=>{voice=!voice;$('voiceButton').textContent=voice?'Suara ON':'Suara OFF';say(task().hint);};
$('avatar').onchange=e=>{if(state.stage!==0)return;state.avatar=e.target.value;save();if(player){world.remove(player);player=pilgrim(world,state.avatar==='female'?0x537e68:0xf4efe4,state.avatar==='female');player.position.set(x,0,z);}};
load();$('avatar').value=state.avatar;hud();try{build();if(state.stage===14){$('intro').hidden=true;$('end').hidden=false;$('endTitle').textContent=state.nafar==='awal'?'Jalur Nafar Awal selesai':'Jalur Nafar Tsani selesai';$('endBody').textContent=state.nafar==='awal'?'42 lontaran pada dua hari Tasyrik.':'63 lontaran pada tiga hari Tasyrik.';}}catch(err){const overlay=document.createElement('div');overlay.className='error';overlay.textContent='Arena Jamarat 3D belum bisa dibuka. Gunakan browser dengan WebGL aktif.';document.body.append(overlay);console.error(err);}
