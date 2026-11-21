/**
 * Original pilgrim avatars: generates two glTF 2.0 GLBs with Idle/Walk/Run.
 * All artwork is original procedural geometry; no third-party models or marks.
 * Run before Vite dev/build to populate public/assets/characters.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const TARGET=path.resolve('public/assets/characters');
const TAU=Math.PI*2;
const palettes={
 male:{cloth:[.91,.88,.79],secondary:[.975,.965,.91],trim:[.70,.59,.39],skin:[.59,.39,.285],hair:[.17,.13,.11],shoe:[.77,.69,.56],shade:[.81,.78,.70]},
 female:{cloth:[.24,.48,.39],secondary:[.86,.84,.73],trim:[.72,.65,.43],skin:[.59,.39,.285],hair:[.19,.15,.13],shoe:[.29,.36,.30],shade:[.17,.36,.31]}
};
function vectorNorm(x,y,z){const d=Math.hypot(x,y,z)||1;return [x/d,y/d,z/d];}
function geometry(){return {position:[],normal:[],uv:[],indices:[]};}
function pushVertex(g,p,n,uv=[0,0]){const id=g.position.length/3;g.position.push(...p);g.normal.push(...n);g.uv.push(...uv);return id;}
function sphere(segments=18,rings=12){
 const g=geometry();for(let j=0;j<=rings;j++){
  const v=j/rings,phi=Math.PI*v;for(let i=0;i<=segments;i++){
   const a=i/segments*TAU,dir=[Math.cos(a)*Math.sin(phi),Math.cos(phi),Math.sin(a)*Math.sin(phi)];pushVertex(g,dir,dir,[i/segments,1-v]);
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
   const n=vectorNorm(Math.cos(a),0,Math.sin(a));pushVertex(g,[r*Math.cos(a),y,r*Math.sin(a)],n,[i/segments,j/rows]);
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
   const n=vectorNorm(Math.cos(a),bottom-top,Math.sin(a));pushVertex(g,[Math.cos(a)*r,y,Math.sin(a)*r],n,[i/segments,t]);
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
 for(const face of faces){const start=g.position.length/3;for(let k=1;k<=4;k++)pushVertex(g,face[k],face[0],[[0,0],[0,1],[1,1],[1,0]][k-1]);g.indices.push(start,start+1,start+2,start,start+2,start+3);}
 return g;
}
function packBuffer(list,buf){const data=Buffer.isBuffer(buf)?buf:Buffer.from(buf.buffer,buf.byteOffset||0,buf.byteLength);const offset=list.length?list[list.length-1].offset+list[list.length-1].buffer.length:0;
 const padding=(4-data.length%4)%4;list.push({buffer:padding?Buffer.concat([data,Buffer.alloc(padding)]):data,offset});return {byteOffset:offset,byteLength:data.length};}
// Tiny deterministic PNG encoder. No canvas or external image dependency in Node/Vercel.
const UINT32=0xffffffff;
function crc32(buf){
 let c=UINT32;for(const b of buf){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}
 return (c^UINT32)>>>0;
}
function pngChunk(tag,data){
 const out=Buffer.allocUnsafe(12+data.length);out.writeUInt32BE(data.length,0);out.write(tag,4,'ascii');
 data.copy(out,8);out.writeUInt32BE(crc32(out.subarray(4,8+data.length)),8+data.length);return out;
}
const pixelNoise=(x,y,seed=0)=>{
 const a=Math.sin(x*73.13+y*113.7+seed*27.3)*43758.5453;return (a-Math.floor(a))*2-1;
};
function paintTexture(type,sex,width=128,height=128){
 const scanline=Buffer.alloc(height*(1+width*4)),cloth=type==='cloth',normal=type==='weave-normal';
 for(let y=0;y<height;y++){
  const row=y*(1+width*4);scanline[row]=0;
  for(let x=0;x<width;x++){
   const i=row+1+x*4,n=pixelNoise(x,y,type.length),wave=Math.sin(x*Math.PI*.5)*Math.sin(y*Math.PI*.5);
   const warp=Math.sin(x*Math.PI/2)*.45+Math.cos(y*Math.PI/2)*.36;
   let r,g,b;
   if(normal){
    const xx=Math.round(128+Math.sin(x*Math.PI/2)*11),yy=Math.round(128+Math.cos(y*Math.PI/2)*11);
    r=xx;g=yy;b=254;
   }else if(cloth){
    const thread=warp*6+n*4,crease=Math.cos(x*Math.PI/16)*2;
    const value=Math.max(208,Math.min(252,233+thread+crease));
    r=value;g=value;b=Math.min(255,value+1);
   }else{
    const pore=n*6+Math.sin(x*.72+y*.23)*1.7+Math.cos(y*.41)*1.3;
    const value=Math.max(219,Math.min(254,240+pore));
    r=value;g=Math.max(0,value-2);b=Math.max(0,value-5);
   }
   scanline[i]=r;scanline[i+1]=g;scanline[i+2]=b;scanline[i+3]=255;
  }
 }
 const hdr=Buffer.alloc(13);hdr.writeUInt32BE(width,0);hdr.writeUInt32BE(height,4);hdr[8]=8;hdr[9]=6;
 const sig=Buffer.from([137,80,78,71,13,10,26,10]);
 return Buffer.concat([sig,pngChunk('IHDR',hdr),pngChunk('IDAT',zlib.deflateSync(scanline,{level:9})),pngChunk('IEND',Buffer.alloc(0))]);
}

function buildAvatar(sex){
 const pal=palettes[sex],buffers=[],bufferViews=[],accessors=[],materials=[],meshDefs=[],nodes=[],roots=[],images=[],textures=[],samplers=[];
 const color=(name,rgb)=>{const id=materials.length;materials.push({name,pbrMetallicRoughness:{baseColorFactor:[...rgb,1],metallicFactor:0,roughnessFactor:.79},doubleSided:true});return id;};
 const colors={};for(const [key,value] of Object.entries(pal))colors[key]=color(key,value);
 colors.eyes=color('iris',[.10,.09,.08]);colors.whites=color('eye white',[.91,.87,.83]);colors.lips=color('natural lips',[.43,.29,.26]);colors.gold=color('scarf pin',[.81,.64,.28]);colors.skinShade=color('skin contour',[.52,.33,.25]);colors.skinLight=color('skin highlights',[.66,.46,.35]);colors.clothLight=color('weave highlight',sex==='male'?[.98,.97,.94]:[.32,.57,.47]);colors.clothDark=color('weave shadow',sex==='male'?[.75,.74,.68]:[.17,.36,.29]);colors.sole=color('sandal sole',[.25,.23,.20]);colors.strap=color('sandal strap',[.54,.46,.33]);

 // Packed PNGs live in GLB BIN. All texture coordinates are part of geometry.
 const sampler=samplers.push({magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497})-1;
 function embeddedTexture(name,kind){
  const blob=paintTexture(kind,sex),v=packBuffer(buffers,blob);
  const img=images.push({name,mimeType:'image/png',bufferView:bufferViews.push({buffer:0,...v})-1})-1;
  return textures.push({name,sampler,source:img})-1;
 }
 const clothMap=embeddedTexture('fine woven fabric','cloth');
 const skinMap=embeddedTexture('subtle skin surface','skin');
 const weaveNormal=embeddedTexture('fabric micro-normal','weave-normal');
 for(const material of materials){
  const name=material.name;
  const fabric=['cloth','secondary','shade','clothLight','clothDark'].includes(name);
  const skin=['skin','skinShade','skinLight'].includes(name);
  if(fabric){
   material.pbrMetallicRoughness.baseColorTexture={index:clothMap};
   material.pbrMetallicRoughness.roughnessFactor=.93;
   material.normalTexture={index:weaveNormal,scale:.22};
  }else if(skin){
   material.pbrMetallicRoughness.baseColorTexture={index:skinMap};
   material.pbrMetallicRoughness.roughnessFactor=.83;
  }
 }

 function access(arr,type,componentType=5126,target=null,limits=false){let b;
  if(componentType===5126){b=Buffer.alloc(arr.length*4);arr.forEach((x,i)=>b.writeFloatLE(x,i*4));}
  else if(componentType===5123){b=Buffer.alloc(arr.length*2);arr.forEach((x,i)=>b.writeUInt16LE(x,i*2));}
  else {b=Buffer.alloc(arr.length*4);arr.forEach((x,i)=>b.writeUInt32LE(x,i*4));}
  const view=packBuffer(buffers,b),viewIndex=bufferViews.push({buffer:0,...view,...(target?{target}:{})})-1;
  const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[type];const acc={bufferView:viewIndex,componentType,count:arr.length/components,type};
  if(limits){acc.min=Array(components).fill(Infinity);acc.max=Array(components).fill(-Infinity);for(let i=0;i<arr.length;i++){const k=i%components;acc.min[k]=Math.min(acc.min[k],arr[i]);acc.max[k]=Math.max(acc.max[k],arr[i]);}}
  return accessors.push(acc)-1;
 }
 const meshes=new Map();
 function meshFor(geo,material,name){const key=JSON.stringify({name,material});if(meshes.has(key))return meshes.get(key);
  const pos=access(geo.position,'VEC3',5126,34962,true),normal=access(geo.normal,'VEC3',5126,34962),uv=access(geo.uv,'VEC2',5126,34962),indices=access(geo.indices,'SCALAR',5123,34963);
  const id=meshDefs.push({name,primitives:[{attributes:{POSITION:pos,NORMAL:normal,TEXCOORD_0:uv},indices,material,mode:4}]})-1;
  meshes.set(key,id);return id;
 }
 function node(name,parent=null,opts={}){const n={name,...opts};const id=nodes.push(n)-1;
  if(parent===null)roots.push(id);else {nodes[parent].children??=[];nodes[parent].children.push(id);}return id;
 }
 function shape(name,geo,col,pos,scale,parent,extra={}){return node(name,parent,{mesh:meshFor(geo,colors[col],name),translation:pos,scale,...extra});}
 const root=node('PilgrimRoot');const body=node('Body',root);
 const headPivot=node('Head',body,{translation:[0,1.965,.015]});
 shape('Neck',cylinder(),'skin',[0,1.79,0],[.12,.17,.13],body);
 shape('Face',sphere(28,20),'skin',[0,.055,.048],[.248,.297,.252],headPivot);
 shape('Jaw',sphere(16,12),'skin',[0,-.14,.095],[.174,.126,.187],headPivot);
 for(const side of [-1,1]){
  shape('Ear'+side,sphere(14,10),'skinShade',[side*.243,.005,.05],[.068,.105,.064],headPivot);
  shape('EarInner'+side,sphere(12,8),'skin',[side*.279,.007,.096],[.033,.052,.034],headPivot);
  shape('EyeWhite'+side,sphere(16,12),'whites',[side*.092,.133,.274],[.053,.035,.027],headPivot);
  shape('Iris'+side,sphere(14,10),'eyes',[side*.092,.133,.296],[.024,.024,.011],headPivot);
  shape('Cheek'+side,sphere(12,8),'skinLight',[side*.155,-.038,.221],[.04,.035,.012],headPivot);
  shape('Eyebrow'+side,box(),'hair',[side*.09,.199,.254],[.095,.024,.022],headPivot);
 }
 shape('NoseBridge',sphere(15,10),'skin',[0,.08,.277],[.041,.103,.056],headPivot);
 shape('NoseTip',sphere(14,9),'skinShade',[0,-.011,.326],[.066,.042,.046],headPivot);
 shape('UpperLip',sphere(12,8),'lips',[0,-.102,.276],[.088,.014,.026],headPivot);
 shape('LowerLip',sphere(12,8),'lips',[0,-.121,.274],[.072,.014,.024],headPivot);
 if(sex==='male'){
  // Ihram: two unstitched cloths, uncovered head, bare arms and no trousers.
  shape('NaturalShortHair',sphere(24,14),'hair',[0,.309,-.013],[.251,.101,.246],headPivot);
  for(let i=0;i<8;i++){const a=(i-3.5)*.058;shape('Hairline'+i,sphere(9,7),'hair',[a,.268,.211-Math.abs(a)*.26],[.047,.036,.034],headPivot);}
  shape('LowerIzar',coneFrustum(.79,1,30,.065),'secondary',[0,.8,0],[.52,1.29,.47],body);
  shape('UpperIzarFold',coneFrustum(.87,.99,28,.041),'cloth',[0,.87,.014],[.508,1.11,.467],body);
  shape('IzarWaistFold',cylinder(24,.022),'clothLight',[0,1.19,0],[.459,.075,.435],body);
  shape('RidaWrappedTorso',coneFrustum(.85,.98,28,.034),'cloth',[0,1.495,-.014],[.46,.65,.422],body);
  shape('RidaUpperShoulder',box(),'secondary',[-.15,1.72,.18],[.64,.22,.49],body,{rotation:[0,0,-.065,.998]});
  shape('RidaHangingEnd',box(),'secondary',[-.30,1.43,.444],[.19,.58,.059],body,{rotation:[0,0,-.056,.998]});
  for(let i=-3;i<=3;i++){
   const v=Math.abs(i)/3,x=i*.12;
   shape('IzarPleat'+i,box(),i%2?'clothLight':'shade',[x,.64,.448+(1-v)*.04],[.019,.64-v*.13,.022],body);
  }
  for(let i=0;i<4;i++)shape('RidaWovenFold'+i,box(),'clothLight',[-.33+i*.11,1.61-i*.033,.429],[.018,.36,.018],body,{rotation:[0,0,.13,.991]});
 }else{
  // Modest robe and face-framing hijab, face not veiled.
  shape('RobeSkirt',coneFrustum(.59,1,30,.071),'cloth',[0,.825,0],[.678,1.37,.585],body);
  shape('RobeTorso',coneFrustum(.81,1.0,27,.033),'cloth',[0,1.52,0],[.455,.80,.411],body);
  shape('RobeBeltFold',cylinder(24,.018),'clothDark',[0,1.21,0],[.441,.085,.41],body);
  shape('HeadscarfBack',sphere(24,16),'secondary',[0,.05,-.19],[.333,.44,.29],headPivot);
  shape('HeadscarfTop',sphere(24,14),'secondary',[0,.318,-.041],[.331,.155,.312],headPivot);
  for(const side of [-1,1]){
   shape('HijabSide'+side,coneFrustum(.72,.84,16,.014),'secondary',[side*.252,.07,-.055],[.139,.43,.229],headPivot);
   shape('HijabEdge'+side,box(),'clothLight',[side*.225,.09,.185],[.028,.37,.022],headPivot);
  }
  shape('ScarfChest',coneFrustum(.56,1,22,.033),'secondary',[0,1.54,.17],[.46,.70,.345],body);
  shape('ScarfPin',sphere(12,9),'gold',[.259,.185,.178],[.044,.05,.032],headPivot);
  for(let i=-4;i<=4;i++){
   const v=Math.abs(i)/4;
   shape('RobePleat'+i,box(),i%2?'clothDark':'clothLight',[i*.124,.59,.525+(1-v)*.033],[.016,.62-v*.19,.016],body);
  }
 }
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const arm=node(side===-1?'LeftArm':'RightArm',body,{translation:[side*.44,1.61,.015]});arms.push(arm);
  if(sex==='male'){
    shape('BareArm'+side,coneFrustum(.83,1,18,.017),'skin',[side*.045,-.30,0],[.17,.63,.16],arm);
    shape('Elbow'+side,sphere(12,9),'skinLight',[side*.05,-.449,.044],[.116,.095,.086],arm);
  }else{
    shape('LongSleeve'+side,coneFrustum(.8,1,18,.035),'cloth',[side*.055,-.3,0],[.205,.65,.205],arm);
    shape('SleeveCuff'+side,cylinder(14),'clothDark',[side*.08,-.59,0],[.159,.059,.16],arm);
  }
  shape('Wrist'+side,cylinder(12),'skin',[side*.08,-.605,.013],[.125,.16,.118],arm);
  shape('Palm'+side,sphere(14,9),'skin',[side*.1,-.74,.025],[.13,.19,.098],arm);
  for(let i=0;i<4;i++)shape('Finger'+side+'-'+i,cylinder(8),'skin',[side*.105+(i-1.5)*.047,-.868,.092],[.023,.151-Math.abs(i-1.5)*.010,.026],arm);
  shape('Thumb'+side,sphere(11,9),'skin',[side*.208,-.72,.09],[.048,.098,.046],arm);
  const leg=node(side===-1?'LeftLeg':'RightLeg',body,{translation:[side*.185,.71,0]});legs.push(leg);
  shape('LowerLeg'+side,cylinder(16),sex==='male'?'skin':'shade',[0,-.29,0],[.151,.62,.153],leg);
  shape('Ankle'+side,cylinder(12),'skin',[0,-.61,.018],[.110,.13,.113],leg);
  shape('VisibleFoot'+side,sphere(16,10),'skin',[0,-.648,.122],[.162,.091,.261],leg);
  shape('SandalSole'+side,sphere(16,10),'sole',[0,-.724,.14],[.186,.036,.302],leg);
  shape('SandalFrontStrap'+side,box(),'strap',[0,-.611,.248],[.296,.042,.054],leg);
  shape('SandalRearStrap'+side,box(),'strap',[0,-.608,.045],[.25,.041,.058],leg);
 }
 if(sex==='female')for(const side of [-1,1])shape('RobeSeam'+side,box(),'shade',[side*.41,.75,.34],[.024,.58,.02],body);
 const animations=[];
 // 16 sample pairs smoothly interpolate the locomotion loops in glTF 2.0.
 const axisX=angle=>[Math.sin(angle/2),0,0,Math.cos(angle/2)];
 const axisY=angle=>[0,Math.sin(angle/2),0,Math.cos(angle/2)];
 const axisZ=angle=>[0,0,Math.sin(angle/2),Math.cos(angle/2)];
 function clip(name,duration,strength){
  const steps=16,times=Array.from({length:steps+1},(_,i)=>duration*i/steps);
  const input=access(times,'SCALAR',5126,null,true),samplers=[],channels=[];
  const channel=(joint,path,values,type)=>{
   const output=access(values,type);
   samplers.push({input,output,interpolation:'LINEAR'});
   channels.push({sampler:samplers.length-1,target:{node:joint,path}});
  };
  const rot=(joint,angles,axis=axisX)=>channel(joint,'rotation',angles.flatMap(axis),'VEC4');
  for(let k=0;k<2;k++){
   const sign=k===0?1:-1;
   const wave=times.map((t,i)=>Math.sin(TAU*i/steps)*strength*sign);
   rot(legs[k],wave);
   rot(arms[k],wave.map(a=>-a*.66+sign*.029));
  }
  rot(headPivot,times.map((t,i)=>.017*Math.sin(TAU*i/steps+.35)),axisY);
  rot(body,times.map((t,i)=>(name==='Idle'?.008:.024)*Math.sin(TAU*i/steps)),axisZ);
  const bob=name==='Idle'?.008:name==='Walk'?.030:.051;
  channel(body,'translation',times.flatMap((t,i)=>{const angle=TAU*i/steps;return [.012*Math.sin(angle),bob*(1-Math.cos(2*angle))*.5,0];}),'VEC3');
  animations.push({name,samplers,channels});
 }
 clip('Idle',2.5,.015);clip('Walk',1.05,.40);clip('Run',.72,.64);
 const bin=Buffer.concat(buffers.map(x=>x.buffer));
 const gltf={asset:{version:'2.0',generator:'MANASIK Adventure original pilgrim avatar builder v6'},scene:0,scenes:[{nodes:roots}],nodes,meshes:meshDefs,materials,animations,accessors,bufferViews,images,textures,samplers,buffers:[{byteLength:bin.length}]};
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
