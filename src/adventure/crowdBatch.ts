import * as THREE from 'three';
/** Batch the existing art; retain original roots for authored movement and interaction. */
export function batchPilgrims(scene:THREE.Scene,roots:THREE.Object3D[]) {
  // A sparse group benefits more from normal per-mesh frustum culling.
  if(roots.length<16)return {update(){},dispose(){}};
  // Local A/B profiling keeps framing, movement and art identical.
  if(import.meta.env.DEV&&new URLSearchParams(location.search).has('unbatched'))return {update(){},dispose(){}};
  const groups=new Map<string,{source:THREE.Mesh;parts:THREE.Mesh[]}>();
  for(const root of roots)root.traverse(object=>{
    if(!(object instanceof THREE.Mesh)||!(object.material instanceof THREE.MeshStandardMaterial))return;
    const parameters=(object.geometry as THREE.BufferGeometry&{parameters?:object}).parameters;
    const key=JSON.stringify([object.geometry.type,parameters,object.material.roughness,object.material.metalness]);
    const group:{source:THREE.Mesh;parts:THREE.Mesh[]}=groups.get(key)??{source:object,parts:[]};group.parts.push(object);groups.set(key,group);object.visible=false;
  });
  const batches=Array.from(groups.values(),({source,parts})=>{
    const material=(source.material as THREE.MeshStandardMaterial).clone();material.color.set(0xffffff);
    const mesh=new THREE.InstancedMesh(source.geometry,material,parts.length);mesh.frustumCulled=false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    parts.forEach((part,i)=>mesh.setColorAt(i,(part.material as THREE.MeshStandardMaterial).color));scene.add(mesh);
    return {mesh,parts};
  });
  function update(){
    for(const root of roots)root.updateMatrixWorld(true);
    for(const {mesh,parts} of batches){parts.forEach((part,i)=>mesh.setMatrixAt(i,part.matrixWorld));mesh.instanceMatrix.needsUpdate=true;}
  }
  update();return {update,dispose(){for(const {mesh}of batches){scene.remove(mesh);(mesh.material as THREE.Material).dispose();mesh.dispose();}}};
}
