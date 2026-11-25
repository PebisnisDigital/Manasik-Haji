/** Ground-plane character physics. Kinematic discs, swept substeps and wall sliding.
 * Scripted animation/ritual counters remain independent. All dimensions are metres.
 */
export type GroundPoint={x:number;z:number};
export type SolidBody=GroundPoint&{radius?:number};
export const HUMAN_RADIUS=.32;
const sq=(x:number)=>x*x;
export function bodyClear(from:GroundPoint,to:GroundPoint,bodies:readonly SolidBody[],radius=HUMAN_RADIUS){
 for(const b of bodies){const limit=radius+(b.radius??HUMAN_RADIUS),after=sq(to.x-b.x)+sq(to.z-b.z);
  if(after>=limit*limit-1e-8)continue;
  // A pre-existing overlap can be escaped but never made deeper.
  const before=sq(from.x-b.x)+sq(from.z-b.z);
  if(after<before+1e-9)return false;
 }
 return true;
}
export function sweepGround(start:GroundPoint,target:GroundPoint,bodies:readonly SolidBody[],walkable:(x:number,z:number)=>boolean=()=>true,radius=HUMAN_RADIUS){
 let x=start.x,z=start.z,hit=false;
 const dx=target.x-x,dz=target.z-z,length=Math.hypot(dx,dz);
 if(!Number.isFinite(length)||length<1e-8)return {x,z,hit};
 const steps=Math.max(1,Math.ceil(length/.12)),sx=dx/steps,sz=dz/steps;
 const local=bodies.filter(b=>Math.abs(b.x-start.x)<=length+radius+(b.radius??HUMAN_RADIUS)&&Math.abs(b.z-start.z)<=length+radius+(b.radius??HUMAN_RADIUS));
 const ok=(a:number,b:number)=>walkable(a,b)&&bodyClear({x,z},{x:a,z:b},local,radius);
 for(let i=0;i<steps;i++){if(ok(x+sx,z+sz)){x+=sx;z+=sz;continue;}
  hit=true;
  if(Math.abs(sx)>=Math.abs(sz)){if(Math.abs(sx)>1e-9&&ok(x+sx,z))x+=sx;if(Math.abs(sz)>1e-9&&ok(x,z+sz))z+=sz;}
  else{if(Math.abs(sz)>1e-9&&ok(x,z+sz))z+=sz;if(Math.abs(sx)>1e-9&&ok(x+sx,z))x+=sx;}
 }
 return {x,z,hit};
}
let lastContact=-Infinity;
/** One gentle notice per encounter window, never invalidate a ritual or reset progress. */
export function reportContact(hit:boolean){
 if(!hit||typeof document==='undefined')return;
 const now=performance.now();if(now-lastContact<2200)return;lastContact=now;
 document.dispatchEvent(new CustomEvent('simple-play-notice',{detail:'Jalan terhalang. Beri ruang dan lewat dengan tertib.'}));
}
