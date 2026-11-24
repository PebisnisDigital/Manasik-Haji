import {resolveFrames} from './CrowdView.ts';
import {Clip} from '../sim/States.ts';
/** Presentation only: movement, collisions and saves never read these values. */
export class DistrictLocomotion {
  moving=false;
  phase=0;
  readonly pose={f0:0,f1:0,frac:0,frameB:0,blend:0};
  private idlePhase=0;
  constructor(phase=0){this.phase=phase;this.reset();}
  reset(){this.moving=false;this.idlePhase=0;resolveFrames(Clip.IDLE,0,this.pose);this.pose.frameB=this.pose.f0;this.pose.blend=0;}
  update(distance:number,dt:number,active:boolean){
    if(!active||dt<=0)return this.pose;
    const moving=distance>.001;
    if(moving!==this.moving){
      // VAT supports one outgoing frame; retain the dominant pose on rapid reversals.
      this.pose.frameB=this.pose.blend>.5?this.pose.frameB:this.pose.frac<.5?this.pose.f0:this.pose.f1;
      this.pose.blend=1;this.moving=moving;
    }else this.pose.blend=Math.max(0,this.pose.blend-dt/.18);
    if(moving)this.phase=(this.phase+distance/1.42)%1;
    else this.idlePhase=(this.idlePhase+dt*.13)%1;
    resolveFrames(moving?Clip.WALK:Clip.IDLE,moving?this.phase:this.idlePhase,this.pose);
    return this.pose;
  }
}
