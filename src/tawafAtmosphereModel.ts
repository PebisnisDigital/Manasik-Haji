import type {GraphicsTier} from './graphicsModel.ts';
export const TAWAF_CROWD_COUNTS={low:96,medium:168,high:224} as const;
export const TAWAF_ORIGINS=['Asia','Eropa','Afrika','Arab'] as const;
export interface TawafPilgrim {id:number;origin:string;angle:number;radius:number;speed:number;female:boolean;height:number;build:number;palette:number;brightness:number;yieldOffset?:number}
/** Origins describe a mixed congregation; appearance varies independently of origin. */
export function createTawafPilgrims(tier:GraphicsTier):TawafPilgrim[]{
 const count=TAWAF_CROWD_COUNTS[tier],lanes=[20,22.2,24.4,26.6,33.2,35.4];
 return Array.from({length:count},(_,id)=>{const lane=id%lanes.length,index=Math.floor(id/lanes.length),perLane=Math.ceil((count-lane)/lanes.length),female=(id*7)%12<5;return {id,origin:TAWAF_ORIGINS[id%4],angle:index/perLane*Math.PI*2+lane*.31,radius:lanes[lane],speed:.84+lane*.065,female,height:1.5+(id*17%35)/100,build:.86+(id*11%29)/100,palette:female?(id*3+Math.floor(id/4))%10:(id*3+Math.floor(id/4))%8,brightness:.93+(id*7%14)/100};});
}
/** Parallel flowing lanes: the same outward displacement preserves lane spacing at obstacles.
 * The normal 30 m player checkpoint lane stays clear between inner and outer groups. */
export function pilgrimPosition(p:Pick<TawafPilgrim,'angle'|'radius'|'yieldOffset'>){
 const radial=(angle:number)=>{
  const delta=Math.atan2(Math.sin(angle-.45),Math.cos(angle-.45));
  const maqam=Math.atan2(Math.sin(angle+Math.PI/4),Math.cos(angle+Math.PI/4));
  return p.radius+10.5*Math.exp(-delta*delta/.055)+2.5*Math.exp(-maqam*maqam/.035)+(p.yieldOffset??0);
 };
 const radius=radial(p.angle),next=p.angle-.001,nextRadius=radial(next);
 const x=Math.cos(p.angle)*radius,z=64+Math.sin(p.angle)*radius;
 return {x,z,yaw:Math.atan2(Math.cos(next)*nextRadius-x,64+Math.sin(next)*nextRadius-z)};
}
export function stepPilgrim(p:TawafPilgrim,dt:number,player:{x:number;z:number},active=true){
 if(!active||!Number.isFinite(dt)||dt<=0)return;
 const step=Math.min(dt,.05),at=pilgrimPosition(p),distance=Math.hypot(at.x-player.x,at.z-player.z);
 // Yield sideways, not by stopping the entire lane. All actors in a lane retain the same angular speed.
 const playerRadius=Math.hypot(player.x,player.z-64),radius=Math.hypot(at.x,at.z-64);
 const desired=distance<2.2?(radius>=playerRadius||p.radius<=20?1:-1)*.45*(1-distance/2.2):0;
 p.yieldOffset=(p.yieldOffset??0)+(desired-(p.yieldOffset??0))*Math.min(1,step*4);
 p.angle-=p.speed/p.radius*step;
 p.angle=Math.atan2(Math.sin(p.angle),Math.cos(p.angle));
}
