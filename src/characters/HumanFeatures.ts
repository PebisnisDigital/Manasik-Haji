import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Facial landmarks for the existing articulated preparation cast. Metres, +Z forward. */
export function addHumanFeatures(parent:THREE.Group,skin:THREE.Material,z:number):void {
  const dark=new THREE.MeshStandardMaterial({color:0x302720,roughness:.92});
  const white=new THREE.MeshStandardMaterial({color:0xdad5c9,roughness:.58});
  const lip=new THREE.MeshStandardMaterial({color:0x875b4c,roughness:.85});
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
  function part(m:THREE.Material,x:number,y:number,dz:number,rx:number,ry:number,rz:number){
    const g=new THREE.SphereGeometry(1,8,6);g.scale(rx,ry,rz);g.translate(x,y,z+dz);const list=batches.get(m)??[];list.push(g);batches.set(m,list);
  }
  for(const side of [-1,1]){
    part(white,side*.052,1.54,.132,.021,.008,.009);
    part(dark,side*.052,1.54,.141,.007,.007,.004);
    part(dark,side*.052,1.563,.127,.025,.004,.006);
    part(skin,side*.137,1.51,0,.02,.036,.023);
  }
  part(skin,0,1.505,.137,.021,.035,.028);
  part(lip,0,1.46,.13,.033,.005,.007);
  for(const [m,parts]of batches){const g=mergeGeometries(parts);if(g)parent.add(new THREE.Mesh(g,m));for(const p of parts)p.dispose();}
}
