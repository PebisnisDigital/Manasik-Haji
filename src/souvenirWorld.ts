import * as THREE from 'three';
import {GIFTS,souvenirObstacles,type GiftId} from './souvenirModel.ts';
export function buildSouvenirWorld(scene:THREE.Scene){
 const root=new THREE.Group();scene.add(root);root.name='ruang-oleh-oleh';
 const pickable:THREE.Mesh[]=[],spinners:THREE.Group[]=[];
 const mat=(color:number,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness:metalness?.3:.75,metalness});
 const marble=mat(0xece5d4),green=mat(0x164b39),gold=mat(0xe3b755,.75),dark=mat(0x26382f),cream=mat(0xfff2d8),wood=mat(0x846449),wall=mat(0xf4ebdb),red=mat(0x742c38),black=mat(0x111820);
 const glass=new THREE.MeshPhysicalMaterial({color:0xdaf5ef,transparent:true,opacity:.13,roughness:.15,depthWrite:false});
 function mesh(geometry:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=root){const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o;}
 function box(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material,parent:THREE.Object3D=root){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);}
 function cylinder(r1:number,r2:number,h:number,x:number,y:number,z:number,m:THREE.Material,parent:THREE.Object3D=root){return mesh(new THREE.CylinderGeometry(r1,r2,h,20),m,x,y,z,parent);}
 function label(text:string,x:number,y:number,z:number,w=3,id?:GiftId){const c=document.createElement('canvas');c.width=1024;c.height=240;const g=c.getContext('2d')!;g.fillStyle='#164638';g.fillRect(0,0,1024,240);g.strokeStyle='#cfaf65';g.lineWidth=8;g.strokeRect(5,5,1014,230);g.fillStyle='#fff0c5';g.font='bold 66px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(text,512,120,940);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const o=mesh(new THREE.PlaneGeometry(w,w*240/1024),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}),x,y,z);if(id){o.userData.gift=id;pickable.push(o);}return o;}
 function mark(o:THREE.Mesh,id:GiftId){o.userData.gift=id;pickable.push(o);return o;}
 function frame(x:number,y:number,z:number,w:number,h:number,id:GiftId,text:string){box(w,h,.12,x,y,z,gold);mark(box(w-.15,h-.15,.14,x,y,z+.03,cream),id);label(text,x,y,z+.13,w-.25,id);}
 function ring(x:number,z:number){mesh(new THREE.RingGeometry(.42,.5,24).rotateX(-Math.PI/2),gold,x,.025,z);}
 box(32,.3,31,0,-.17,-3,marble);box(32,5,.3,0,2.5,-18.35,wall);for(const x of [-15.9,15.9])box(.3,5,31,x,2.5,-3,wall);
 box(3.1,.02,20,0,.006,1,green);for(const x of [-1.45,1.45])box(.06,.025,20,x,.02,1,gold);
 for(let x=-14;x<=14;x+=2)box(.015,.015,30,x,.002,-3,dark);
 for(let z=-17;z<=11;z+=2)box(31,.015,.015,0,.003,z,dark);
 label('PUSAT OLEH-OLEH HAJJI.DIGITAL',0,4.7,-9.4,10);
 label('PRESTASI & KENANGAN',-8,4,-8.9,7);label('BEKAL BAITULLAH',8,4,-8.9,7);
 label('PUSAT CUAN',0,3.7,10.7,5);
 box(2.3,.16,1.7,0,.07,1,wood).name='guide-platform';
 for(const p of GIFTS){
  if(p.kind==='guide'||p.kind==='cinema')continue;
  const x=p.x,z=p.z-1.35,id=p.id;
  ring(x,p.z);
  const shelf=p.kind==='book'||p.kind==='audio'||p.kind==='tasbih';
  if(shelf){box(2.65,1.85,.18,x,.95,z-.45,wood);for(const dx of [-1.22,1.22])box(.15,1.9,1.1,x+dx,.95,z,wood);for(const y of [.15,.8,1.45])box(2.65,.12,1.1,x,y,z,wood);}
  else{box(2.65,.18,1.1,x,.92,z,wood);box(2.35,.82,.9,x,.43,z,green);box(2.65,.06,1.1,x,.99,z,gold);}
  label(p.title,x,2.72,z+.57,2.9,id);
  switch(p.kind){
   case 'certificate':case 'wall':case 'photo':case 'screen':frame(x,1.82,z,2.25,1.45,id,p.kind==='certificate'?'HAJI DIGITAL':p.kind==='wall'?'12 / 12':p.kind==='photo'?'KENANGAN':'UCAPAN');break;
   case 'medal':case 'badge':{
    const group=new THREE.Group();group.position.set(x,1.65,z);root.add(group);spinners.push(group);
    const disc=cylinder(.44,.44,.12,0,0,0,gold,group);disc.rotation.x=Math.PI/2;mark(disc,id);
    const emblem=mesh(new THREE.TorusGeometry(.33,.025,8,32),cream,0,0,.08,group);mark(emblem,id);
    if(p.kind==='medal'){for(const dx of [-.18,.18]){const ribbon=box(.2,.65,.055,dx,.55,0,red,group);ribbon.rotation.z=dx*1.6;}}
    else label('12',x,1.65,z+.48,.6,id);
    box(1.8,1.45,.85,x,1.72,z,glass);break;}
   case 'trophy':{
    cylinder(.43,.57,.2,x,1.12,z,gold);cylinder(.12,.19,.45,x,1.43,z,gold);mark(cylinder(.56,.22,.65,x,1.94,z,gold),id);
    for(const dx of [-.52,.52])mesh(new THREE.TorusGeometry(.25,.055,10,24),gold,x+dx,1.98,z);break;}
   case 'card':frame(x,1.45,z,1.9,1.02,id,p.id==='coupon'?'REFERRAL':p.id==='replay'?'AKSES ULANG':'ALUMNI');break;
   case 'coins':for(let i=0;i<6;i++)mark(cylinder(.31,.31,.09,x+(i%2)*.65-.33,1.05+Math.floor(i/2)*.09,z,gold),id);label('30%',x,1.8,z+.4,1.3,id);break;
   case 'wallet':mark(box(1.45,.67,.55,x,1.35,z,green),id);box(.25,.35,.07,x,1.35,z+.31,gold);break;
   case 'book':for(let i=0;i<3;i++){const book=box(.46,.67,.21,x+(i-1)*.56,1.83,z-.13,i===1?gold:green);mark(book,id);box(.38,.58,.03,x+(i-1)*.56,1.83,z-.005,cream);}label(p.id==='stickers'?'STIKER':'EDUKASI',x,1.12,z+.25,1.65,id);break;
   case 'audio':mark(mesh(new THREE.TorusGeometry(.4,.07,10,32,Math.PI),gold,x,1.95,z),id);for(const dx of [-.39,.39])mark(box(.19,.37,.23,x+dx,1.83,z,black),id);break;
   case 'tasbih':for(let i=0;i<16;i++){const a=i*Math.PI/8;mark(mesh(new THREE.SphereGeometry(.085,8,6),gold,x+Math.cos(a)*.48,1.82+Math.sin(a)*.31,z),id);}break;
   case 'gift':mark(box(1.4,.9,.85,x,1.48,z,red),id);box(.19,.94,.9,x,1.48,z,gold);box(1.45,.16,.9,x,1.97,z,gold);break;
  }
 }
 for(const x of [-8,8]){
  const id:GiftId=x<0?'motion':'stickman',title=x<0?'BIOSKOP MOTION':'BIOSKOP STICKMAN';
  box(13.8,.04,8.5,x,.016,-14,black);
  for(const dx of [-4.25,4.25])box(5.5,3.6,.35,x+dx,1.8,-9.65,green);
  for(const dx of [-6.95,6.95])box(.3,3.6,8.3,x+dx,1.8,-13.85,dark);
  box(3, .6,.4,x,3.3,-9.65,gold);label(title,x,3.55,-9.39,5,id);
  box(11,3.2,.18,x,2.05,-17.8,gold);mark(box(10.65,2.9,.21,x,2.05,-17.67,black),id);label(x<0?'KELAS ANIMASI MOTION':'KELAS ANIMASI STICKMAN',x,2.2,-17.5,8.8,id);
  for(const z of [-11.4,-12.9])for(const side of [-1,1])for(let i=0;i<4;i++){
   const sx=x+side*(1.55+i*1.02);box(.82,.42,.7,sx,.42,z,red);box(.82,.86,.18,sx,.83,z+.34,red);box(.92,.08,.78,sx,.2,z,dark);
  }
  ring(x,-14);
 }
 return {pickable,obstacles:souvenirObstacles(),update(now:number){spinners.forEach((g,i)=>{g.rotation.y=Math.sin(now*.00065+i)*.3;});},dispose(){const materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();root.traverse(n=>{if(n instanceof THREE.Mesh){n.geometry.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material]){materials.add(m);const map=(m as THREE.MeshBasicMaterial).map;if(map)textures.add(map);}}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();}};
}
