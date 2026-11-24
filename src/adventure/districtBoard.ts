import * as THREE from 'three';
import {createDistrictWorld} from './districtWorld.ts';
import {loadNusukRoute} from './nusukRoute.ts';
import {NUSUK_LEVELS} from './nusukModel.ts';
import {readSetup,saveSetup} from '../frontSettings.ts';
import {defaultSetup,UMRAH_LEVELS} from '../frontModel.ts';
import {readStory,saveStory,miqatEntryUrl,withTransfer,umrahDeparture} from '../travelStory.ts';
import {readCore,coreUrl,gamePage} from '../coreProgress.ts';
import {tenantUrl} from '../tenant.ts';
import {graphicsTier} from '../graphicsQuality.ts';
import {busSpawn} from './districtModel.ts';
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
  return route.chapters.map((l,i)=>({...l,available:l.done||i===0||route.chapters[i-1].done||l.saved&&l.available,href:i===0?miqatEntryUrl(demo):withTransfer(l.href)}));
 }
 const run=readCore('umrah'),step=run?.step??0;
 return UMRAH_LEVELS.map((l,i)=>({number:i+1,title:l.title,done:i<step,available:i===step,saved:!!run&&i===step,href:i===0?miqatEntryUrl(demo):run&&i===step?umrahDeparture(run.step,coreUrl(run,gamePage(run.step)??'manasik.html')):''}));
}
async function verify():Promise<{program:Program;name:string}>{
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
function backdrop(canvas:HTMLCanvasElement,board:HTMLElement){
 try{
  const renderer=new THREE.WebGLRenderer({canvas,antialias:graphicsTier()!=='low',powerPreference:'low-power'});
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));
  const world=createDistrictWorld(renderer),camera=new THREE.PerspectiveCamera(55,1,.1,230);
  camera.position.set(-12,3.4,23);camera.lookAt(-12,3.4,10);
  world.marker.visible=false;world.luggage.visible=false;
  const avatar=readSetup()?.avatar??'male';
  world.update(0,busSpawn({version:1,stage:0,avatar}),0,false,new THREE.Vector3(-12,0,17),0,{target:null,parcel:false});
  world.luggage.visible=false;
  const support=new THREE.Group();world.scene.add(support);support.position.set(-12,3.4,10);
  const trim=new THREE.MeshStandardMaterial({color:0x9d7841,roughness:.48,metalness:.2}),dark=new THREE.MeshStandardMaterial({color:0x173b32,roughness:.7});
  const slab=new THREE.Mesh(new THREE.BoxGeometry(1,1,.3),dark);support.add(slab);
  const legs=[-1,1].map(()=>{const leg=new THREE.Mesh(new THREE.BoxGeometry(.23,1,.25),trim);support.add(leg);return leg;});
  const foot=[-1,1].map(()=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(.75,.14,.70),dark);support.add(mesh);return mesh;});
  function draw(){
   const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
   const rect=board.getBoundingClientRect(),unit=2*13*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/h;
   const bw=rect.width*unit,bh=rect.height*unit;
   support.position.x=-12+(rect.left+rect.width/2-w/2)*unit;
   support.position.y=3.4-(rect.top+rect.height/2-h/2)*unit;
   slab.scale.set(bw+.09,bh+.09,1);
   for(let i=0;i<2;i++){const x=(i===0?-1:1)*bw*.43,height=Math.max(.15,support.position.y-bh/2);legs[i].scale.y=height;legs[i].position.set(x,-bh/2-height/2,0);foot[i].position.set(x,-support.position.y+.07,0);}
   renderer.render(world.scene,camera);
  }
  const observer=new ResizeObserver(draw);observer.observe(board);window.addEventListener('resize',draw);draw();
  window.addEventListener('pagehide',()=>{observer.disconnect();window.removeEventListener('resize',draw);world.dispose();renderer.dispose();},{once:true});
 }catch{document.documentElement.classList.add('boardFallback');}
}
export async function mountDistrictBoard(){
 document.documentElement.classList.add('districtBoardMode');document.title='Distrik Perjalanan — HAJJI.DIGITAL';
 const canvas=document.getElementById('districtWorld') as HTMLCanvasElement;
 const stage=elem('main','districtBoardStage'),board=elem('section','districtJourneyBoard');board.setAttribute('aria-label','Papan level perjalanan');stage.append(board);document.body.append(stage);
 const top=elem('header','boardHeader'),brand=elem('span','boardBrand','HAJJI.DIGITAL'),count=elem('span','boardProgress','MEMERIKSA AKSES');top.append(brand,count);
 const heading=elem('h1','','Papan Perjalanan'),subtitle=elem('p','boardSubtitle','Memeriksa tiket pribadi…'),grid=elem('div','boardLevels'),foot=elem('footer','boardFooter'),status=elem('p','boardStatus');status.setAttribute('role','status');board.append(top,heading,subtitle,grid,foot,status);
 const back=elem('a','boardBack','Kembali ke gerbang');back.href=tenantUrl('./index.html');
 try{
  const {program,name}=await verify();let launching=false;
  const render=()=>{
   const list=levels(program),completed=list.filter(l=>l.done).length;
   count.textContent=completed+' / '+list.length+' LEVEL';
   heading.textContent=program==='hajj'?'Perjalanan Haji':'Perjalanan Umroh';
   subtitle.textContent=(preview?'PRATINJAU DESAIN · TANPA AKSES BERBAYAR':demo?'DEMO LOKAL · TANPA TRANSAKSI':'Selamat datang, '+name)+' · Sentuh level yang terbuka.';
   grid.replaceChildren();grid.dataset.program=program;
   for(const l of list){
    const button=elem('button','boardLevel '+(l.done?'done':l.available?'available':'locked'));button.type='button';button.dataset.level=String(l.number);button.disabled=!l.available||(!preview&&!l.href);
    const n=elem('span','boardNumber',String(l.number).padStart(2,'0')),title=elem('strong','boardLevelTitle',l.title),state=elem('small','boardLevelStatus',l.done?'✓ Selesai':l.available?(l.saved?'Lanjutkan':'▶ Mulai'):'Terkunci');
    button.append(n,title,state);button.setAttribute('aria-label','Level '+l.number+' '+l.title+' · '+state.textContent);
    button.onclick=()=>{if(launching)return;if(preview){status.textContent='Contoh: Level 1 membuka Miqat & Ihram setelah tiket terverifikasi. Ini bukan akses berbayar.';return;}
     const current=levels(program).find(x=>x.number===l.number);if(!current?.available||!current.href){render();return;}
     launching=true;location.assign(tenantUrl(current.href));};
    grid.append(button);
   }
   foot.replaceChildren(elem('span','boardLegend','✓ Selesai  ·  Emas: terbuka  ·  Abu-abu: terkunci'));
   if(program==='hajj'){
    const bonus=elem('button','boardBonus',completed===list.length?'Buka oleh-oleh →':'Bonus · selesaikan 12 level');bonus.type='button';bonus.disabled=preview||completed!==list.length;bonus.onclick=()=>{if(loadNusukRoute().complete)location.assign(tenantUrl('./oleh-oleh.html'));};foot.append(bonus);
   }
   document.documentElement.dataset.districtBoardReady='true';
  };
  render();backdrop(canvas,board);window.addEventListener('pageshow',e=>{if(e.persisted){launching=false;render();}});window.addEventListener('storage',render);
 }catch(error){count.textContent='AKSES BELUM AKTIF';subtitle.textContent=error instanceof Error&&error.name!=='SyntaxError'?error.message:'Layanan tiket belum tersambung. Gunakan magic link pribadi setelah pembayaran diperiksa.';foot.append(back);const retry=elem('button','boardBonus','Coba lagi');retry.onclick=()=>location.reload();foot.append(retry);}
}
