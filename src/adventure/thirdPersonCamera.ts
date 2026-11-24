import * as THREE from 'three';
export const followAlpha=(rate:number,dt:number)=>1-Math.exp(-rate*Math.max(0,dt));
export class ThirdPersonCamera {
  pitch=.29;
  framing={distance:7.2,height:1.65,side:.48,lead:1.1};
  private initialized=false;
  private focus=new THREE.Vector3();private desired=new THREE.Vector3();private direction=new THREE.Vector3();
  private ray=new THREE.Ray();private hit=new THREE.Vector3();private expanded=new THREE.Box3();
  constructor(private camera:THREE.PerspectiveCamera,private blockers:readonly THREE.Box3[]=[]){}
  orbitPitch(dy:number){this.pitch=THREE.MathUtils.clamp(this.pitch+dy*.003,.08,.65);}
  reset(){this.initialized=false;this.pitch=.29;}
  private constrain(position:THREE.Vector3){
    this.direction.copy(position).sub(this.focus);let length=this.direction.length();
    this.direction.normalize();this.ray.set(this.focus,this.direction);
    for(const box of this.blockers){
      this.expanded.copy(box).expandByScalar(.24);
      if(this.expanded.containsPoint(this.focus)){length=Math.min(length,.55);continue;}
      if(this.ray.intersectBox(this.expanded,this.hit))length=Math.min(length,Math.max(.45,this.hit.distanceTo(this.focus)-.12));
    }
    position.copy(this.focus).addScaledVector(this.direction,length);
  }
  update(x:number,z:number,yaw:number,dt:number){
    this.focus.set(x,this.framing.height,z);
    const {distance,side,height,lead}=this.framing;
    this.desired.set(x-Math.sin(yaw)*Math.cos(this.pitch)*distance-Math.cos(yaw)*side,
      height+Math.sin(this.pitch)*distance,z-Math.cos(yaw)*Math.cos(this.pitch)*distance+Math.sin(yaw)*side);
    this.constrain(this.desired);
    if(!this.initialized){this.camera.position.copy(this.desired);this.initialized=true;}
    else this.camera.position.lerp(this.desired,followAlpha(7,dt));
    // Recheck the smoothed position, so an orbit cannot cut across a wall corner.
    this.constrain(this.camera.position);
    this.focus.x+=Math.sin(yaw)*lead;this.focus.z+=Math.cos(yaw)*lead;
    this.camera.lookAt(this.focus);this.camera.updateMatrixWorld();
  }
}
