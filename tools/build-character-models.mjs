/**
 * Original pilgrim avatars: generates two glTF 2.0 GLBs with Idle/Walk/Run.
 * All artwork is original procedural geometry; no third-party models or marks.
 * Run before Vite dev/build to populate public/assets/characters.
 */
import fs from 'node:fs';
import path from 'node:path';

const TARGET=path.resolve('public/assets/characters');
const TAU=Math.PI*2;
const palettes={
 male:{cloth:[.91,.88,.79],secondary:[.975,.965,.91],trim:[.70,.59,.39],skin:[.59,.39,.285],hair:[.17,.13,.11],shoe:[.77,.69,.56],shade:[.81,.78,.70]},
 female:{cloth:[.24,.48,.39],secondary:[.86,.84,.73],trim:[.72,.65,.43],skin:[.59,.39,.285],hair:[.19,.15,.13],shoe:[.29,.36,.30],shade:[.17,.36,.31]}
};
function vectorNorm(x,y,z){const d=Math.hypot(x,y,z)||1;return [x/d,y/d,z/d];}
function geometry(){return {position:[],normal:[],indices:[]};}
function pushVertex(g,p,n){const id=g.position.length/3;g.position.push(...p);g.normal.push(...n);return id;}
function sphere(segments=18,rings=12){
 const g=geometry();for(let j=0;j<=rings;j++){
  const v=j/rings,phi=Math.PI*v;for(let i=0;i<=segments;i++){
   const a=i/segments*TAU,dir=[Math.cos(a)*Math.sin(phi),Math.cos(phi),Math.sin(a)*Math.sin(phi)];pushVertex(g,dir,dir);
  }
 }
 for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
  const a=j*(segments+1)+i,b=a+segments+1;g.indices.push(a,b,a+1,b,b+1,a+1);
 }
 return g;
}
function cylinder(segments=20,folds=0){
 const g=geometry(),rows=4;
 for(let j=0;j<=rows;j++){
  const y=j/rows-.5;for(let i=0;i<=segments;i++){
   const a=i/segments*TAU,pleat=1+folds*Math.cos(8*a+3*y),r=pleat;
   const n=vectorNorm(Math.cos(a),0,Math.sin(a));pushVertex(g,[r*Math.cos(a),y,r*Math.sin(a)],n);
  }
 }
 for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){
  const a=j*(segments+1)+i,b=a+segments+1;g.indices.push(a,a+1,b,a+1,b+1,b);
 }
 return g;
}
function coneFrustum(top=.65,bottom=1,segments=24,folds=.035){
 const g=geometry(),rows=5;
 for(let j=0;j<=rows;j++){
  const t=j/rows,r0=bottom+(top-bottom)*t,y=t-.5;
  for(let i=0;i<=segments;i++){
   const a=i/segments*TAU,pleat=1+folds*Math.cos(a*9+t*5),r=r0*pleat;
   const n=vectorNorm(Math.cos(a),bottom-top,Math.sin(a));pushVertex(g,[Math.cos(a)*r,y,Math.sin(a)*r],n);
  }
 }
 for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){
  const a=j*(segments+1)+i,b=a+segments+1;g.indices.push(a,a+1,b,a+1,b+1,b);
 }
 return g;
}
function box(){const g=geometry();
 const faces=[[[1,0,0],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]],
 [[-1,0,0],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]],
 [[0,1,0],[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]],
 [[0,-1,0],[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]],
 [[0,0,1],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,.5]],
 [[0,0,-1],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,-.5,-.5]]];
 for(const face of faces){const start=g.position.length/3;for(let k=1;k<=4;k++)pushVertex(g,face[k],face[0]);g.indices.push(start,start+1,start+2,start,start+2,start+3);}
 return g;
}
function packBuffer(list,buf){const data=Buffer.isBuffer(buf)?buf:Buffer.from(buf.buffer,buf.byteOffset||0,buf.byteLength);const offset=list.length?list[list.length-1].offset+list[list.length-1].buffer.length:0;
 const padding=(4-data.length%4)%4;list.push({buffer:padding?Buffer.concat([data,Buffer.alloc(padding)]):data,offset});return {byteOffset:offset,byteLength:data.length};}
function buildAvatar(sex){
 const pal=palettes[sex],buffers=[],bufferViews=[],accessors=[],materials=[],meshDefs=[],nodes=[],roots=[];
 const color=(name,rgb)=>{const id=materials.length;materials.push({name,pbrMetallicRoughness:{baseColorFactor:[...rgb,1],metallicFactor:0,roughnessFactor:.79},doubleSided:true});return id;};
 const colors={};for(const [key,value] of Object.entries(pal))colors[key]=color(key,value);
 colors.eyes=color('eyes',[.075,.065,.06]);colors.lips=color('lips',[.40,.26,.23]);colors.gold=color('pin',[.81,.64,.28]);
 function access(arr,type,componentType=5126,target=null,limits=false){let b;
  if(componentType===5126){b=Buffer.alloc(arr.length*4);arr.forEach((x,i)=>b.writeFloatLE(x,i*4));}
  else if(componentType===5123){b=Buffer.alloc(arr.length*2);arr.forEach((x,i)=>b.writeUInt16LE(x,i*2));}
  else {b=Buffer.alloc(arr.length*4);arr.forEach((x,i)=>b.writeUInt32LE(x,i*4));}
  const view=packBuffer(buffers,b),viewIndex=bufferViews.push({buffer:0,...view,...(target?{target}:{})})-1;
  const components={SCALAR:1,VEC3:3,VEC4:4}[type];const acc={bufferView:viewIndex,componentType,count:arr.length/components,type};
  if(limits){acc.min=Array(components).fill(Infinity);acc.max=Array(components).fill(-Infinity);for(let i=0;i<arr.length;i++){const k=i%components;acc.min[k]=Math.min(acc.min[k],arr[i]);acc.max[k]=Math.max(acc.max[k],arr[i]);}}
  return accessors.push(acc)-1;
 }
 const meshes=new Map();
 function meshFor(geo,material,name){const key=JSON.stringify({name,material});if(meshes.has(key))return meshes.get(key);
  const pos=access(geo.position,'VEC3',5126,34962,true),normal=access(geo.normal,'VEC3',5126,34962),indices=access(geo.indices,'SCALAR',5123,34963);
  const id=meshDefs.push({name,primitives:[{attributes:{POSITION:pos,NORMAL:normal},indices,material,mode:4}]})-1;
  meshes.set(key,id);return id;
 }
 function node(name,parent=null,opts={}){const n={name,...opts};const id=nodes.push(n)-1;
  if(parent===null)roots.push(id);else {nodes[parent].children??=[];nodes[parent].children.push(id);}return id;
 }
 function shape(name,geo,col,pos,scale,parent,extra={}){return node(name,parent,{mesh:meshFor(geo,colors[col],name),translation:pos,scale,...extra});}
 const root=node('PilgrimRoot');const body=node('Body',root);
 const headPivot=node('Head',body,{translation:[0,1.98,0]});
 shape('Neck',cylinder(),'skin',[0,1.79,0],[.12,.17,.13],body);
 shape('Face',sphere(),'skin',[0,.08,.045],[.26,.315,.25],headPivot);
 for(const side of [-1,1]){
  shape('Eyeball'+side,sphere(12,8),'eyes',[side*.091,.13,.259],[.034,.034,.021],headPivot);
  shape('Eyebrow'+side,box(),'hair',[side*.09,.199,.254],[.095,.024,.022],headPivot);
 }
 shape('Nose',sphere(12,8),'skin',[0,.065,.302],[.048,.092,.075],headPivot);
 shape('Mouth',box(),'lips',[0,-.075,.278],[.098,.018,.022],headPivot);
 if(sex==='male'){
  shape('Kufi',sphere(18,10),'secondary',[0,.314,0],[.278,.113,.273],headPivot);
  shape('KufiRim',cylinder(18),'shade',[0,.272,0],[.281,.033,.277],headPivot);
  shape('WaistIhram',coneFrustum(.82,1,22,.045),'secondary',[0,.84,0],[.53,1.27,.47],body);
  shape('UpperIhram',coneFrustum(.86,.98,22,.018),'cloth',[0,1.52,-.016],[.46,.68,.42],body);
  shape('ShoulderDrape',box(),'secondary',[-.12,1.59,.38],[.61,.15,.12],body);
  shape('ChestFold',box(),'shade',[.13,1.49,.418],[.14,.59,.048],body,{rotation:[0,0,.14,.99]});
  shape('WaistTie',cylinder(22),'shade',[0,1.17,0],[.45,.08,.43],body);
 }else{
  shape('RobeSkirt',coneFrustum(.61,1,24,.055),'cloth',[0,.86,0],[.68,1.38,.58],body);
  shape('RobeTorso',coneFrustum(.83,1.0,20,.018),'cloth',[0,1.53,0],[.46,.79,.41],body);
  shape('HeadscarfBack',sphere(18,12),'secondary',[0,.055,-.19],[.325,.44,.29],headPivot);
  shape('HeadscarfTop',sphere(18,10),'secondary',[0,.321,-.05],[.325,.145,.31],headPivot);
  shape('ScarfChest',coneFrustum(.56,1,18,.03),'secondary',[0,1.55,.17],[.46,.7,.34],body);
  shape('ScarfPin',sphere(10,7),'gold',[.26,.19,.18],[.042,.05,.03],headPivot);
 }
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const arm=node(side===-1?'LeftArm':'RightArm',body,{translation:[side*.44,1.61,.015]});arms.push(arm);
  shape('Sleeve'+side,coneFrustum(.81,1,16,.016),'cloth',[side*.055,-.3,0],[.205,.65,.205],arm);
  shape('Wrist'+side,cylinder(12),'skin',[side*.08,-.605,.013],[.125,.16,.118],arm);
  shape('Palm'+side,sphere(14,9),'skin',[side*.1,-.74,.025],[.13,.19,.098],arm);
  for(let i=0;i<3;i++)shape('Finger'+side+'-'+i,cylinder(8),'skin',[side*.105+(i-1)*.047,-.87,.092],[.026,.16,.028],arm);
  const leg=node(side===-1?'LeftLeg':'RightLeg',body,{translation:[side*.185,.71,0]});legs.push(leg);
  shape('Pants'+side,cylinder(16),'shade',[0,-.29,0],[.155,.62,.159],leg);
  shape('Sandals'+side,sphere(14,8),'shoe',[0,-.64,.1],[.18,.105,.29],leg);
 }
 if(sex==='female')for(const side of [-1,1])shape('RobeSeam'+side,box(),'shade',[side*.41,.75,.34],[.024,.58,.02],body);
 const animations=[];
 const axisRot=angle=>[Math.sin(angle/2),0,0,Math.cos(angle/2)];
 function clip(name,duration,strength){
  const times=[0,.25,.5,.75,1].map(t=>t*duration),input=access(times,'SCALAR',5126,null,true);
  const samplers=[],channels=[];
  function rot(joint,angles){const output=access(angles.flatMap(axisRot),'VEC4');samplers.push({input,output,interpolation:'LINEAR'});channels.push({sampler:samplers.length-1,target:{node:joint,path:'rotation'}});}
  for(let i=0;i<2;i++){const sign=i===0?1:-1;const waves=[0,1,0,-1,0].map(v=>v*strength*sign);
   rot(arms[i],waves.map(v=>-v*.78));rot(legs[i],waves);
  }
  rot(headPivot,[.018,.028,.018,.007,.018].map(v=>v*(name==='Idle'?1:.45)));
  animations.push({name,samplers,channels});
 }
 clip('Idle',2.4,.025);clip('Walk',1.05,.48);clip('Run',.68,.7);
 const bin=Buffer.concat(buffers.map(x=>x.buffer));
 const gltf={asset:{version:'2.0',generator:'MANASIK Adventure original pilgrim avatar builder v4'},scene:0,scenes:[{nodes:roots}],nodes,meshes:meshDefs,materials,animations,accessors,bufferViews,buffers:[{byteLength:bin.length}]};
 const json=Buffer.from(JSON.stringify(gltf),'utf8'),pad=(4-json.length%4)%4,jsonChunk=Buffer.concat([json,Buffer.alloc(pad,0x20)]);
 const binPad=(4-bin.length%4)%4,binChunk=Buffer.concat([bin,Buffer.alloc(binPad)]);
 const glb=Buffer.alloc(12+8+jsonChunk.length+8+binChunk.length);glb.writeUInt32LE(0x46546c67,0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);
 glb.writeUInt32LE(jsonChunk.length,12);glb.writeUInt32LE(0x4e4f534a,16);jsonChunk.copy(glb,20);
 const off=20+jsonChunk.length;glb.writeUInt32LE(binChunk.length,off);glb.writeUInt32LE(0x004e4942,off+4);binChunk.copy(glb,off+8);
 return {glb,gltf};
}
fs.mkdirSync(TARGET,{recursive:true});
for(const sex of ['male','female']){
 const {glb,gltf}=buildAvatar(sex);const file=path.join(TARGET,'pilgrim-'+sex+'.glb');fs.writeFileSync(file,glb);
 console.log('generated',path.relative(process.cwd(),file),glb.length,'bytes',gltf.meshes.length,'meshes',gltf.animations.map(x=>x.name).join('/'));
}
