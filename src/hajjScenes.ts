import * as THREE from 'three';
export type Site='arafah'|'muzdalifah'|'mina'|'jamarat';
export interface SiteView{focus(i:number):void;throwStone(i:number,onFinish:()=>void):void;dispose():void}
export function createSite(host:HTMLElement,site:Site):SiteView{
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Rekonstruksi ilustratif '+site+'; geser untuk memutar kamera');host.replaceChildren(canvas);
 const r=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});r.setPixelRatio(Math.min(devicePixelRatio,1.3));r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;
 const night=site==='muzdalifah';const s=new THREE.Scene();s.background=new THREE.Color(night?0x18283b:0xc9d9da);s.fog=new THREE.Fog(night?0x18283b:0xc9d9da,42,130);
 s.add(new THREE.HemisphereLight(night?0xb9d5ff:0xfff5df,0xb3a68b,night?1.5:2.3));
 const sun=new THREE.DirectionalLight(night?0xa1c7ff:0xffe7bd,night?1.1:2.1);sun.position.set(8,20,12);s.add(sun);
 const mat=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.9});
 const sand=mat(site==='jamarat'?0xd7d9d1:0xc8ab80),white=mat(0xf7f3e5),base=mat(0xa2a49c),rock=mat(0xa89272),green=mat(0x356f56),dark=mat(0x425747);
 function mesh(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number):THREE.Mesh{const a=new THREE.Mesh(g,m);a.position.set(x,y,z);s.add(a);return a;}
 function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number):THREE.Mesh{return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);}
 box(115,.3,115,sand,0,-.17,0);
 function tent(x:number,z:number,size=1):void{box(3.7*size,1.35*size,3.7*size,white,x,.68*size,z);const roof=mesh(new THREE.ConeGeometry(2.66*size,1.7*size,4),white,x,2.17*size,z);roof.rotation.y=Math.PI/4;box(.66*size,1.2*size,.05,dark,x,.6*size,z+1.86*size);}
 function sign(label:string,x:number,y:number,z:number):void{const c=document.createElement('canvas');c.width=512;c.height=128;const a=c.getContext('2d')!;a.fillStyle='#24533f';a.fillRect(0,0,512,128);a.fillStyle='#fff';a.font='bold 42px sans-serif';a.textAlign='center';a.textBaseline='middle';a.fillText(label,256,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;mesh(new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}),x,y,z);}
 function people(n:number):void{const bodies=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.21,.9,3,6),white,n);const heads=new THREE.InstancedMesh(new THREE.SphereGeometry(.15,8,6),mat(0xb68c69),n);const pos=new THREE.Object3D();for(let i=0;i<n;i++){const x=(Math.sin(i*2.31)*.5+.5)*42-21,z=(Math.cos(i*4.19)*.5+.5)*24-9;pos.position.set(x,.65,z);pos.updateMatrix();bodies.setMatrixAt(i,pos.matrix);pos.position.set(x,1.36,z);pos.updateMatrix();heads.setMatrixAt(i,pos.matrix);}s.add(bodies,heads);}
 const targets=[-8,0,8];
 if(site==='arafah'){for(let i=0;i<24;i++){const m=mesh(new THREE.DodecahedronGeometry(2.1+(i%5)*.95,0),rock,(i%8-3.5)*3.2,1.5+Math.sin(i)*.7,-18-Math.floor(i/8)*3);m.scale.set(1.3,1.3,1.3);m.rotation.set(i*.31,i*.37,i*.1);}for(let i=0;i<8;i++)tent((i%4-1.5)*5,5+Math.floor(i/4)*6);sign('ARAFAH • WUKUF',0,3.5,-7);people(42);}
 if(site==='muzdalifah'){for(let i=0;i<20;i++){const x=(Math.sin(i*2.2)*.5+.5)*30-15,z=(Math.cos(i*3.1)*.5+.5)*27-13;box(1.4,.045,2.1,i%2?green:dark,x,.02,z);}for(let i=0;i<32;i++)mesh(new THREE.DodecahedronGeometry(.09+(i%3)*.025,0),rock,(i%8-3.5)*.35,.09,2+Math.floor(i/8)*.31);for(let i=0;i<5;i++){box(.13,5,.13,base,i*7-14,2.5,-9);box(.55,.2,.55,new THREE.MeshBasicMaterial({color:0xffeac1}),i*7-14,5,-9);}sign('MUZDALIFAH • MABIT',0,3.5,-7);people(28);}
 if(site==='mina'){for(let i=0;i<48;i++){const x=(i%8-3.5)*5.2,z=Math.floor(i/8)*5.1-19;if(Math.abs(x)<3)continue;tent(x,z);}box(4,.025,49,base,0,.015,-4);sign('MINA • AREA TENDA',0,3.6,-8);people(35);}
 if(site==='jamarat'){
  box(32,.2,27,base,0,-.02,0);box(32,.25,1,white,0,5.1,-10);
  for(let i=0;i<3;i++){const x=targets[i];mesh(new THREE.CylinderGeometry(2.9,2.9,.22,40),base,x,.11,0);mesh(new THREE.TorusGeometry(2.6,.17,8,44).rotateX(Math.PI/2),white,x,.23,0);box(3.5,4.2,.8,white,x,2.1,0);sign(['ULA','WUSTHA','AQABAH'][i],x,4.9,.5);}
  for(let i=0;i<7;i++){box(.25,5,.25,white,i*5-15,2.5,-10);box(.29,.85,.29,white,i*5-15,.42,10);}
 }
 const cam=new THREE.PerspectiveCamera(47,1,.1,180);let orbit=.2,elev=.43,dist=site==='jamarat'?22:34,focusX=0;const center=new THREE.Vector3(0,1.5,0);
 const stone=mesh(new THREE.DodecahedronGeometry(.11,0),rock,0,0,0);stone.visible=false;
 let shot:{i:number;start:number;finish:()=>void}|null=null;let raf=0,disposed=false,drag:number|null=null,px=0,py=0;
 canvas.addEventListener('pointerdown',e=>{if(drag!==null)return;drag=e.pointerId;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(drag!==e.pointerId)return;orbit-=(e.clientX-px)*.009;elev=THREE.MathUtils.clamp(elev+(e.clientY-py)*.006,.15,1.1);px=e.clientX;py=e.clientY;});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if((e as PointerEvent).pointerId===drag)drag=null;});
 function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function frame(now:number){if(disposed)return;raf=requestAnimationFrame(frame);if(document.hidden)return;center.x+=(focusX-center.x)*.12;cam.position.set(center.x+Math.sin(orbit)*Math.cos(elev)*dist,1.5+Math.sin(elev)*dist,Math.cos(orbit)*Math.cos(elev)*dist);cam.lookAt(center);
 if(shot){const t=Math.min(1,(now-shot.start)/720);stone.position.set(targets[shot.i],.9+Math.sin(t*Math.PI)*3.1,7*(1-t));if(t>=1){const cb=shot.finish;shot=null;stone.visible=false;cb();}}
 r.render(s,cam);}
 raf=requestAnimationFrame(frame);
 return {focus(i){if(site==='jamarat'){focusX=targets[i];orbit=.05;dist=13;}},throwStone(i,onFinish){if(shot||site!=='jamarat')return;stone.visible=true;shot={i,start:performance.now(),finish:onFinish};},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();const geos=new Set<THREE.BufferGeometry>();const mats=new Set<THREE.Material>();s.traverse(o=>{if(o instanceof THREE.Mesh){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});for(const g of geos)g.dispose();for(const m of mats){if('map' in m&&(m as THREE.MeshBasicMaterial).map)(m as THREE.MeshBasicMaterial).map?.dispose();m.dispose();}r.dispose();}};
}
