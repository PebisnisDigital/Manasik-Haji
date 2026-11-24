import * as THREE from 'three';
import {buildCharacterMesh,type CharacterVariant} from './CharacterMesh.ts';
import {BONES} from './Rig.ts';
import {readLook,playerVariant} from './playerAppearance.ts';

const jointPosition=new THREE.Vector3(),handPosition=new THREE.Vector3(),direction=new THREE.Vector3(),desired=new THREE.Vector3();
const parentRotation=new THREE.Quaternion(),turn=new THREE.Quaternion(),localTurn=new THREE.Quaternion();
/** Keep the attendant's actual hand on the tool instead of gesturing beside it. */
function reach(mesh:THREE.SkinnedMesh,bones:THREE.Bone[],target:THREE.Vector3,passes=8){
 for(let pass=0;pass<passes;pass++)for(const index of [11,10]){
  mesh.updateWorldMatrix(true,true);const joint=bones[index];joint.getWorldPosition(jointPosition);bones[12].getWorldPosition(handPosition);
  direction.copy(handPosition).sub(jointPosition).normalize();desired.copy(target).sub(jointPosition).normalize();turn.setFromUnitVectors(direction,desired);
  joint.parent!.getWorldQuaternion(parentRotation);localTurn.copy(parentRotation).invert().multiply(turn).multiply(parentRotation);joint.quaternion.premultiply(localTurn).normalize();
 }
}

/** The project's existing body/face geometry, with a live skeleton for the close-up action. */
function actor(variant:CharacterVariant,female:boolean,staff=false,lod=0,skinColor?:number){
 const data=buildCharacterMesh(lod,variant),g=new THREE.BufferGeometry();g.setIndex(new THREE.BufferAttribute(data.index,1));g.setAttribute('position',new THREE.BufferAttribute(data.position,3));g.setAttribute('normal',new THREE.BufferAttribute(data.normal,3));
 const indices=new Uint16Array(data.vertexCount*4),weights=new Float32Array(data.vertexCount*4),colors=new Float32Array(data.vertexCount*3);
 const garment=new THREE.Color(staff?0x617c78:female?0x3a4148:0xf4f1e8),cover=new THREE.Color(female?0x454c52:0xf8f6f0),skin=new THREE.Color(skinColor??(female?0xb98d66:0xc59d78));
 for(let i=0;i<data.vertexCount;i++){indices[i*4]=data.skinIndex[i*2];indices[i*4+1]=data.skinIndex[i*2+1];weights[i*4]=data.skinWeight[i*2];weights[i*4+1]=data.skinWeight[i*2+1];const z=data.zone[i],c=z>6.5?new THREE.Color(.055,.085,.095):z>5.5?skin.clone().multiply(new THREE.Color(.72,.46,.43)):z>4.5?new THREE.Color(.78,.76,.71):z>3.5?new THREE.Color(.032,.022,.017):z>2.5?garment.clone().multiplyScalar(.66):z>1.5?cover:z>.5?skin:garment;colors.set([c.r,c.g,c.b],i*3);}
 g.setAttribute('skinIndex',new THREE.BufferAttribute(indices,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));g.setAttribute('color',new THREE.BufferAttribute(colors,3));
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85}));const bones=BONES.map(b=>{const n=new THREE.Bone();n.name=b.name;n.position.fromArray(b.offset);return n;});BONES.forEach((b,i)=>{if(b.parent>=0)bones[b.parent].add(bones[i]);});mesh.add(bones[0]);mesh.bind(new THREE.Skeleton(bones));mesh.frustumCulled=false;mesh.scale.setScalar(female?1.64:1.74);return {mesh,bones};
}
export class TahallulAction{
 readonly group=new THREE.Group();readonly customer;readonly barber;
 private hair:THREE.Mesh[]=[];private tool=new THREE.Group();private blades:THREE.Mesh[]=[];private clippings:THREE.Mesh[]=[];
 private handTarget=new THREE.Vector3();
 private cape:THREE.Mesh|null=null;
 private readonly bald:boolean;
 private readonly hairLength:number;
 constructor(readonly avatar:'male'|'female',readonly method:'shave'|'trim',cuts:number,private options:{ambient?:boolean;skin?:number}={}){
  this.bald=!options.ambient&&readLook().hair==='shaved';this.hairLength=!options.ambient&&readLook().hair==='trimmed'?.047:.065;
  const female=avatar==='female';this.group.name='tahallul-live-haircut';this.tool.name='haircut-tool';
  this.customer=actor(options.ambient?{robeLength:female?.065:.19,coverHead:female,pilgrimStyle:avatar,hair:'shaved'}:{...playerVariant(avatar),hair:'shaved'},female,false,options.ambient?1:0,options.skin);this.barber=actor({robeLength:.49,coverHead:female,pilgrimStyle:avatar,casual:!female,hair:'natural'},female,true,options.ambient?1:0,options.skin);
  this.group.add(this.customer.mesh,this.barber.mesh);
  this.customer.bones[0].position.y-=.28;for(const i of [13,16])this.customer.bones[i].rotation.x=-1.45;for(const i of [14,17])this.customer.bones[i].rotation.x=1.45;for(const i of [6,10])this.customer.bones[i].rotation.x=-.35;for(const i of [7,11])this.customer.bones[i].rotation.x=-.8;
  const head=this.customer.bones[4];
  if(!female&&!this.bald){for(let i=0;i<3;i++){const h=new THREE.Mesh(new THREE.SphereGeometry(1,12,8,i*Math.PI*2/3,Math.PI*2/3,0,Math.PI*.52),new THREE.MeshStandardMaterial({color:0x231d17,roughness:1}));h.scale.set(.0505,.065,.0545);h.position.y=.928-.93;head.add(h);this.hair.push(h);}}
  const steel=new THREE.MeshStandardMaterial({color:0xcbd5d6,metalness:.7,roughness:.3}),dark=new THREE.MeshStandardMaterial({color:0x243c35,roughness:.7});
  if(method==='shave'&&!female){const body=new THREE.Mesh(new THREE.BoxGeometry(.09,.19,.065),dark);this.tool.add(body);const teeth=new THREE.Mesh(new THREE.BoxGeometry(.105,.035,.08),steel);teeth.position.y=.105;this.tool.add(teeth);}else{for(const side of [-1,1]){const blade=new THREE.Mesh(new THREE.BoxGeometry(.018,.25,.016),steel);blade.position.y=.06;this.tool.add(blade);this.blades.push(blade);const ring=new THREE.Mesh(new THREE.TorusGeometry(.035,.008,5,12),dark);ring.position.set(side*.035,-.11,0);this.tool.add(ring);}}
  this.group.add(this.tool);this.tool.visible=false;
  // Female ends stay under the opaque privacy cape; the attendant/tool move behind it.
  if(female){this.cape=new THREE.Mesh(new THREE.BoxGeometry(.61,.58,.08),new THREE.MeshStandardMaterial({color:0x454c52,roughness:1}));this.cape.position.set(0,.99,-.12);this.group.add(this.cape);}
  for(let i=0;i<(options.ambient?0:12);i++){const h=new THREE.Mesh(new THREE.BoxGeometry(.014,.045,.012),dark);h.visible=false;this.group.add(h);this.clippings.push(h);}
  this.update(cuts,0,false);
 }
 poseCustomer(seated:number,offset=0,visible=true){this.customer.mesh.visible=visible;this.customer.mesh.position.z=offset;this.customer.bones[0].position.y=.53-.28*seated;for(const i of [13,16])this.customer.bones[i].rotation.x=-1.45*seated;for(const i of [14,17])this.customer.bones[i].rotation.x=1.45*seated;if(this.cape){this.cape.visible=visible;this.cape.position.set(0,.99+(1-seated)*.28*1.64,-.12+offset);}}
 update(cuts:number,t:number,busy:boolean){
  const female=this.avatar==='female',angle=female?Math.PI:Math.PI/3+Math.min(2,cuts)*Math.PI*2/3;
  this.barber.mesh.position.set(Math.sin(angle)*.48,0,Math.cos(angle)*.48);this.barber.mesh.rotation.y=angle+Math.PI;
  const arm=this.barber.bones[10],forearm=this.barber.bones[11];arm.rotation.set(busy?-1.2+Math.sin(t*16)*.13:-.3,0,-.1);forearm.rotation.set(busy?-.65:-.3,0,0);
  this.tool.visible=busy;const sweep=Math.sin(t*Math.PI*3),rad=.12+(.025*(1-t));this.tool.position.set(Math.sin(angle)*rad,1.17+Math.sin(t*Math.PI)*.055,Math.cos(angle)*rad);this.tool.rotation.set(.3+sweep*.15,angle,Math.PI/2+sweep*.18);
  if(busy){this.group.updateWorldMatrix(true,true);this.handTarget.copy(this.tool.position);this.group.localToWorld(this.handTarget);reach(this.barber.mesh,this.barber.bones,this.handTarget,this.options.ambient?4:8);}
  this.blades.forEach((b,i)=>b.rotation.z=(i?1:-1)*(.12+Math.abs(Math.sin(t*22))*.3));
  this.hair.forEach((h,i)=>{const done=i<cuts,partial=i===cuts&&busy?t:0;if(this.method==='shave'){h.visible=!done&&partial<.96;h.scale.y=this.hairLength*(1-partial*.13);}else{h.visible=true;const shorter=this.hairLength*.73;h.scale.y=done?shorter:this.hairLength-(this.hairLength-shorter)*partial;}});
  this.clippings.forEach((h,i)=>{h.visible=busy&&!female&&!this.bald&&t>.18;const fall=(t*2+i/12)%1;h.position.set(Math.sin(angle)*.12+(i%3-.9)*.045,1.18-fall*.9,Math.cos(angle)*.12+(i%4-1.5)*.035);h.rotation.z=fall*4;});
 }
 dispose(){this.group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());if(o instanceof THREE.SkinnedMesh)o.skeleton.dispose();}});this.group.removeFromParent();}
}
