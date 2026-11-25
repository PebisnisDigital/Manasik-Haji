import * as THREE from 'three';
import {humanActor} from '../characters/HumanActors.ts';
import {Clip} from '../sim/States.ts';
import {graphicsTier} from '../graphicsQuality.ts';
import {celebrationGuests,CELEBRATION_FLAGS,SOUVENIR_BUILDING} from './citySouvenir.ts';
import type {Point,Rect} from './districtModel.ts';

export function createSouvenirCelebration(scene:THREE.Scene){
 const b=SOUVENIR_BUILDING,root=new THREE.Group();root.name='souvenir-celebration';root.position.set(b.x,0,b.z);scene.add(root);
 const geometries:THREE.BufferGeometry[]=[],materials:THREE.Material[]=[],textures:THREE.Texture[]=[],solids:Rect[]=[];
 const mat=(color:number,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,metalness,roughness:metalness?.36:.78});materials.push(m);return m;};
 const emerald=mat(0x12634e),gold=mat(0xe3b85a,.48),red=mat(0xa71e36),white=mat(0xf4f1e6),dark=mat(0x263746),glass=mat(0x375b70,.35),black=mat(0x172126),pavement=mat(0xd2cab2);
 const light=new THREE.MeshBasicMaterial({color:0xffe4ac});materials.push(light);
 function mesh(parent:THREE.Object3D,geo:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0){geometries.push(geo);const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o;}
 const box=(p:THREE.Object3D,w:number,h:number,d:number,m:THREE.Material,x=0,y=0,z=0)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const sphere=(p:THREE.Object3D,w:number,h:number,d:number,m:THREE.Material,x=0,y=0,z=0)=>{const o=mesh(p,new THREE.SphereGeometry(1,14,9),m,x,y,z);o.scale.set(w,h,d);return o;};
 function pole(p:THREE.Object3D,x:number,z:number,h:number){mesh(p,new THREE.CylinderGeometry(.075,.095,h,8),gold,x,h/2,z);sphere(p,.15,.15,.15,gold,x,h,z);}
 function sign(p:THREE.Object3D,w:number,h:number,lines:readonly string[],x:number,y:number,z:number,background='#124b3e'){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d')!;ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#e3ba66';ctx.lineWidth=12;ctx.strokeRect(15,15,c.width-30,c.height-30);ctx.textAlign='center';ctx.textBaseline='middle';for(let i=0;i<lines.length;i++){ctx.fillStyle=i===0?'#ffe4a3':'#fff7e3';ctx.font='bold '+Math.min(i===0?96:60,(c.height-60)/lines.length*.63)+'px system-ui';ctx.fillText(lines[i]!,c.width/2,30+(i+.5)*(c.height-60)/lines.length,c.width-65);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);const m=new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide,toneMapped:false});materials.push(m);return mesh(p,new THREE.PlaneGeometry(w,h),m,x,y,z);}
 // Broad carpet, clear central approach, display banners flanking the entrance.
 box(root,20,.10,15,pavement,0,.09,17.5);box(root,4.5,.045,15,red,0,.17,17.5);
 for(const x of [-2.17,2.17])box(root,.10,.047,15,gold,x,.175,17.5);
 for(const side of [-1,1]){
  const x=side*7.4;
  box(root,5.8,4.5,.22,gold,x,4.4,12.3);
  sign(root,5.5,4.2,side===-1?['SELAMAT!','PERJALANAN HAJJI.DIGITAL','12 LEVEL · 12 BINTANG']:['GEDUNG OLEH-OLEH','PERAYAAN KELULUSAN','HADIAH PERJALANAN'],x,4.4,12.44);
  for(const dx of [-2.5,2.5]){pole(root,x+dx,12.3,6.9);solids.push({x:b.x+x+dx,z:b.z+12.3,w:.35,d:.35});}
  solids.push({x:b.x+x,z:b.z+12.3,w:5.8,d:.26});
 }
 const flags:THREE.Group[]=[];
 for(let i=0;i<8;i++){const side=i<4?-1:1,x=side*10.8,z=12+(i%4)*3.6;pole(root,x,z,7.6);solids.push({x:b.x+x,z:b.z+z,w:.35,d:.35});const flag=new THREE.Group();flag.position.set(x,5.7,z);root.add(flag);sign(flag,1.45,3.8,CELEBRATION_FLAGS[i%CELEBRATION_FLAGS.length]!.split('|'),side*.76,0,0,i%2?'#96334a':'#155341');flags.push(flag);}
 // Warm accent lights on the facade and a twelve-star ceremonial arch.
 for(let i=0;i<12;i++){const a=Math.PI*i/11;const star=new THREE.Shape();for(let j=0;j<10;j++){const r=j%2?.16:.34,t=Math.PI/2+j*Math.PI/5;if(j===0)star.moveTo(Math.cos(t)*r,Math.sin(t)*r);else star.lineTo(Math.cos(t)*r,Math.sin(t)*r);}star.closePath();mesh(root,new THREE.ShapeGeometry(star),gold,Math.cos(a)*4.5,7.5+Math.sin(a)*2.25,10.42);}
 for(const x of [-9,-5,5,9]){box(root,.12,8,.14,light,x,8.8,10.4);}
 // Red ribbon split into two panels. It opens only after guard approval; no collision in the aisle.
 const ribbonLeft=new THREE.Group(),ribbonRight=new THREE.Group();ribbonLeft.position.set(-2.65,1.05,13.4);ribbonRight.position.set(2.65,1.05,13.4);root.add(ribbonLeft,ribbonRight);
 box(ribbonLeft,2.65,.24,.055,red,1.325);box(ribbonRight,2.65,.24,.055,red,-1.325);
 for(const x of [-2.65,2.65]){pole(root,x,13.4,1.15);solids.push({x:b.x+x,z:b.z+13.4,w:.35,d:.35});}
 // Ceremonial scissors on a plinth beside the carpet.
 box(root,.85,.95,.65,emerald,-3.65,.5,14.9);box(root,.96,.1,.76,gold,-3.65,1.02,14.9);
 for(const side of [-1,1]){mesh(root,new THREE.TorusGeometry(.16,.035,8,16),gold,-3.65+side*.14,1.18,14.9);const blade=box(root,.07,.54,.06,white,-3.65+side*.1,1.48,14.9);blade.rotation.z=side*.28;}
 solids.push({x:b.x-3.65,z:b.z+14.9,w:.95,d:.8});
 const actors=celebrationGuests().map((g,i)=>{const actor=humanActor(scene,0x526b65,g.female,g.female?1.64:1.75,undefined,{registration:true,cull:true,palette:g.role==='press'?4:g.role==='committee'?9:i%10,build:.92+(i%4)*.055,brightness:1});actor.position.set(b.x+g.x,.15,b.z+g.z);actor.rotation.y=Math.atan2(-g.x,13.4-g.z);if(g.role==='press'){
  // Camera body, lens, shoulder strap; separate from the shared skinned avatar.
  box(actor,.30,.22,.23,black,.18,1.37,.22);const lens=mesh(actor,new THREE.CylinderGeometry(.085,.10,.22,12),dark,.18,1.37,.42);lens.rotation.x=Math.PI/2;box(actor,.15,.08,.07,light,.18,1.50,.26);sign(actor,.45,.15,['PRESS'],0,1.10,.17,'#27445b');
 }else if(g.role==='committee'){sign(actor,.36,.15,['PANITIA'],0,1.24,.18);}
 return {actor,g};});
 // Ground-level press equipment, arranged outside the pedestrian aisle.
 for(const side of [-1,1]){const x=side*5.2,z=16.5;const tripod=new THREE.Group();tripod.position.set(x,0,z);root.add(tripod);for(let j=0;j<3;j++){const a=j*2*Math.PI/3;const leg=box(tripod,.075,1.25,.075,dark,Math.cos(a)*.22,.62,Math.sin(a)*.22);leg.rotation.z=Math.cos(a)*.26;leg.rotation.x=-Math.sin(a)*.26;}box(tripod,.45,.28,.36,black,0,1.35,0);const lens=mesh(tripod,new THREE.CylinderGeometry(.13,.13,.27,12),glass,0,1.35,-.29);lens.rotation.x=Math.PI/2;solids.push({x:b.x+x,z:b.z+z,w:.75,d:.75});}
 const aircraft=new THREE.Group();aircraft.name='celebration-airliner';scene.add(aircraft);sphere(aircraft,.8,.85,5.2,white);sphere(aircraft,.65,.60,1.4,glass,0,.16,3.65);
 for(const side of [-1,1]){const wing=box(aircraft,5.5,.14,1.6,white,side*3.1,-.18,-.25);wing.rotation.y=side*.24;box(aircraft,1.9,.12,.85,white,side*1.2,.1,-4.1);const engine=mesh(aircraft,new THREE.CylinderGeometry(.43,.43,1.5,12),emerald,side*2.7,-.56,.2);engine.rotation.x=Math.PI/2;}
 const tail=box(aircraft,.16,2.3,1.35,emerald,0,1.25,-4.1);tail.rotation.x=-.22;
 const helicopters=Array.from({length:2},(_,i)=>{const h=new THREE.Group();h.name='celebration-helicopter-'+i;scene.add(h);sphere(h,1.05,.95,1.95,i?white:emerald);sphere(h,.85,.7,1.02,glass,0,.19,1.15);box(h,.30,.35,3.7,white,0,.25,-2.8);box(h,.16,1.1,.75,emerald,0,.68,-4.4);for(const x of [-.87,.87]){box(h,.10,.10,3.3,dark,x,-1.14,0);for(const z of [-.85,.85])box(h,.085,.5,.085,dark,x,-.86,z);}const rotor=new THREE.Group();rotor.position.y=1.16;h.add(rotor);box(rotor,6.8,.06,.22,dark);box(rotor,.22,.06,6.8,dark);sphere(h,.16,.16,.16,gold,0,1.19,0);const tailRotor=new THREE.Group();tailRotor.position.set(.17,.64,-4.5);h.add(tailRotor);box(tailRotor,.06,1.25,.11,dark);box(tailRotor,.06,.11,1.25,dark);return {h,rotor,tailRotor};});
 const pieces=new THREE.InstancedMesh(new THREE.PlaneGeometry(.14,.27),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),80);geometries.push(pieces.geometry);materials.push(pieces.material as THREE.Material);root.add(pieces);pieces.visible=false;for(let i=0;i<80;i++)pieces.setColorAt(i,new THREE.Color([0xe8bc62,0xf4eee2,0x2db283,0xd4546c][i%4]!));const dummy=new THREE.Object3D();
 let clock=0,cutAt=-100,cut=false;function celebrate(){if(cut)return;cut=true;cutAt=clock;}
 function update(hero:Point,dt:number,active:boolean){if(active)clock+=Math.max(0,Math.min(.08,dt));const distance=Math.hypot(hero.x-b.x,hero.z-b.z),near=distance<75;
  root.visible=distance<135;for(let i=0;i<flags.length;i++)flags[i]!.rotation.y=Math.sin(clock*1.7+i)*.18;
  const age=clock-cutAt,opened=cut?Math.min(1,Math.max(0,age/.7)):0;ribbonLeft.rotation.y=-opened*Math.PI*.5;ribbonRight.rotation.y=opened*Math.PI*.5;
  for(let i=0;i<actors.length;i++){const {actor,g}=actors[i]!;actor.visible=near&&(graphicsTier()!=='low'||i%2===0||g.role==='press');if(actor.visible){actor.rotation.y=Math.atan2((cut?hero.x:b.x)-actor.position.x,(cut?hero.z:b.z+13.4)-actor.position.z);if(cut&&g.role!=='press'&&i%3===0)actor.userData.campPose={clip:Clip.GUIDE_WAVE,phase:(clock*.65+i*.17)%1};}}
  const a=clock*.105;aircraft.position.set(b.x+Math.cos(a)*61,41+Math.sin(a*.8)*2,b.z+Math.sin(a)*36);aircraft.rotation.y=Math.atan2(-61*Math.sin(a),36*Math.cos(a));aircraft.rotation.z=.1;aircraft.visible=distance<160;
  for(let i=0;i<helicopters.length;i++){const {h,rotor,tailRotor}=helicopters[i]!,a=clock*.23+i*Math.PI;h.position.set(b.x+Math.cos(a)*(18+i*4),28+i*5+Math.sin(clock+i)*.75,b.z+Math.sin(a)*(13+i*3));h.rotation.y=Math.atan2(-Math.sin(a)*(18+i*4),Math.cos(a)*(13+i*3));rotor.rotation.y=clock*25;tailRotor.rotation.x=clock*32;h.visible=distance<145;}
  pieces.visible=cut&&age>=0&&age<4&&near&&graphicsTier()!=='low';if(pieces.visible){for(let i=0;i<80;i++){const a=i*2.399,life=age+i%7*.045;dummy.position.set(Math.cos(a)*life*(1+i%5*.3),Math.max(.2,2.1+life*(3+i%4*.4)-1.65*life*life),13.4+Math.sin(a)*life*(1+i%5*.3));dummy.rotation.set(life*2+i,life*3,i+life);dummy.updateMatrix();pieces.setMatrixAt(i,dummy.matrix);}pieces.instanceMatrix.needsUpdate=true;}
 }
 update({x:0,z:0},0,false);
 return {solids,update,celebrate,dispose(){root.removeFromParent();aircraft.removeFromParent();for(const h of helicopters)h.h.removeFromParent();for(const a of actors)a.actor.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
