/**
 * Fast GLB structural QA, designed to run before every production build.
 * Checks both models without any third-party package dependency.
 */
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('public/assets/characters');
const expected=['Idle','Walk','Run'];
function fail(msg){throw new Error('AVATAR QA: '+msg);}
function parse(file){
 const data=fs.readFileSync(path.join(root,file));
 if(data.length<1024||data.length>900000)fail(file+' asset size outside range: '+data.length);
 if(data.readUInt32LE(0)!==0x46546c67||data.readUInt32LE(4)!==2||data.readUInt32LE(8)!==data.length)fail(file+' invalid glb header');
 const jl=data.readUInt32LE(12),jt=data.readUInt32LE(16);
 if(jt!==0x4e4f534a||jl%4!==0)fail(file+' invalid JSON chunk');
 const json=JSON.parse(data.subarray(20,20+jl).toString('utf8').trim());
 const pos=20+jl,bl=data.readUInt32LE(pos),bt=data.readUInt32LE(pos+4);
 if(bt!==0x004e4942||pos+8+bl!==data.length)fail(file+' invalid BIN chunk');
 const binary=data.subarray(pos+8),buffers=json.bufferViews||[],accessors=json.accessors||[];
 if(json.asset?.version!=='2.0')fail(file+' bad glTF version');
 if(!json.nodes?.length||!json.meshes?.length||!json.animations?.length)fail(file+' missing geometry or animation');
 if(json.meshes.length>150||json.nodes.length>200)fail(file+' mesh/node count exceeds lightweight budget');
 if(json.buffers?.[0]?.byteLength>binary.length)fail(file+' undeclared BIN length');
 for(const [i,v] of buffers.entries()){
  if(v.buffer!==0||v.byteOffset<0||v.byteLength<0||v.byteOffset+v.byteLength>binary.length)fail(file+' view '+i+' out of BIN bounds');
 }
 for(const [i,a] of accessors.entries()){
  const v=buffers[a.bufferView];if(!v||!a.count||!['SCALAR','VEC2','VEC3','VEC4'].includes(a.type))fail(file+' bad accessor '+i);
  const n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],bytes=a.componentType===5126?4:a.componentType===5123?2:0;
  if(!bytes||a.count*n*bytes>v.byteLength)fail(file+' accessor length mismatch '+i);
  if(a.componentType===5126){
   for(let k=0;k<a.count*n;k++)if(!Number.isFinite(binary.readFloatLE(v.byteOffset+k*4)))fail(file+' non-finite animation/mesh float in accessor '+i);
  }
 }
 for(const [i,node] of json.nodes.entries()){
  for(const child of node.children||[])if(!json.nodes[child])fail(file+' bad child '+i);
  if(node.mesh!==undefined&&!json.meshes[node.mesh])fail(file+' bad mesh index '+i);
  if(node.rotation&&Math.abs(Math.hypot(...node.rotation)-1)>.01)fail(file+' unnormalized quaternion in node '+i);
 }

 // Embedded skin, weave and normal textures: no external URLs or separate assets.
 if(json.images?.length!==3||json.textures?.length!==3||json.samplers?.length!==1)fail(file+' missing V6 embedded textures');
 const pngSig=Buffer.from([137,80,78,71,13,10,26,10]);
 for(const image of json.images){
  const view=buffers[image.bufferView];
  if(!view||image.mimeType!=='image/png'||image.uri)fail(file+' invalid embedded image');
  const data2=binary.subarray(view.byteOffset,view.byteOffset+view.byteLength);
  if(!data2.subarray(0,8).equals(pngSig)||data2.length<70)fail(file+' invalid PNG signature');
 }
 for(const material of json.materials){
  const withTexture=material.pbrMetallicRoughness?.baseColorTexture;
  if(['skin','skinShade','skinLight','cloth','secondary','shade','clothLight','clothDark'].includes(material.name)&&!withTexture)fail(file+' untextured '+material.name);
  for(const textureRef of [withTexture,material.normalTexture]){
   if(textureRef&&!json.textures[textureRef.index])fail(file+' broken material texture');
  }
 }
 for(const mesh of json.meshes)for(const prim of mesh.primitives){
  if(prim.attributes.TEXCOORD_0===undefined)fail(file+' missing UV map');
  const uv=accessors[prim.attributes.TEXCOORD_0],pos=accessors[prim.attributes.POSITION];
  if(!uv||uv.type!=='VEC2'||uv.count!==pos.count)fail(file+' invalid UV accessor');
 }
 const animations=new Map((json.animations||[]).map(a=>[a.name,a]));
 for(const name of expected){
  const clip=animations.get(name);
  if(!clip||clip.channels.length<6)fail(file+' missing or empty '+name+' clip');
  const durationAcc=accessors[clip.samplers[0]?.input];
  if(!durationAcc||durationAcc.count<9)fail(file+' '+name+' clip too short');
  for(const channel of clip.channels){
   const target=channel.target;if(!json.nodes[target.node])fail(file+' target missing');
   if(!['rotation','translation'].includes(target.path))fail(file+' unsupported path');
   const sampler=clip.samplers[channel.sampler];if(!sampler)fail(file+' missing animation sampler');
   if(accessors[sampler.input].count!==accessors[sampler.output].count)fail(file+' mismatched pose samples in '+name);
  }
 }
 const names=new Set(json.nodes.map(n=>n.name));
 if(!['PilgrimRoot','Head','Body','LeftArm','RightArm','LeftLeg','RightLeg'].every(k=>names.has(k)))fail(file+' missing skeleton nodes');
 if(file==='pilgrim-male.glb'){
  if(names.has('Kufi')||[...names].some(n=>n.startsWith('Pants')||n.startsWith('LongSleeve')))fail('men ihram cannot have cap, pants or tailored sleeves');
  if(!names.has('LowerIzar')||!names.has('RidaWrappedTorso'))fail('missing 2-piece male ihram');
 }else{
  if(!names.has('HeadscarfTop')||!names.has('RobeSkirt'))fail('female robe/hijab missing');
 }
 console.log('✓ QA',file,data.length+' bytes',json.nodes.length+' nodes',json.meshes.length+' meshes',expected.join('/'));
}
for(const name of ['pilgrim-male.glb','pilgrim-female.glb'])parse(name);
console.log('✓ V6 character models passed structure, motion, modest clothing and size QA');
