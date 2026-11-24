import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {surfaceDetail,disposeSurface} from './GraphicsDetail.ts';

export type PlaceTheme='haram'|'sai'|'tahallul'|'prep'|'post'|'trim'|'arafah'|'muzdalifah'|'mina'|'jamarat';
/** Scenic solids stay outside walking bounds. This layer never changes collision or saves. */
export function placeDetails(theme:PlaceTheme,walkingRadius=36):THREE.Group {
  const root=new THREE.Group();root.name='place-details-'+theme;
  const wall=new THREE.MeshStandardMaterial({color:0xd8c9b0,roughness:.82});
  const ivory=new THREE.MeshStandardMaterial({color:0xf2eadc,roughness:.68});
  const trim=new THREE.MeshStandardMaterial({color:0xb49a68,roughness:.43,metalness:.25});
  const glass=new THREE.MeshStandardMaterial({color:0x3c6869,roughness:.28,metalness:.38});
  const dark=new THREE.MeshStandardMaterial({color:0x35483f,roughness:.8});
  const wood=new THREE.MeshStandardMaterial({color:0x775744,roughness:.9});
  const leaf=new THREE.MeshStandardMaterial({color:0x51704d,roughness:1});
  surfaceDetail(wall,'stone',8,5);surfaceDetail(ivory,'stone',2,2);surfaceDetail(wood,'fabric',3,1);
  let facadeRotation=0,pivotX=0,pivotZ=0;
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
  function part(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,ry=0){
    g.rotateY(ry);g.translate(x,y,z);if(facadeRotation){g.translate(-pivotX,0,-pivotZ);g.rotateY(facadeRotation);g.translate(pivotX,0,pivotZ);}let list=batches.get(m);if(!list){list=[];batches.set(m,list);}list.push(g);
  }
  const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number)=>part(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  function label(text:string,x:number,y:number,z:number,width=3){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#244d40';ctx.fillRect(0,0,512,96);ctx.strokeStyle='#ccba8c';ctx.lineWidth=5;ctx.strokeRect(4,4,504,88);
    ctx.fillStyle='#fff4dc';ctx.font='600 30px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,48,480);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(width,width*96/512),new THREE.MeshBasicMaterial({map:tex}));sign.position.set(x,y,z);root.add(sign);
  }
  function facade(x:number,z:number,w=12,h=9,d=4,rotation=0){
    facadeRotation=rotation;pivotX=x;pivotZ=z;
    box(w,h,d,wall,x,h/2,z);box(w+.5,.22,d+.5,ivory,x,h,z);box(w+.2,.13,d+.2,trim,x,h-.45,z);
    for(let a=-w/2+1.25;a<w/2;a+=2.5){
      box(.18,h,.14,ivory,x+a-1,h/2,z+d/2+.08);
      for(let y=2.3;y<h-1;y+=2.4){box(1.13,1.45,.12,glass,x+a,y,z+d/2+.06);box(1.4,.12,.3,ivory,x+a,y-.8,z+d/2+.15);box(.045,1.45,.15,trim,x+a,y,z+d/2+.14);box(1.13,.055,.15,trim,x+a,y+.1,z+d/2+.14);}
    }
    box(1.55,2.3,.15,dark,x,1.15,z+d/2+.1);box(2.4,.15,1.7,ivory,x,2.5,z+d/2+.5);
    for(const side of [-1,1])box(.1,2.5,.1,trim,x+side,1.25,z+d/2+1.2);
    facadeRotation=0;
  }
  function bench(x:number,z:number){
    for(const a of [-.8,.8])box(.1,.48,.6,dark,x+a,.24,z);
    for(let i=0;i<4;i++)box(2.2,.06,.13,wood,x,.51,z-.22+i*.15);
    box(2.2,.4,.1,wood,x,.79,z-.32);
  }
  function planter(x:number,z:number){
    box(1.1,.5,1.1,ivory,x,.25,z);part(new THREE.CylinderGeometry(.28,.38,.9,7),leaf,x,.9,z);
  }
  if(theme==='haram'){
    // The old adventure's walk radius is <=36 m; the core precinct extends farther.
    for(let i=-3;i<=3;i++){const e=walkingRadius+17,h=10+(i%2)*2;facade(i*13,-e,12,h,5);facade(i*13,e,12,h,5,Math.PI);facade(-e,i*13,12,h,5,Math.PI/2);facade(e,i*13,12,h,5,-Math.PI/2);}
    for(const x of [-walkingRadius-4,walkingRadius+4])for(const z of [-24,-12,0,12,24]){bench(x,z);planter(x,z+2.4);}
    label('GALERI • TITIK KUMPUL',0,3.3,-walkingRadius-14.3,5);
  }else if(theme==='sai'){
    // Corridor solids remain outside the old x=+/-10 m movement envelope.
    for(const side of [-1,1])for(let z=-36;z<=36;z+=12){
      box(.25,6,9,ivory,side*12.25,3,z);box(.2,.14,10,trim,side*12.05,4.8,z);
      box(.12,2.6,5.5,glass,side*12.07,3.1,z);box(.35,.2,6,ivory,side*11.9,1.7,z);
      for(const end of [-1,1])box(.5,5.8,.5,wall,side*11.8,2.9,z+end*4.5);
    }
    for(const x of [-7,7]){bench(x,-43.2);bench(x,43.2);}for(const x of [-11.7,11.7])planter(x,0);
  }else if(theme==='prep'||theme==='post'||theme==='trim'){
    for(const x of [-3.7,3.7]){
      box(2,1.6,.08,glass,x,2.1,-3.23);box(2.25,.09,.2,trim,x,1.25,-3.12);
      box(1.65,.8,.5,wood,x,.4,-2.95);box(.04,.65,.54,trim,x,.4,-2.94);
    }
    label(theme==='prep'?'PERSIAPAN • ROMBONGAN':theme==='post'?'ISTIRAHAT • ZAMZAM':'AREA PERAGAAN',0,3.03,-3.22,3);
  }else if(theme==='tahallul'){
    for(let i=-2;i<=2;i++)facade(i*12,-28,11.5,7+(i%2)*1.5,4);
    for(const x of [-31,33])for(const z of [-12,0,12]){facade(x,z,5,5,5);planter(x-2,z+4);}
    for(const x of [-16,-10,-4,2,8,14,20])bench(x,-19);
    label('LAYANAN JAMAAH • TITIK KUMPUL',0,3,-25.8,5);
  }else{
    const night=theme==='muzdalifah',jamarat=theme==='jamarat';
    for(const x of [-27,27])for(const z of [-7,7]){facade(x,z,7,night?4:5,5);bench(x,z+4);}
    if(jamarat){
      for(const z of [-11.5,12]){box(34,.35,.45,ivory,0,1.1,z);box(34,.08,.12,trim,0,1.4,z);for(let x=-16;x<=16;x+=2)box(.08,1.3,.08,dark,x,.65,z);}
      for(const x of [-19,19])box(.45,7,24,wall,x,3.5,0);box(38,.35,24,ivory,0,7,0);
    }else{
      for(const x of [-21,21]){box(.22,.6,34,ivory,x,.3,1);for(let z=-12;z<=14;z+=6){planter(x,z);bench(x+Math.sign(x)*1.7,z+2);}}
      for(let x=-15;x<=15;x+=5){box(.09,1.1,.09,trim,x,.55,16);box(4.9,.08,.08,dark,x+2.5,.95,16);}
    }
    label(jamarat?'LAYANAN PETUGAS':theme==='mina'?'POS ROMBONGAN':night?'LAYANAN MALAM':'POS JAMAAH',-27,3,-4.3,4);
  }
  for(const [material,geometries]of batches){
    const merged=mergeGeometries(geometries);if(merged){const mesh=new THREE.Mesh(merged,material);mesh.receiveShadow=true;mesh.castShadow=true;root.add(mesh);}for(const g of geometries)g.dispose();
  }
  root.userData.scenicOnly=true;return root;
}

export function disposePlaceDetails(root:THREE.Group):void {
  const mats=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});
  for(const m of mats){disposeSurface(m);m.dispose();}root.removeFromParent();
}
