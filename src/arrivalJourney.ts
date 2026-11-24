import {QUDUM_ENTRY} from './adventure/arenaDoor.ts';
import * as THREE from 'three';
import {buildKaaba,buildHijr,buildMaqam,buildZamzam} from './env/Kaaba.ts';
import {buildCourtyard,buildGalleries,buildMinarets} from './env/Precinct.ts';
import {createMaterials} from './env/Materials.ts';
import {graphicsTier} from './graphicsQuality.ts';
import {humanActor} from './characters/HumanActors.ts';
import {walkPath,type attachWalker,type Obstacle} from './coreWalk.ts';
import {ARRIVAL_CENTRE,ARRIVAL_STOPS,ARRIVAL_BOUNDS,ARRIVAL_SOLIDS,readArrivalJourney,storeArrivalJourney,completeArrivalJourney,stepEscort,type Escort} from './arrivalJourneyModel.ts';
import {coreUrl,readCore,gamePage,type Avatar,type Program} from './coreProgress.ts';
import {tenantUrl} from './tenant.ts';
import {saveStory} from './travelStory.ts';
import {mountContinuousTawaf} from './continuousTawaf.ts';
import {canEnterContinuousTawaf,readTawafTour,storeTawafTour} from './continuousTawafModel.ts';
type Action={label:string;fn:()=>void;id?:string;primary?:boolean};
type Options={scene:THREE.Scene;renderer:THREE.WebGLRenderer;walker:ReturnType<typeof attachWalker>;guide:THREE.Group;program:Program;avatar:Avatar;bounds:[number,number,number,number];obstacles:Obstacle[];host:HTMLElement;blocked:()=>boolean;show:(title:string,body:string,actions:Action[])=>void;close:()=>void;notice:(text?:string)=>void;changed:()=>void;resumeTawaf?:boolean;directQudum?:boolean};
export function arrivalResumePoint(stage:number):readonly [number,number]{const last=ARRIVAL_STOPS[Math.max(0,Math.min(4,stage-1))];return stage?[last.x,last.z]:[0,2.5];}
export function mountArrivalJourney(o:Options){
 let saved=readArrivalJourney(o.program,o.avatar),leg=0,assisted=false,visible=false,looked=false;
 let tawaf:ReturnType<typeof mountContinuousTawaf>|null=null;
 const {scene,walker}=o;for(let i=0;i<4;i++)o.bounds[i]=ARRIVAL_BOUNDS[i];o.obstacles.push(...ARRIVAL_SOLIDS);
 const group=new THREE.Group();group.name='continuous-arrival-precinct';group.position.set(ARRIVAL_CENTRE.x,-.035,ARRIVAL_CENTRE.z);scene.add(group);
 const materials=createMaterials(o.renderer,graphicsTier());group.add(buildCourtyard(materials),buildKaaba(materials),buildHijr(materials),buildMaqam(materials),buildZamzam(materials),buildGalleries(materials).group,buildMinarets(materials));
 const geometries:THREE.BufferGeometry[]=[],extras:THREE.Material[]=[],textures:THREE.Texture[]=[];
 function box(w:number,h:number,d:number,color:number,x:number,y:number,z:number){const g=new THREE.BoxGeometry(w,h,d),m=new THREE.MeshStandardMaterial({color,roughness:.8});geometries.push(g);extras.push(m);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);scene.add(mesh);return mesh;}
 function sign(text:string,x:number,y:number,z:number,w=3){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#1e5141';ctx.fillRect(0,0,768,128);ctx.strokeStyle='#e0c582';ctx.lineWidth=7;ctx.strokeRect(4,4,760,120);ctx.fillStyle='#fff2c5';ctx.font='bold 37px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,64,730);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;textures.push(map);const m=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}),g=new THREE.PlaneGeometry(w,w/6);extras.push(m);geometries.push(g);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.rotation.y=Math.PI;scene.add(mesh);return mesh;}
 for(const x of [7.5,18.5]){box(.65,5,.65,0xe4dcc7,x,2.5,24);box(1,.18,1,0xbea264,x,4.9,24);}box(12,.4,.7,0xe7d9b7,13,5.3,24);sign('PELATARAN KA’BAH',13,4.45,23.7,7);
 const crowd:THREE.Group[]=[],perimeter:THREE.Group[]=[];
 for(const [cx,cz,color,text] of [[27.5,39.5,0x28704b,'HAJJI.DIGITAL'],[17,36,0x416684,'ROMBONGAN BIRU'],[33,46,0xb39b61,'ROMBONGAN EMAS']] as const){box(.065,3.1,.065,0xc0a674,cx,1.55,cz);box(1.4,.75,.05,color,cx+.68,2.75,cz);sign(text,cx+.65,2.75,cz-.04,1.35);for(let i=0;i<3;i++){const npc=humanActor(scene,color,o.avatar==='female');npc.position.set(cx-1.1+i*.9,0,cz+1.7+(i%2)*.7);npc.rotation.y=Math.PI;crowd.push(npc);}}
 for(let i=0;i<(graphicsTier()==='low'?16:30);i++){const angle=i*.61,radius=29+(i%4)*3,person=humanActor(scene,0xf4efe3,i%3===0);person.position.set(Math.cos(angle)*radius,0,64+Math.sin(angle)*radius);person.rotation.y=angle-Math.PI/2;crowd.push(person);perimeter.push(person);}
 box(7,.025,.16,0x338c73,20,.014,64);const startSign=sign('TITIK AWAL TAWAF',22,1.8,65.3,3.5);startSign.rotation.y=Math.PI;
 const arrowShape=new THREE.Shape();arrowShape.moveTo(0,.65);arrowShape.lineTo(-.32,.03);arrowShape.lineTo(-.13,.03);arrowShape.lineTo(-.13,-.5);arrowShape.lineTo(.13,-.5);arrowShape.lineTo(.13,.03);arrowShape.lineTo(.32,.03);arrowShape.closePath();const arrowGeo=new THREE.ShapeGeometry(arrowShape).rotateX(-Math.PI/2),arrowMat=new THREE.MeshBasicMaterial({color:0x19866c,side:THREE.DoubleSide});geometries.push(arrowGeo);extras.push(arrowMat);for(const z of [62,60.5,59]){const arrow=new THREE.Mesh(arrowGeo,arrowMat);arrow.position.set(19,.045,z);scene.add(arrow);}
 const start=o.directQudum&&saved.stage===0?QUDUM_ENTRY:arrivalResumePoint(saved.stage),agent:Escort={x:start[0]+1.3,z:start[1]+1,yaw:0,waiting:false,cursor:0,path:[],state:'walking'};o.guide.position.set(agent.x,0,agent.z);
 function plan(){if(saved.stage>=5){walker.setGoal(19,64);agent.state='arrived';return;}const route=o.directQudum&&saved.stage===0?[[13,25]]:ARRIVAL_STOPS[saved.stage].route;leg=Math.min(leg,route.length-1);const point=route[leg];agent.path=walkPath([agent.x,agent.z],[point[0]+1.3,point[1]],o.obstacles,o.bounds);agent.cursor=0;agent.state=agent.path.length?'walking':'waiting';walker.setGoal(point[0],point[1]);if(assisted&&!o.blocked())walker.approach();o.changed();}
 function near(){if(saved.stage>=5)return true;const goal=ARRIVAL_STOPS[saved.stage];return leg===(o.directQudum&&saved.stage===0?0:goal.route.length-1)&&agent.state==='arrived'&&Math.hypot(walker.position.x-goal.x,walker.position.z-goal.z)<=1.15&&Math.hypot(walker.position.x-agent.x,walker.position.z-agent.z)<3.5;}
 function move(stage:number){if(!storeArrivalJourney(o.program,o.avatar,{version:1,active:true,stage})){o.notice('Tujuan belum tersimpan atau berubah di tab lain. Muat ulang untuk melanjutkan checkpoint.');return;}saved=readArrivalJourney(o.program,o.avatar);leg=0;looked=false;o.notice('');o.close();plan();}
 function nextUrl(){if(o.program==='hajj')return tenantUrl('./tawaf-adventure.html');const run=readCore('umrah');return run?coreUrl(run,gamePage(run.step)??'manasik.html'):tenantUrl('./adventure-map.html?journey=umrah');}
 function startTawaf(){if(tawaf||o.program!=='hajj'||!canEnterContinuousTawaf())return;const s=readTawafTour(o.avatar);if(!s.active&&!storeTawafTour(o.avatar,{version:1,active:true,poi:0,started:false})){o.notice('Persiapan Tawaf belum dapat disimpan. Progres Level 2 tetap dipertahankan.');return;}o.close();for(const person of perimeter)person.visible=false;tawaf=mountContinuousTawaf(o);o.changed();document.title='Tawaf Qudum · HAJJI.DIGITAL';}
 function finish(){o.show('Level 2 · Siap mulai tawaf','Titik awal sudah ditemukan dan checkpoint kedatangan tersimpan. Kenali titik penting di sekitar Ka’bah, lalu selesaikan tujuh putaran untuk menuntaskan level ini.',[{label:o.program==='hajj'?'Mulai Tawaf Qudum':'Mulai latihan tawaf →',id:'arrivalTawaf',fn:()=>o.program==='hajj'?startTawaf():location.assign(nextUrl())},{label:'Lihat peta perjalanan',id:'arrivalMap',primary:false,fn:()=>location.assign(tenantUrl('./adventure-map.html?journey='+o.program))}]);}
 function interact(){if(tawaf){tawaf.interact();return;}if(o.blocked()||!near())return;if(saved.stage===5){finish();return;}
  if(saved.stage===0)o.show('Kita sudah sampai di pelataran','Tetap bersama pembimbing. Selanjutnya kita masuk ke kawasan Ka’bah dengan tenang, lalu mencari rombonganmu.',[{label:'Masuk ke kawasan bersama pembimbing',id:'arrivalContinue',fn:()=>move(1)}]);
  else if(saved.stage===1)o.show('Selamat datang di kawasan Ka’bah','Rombongan kita membawa bendera hijau dengan nama HAJJI.DIGITAL. Perhatikan nama di bendera, lalu temui mereka di titik kumpul.',[{label:'Cari rombongan berbendera hijau',id:'arrivalContinue',fn:()=>move(2)}]);
  else if(saved.stage===2)o.show('Cocokkan rombonganmu','Baca nama pada bendera di dekat para jemaah. Apa nama rombongan kita?',[
   {label:'HAJJI.DIGITAL · Bendera hijau',id:'arrivalGroupAnswer',fn:()=>move(3)},
   {label:'Rombongan biru',primary:false,fn:()=>o.notice('Itu rombongan lain. Cari bendera hijau bertuliskan HAJJI.DIGITAL; jangan terpisah dari pembimbing.')},
  ]);
  else if(saved.stage===3){if(!visible||!looked){focus();o.notice('Kamera diarahkan ke Ka’bah. Amati bangunannya, lalu tekan Saya sudah melihat Ka’bah.');return;}o.show('Ka’bah terlihat di depanmu','Itulah Ka’bah dengan kiswah hitam dan sabuk emas. Kita belum menghitung putaran pada tahap pengenalan ini. Berikutnya cari garis awal tawaf bersama pembimbing.',[{label:'Sudah terlihat, cari titik tawaf',id:'arrivalContinue',fn:()=>move(4)}]);}
  else o.show('Garis awal tawaf ditemukan','Garis ini sejajar dengan sudut Hajar Aswad. Saat mulai berjalan pada arah yang ditunjukkan, Ka’bah berada di sebelah kiri. Tidak perlu menerobos jemaah untuk mendekati bangunannya.',[{label:'Simpan titik awal · lanjut tawaf',id:'arrivalFinish',fn:()=>{if(!completeArrivalJourney(o.program,o.avatar)){o.notice('Progres Level 2 belum dapat disimpan. Data lama tetap dipertahankan. Coba lagi setelah memeriksa penyimpanan browser.');return;}move(5);if(saved.stage!==5)return;saveStory({},o.program==='hajj'?'hajj:arrival':'umrah:2');finish();}}]);
 }
 function focus(){if(tawaf){tawaf.focus();return;}walker.lookAt(ARRIVAL_CENTRE.x,3.2,ARRIVAL_CENTRE.z);looked=true;}
 const abort=new AbortController();window.addEventListener('keydown',e=>{if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))assisted=false;},{signal:abort.signal});o.host.querySelector('.walkJoy')?.addEventListener('pointerdown',()=>{assisted=false;},{signal:abort.signal});
 const projected=new THREE.Vector3();
 function tick(dt:number,camera:THREE.Camera){if(tawaf){tawaf.tick(dt);return;}if(o.blocked())assisted=false;stepEscort(agent,walker.position,dt,o.blocked()||document.hidden,o.obstacles,o.bounds);o.guide.position.set(agent.x,0,agent.z);o.guide.rotation.y=agent.yaw;
  if(agent.state==='arrived'&&saved.stage<5&&leg<(o.directQudum&&saved.stage===0?0:ARRIVAL_STOPS[saved.stage].route.length-1)&&Math.hypot(walker.position.x-agent.x,walker.position.z-agent.z)<3.5){leg++;plan();}
  if(saved.stage===4&&near()&&!looked){walker.lock(true);walker.face(19,60);walker.lock(false);agent.yaw=Math.PI;o.guide.rotation.y=Math.PI;looked=true;}
  projected.set(0,4.5,64).project(camera);visible=Math.abs(projected.x)<.92&&Math.abs(projected.y)<.95&&projected.z>=-1&&projected.z<=1;
 }
 plan();if(o.resumeTawaf)startTawaf();return {tick,interact,near,focus,tawaf:()=>tawaf,position:o.guide.position,approach(){if(tawaf){tawaf.approach();return;}assisted=true;walker.approach();},finish,
  view(){const goal=ARRIVAL_STOPS[Math.min(saved.stage,4)];return {stage:saved.stage,title:saved.stage===5?'Titik awal tawaf ditemukan':o.directQudum&&saved.stage===0?'Temui pembimbing di pelataran Ka’bah':goal.title,body:saved.stage===5?'Checkpoint kedatangan tersimpan. Lanjutkan tujuh putaran untuk menuntaskan Level 2.':o.directQudum&&saved.stage===0?'Selamat datang di pelataran Ka’bah. Temui pembimbing di depanmu.':goal.body,action:saved.stage===5?'Lanjutkan ke tawaf':goal.action,status:agent.state==='waiting'?'Pembimbing menunggu kamu':agent.state==='arrived'?'Pembimbing sudah sampai':'Berjalan bersama pembimbing',near:near(),visible,looked,guideX:agent.x,guideZ:agent.z,leg};},
  dispose(){tawaf?.dispose();abort.abort();materials.dispose();group.traverse(obj=>{if(obj instanceof THREE.Mesh)obj.geometry.dispose();});group.removeFromParent();for(const g of geometries)g.dispose();for(const m of extras)m.dispose();for(const t of textures)t.dispose();}
 };
}
