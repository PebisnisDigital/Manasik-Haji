import type {GraphicsTier} from './graphicsModel.ts';
export const TAWAF_CROWD_COUNTS={low:96,medium:168,high:224} as const;
export const TAWAF_ORIGINS=['Asia','Eropa','Afrika','Arab'] as const;
export interface TawafPilgrim {id:number;origin:string;angle:number;radius:number;speed:number;female:boolean;height:number;build:number;palette:number;brightness:number}
/** Origins describe a mixed congregation; appearance varies independently of origin. */
export function createTawafPilgrims(tier:GraphicsTier):TawafPilgrim[]{
 const count=TAWAF_CROWD_COUNTS[tier],lanes=[20,22.2,24.4,26.6,30,33.5];
 return Array.from({length:count},(_,id)=>{const lane=id%lanes.length,index=Math.floor(id/lanes.length),perLane=Math.ceil((count-lane)/lanes.length),female=(id*7)%12<5;return {id,origin:TAWAF_ORIGINS[id%4],angle:index/perLane*Math.PI*2+lane*.31,radius:lanes[lane],speed:.72+(id*13%19)/38,female,height:1.5+(id*17%35)/100,build:.86+(id*11%29)/100,palette:female?(id*3+Math.floor(id/4))%10:(id*3+Math.floor(id/4))%8,brightness:.93+(id*7%14)/100};});
}
export function pilgrimPosition(p:Pick<TawafPilgrim,'angle'|'radius'>){
 // Leave space around the existing Zamzam kiosk; radial detour, not teleportation.
 const delta=Math.atan2(Math.sin(p.angle-.45),Math.cos(p.angle-.45));
 const maqam=Math.atan2(Math.sin(p.angle+Math.PI/4),Math.cos(p.angle+Math.PI/4));
 const radius=p.radius+Math.max(0,30.5-p.radius)*Math.exp(-delta*delta/.055)+Math.max(0,22.5-p.radius)*Math.exp(-maqam*maqam/.035);
 return {x:Math.cos(p.angle)*radius,z:64+Math.sin(p.angle)*radius,yaw:Math.atan2(Math.sin(p.angle),-Math.cos(p.angle))};
}
export function stepPilgrim(p:TawafPilgrim,dt:number,player:{x:number;z:number},active=true){
 if(!active||!Number.isFinite(dt)||dt<=0)return;
 const at=pilgrimPosition(p),yielding=Math.hypot(at.x-player.x,at.z-player.z)<1.25;
 p.angle-=p.speed/p.radius*Math.min(dt,.05)*(yielding?.2:1);
 p.angle=Math.atan2(Math.sin(p.angle),Math.cos(p.angle));
}
