import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {BUILDINGS,DISTRICT_ROADS,STATIONS,type Vehicle,type Point} from './districtModel.ts';
import {surfaceDetail,staticShadows} from '../env/GraphicsDetail.ts';
import {graphicsTier} from '../graphicsQuality.ts';
import {BUS_WHEEL_RADIUS} from './districtPresentation.ts';

export function createDistrictWorld(renderer:THREE.WebGLRenderer,night=false,missionCity=false){
  const scene=new THREE.Scene();scene.background=new THREE.Color(night?0x172b43:0xadbfc3);scene.fog=new THREE.Fog(night?0x25354c:0xc6c4b6,75,175);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);
  scene.environment=environment.texture;scene.environmentIntensity=night?.25:.32;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(night?0xb9d5ff:0xe9f3ff,0x87725a,night?1.4:1.8));
  const sun=new THREE.DirectionalLight(night?0xa1c7ff:0xffd6a0,night?.9:3.4);sun.position.set(-45,65,25);scene.add(sun);staticShadows(renderer,sun,75);
  const materials=new Map<string,THREE.MeshStandardMaterial>();
  function mat(color:number,roughness=.8,metalness=0){const key=[color,roughness,metalness].join();let m=materials.get(key);if(!m){m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.set(key,m);}return m;}
  const stone=mat(0xddd3c1),pavement=mat(0xb9b1a0),sand=mat(0xcaba9e),asphalt=mat(0x42494b),dark=mat(0x303c39),gold=mat(0xc3a36b,.45,.35),glass=mat(0x344f59,.24,.35),white=mat(0xe8e6dc);
  surfaceDetail(stone,'stone',4,4);surfaceDetail(pavement,'stone',22,22);surfaceDetail(sand,'sand',30,30);
  function mesh(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene,cast=true){const a=new THREE.Mesh(g,m);a.position.set(x,y,z);a.receiveShadow=true;a.castShadow=cast;parent.add(a);return a;}
  function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=scene,cast=true){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent,cast);}
  function label(text:string,width:number,x:number,y:number,z:number,rotation=0,color='#e8d7b4',parent:THREE.Object3D=scene){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#203b34';ctx.fillRect(0,0,1024,128);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 58px system-ui';ctx.fillText(text,512,66,970);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;
    const sign=mesh(new THREE.PlaneGeometry(width,width/8),new THREE.MeshBasicMaterial({map:t}),x,y,z,parent,false);sign.rotation.y=rotation;return sign;
  }
  const ground=mesh(new THREE.PlaneGeometry(missionCity?212:190,missionCity?186:170),sand,0,-.04,0,scene,false);ground.rotation.x=-Math.PI/2;
  for(const road of DISTRICT_ROADS)box(road.w,.12,road.d,asphalt,road.x,road.z===54?0:.025,road.z,scene,false);
  box(72,.16,44,pavement,0,.03,0,scene,false);
  for(const z of [-24,24]){
    for(const edge of [-4.2,4.2])box(84,.16,.25,stone,0,.08,z+edge,scene,false);
    for(let x=-36;x<=36;x+=6)box(2.6,.02,.12,white,x,.096,z,scene,false);
  }
  for(const x of [-38,38]){
    for(const edge of [-4.2,4.2])box(.25,.16,56,stone,x+edge,.08,0,scene,false);
    for(let z=-18;z<=18;z+=6)box(.12,.02,2.6,white,x,.096,z,scene,false);
  }
  // Pedestrian crossings lead from each sidewalk to the main road.
  for(let x=-8;x<=4;x+=1.5)box(.7,.025,7.5,white,x,.11,24,scene,false);
  for(let z=-16;z<=-8;z+=1.5)box(7.5,.025,.7,white,38,.11,z,scene,false);
  // These five buildings are used only in the original transfer/errand scene, never in the member city.
  if(!missionCity)for(const b of BUILDINGS){
    const facade=mat(b.color);box(b.w,b.height,b.d,facade,b.x,b.height/2,b.z);
    box(b.w+.5,.45,b.d+.5,stone,b.x,b.height+.1,b.z);box(b.w+.7,.28,.8,gold,b.x,3.4,b.z+b.d/2+.3);
    for(let y=4.8;y<b.height-1;y+=3.1)for(let x=-b.w/2+2;x<b.w/2-1;x+=3.4){
      box(1.65,1.9,.12,glass,b.x+x,y,b.z+b.d/2+.07);
      box(1.9,.12,.45,stone,b.x+x,y-1,b.z+b.d/2+.17);
      if((Math.round(x)+Math.round(y))%3===0)box(1.5,.08,.4,gold,b.x+x,y+1,b.z+b.d/2+.14);
    }
    for(let y=4.8;y<b.height-1;y+=3.1){
      for(let x=-b.w/2+2;x<b.w/2-1;x+=3.4){box(1.65,1.9,.12,glass,b.x+x,y,b.z-b.d/2-.07);box(1.9,.12,.45,stone,b.x+x,y-1,b.z-b.d/2-.17);}
      for(const side of [-1,1])for(let z=-b.d/2+2;z<b.d/2-1;z+=3.4){box(.12,1.9,1.65,glass,b.x+side*(b.w/2+.07),y,b.z+z);box(.45,.12,1.9,stone,b.x+side*(b.w/2+.17),y-1,b.z+z);}
    }
    box(3.1,2.9,.14,glass,b.x,1.5,b.z+b.d/2+.08);box(.09,2.9,.16,gold,b.x,1.5,b.z+b.d/2+.17);
    label(b.name,Math.min(15,b.w-1),b.x,3.95,b.z+b.d/2+.47);
    for(const x of [-b.w/2+.7,b.w/2-.7])box(.45,b.height+.2,.4,stone,b.x+x,b.height/2,b.z+b.d/2+.12);
    if(b.name==='TERMINAL LATIHAN'){
      box(.13,3.1,5.2,glass,b.x-b.w/2-.08,1.6,-12);
      label('TERMINAL LATIHAN',14,b.x-b.w/2-.2,6.5,-9,-Math.PI/2);
      box(6,.18,19,dark,b.x-b.w/2-2.7,3.7,-9);
    }
  }
  // Low benches, planted islands, market awnings and a silhouette beyond the streets.
  for(const [x,z]of [[-4,-9],[0,6],[27,6],[-49,15],[-48,-13],[48,30]]){
    box(2.7,.6,2.7,stone,x,.25,z);box(2.3,.09,2.3,mat(0x5c7050),x,.6,z,scene,false);palm(x,z);
  }
  function palm(x:number,z:number){
    const trunk=mesh(new THREE.CylinderGeometry(.15,.24,5.3,7),mat(0x7c6c50),x,2.65,z);trunk.rotation.z=.055;
    const leafMaterial=mat(0x4d6c46);for(let i=0;i<7;i++){
      const a=i*Math.PI*2/7,leaf=mesh(new THREE.ConeGeometry(.58,3.1,4),leafMaterial,x+Math.sin(a)*1.1,5.35,z+Math.cos(a)*1.1);
      leaf.rotation.set(Math.cos(a)*.94,a,Math.sin(a)*.94);
    }
  }
  for(const [x,z]of [[-5,3],[5,8],[27,-1],[-12,-17]]){
    box(3,.16,.8,mat(0x756954),x,.64,z);box(3,.55,.12,mat(0x756954),x,1.02,z-.4);
    for(const side of [-1,1])box(.12,.6,.65,dark,x+side*1.1,.3,z);
  }
  for(const [x,z]of [[-31,30],[8,30],[-31,-30],[8,-30],[45,12],[-45,-3]]){
    mesh(new THREE.CylinderGeometry(.09,.13,6.6,8),dark,x,3.3,z);
    box(1.2,.12,.5,dark,x+.45,6.6,z);box(.9,.04,.32,mat(0xf6ddb0,.3),x+.45,6.5,z,scene,false);
  }
  if(!missionCity)for(let i=0;i<5;i++){const x=-30+i*5;const awning=box(4,.13,2.8,mat(i%2?0x667e65:0xa96e54),x,3,-36);awning.rotation.x=.14;box(3.5,1.1,1,mat(0x89735c),x,.55,-36.3);}
  // The legacy scenery mosque is outside its original transfer map; omit it from the compact member city to clear the level 8 footprint.
  if(!missionCity){box(23,5,14,mat(0xc8c2b1),-22,2.5,-66);
  mesh(new THREE.SphereGeometry(6,24,12,0,Math.PI*2,0,Math.PI/2),mat(0x71877a,.5),-22,5,-66);
  mesh(new THREE.CylinderGeometry(.8,1.2,19,12),stone,-37,9.5,-64);mesh(new THREE.ConeGeometry(1.4,3,12),gold,-37,20,-64);}
  // The legacy transfer map ends at z=-57. Its mountain silhouettes at z=-98
  // intersect the expanded mission city (z=-128..128), including buildings 6–9.
  // Do not create these meshes in the mission hub at all, even before static batching.
  if(!missionCity)for(let i=0;i<9;i++){
    const mountain=mesh(new THREE.ConeGeometry(20+(i%3)*8,20+(i%4)*9,5),mat(0x9f9f91),-100+i*25,6,-98,scene,false);mountain.rotation.y=i*.6;
  }
  // A visible bus stop and a marked destination parking bay.
  if(!missionCity){for(const x of [-8,0])box(.12,2.7,.12,dark,x,1.35,30);
  box(9,.2,3.7,dark,-4,2.75,30);label('BUS 01 · ROMBONGAN',7,-4,2.3,30.1);
  box(7,.5,.8,stone,-4,.25,30.5);label('PARKIR BUS',6,33.7,.2,-12,Math.PI/2,'#f1d398');
  for(const x of [34.3,41.7])box(.18,.025,12,gold,x,.11,-12,scene,false);
  for(const z of [-18,-6])box(7.5,.025,.18,gold,38,.11,z,scene,false);}
  const luggage=new THREE.Group();scene.add(luggage);luggage.position.set(STATIONS.luggage.x,0,STATIONS.luggage.z);
  box(.58,.82,.32,mat(0xa88052),0,.5,0,luggage);box(.32,.24,.055,dark,0,1.02,0,luggage);
  for(const x of [-.21,.21])mesh(new THREE.SphereGeometry(.07,7,5),dark,x,.09,0,luggage);
  const parcel=new THREE.Group();scene.add(parcel);parcel.visible=false;
  box(.55,.38,.4,mat(0xaf8153),0,.9,0,parcel,false);box(.12,.39,.41,white,0,.9,0,parcel,false);
  const marker=new THREE.Group();scene.add(marker);
  const halo=mesh(new THREE.RingGeometry(.8,1.05,48),new THREE.MeshBasicMaterial({color:0xedc773,side:THREE.DoubleSide,transparent:true,opacity:.75}),0,.14,0,marker,false);halo.rotation.x=-Math.PI/2;
  const diamond=mesh(new THREE.OctahedronGeometry(.28),new THREE.MeshStandardMaterial({color:0xf3d594,emissive:0xa77a32,emissiveIntensity:.35,roughness:.4}),0,2.55,0,marker,false);
  const bus=new THREE.Group();scene.add(bus);
  const wheels:{steering:THREE.Group;rolling:THREE.Group;front:boolean}[]=[];
  const busPaint=mat(0x234f47,.34,.3),trim=mat(0xbda779,.42,.35),rubber=mat(0x262a2b),busGlass=mat(0x395d67,.16,.48);
  box(2.55,2.5,9.1,busPaint,0,1.95,0,bus,false);box(2.62,.16,9.2,trim,0,1.02,0,bus,false);
  box(2.53,.24,9.12,white,0,3.24,0,bus,false);box(2.38,1.17,.08,busGlass,0,2.52,4.58,bus,false);
  box(2.38,.7,.08,busGlass,0,2.7,-4.58,bus,false);
  for(const side of [-1,1]){
    for(let z=-3.5;z<3.4;z+=1.2)box(.05,1.1,1.05,busGlass,side*1.29,2.52,z,bus,false);
    box(.06,.13,7.4,trim,side*1.32,1.75,-.2,bus,false);
    for(const z of [-2.8,2.7]){
      const steering=new THREE.Group(),rolling=new THREE.Group();steering.position.set(side*1.26,.59,z);bus.add(steering);steering.add(rolling);
      const wheel=mesh(new THREE.CylinderGeometry(BUS_WHEEL_RADIUS,BUS_WHEEL_RADIUS,.3,16),rubber,0,0,0,rolling,false);wheel.rotation.z=Math.PI/2;
      const hub=mesh(new THREE.CylinderGeometry(.32,.32,.32,12),trim,side*.01,0,0,rolling,false);hub.rotation.z=Math.PI/2;
      for(let i=0;i<3;i++){const spoke=box(.035,.53,.045,rubber,side*.185,0,0,rolling,false);spoke.rotation.x=i*Math.PI/3;}
      wheels.push({steering,rolling,front:z>0});
    }
    for(const x of [-.8,.8])box(.32,.18,.05,mat(0xf5e5be,.3),x,1.22,side*4.62,bus,false);
  }
  box(.04,1.9,.95,busGlass,-1.32,1.93,3.2,bus,false);label('ROMBONGAN · 01',2,0,3.05,4.64,0,'#f9e7ba',bus);
  const shadow=mesh(new THREE.PlaneGeometry(3.2,10),new THREE.MeshBasicMaterial({color:0x161e1b,transparent:true,opacity:.2,depthWrite:false}),0,.12,0,bus,false);shadow.rotation.x=-Math.PI/2;
  const traffic:THREE.Group[]=[];
  if(graphicsTier()!=='low')for(let i=0;i<3;i++){
    const car=new THREE.Group();scene.add(car);box(1.8,.8,3.8,mat([0x9b8068,0xd5d0c4,0x536971][i],.4,.2),0,.7,0,car,false);box(1.6,.65,1.9,glass,0,1.3,-.15,car,false);
    traffic.push(car);
  }
  // Merge static architecture once; moving vehicles, luggage and markers keep their own transforms.
  function mergeChildren(parent:THREE.Object3D){
    parent.updateMatrixWorld(true);const batches=new Map<string,THREE.Mesh[]>();
    for(const child of parent.children)if(child instanceof THREE.Mesh&&child.material instanceof THREE.MeshStandardMaterial){
      const key=child.material.uuid+':'+child.castShadow;const group=batches.get(key)??[];group.push(child);batches.set(key,group);
    }
    for(const parts of batches.values())if(parts.length>1){
      const copies=parts.map(p=>p.geometry.clone().applyMatrix4(p.matrix)),geometry=mergeGeometries(copies,false);copies.forEach(g=>g.dispose());
      if(!geometry)continue;const merged=new THREE.Mesh(geometry,parts[0].material);merged.castShadow=parts[0].castShadow;merged.receiveShadow=true;parent.add(merged);
      for(const part of parts){parent.remove(part);part.geometry.dispose();}
    }
  }
  mergeChildren(scene);mergeChildren(bus);mergeChildren(luggage);mergeChildren(parcel);wheels.forEach(w=>mergeChildren(w.rolling));
  return {scene,bus,luggage,marker,wheels,
    update(now:number,vehicle:Vehicle,stage:number,carried:boolean,hero:THREE.Vector3,yaw:number,activity?:{target:Point|null;parcel:boolean},wheelAngle=0){
      bus.position.set(vehicle.x,0,vehicle.z);bus.rotation.y=vehicle.yaw;
      for(const w of wheels){w.steering.rotation.y=w.front?-vehicle.steer:0;w.rolling.rotation.x=wheelAngle;}
      const goal=stage===3?STATIONS.terminal:stage===4?STATIONS.arrival:stage===5?STATIONS.arrival:stage===0?STATIONS.briefing:stage===1?STATIONS.luggage:vehicle;
      const tracked=activity?activity.target:goal;
      if(tracked)marker.position.set(tracked.x,0,tracked.z);diamond.rotation.y=now*.001;diamond.position.y=(stage===2?4.5:2.6)+Math.sin(now*.002)*.12;marker.visible=!!tracked;
      parcel.visible=activity?.parcel??false;if(parcel.visible){parcel.position.set(hero.x-Math.cos(yaw)*.57,0,hero.z+Math.sin(yaw)*.57);parcel.rotation.y=yaw;}
      luggage.visible=stage<3;if(carried){luggage.position.set(hero.x-Math.cos(yaw)*.48,0,hero.z+Math.sin(yaw)*.48);luggage.rotation.y=yaw;}
      traffic.forEach((car,i)=>{const x=((now*.002+i*45)%120)-60;car.position.set(x,.01,52+i*1.7);car.rotation.y=Math.PI/2;});
    },
    dispose(){
      const geometries=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
      scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){mats.add(m);if(m instanceof THREE.MeshStandardMaterial||m instanceof THREE.MeshBasicMaterial)if(m.map)textures.add(m.map);}}});
      geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());environment.dispose();
    },
  };
}
