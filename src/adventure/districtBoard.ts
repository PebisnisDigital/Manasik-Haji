import * as THREE from 'three';
import {loadNusukRoute} from './nusukRoute.ts';
import {NUSUK_LEVELS} from './nusukModel.ts';
import {readSetup,saveSetup} from '../frontSettings.ts';
import {defaultSetup,UMRAH_LEVELS} from '../frontModel.ts';
import {readStory,saveStory,miqatEntryUrl,withTransfer,umrahDeparture} from '../travelStory.ts';
import {readCore,coreUrl,gamePage} from '../coreProgress.ts';
import {tenantUrl} from '../tenant.ts';
import './districtBoard.css';
type Program='hajj'|'umrah';
type Level={number:number;title:string;done:boolean;available:boolean;saved:boolean;href:string};
const local=()=>['localhost','127.0.0.1'].includes(location.hostname);
const mode=new URLSearchParams(location.search).get('board');
const demo=mode==='demo'&&local(),preview=mode==='preview';
const elem=<K extends keyof HTMLElementTagNameMap>(tag:K,cls='',text='')=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
function levels(program:Program):Level[]{
 if(preview)return (program==='hajj'?NUSUK_LEVELS:UMRAH_LEVELS.map((l,i)=>({...l,number:i+1}))).map(l=>({number:l.number,title:l.title,done:false,available:l.number===1,saved:false,href:''}));
 if(program==='hajj'){
  const route=loadNusukRoute();
  return route.chapters.map((l,i)=>{const entry=i===0?miqatEntryUrl(demo):withTransfer(l.href);return {...l,available:l.done||i===0||route.chapters[i-1].done||l.saved&&l.available,href:entry.includes('district.html?transfer=')?l.href:entry};});
 }
 const run=readCore('umrah'),step=run?.step??0;
 return UMRAH_LEVELS.map((l,i)=>({number:i+1,title:l.title,done:i<step,available:i===step,saved:!!run&&i===step,href:i===0?miqatEntryUrl(demo):run&&i===step?umrahDeparture(run.step,coreUrl(run,gamePage(run.step)??'manasik.html')):''}));
}
export async function verifyDistrictBoard():Promise<{program:Program;name:string}>{
 if(preview)return {program:'hajj',name:'Peserta Demo'};
 if(demo){const setup=readSetup()??defaultSetup();return {program:setup.program,name:readStory().name};}
 const res=await fetch(new URL('./api/registration',location.href),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(8000)});
 const data=await res.json(),r=data.registration;
 if(!res.ok||r?.status!=='approved'||!['hajj','umrah'].includes(r.program)||!['male','female'].includes(r.avatar))throw Error('Tiket belum aktif. Buka kembali magic link pribadi dari admin.');
 if(!saveSetup({...readSetup()??defaultSetup(),program:r.program,avatar:r.avatar}))throw Error('Penyimpanan karakter tidak tersedia.');
 const name=typeof r.name==='string'&&r.name.trim().length>=2&&r.name.trim().length<=60?r.name.trim():readStory().name;
 if(!saveStory({name,briefed:true}))throw Error('Penyimpanan perjalanan belum tersedia.');
 return {program:r.program,name};
}

export type DistrictBoardAccess=Awaited<ReturnType<typeof verifyDistrictBoard>>;
export const BOARD_POINT={x:-8,z:11.7},BOARD_SPAWN={x:-8,z:17.8};
export const BOARD_SOLID={...BOARD_POINT,w:10.2,d:.65};
export function createWorldJourneyBoard(scene:THREE.Scene,access:DistrictBoardAccess,toast:(text:string)=>void,onSelect?:(number:number)=>void){
 const {program,name}=access;
 const width=10,height=5.05,base=.75;
 const group=new THREE.Group();group.position.set(BOARD_POINT.x,base+height/2,BOARD_POINT.z);scene.add(group);
 const dark=new THREE.MeshStandardMaterial({color:0x173b32,roughness:.62}),gold=new THREE.MeshStandardMaterial({color:0xb5975b,roughness:.45,metalness:.32});
 function box(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
 box(width+.32,height+.32,.30,0,0,0,gold);box(width+.10,height+.10,.34,0,0,0,dark);
 for(const x of [-4.45,4.45]){box(.28,base+.28,.34,x,-height/2-base/2,0,gold);box(.9,.14,.72,x,-height/2-base+.07,0,dark);}
 const c=document.createElement('canvas');c.width=2048;c.height=1034;const ctx=c.getContext('2d')!;
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 const face=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));face.position.z=.181;group.add(face);
 const dialog=elem('dialog','overlay boardReadDialog');dialog.hidden=true;dialog.setAttribute('aria-label','Peta perjalanan');
 const sheet=elem('section','districtJourneyBoard'),top=elem('header','boardHeader'),brand=elem('span','boardBrand','HAJJI.DIGITAL'),count=elem('span','boardProgress'),heading=elem('h1','','Peta Perjalanan'),subtitle=elem('p','boardSubtitle'),grid=elem('div','boardLevels'),foot=elem('footer','boardFooter'),close=elem('button','boardBack','Kembali ke kawasan');close.type='button';
 top.append(brand,count);sheet.append(top,heading,subtitle,grid,foot);dialog.append(sheet);document.body.append(dialog);
 let list:Level[]=[],launching=false;
 const hitZones:{x:number;y:number;w:number;h:number;number:number}[]=[];
 const closeMap=()=>{dialog.hidden=true;if(dialog.open)dialog.close();};close.onclick=closeMap;dialog.addEventListener('cancel',e=>{e.preventDefault();closeMap();});
 function launch(number:number){
  if(launching)return;
  if(preview){toast('Pratinjau: level hanya bisa dimainkan melalui tiket terverifikasi.');return;}
  const level=levels(program).find(x=>x.number===number);
  if(!level?.available||!level.href){toast('Selesaikan level sebelumnya terlebih dahulu.');return;}
  launching=true;try{sessionStorage.setItem('hajji-district-return',mode==='demo'?'demo':'magic');}catch{}location.assign(tenantUrl(level.href));
 }
 function select(number:number){const level=levels(program).find(l=>l.number===number);if(!level?.available){toast('Selesaikan level sebelumnya terlebih dahulu.');return;}if(onSelect){closeMap();onSelect(number);}else launch(number);}
 function bonus(){if(preview||program!=='hajj'||!loadNusukRoute().complete){toast('Selesaikan 12 level untuk membuka oleh-oleh.');return;}location.assign(tenantUrl('./oleh-oleh.html'));}
 function draw(){
  list=levels(program);const completed=list.filter(l=>l.done).length;
  const w=c.width,h=c.height;ctx.fillStyle='#14392e';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#c9ac6c';ctx.lineWidth=8;ctx.strokeRect(16,16,w-32,h-32);
  ctx.textAlign='left';ctx.fillStyle='#e9cb89';ctx.font='bold 31px system-ui';ctx.fillText('HAJJI.DIGITAL',66,70);
  ctx.fillStyle='#fff5dc';ctx.font='bold 66px system-ui';ctx.fillText(program==='hajj'?'PETA PERJALANAN HAJI':'PETA PERJALANAN UMROH',66,151);
  ctx.font='32px system-ui';ctx.fillStyle='#d2e2d4';ctx.fillText('Pilih tujuan gedung · '+completed+' / '+list.length+' selesai',69,205);
  const cols=4,gap=25,tw=(w-132-3*gap)/4,th=205,y0=262;
  hitZones.length=0;
  // A continuous route snakes through the numbered stops.
  const centers=list.map((_,i)=>{const row=Math.floor(i/cols),col=row%2?cols-1-i%cols:i%cols;return [66+col*(tw+gap)+tw/2,y0+row*(th+gap)+th/2];});
  ctx.strokeStyle='#aa9158';ctx.lineWidth=14;ctx.beginPath();centers.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
  for(let i=0;i<list.length;i++){
   const l=list[i],row=Math.floor(i/cols),col=row%2?cols-1-i%cols:i%cols,x=66+col*(tw+gap),y=y0+row*(th+gap);
   hitZones.push({x,y,w:tw,h:th,number:l.number});
   ctx.fillStyle=l.done?'#316851':l.available?'#e9c77c':'#30483e';ctx.fillRect(x,y,tw,th);
   ctx.strokeStyle=l.available?'#f8e3a9':'#697d69';ctx.lineWidth=3;ctx.strokeRect(x,y,tw,th);
   ctx.fillStyle=l.available&&!l.done?'#193d2f':'#e4e9dc';ctx.font='bold 55px system-ui';ctx.fillText(String(l.number).padStart(2,'0'),x+22,y+63);
   ctx.font='bold 32px system-ui';const words=l.title.split(' ');let line='',yy=y+108;
   for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>tw-42&&line){ctx.fillText(line,x+22,yy,tw-42);yy+=39;line=word;}else line=next;}ctx.fillText(line,x+22,yy,tw-42);
   ctx.font='bold 25px system-ui';ctx.fillStyle=l.available&&!l.done?'#37533c':'#c1cec0';ctx.fillText(l.done?'SELESAI':l.available?'KUNJUNGI GEDUNG':'TERKUNCI',x+22,y+185,tw-42);
  }
  ctx.fillStyle='#e9cb89';ctx.font='bold 26px system-ui';ctx.fillText(program==='hajj'?'BONUS OLEH-OLEH · '+(completed===list.length?'TERBUKA':'SELESAIKAN 12 LEVEL'):'JALUR LATIHAN UMROH',66,989);
  if(program==='hajj')hitZones.push({x:66,y:936,w:1000,h:65,number:0});
  if(preview){ctx.textAlign='right';ctx.font='23px system-ui';ctx.fillText('PRATINJAU DESAIN',w-66,989);ctx.textAlign='left';}
  texture.needsUpdate=true;
  count.textContent=completed+' / '+list.length+' LEVEL';heading.textContent=program==='hajj'?'Peta Perjalanan Haji':'Peta Perjalanan Umroh';subtitle.textContent=(preview?'Pratinjau tanpa transaksi':demo?'Demo lokal':'Selamat datang, '+name)+' · Pilih gedung tujuan.';
  grid.replaceChildren();for(const l of list){const b=elem('button','boardLevel '+(l.done?'done':l.available?'available':'locked'));b.type='button';b.dataset.level=String(l.number);b.disabled=!l.available||(!preview&&!l.href);b.append(elem('span','boardNumber',String(l.number).padStart(2,'0')),elem('strong','boardLevelTitle',l.title),elem('small','boardLevelStatus',l.done?'Selesai':l.available?'Kunjungi gedung':'Terkunci'));b.onclick=()=>select(l.number);grid.append(b);}
  foot.replaceChildren(close);if(program==='hajj'){const b=elem('button','boardBonus',completed===list.length?'Buka oleh-oleh':'Bonus · terkunci');b.disabled=preview||completed!==list.length;b.onclick=bonus;foot.append(b);}
 }
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function tap(clientX:number,clientY:number,camera:THREE.Camera,canvas:HTMLCanvasElement){
  const r=canvas.getBoundingClientRect();pointer.set((clientX-r.left)/r.width*2-1,1-(clientY-r.top)/r.height*2);ray.setFromCamera(pointer,camera);
  const hit=ray.intersectObject(face)[0];if(!hit?.uv)return false;
  const x=hit.uv.x*c.width,y=(1-hit.uv.y)*c.height;
  const tile=hitZones.find(t=>x>=t.x&&x<=t.x+t.w&&y>=t.y&&y<=t.y+t.h);
  if(tile){if(tile.number===0)bonus();else select(tile.number);}else open();
  return true;
 }
 function open(){draw();dialog.hidden=false;if(!dialog.open)dialog.showModal();close.focus();}
 draw();group.updateMatrixWorld(true);window.addEventListener('storage',draw);window.addEventListener('pageshow',e=>{if(e.persisted){launching=false;draw();}});
 document.documentElement.dataset.districtBoardReady='true';
 return {tap,open,launch,available:()=>list.filter(l=>l.available).map(l=>l.number),next:()=>list.find(l=>l.available&&!l.done)?.number??list[0]?.number??1,progress:()=>({done:list.filter(l=>l.done).length,total:list.length}),dispose:()=>{window.removeEventListener('storage',draw);dialog.remove();texture.dispose();}};
}
