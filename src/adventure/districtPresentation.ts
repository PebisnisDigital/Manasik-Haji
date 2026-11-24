export {DistrictLocomotion} from '../characters/Locomotion.ts';
import type {Point,Vehicle} from './districtModel.ts';

const FOOT={distance:6.8,height:1.65,side:.48,lead:1.1};
const BUS={distance:13.5,height:2.5,side:.2,lead:2.8};
const angleDelta=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

/** A short mode blend; ordinary follow/orbit and building occlusion remain in the rig. */
export class DistrictCameraPresentation {
  readonly focus={x:0,z:0,yaw:0};
  readonly framing={...FOOT};
  private from={x:0,z:0,yaw:0};
  private fromFraming={...FOOT};
  private elapsed=.65;
  private driving=false;
  transition(driving:boolean,cut=false){
    this.driving=driving;Object.assign(this.from,this.focus);Object.assign(this.fromFraming,this.framing);this.elapsed=cut?.65:0;
  }
  update(target:Point,yaw:number,dt:number){
    this.elapsed=Math.min(.65,this.elapsed+Math.max(0,dt));
    const t=this.elapsed/.65,a=t*t*(3-2*t),frame=this.driving?BUS:FOOT;
    this.focus.x=this.from.x+(target.x-this.from.x)*a;
    this.focus.z=this.from.z+(target.z-this.from.z)*a;
    this.focus.yaw=this.from.yaw+angleDelta(this.from.yaw,yaw)*a;
    for(const k of ['distance','height','side','lead'] as const)this.framing[k]=this.fromFraming[k]+(frame[k]-this.fromFraming[k])*a;
  }
}

export const BUS_WHEEL_RADIUS=.57;
/** Project actual resolved travel on the bus's midpoint heading; reverse rolls backwards. */
export function wheelTravel(before:Vehicle,after:Vehicle){
  const yaw=before.yaw+angleDelta(before.yaw,after.yaw)/2;
  return ((after.x-before.x)*Math.sin(yaw)+(after.z-before.z)*Math.cos(yaw))/BUS_WHEEL_RADIUS;
}
