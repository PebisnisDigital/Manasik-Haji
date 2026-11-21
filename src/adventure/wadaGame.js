import * as THREE from 'three';
// Chapter 12: Tawaf Wada' teaching adventure, not religious certification or a real Hajj ruling.
// The menstruation/postpartum exemption route is educational and requires individual guidance in practice.
const $=id=>document.getElementById(id),SAVE='manasik-wada-quest-v1',PREV='manasik-tasyrik-quest-v1';
const DEMO=new URLSearchParams(location.search).has('demo'),TAU=Math.PI*2,R=19,COUNT=10;
function cleared11(){try{const p=JSON.parse(localStorage.getItem(PREV)||'null');return p?.version===1&&p.stage===14&&Array.isArray(p.counts)&&p.counts.length===9&&p.counts.slice(0,6).every(n=>n===7)&&((p.nafar==='awal'&&p.counts.slice(6).every(n=>n===0))||(p.nafar==='tsani'&&p.counts.slice(6).every(n=>n===7)));}catch{return false;}}
if(!cleared11()&&!DEMO){location.replace('./adventure-map.html');throw Error('Complete Level 11 first');}
const missions=[
 {world:'hotel',x:-28,z:0,name:'Temui pembimbing',hint:'Cari petugas A07 di halaman penginapan.',action:'Bicara'},
 {world:'hotel',x:-7,z:-10,name:'Siapkan koper',hint:'Ambil koper dan pastikan persiapan perjalanan selesai sebelum tawaf.',action:'Siapkan koper'},
 {world:'hotel',x:13,z:0,name:'Temui pembimbing Wada’',hint:'Dengarkan panduan sebelum memilih skenario latihan.',action:'Tanya pembimbing'},
 {world:'hotel',x:27,z:0,name:'Menuju Masjidil Haram',hint:'Temukan bus A07 untuk perjalanan menuju Masjidil Haram.',action:'Naik bus'},
 {world:'haram',x:R,z:0,name:'Mulai Tawaf Wada’',hint:'Cari titik awal sejajar Hajar Aswad. Ka’bah berada di sisi kiri.',action:'Mulai Tawaf'},
 {world:'haram',x:R,z:0,name:'Tawaf Wada’ · 7 putaran',hint:'Ikuti checkpoint melingkar satu per satu hingga tujuh putaran.',action:''},
 {world:'haram',x:0,z:31,name:'Menuju pintu keluar',hint:'Tawaf selesai. Ikuti penanda keluar menuju titik keberangkatan.',action:'Keluar'},
 {world:'departure',x:-22,z:7,name:'Temui petugas keberangkatan',hint:'Cari petugas A07 di lokasi keberangkatan.',action:'Lapor'},
 {world:'departure',x:19,z:6,name:'Naik bus keberangkatan',hint:'Cari bus rombongan yang sudah ditentukan.',action:'Naik bus'},
 {world:'departure',x:19,z:6,name:'Petualangan manasik selesai',hint:'Campaign tuntas dalam simulasi edukasi.',action:''}
];
const state={version:1,stage:0,avatar:'male',branch:null,laps:0,gate:0,packed:false,guideRead:false};
let scene,world,renderer,camera,player,marker,npcs=[],px=-38,pz=8,yaw=Math.PI/2,heading=0,active=false,transition=false,voice=false,last=0,toastUntil=0;
const pressed=new Set(),stick={pointer:null,x:0,y:0},look={pointer:null,x:0},camGoal=new THREE.Vector3(),lookGoal=new THREE.Vector3(),materials=new Map();
const box=(a,b,c)=>new THREE.BoxGeometry(a,b,c);
function material(color,glow=0){const key=color+'/'+glow;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.82,emissive:color,emissiveIntensity:glow}));return materials.get(key);}
function mesh(geometry,color,x,y,z,parent=world,glow=0){const m=new THREE.Mesh(geometry,material(color,glow));m.position.set(x,y,z);parent.add(m);return m;}
function person(parent,robe=0xf2eee4,hijab=false){const p=new THREE.Group();parent.add(p);mesh(new THREE.CylinderGeometry(.32,.47,1.44,10),robe,0,1.05,0,p);mesh(new THREE.SphereGeometry(.255,11,8),0x9d765e,0,2.03,0,p);for(const x of [-.19,.19])mesh(new THREE.CylinderGeometry(.12,.15,.61,8),0xdcd8ce,x,.31,0,p);if(hijab)mesh(new THREE.ConeGeometry(.49,.91,10),robe,0,2.09,0,p);else mesh(new THREE.SphereGeometry(.267,10,8,0,TAU,0,Math.PI*.47),0xf6f1e7,0,2.15,0,p);return p;}
function label(title,x,y,z,w=6){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=186;const ctx=canvas.getContext('2d');ctx.fillStyle='#205b49';ctx.fillRect(0,0,512,186);ctx.strokeStyle='#f2d68e';ctx.lineWidth=11;ctx.strokeRect(8,8,496,170);ctx.fillStyle='#fff1cc';ctx.font='bold 62px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(title,256,92,490);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.363),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));p.position.set(x,y,z);world.add(p);}
function ground(color,sx=105,sz=105){const p=mesh(new THREE.PlaneGeometry(sx,sz),color,0,-.02,0);p.rotation.x=-Math.PI/2;}
function bus(x,z){const group=new THREE.Group();group.position.set(x,0,z);world.add(group);mesh(box(4.6,3.9,10.5),0xefece3,0,2.25,0,group);mesh(box(4.7,1.05,10.6),0x4a806a,0,2.32,0,group);mesh(box(4.75,1.0,8.7),0x5b8285,0,3.3,0,group);for(const xx of [-2.26,2.26])for(const zz of [-3.4,3.4])mesh(new THREE.CylinderGeometry(.78,.78,.35,12),0x27332c,xx,.9,zz,group).rotation.z=Math.PI/2;label('BUS A07',x,5.0,z+5.3,3.5);}
function buildHotel(){scene.background=new THREE.Color(0xc5cdbc);scene.fog=new THREE.Fog(0xc4ccbd,75,145);ground(0xd3cabc,112,86);
for(let i=-5;i<=5;i++){const x=i*9;mesh(box(8,11,10),i%2?0xdbd1be:0xe6d7c0,x,5.5,-31);mesh(box(7,1,2),0xc0ac82,x,11,-31);}
for(let x=-45;x<=45;x+=10){for(const z of [-21,22]){mesh(new THREE.CylinderGeometry(.35,.45,6.3,9),0xd9d1bd,x,3.15,z);mesh(new THREE.SphereGeometry(.55,12,10),0xffe8bd,x,6.5,z,world,.3);}}
label('PENGINAPAN A07',-28,5,-10,8);
mesh(box(6.5,.9,4),0x8caa98,-7,.45,-10);mesh(box(2.0,1.45,1.2),0x53696b,-7,1.65,-10);mesh(box(1.6,.18,.7),0xc4af6b,-7,2.6,-10);label('KOPER',-7,4,-10,5);
person(world,0x447d65,true).position.set(-28,0,0);person(world,0x3e8268,true).position.set(13,0,0);bus(27,0);
for(let i=0;i<22;i++){const p=person(world,i%3?0xf4eee5:0xccd5c8,i%6===0);p.position.set(-36+i*3.2,0,11+(i%3)*2.5);npcs.push({mesh:p,speed:i%2?.25:-.21,axis:'x',lo:-43,hi:43});}
}
function buildHaram(){scene.background=new THREE.Color(0xc7d4c2);scene.fog=new THREE.Fog(0xc9d4c5,65,155);ground(0xe1ded7,125,125);
for(let i=-7;i<=7;i++){for(const zz of [-53,53]){mesh(new THREE.CylinderGeometry(.65,.79,12.5,10),0xe9e3d6,i*7.3,6.25,zz);mesh(box(7.4,.75,3),0xc9b58d,i*7.3,12.9,zz);}for(const xx of [-53,53]){mesh(new THREE.CylinderGeometry(.65,.79,12.5,10),0xe9e3d6,xx,6.25,i*7.3);mesh(box(3,.75,7.4),0xc9b58d,xx,12.9,i*7.3);}}
mesh(box(14,14,14),0x141615,0,7,0);mesh(box(14.2,.62,14.2),0xb99452,0,9.55,0);
for(const yy of [3.6,8.6,10.7]){for(const zz of [-7.13,7.13])mesh(box(14.2,.1,.08),0x957945,0,yy,zz);for(const xx of [-7.13,7.13])mesh(box(.08,.1,14.2),0x957945,xx,yy,0);}
mesh(box(3,5.2,.16),0xc8a34d,0,4.1,7.19);
const blackStone=mesh(new THREE.SphereGeometry(.45,10,9),0x262725,7.14,3.4,7.14);blackStone.scale.set(.6,.7,.6);
const lane=mesh(new THREE.RingGeometry(16.4,24,98),0xb8c9bf,0,.07,0);lane.rotation.x=-Math.PI/2;
const start=mesh(new THREE.RingGeometry(1.1,1.28,42),0xf2d17e,R,.1,0);start.rotation.x=-Math.PI/2;
label('PINTU KELUAR',0,5,34,7.6);person(world,0x48826d,true).position.set(0,0,31);
for(let i=0;i<45;i++){const theta=i/45*TAU,rad=27.0+(i%3)*2.4;const p=person(world,i%6===0?0xd7d3c9:0xf6f4ec,i%7===0);p.position.set(Math.cos(theta)*rad,0,Math.sin(theta)*rad);npcs.push({mesh:p,speed:.105+(i%4)*.025,axis:'circle',theta,rad});}
}
function buildDeparture(){scene.background=new THREE.Color(0xbecdbd);scene.fog=new THREE.Fog(0xc2cebe,80,160);ground(0xc9c8bc,118,88);
for(let x=-46;x<=46;x+=10){for(const z of [-22,23]){mesh(new THREE.CylinderGeometry(.4,.47,7,9),0xd7d0c1,x,3.5,z);mesh(new THREE.SphereGeometry(.52,10,8),0xffe8af,x,7.24,z,world,.35);}}
mesh(box(15,3.5,6),0x5e8b78,-22,1.75,-5);label('POS A07',-22,4.8,-2,6);
person(world,0x43816a,true).position.set(-22,0,7);bus(19,6);
signLine(-30,20);for(let i=0;i<19;i++){const p=person(world,i%4?0xf1eee4:0xcdd3c7,i%5===0);p.position.set(-37+i*3.6,0,-16+(i%4)*1.8);npcs.push({mesh:p,speed:i%2?.18:-.19,axis:'x',lo:-38,hi:38});}
}
function signLine(x1,x2){for(let x=x1;x<=x2;x+=7)mesh(box(2.6,.04,.16),0xf2e2bd,x,.02,16);}
function point(){if(state.stage===5){const theta=(state.gate+1)*TAU/COUNT;return {x:R*Math.cos(theta),z:R*Math.sin(theta)};}return missions[state.stage];}
function target(){return missions[state.stage];}
function persist(){try{localStorage.setItem(SAVE,JSON.stringify(state));}catch{}}
function load(){try{const p=JSON.parse(localStorage.getItem(SAVE)||'null');if(!p||p.version!==1||!Number.isInteger(p.stage)||p.stage<0||p.stage>9||!Number.isInteger(p.laps)||p.laps<0||p.laps>7||!Number.isInteger(p.gate)||p.gate<0||p.gate>=COUNT||!['male','female'].includes(p.avatar)||![null,'normal','uzur'].includes(p.branch))return;
if(p.stage>4&&p.stage<9&&p.branch===null)return;
if((p.stage===6||p.stage===7||p.stage===8||p.stage===9)&&p.branch==='normal'&&p.laps!==7)return;
if(p.branch==='uzur'&&p.stage<7)return;
state.stage=p.stage;state.avatar=p.avatar;state.branch=p.branch;state.laps=p.laps;state.gate=p.gate;state.packed=!!p.packed;state.guideRead=!!p.guideRead;
const t=target();if(p.stage===0){px=-38;pz=8;}else if(p.stage===1){px=-28;pz=0;}else if(p.stage===2){px=-7;pz=-10;}else if(p.stage===3){px=13;pz=0;}else if(p.stage===4){px=20;pz=7;}else if(p.stage===5){const theta=state.gate*TAU/COUNT;px=R*Math.cos(theta);pz=R*Math.sin(theta);}else if(p.stage===6){px=R;pz=0;}else if(p.stage===7){px=-35;pz=8;}else if(p.stage===8){px=-22;pz=7;}else{px=19;pz=6;}
yaw=p.stage===5?0:Math.PI/2;
}catch{}}
function say(text){$('caption').textContent=text;if(voice&&'speechSynthesis' in window){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='id-ID';u.rate=.94;u.volume=.62;speechSynthesis.speak(u);}catch{}}}
function toast(text,duration=2.2){$('toast').textContent=text;$('toast').hidden=false;toastUntil=performance.now()+duration*1000;}
function hud(){const q=target(),t=point();$('title').textContent=q.name;$('zone').textContent=q.world==='hotel'?'MAKKAH · PERSIAPAN':q.world==='haram'?'MASJIDIL HARAM':'TITIK KEBERANGKATAN';$('hint').textContent=state.stage===5?'PUTARAN '+state.laps+'/7 · TITIK '+(state.gate+1)+'/'+COUNT:q.hint;$('lap').textContent=state.laps+'/7';$('lapFill').style.width=(state.laps/7*100)+'%';$('stage').textContent=Math.min(9,state.stage)+'/9';$('targetLabel').textContent=state.stage===5?'CHECKPOINT '+(state.gate+1)+'/'+COUNT:q.name.toUpperCase();$('action').textContent=q.action;$('action').hidden=!active||state.stage===5||state.stage===9||Math.hypot(px-t.x,pz-t.z)>3.4;if(marker)marker.visible=state.stage<9;}
function advance(){state.stage++;persist();hud();}
function changeScene(next,x,z,title){transition=true;active=false;$('travel').hidden=false;$('travelTitle').textContent=title;state.stage=next;persist();setTimeout(()=>{px=x;pz=z;yaw=Math.PI/2;build();transition=false;$('travel').hidden=true;active=true;hud();say(target().hint);},1700);}
function tawafCheckpoint(){if(state.stage!==5)return;state.gate++;if(state.gate>=COUNT){state.gate=0;state.laps++;toast('TAWAF WADA’ · '+state.laps+'/7');if(state.laps===7){state.stage=6;toast('7 PUTARAN TUNTAS',3);say('Tujuh putaran latihan tuntas. Ikuti jalur keluar menuju keberangkatan.');}}
persist();hud();}
function branchNormal(){if(state.stage!==2||!state.packed)return;$('branchPanel').hidden=true;state.branch='normal';state.guideRead=true;advance();active=true;toast('JALUR TAWAF WADA’');say('Persiapan selesai. Temukan bus menuju Masjidil Haram.');}
function branchUzur(){if(state.stage!==2||!state.packed)return;$('branchPanel').hidden=true;$('uzurPanel').hidden=false;active=false;}
function confirmUzur(){if(state.stage!==2)return;$('uzurPanel').hidden=true;state.branch='uzur';state.guideRead=true;toast('JALUR PANDUAN UZUR',3);changeScene(7,-35,8,'MENUJU TITIK KEBERANGKATAN');}
function interact(){if(!active||transition||state.stage>=9||state.stage===5)return;const t=point();if(Math.hypot(px-t.x,pz-t.z)>3.4)return;
if(state.stage===0){advance();toast('PEMBIMBING DITEMUI');say('Selesaikan persiapan koper sebelum melakukan tawaf perpisahan.');}
else if(state.stage===1){state.packed=true;advance();toast('KOPER SIAP');say('Persiapan perjalanan sudah selesai. Temui pembimbing untuk skenario Tawaf Wada’.');}
else if(state.stage===2){active=false;$('branchPanel').hidden=false;}
else if(state.stage===3){changeScene(4,20,7,'MENUJU MASJIDIL HARAM');}
else if(state.stage===4){advance();toast('MULAI TAWAF WADA’');say('Mulai sejajar Hajar Aswad. Kelilingi Ka’bah tujuh putaran, Ka’bah di sisi kiri.');}
else if(state.stage===6){changeScene(7,-35,8,'MENUJU KEBERANGKATAN');}
else if(state.stage===7){advance();toast('PETUGAS DITEMUI');say('Cari bus A07 dan ikuti jadwal keberangkatan kelompok.');}
else if(state.stage===8){state.stage=9;persist();active=false;$('ending').hidden=false;showEnding();toast('CAMPAIGN MANASIK TUNTAS!',3);}
hud();}
function begin(){for(const id of ['intro','pause','help','branchPanel','guidePanel'])$(id).hidden=true;active=state.stage<9;if(state.stage===9){$('ending').hidden=false;active=false;showEnding();}hud();say(target().hint);}
function pause(){active=false;$('pause').hidden=false;$('checkpoint').textContent='Tahap '+state.stage+'/9 · Tawaf '+state.laps+'/7 · Jalur '+(state.branch||'belum dipilih');hud();}
function restart(){if(!confirm('Mulai ulang Level 12 dari awal?'))return;state.stage=0;state.avatar=$('avatar').value;state.branch=null;state.laps=0;state.gate=0;state.packed=false;state.guideRead=false;px=-38;pz=8;yaw=Math.PI/2;active=false;transition=false;persist();for(const id of ['pause','ending','branchPanel','uzurPanel','travel','help','guidePanel'])$(id).hidden=true;$('intro').hidden=false;build();}
function showEnding(){$('endingTitle').textContent='Petualangan Manasik Tamat';$('branchInfo').textContent=state.branch==='normal'?'Jalur Tawaf Wada’: 7 putaran simulasi berhasil diselesaikan.':'Jalur panduan uzur: pembelajaran kondisi haid/nifas dan keberangkatan bersama pembimbing.';$('endingCount').textContent=state.branch==='normal'?'7/7 TAWAF':'PANDUAN UZUR';$('endingNote').textContent='Badge ini hanya menunjukkan penyelesaian game, bukan sertifikat ibadah haji atau verifikasi manasik resmi.';}
function move(dt,now){if(!active)return;const f=Number(pressed.has('KeyW')||pressed.has('ArrowUp'))-Number(pressed.has('KeyS')||pressed.has('ArrowDown'))-stick.y,r=Number(pressed.has('KeyD')||pressed.has('ArrowRight'))-Number(pressed.has('KeyA')||pressed.has('ArrowLeft'))+stick.x,m=Math.hypot(f,r);if(m<.08)return;
const dx=(Math.sin(yaw)*f+Math.cos(yaw)*r)/Math.max(1,m),dz=(Math.cos(yaw)*f-Math.sin(yaw)*r)/Math.max(1,m),speed=pressed.has('ShiftLeft')||pressed.has('ShiftRight')?8.2:6.35;let nx=px+dx*speed*dt,nz=pz+dz*speed*dt;
if(target().world==='haram'){nx=Math.max(-47,Math.min(47,nx));nz=Math.max(-47,Math.min(47,nz));let rr=Math.hypot(nx,nz);const minR=state.stage===5?16.5:10;if(rr<minR){if(rr<.01){nx=minR;nz=0;}else{nx=nx/rr*minR;nz=nz/rr*minR;}}rr=Math.hypot(nx,nz);if(state.stage===5&&rr>24){nx=nx/rr*24;nz=nz/rr*24;}}
else{nx=Math.max(-43,Math.min(43,nx));nz=Math.max(-23,Math.min(24,nz));}
for(const n of npcs){const vx=nx-n.mesh.position.x,vz=nz-n.mesh.position.z,d=Math.hypot(vx,vz);if(d>.01&&d<.75){nx+=vx/d*(.75-d)*.45;nz+=vz/d*(.75-d)*.45;}}
px=nx;pz=nz;heading=Math.atan2(dx,dz);player.rotation.y+=Math.atan2(Math.sin(heading-player.rotation.y),Math.cos(heading-player.rotation.y))*Math.min(1,dt*10);player.position.set(px,Math.sin(now*.013)*.045,pz);
if(state.stage===5){const t=point();if(Math.hypot(px-t.x,pz-t.z)<3.1)tawafCheckpoint();}
hud();}
function frame(now){const dt=Math.min(.045,(now-(last||now))/1000);last=now;if(renderer&&!document.hidden){move(dt,now);for(const n of npcs){if(n.axis==='circle'){n.theta+=n.speed*dt;n.mesh.position.set(Math.cos(n.theta)*n.rad,0,Math.sin(n.theta)*n.rad);n.mesh.rotation.y=n.theta+Math.PI/2;}else{n.mesh.position[n.axis]+=n.speed*dt;if(n.mesh.position[n.axis]>n.hi)n.mesh.position[n.axis]=n.lo;if(n.mesh.position[n.axis]<n.lo)n.mesh.position[n.axis]=n.hi;}}
const t=point();marker.position.set(t.x,.13+Math.sin(now*.0028)*.14,t.z);marker.rotation.y=now*.0008;camGoal.set(px-Math.sin(yaw)*9.7,6.1,pz-Math.cos(yaw)*9.7);camera.position.lerp(camGoal,Math.min(1,dt*5));lookGoal.set(px,1.46,pz);camera.lookAt(lookGoal);renderer.render(scene,camera);
$('miniPlayer').setAttribute('cx',String(100+px/53*84));$('miniPlayer').setAttribute('cy',String(100-pz/53*84));$('miniTarget').setAttribute('cx',String(100+t.x/53*84));$('miniTarget').setAttribute('cy',String(100-t.z/53*84));if(!$('toast').hidden&&now>toastUntil)$('toast').hidden=true;}requestAnimationFrame(frame);}
function build(){if(world){scene.remove(world);world.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material?.map instanceof THREE.CanvasTexture)o.material.map.dispose();});}
world=new THREE.Group();scene.add(world);npcs=[];world.add(new THREE.HemisphereLight(0xe9fbf0,0x7a7165,3));const sun=new THREE.DirectionalLight(0xffeaca,3.6);sun.position.set(-27,60,18);world.add(sun);
if(target().world==='hotel')buildHotel();else if(target().world==='haram')buildHaram();else buildDeparture();
player=person(world,state.avatar==='female'?0x4e7e6b:0xf5efe4,state.avatar==='female');player.position.set(px,0,pz);
marker=new THREE.Group();world.add(marker);mesh(new THREE.CylinderGeometry(.16,.25,2,11),0xf4cc76,0,1.55,0,marker,.6);mesh(new THREE.OctahedronGeometry(.51),0xfce2a1,0,2.82,0,marker,.8);const lamp=new THREE.PointLight(0xffd68b,4,11);lamp.position.y=2.4;marker.add(lamp);hud();}
function controls(){const joy=$('joy'),knob=$('knob'),canvas=$('world');
function drag(e){if(e.pointerId!==stick.pointer)return;const r=joy.getBoundingClientRect(),radius=r.width*.36;let xx=(e.clientX-r.left-r.width/2)/radius,yy=(e.clientY-r.top-r.height/2)/radius;const d=Math.hypot(xx,yy);if(d>1){xx/=d;yy/=d;}stick.x=xx;stick.y=yy;knob.style.left=(50+xx*35)+'%';knob.style.top=(50+yy*35)+'%';}
joy.addEventListener('pointerdown',e=>{if(stick.pointer!==null)return;stick.pointer=e.pointerId;joy.setPointerCapture(e.pointerId);drag(e);});joy.addEventListener('pointermove',drag);const release=e=>{if(e.pointerId!==stick.pointer)return;stick.pointer=null;stick.x=stick.y=0;knob.style.left='50%';knob.style.top='50%';};for(const ev of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(ev,release);
canvas.addEventListener('pointerdown',e=>{if(look.pointer!==null)return;look.pointer=e.pointerId;look.x=e.clientX;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(e.pointerId!==look.pointer)return;yaw-=(e.clientX-look.x)*.004;look.x=e.clientX;});for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{if(e.pointerId===look.pointer)look.pointer=null;});
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='Escape'&&active)pause();pressed.add(e.code);});addEventListener('keyup',e=>pressed.delete(e.code));addEventListener('blur',()=>{pressed.clear();stick.x=stick.y=0;});document.addEventListener('visibilitychange',()=>{if(document.hidden){active=false;pressed.clear();}else if(!transition&&['intro','pause','help','guidePanel','branchPanel','uzurPanel','travel','ending'].every(k=>$(k).hidden))active=true;});
}
$('start').onclick=begin;$('resume').onclick=begin;$('menu').onclick=pause;$('action').onclick=interact;$('reset').onclick=restart;$('replay').onclick=restart;
$('helpButton').onclick=()=>{active=false;$('help').hidden=false;};$('helpClose').onclick=begin;$('camera').onclick=()=>{yaw=heading;};
$('guideButton').onclick=()=>{active=false;$('guidePanel').hidden=false;};$('guideClose').onclick=begin;
$('normalPath').onclick=branchNormal;$('uzurPath').onclick=branchUzur;$('branchBack').onclick=()=>{$('branchPanel').hidden=true;begin();};
$('uzurConfirm').onclick=confirmUzur;$('uzurBack').onclick=()=>{$('uzurPanel').hidden=true;$('branchPanel').hidden=false;};
$('voiceButton').onclick=()=>{voice=!voice;$('voiceButton').textContent=voice?'Suara ON':'Suara OFF';say(target().hint);};
$('avatar').onchange=e=>{if(state.stage!==0)return;state.avatar=e.target.value;persist();if(player){world.remove(player);player=person(world,state.avatar==='female'?0x4e7e6b:0xf5efe4,state.avatar==='female');player.position.set(px,0,pz);}};
$('copyBadge').onclick=async()=>{const text='MANASIK ADVENTURE — Campaign 12 Chapter selesai (simulasi edukasi, bukan sertifikasi haji). Jalur Level 12: '+(state.branch==='normal'?'Tawaf Wada’':'Panduan uzur')+'.';try{await navigator.clipboard.writeText(text);$('copyBadge').textContent='Tersalin!';}catch{$('copyBadge').textContent='Salin manual';}};
load();$('avatar').value=state.avatar;hud();
try{renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.35,devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(66,1,.1,220);build();const fit=()=>{const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};fit();addEventListener('resize',fit);controls();requestAnimationFrame(frame);if(state.stage===9){$('intro').hidden=true;$('ending').hidden=false;showEnding();}}catch(e){const p=document.createElement('div');p.className='error';p.textContent='Game 3D belum dapat dibuka. Coba browser dengan WebGL aktif.';document.body.append(p);console.error(e);}
