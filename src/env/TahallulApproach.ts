import * as THREE from 'three';
/** Small exterior continuation of the existing Mas’a, with an open, legible exit. */
export function buildTahallulApproach(){
 const group=new THREE.Group();group.name='Marwah exit and tahallul forecourt';
 const cream=new THREE.MeshStandardMaterial({color:0xe4d9c1,roughness:.85}),green=new THREE.MeshStandardMaterial({color:0x174e3c,roughness:.8}),gold=new THREE.MeshStandardMaterial({color:0xc2a263,roughness:.65});
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,m=cream)=>{const p=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);p.position.set(x,y,z);group.add(p);return p;};
 const sign=(text:string,x:number,y:number,z:number,width:number,yaw=0)=>{
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;const c=canvas.getContext('2d')!;
  c.fillStyle='#164a39';c.fillRect(0,0,768,192);c.strokeStyle='#e9cc87';c.lineWidth=8;c.strokeRect(8,8,752,176);c.fillStyle='#ffe5a2';c.font='bold 49px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(text,384,96,730);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));p.position.set(x,y,z);p.rotation.y=yaw;group.add(p);
 };
 box(21,.25,20,24,-.17,36);box(7,.25,7,12,-.17,40);
 for(let x=15;x<=33;x+=3)box(.035,.015,20,x,-.025,36,gold);
 for(let z=28;z<=44;z+=3)box(21,.015,.035,24,-.025,z,gold);
 // Gallery doorway: the old wall is split around z37..44 in saiGame.
 for(const z of [37,44])box(.85,6,.85,13.7,3,z);box(.9,1,7.8,13.7,6.5,40.5);
 sign('KELUAR → TAHALLUL',13.1,5.5,40.5,6,-Math.PI/2);
 box(18,8,.7,25,4,26);box(.7,6,18,34,3,35);
 for(const x of [17,22,27,32]){box(.55,5,.55,x,2.5,44);box(2,.35,1.4,x,5.1,44);}
 box(19,.4,2,24.5,5.5,44);
 // A walk-up door into the next existing scene, with enough clearance around it.
 for(const x of [26,32])box(.65,4.7,.75,x,2.35,29.5);
 box(6.7,.65,1,29,4.8,29.5,green);box(5.3,.06,3,29,.02,30.6,gold);
 sign('LEVEL 5 · TAHALLUL',29,4,29.9,6);sign('TEMPAT TAHALLUL →',21,3.6,26.5,7);
 for(const x of [17,24]){box(2,.6,1,x,.3,28,green);const foliage=new THREE.Mesh(new THREE.SphereGeometry(.8,10,6),green);foliage.position.set(x,1.1,28);group.add(foliage);}
 return group;
}
