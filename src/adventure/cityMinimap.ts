import {BUILDINGS,DISTRICT_ROADS,type Point,type Rect} from './districtModel.ts';
import {CITY_BOUNDS,CITY_ROADS,cityRoute} from './cityNavigation.ts';
type Building=Rect&{number:number;door:Point};
const ns='http://www.w3.org/2000/svg';
const mx=(x:number)=>(x-CITY_BOUNDS.minX)/(CITY_BOUNDS.maxX-CITY_BOUNDS.minX)*140;
const mz=(z:number)=>(z-CITY_BOUNDS.minZ)/(CITY_BOUNDS.maxZ-CITY_BOUNDS.minZ)*114;
const node=<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Record<string,string|number>)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
export function mountCityMinimap(places:readonly Building[],solids:readonly Rect[],board:Rect){
 const svg=document.querySelector<SVGSVGElement>('.miniMap svg')!,map=document.querySelector<HTMLElement>('.miniMap')!,hud=document.querySelector<HTMLElement>('.districtHud')!;
 const player=document.getElementById('mapPlayer')!,goal=document.getElementById('mapGoal')!,route=document.getElementById('mapRoute')!;
 const roads=[...DISTRICT_ROADS,...CITY_ROADS];const layer=node('g',{});svg.replaceChildren(node('rect',{width:140,height:114,rx:4,fill:'#21352e'}),layer);
 const rect=(r:Rect,attrs:Record<string,string|number>)=>node('rect',{x:mx(r.x-r.w/2),y:mz(r.z-r.d/2),width:r.w*140/300,height:r.d*114/256,...attrs});
 for(const road of roads)layer.append(rect(road,{fill:'#87938b'}));
 for(const b of BUILDINGS)layer.append(rect(b,{fill:'#b5aa90',stroke:'#d8cbb2','stroke-width':.35}));
 layer.append(rect(board,{fill:'#d4ba78'}));
 const buildings=new Map<number,SVGRectElement>();
 for(const b of places){const box=rect(b,{fill:'#b3aa94',stroke:'#e4d8bf','stroke-width':.45,rx:.6});buildings.set(b.number,box);layer.append(box);}
 route.setAttribute('stroke','#62ed89');route.setAttribute('stroke-width','2.1');route.setAttribute('stroke-linecap','round');route.setAttribute('stroke-linejoin','round');route.removeAttribute('hidden');svg.append(route);
 for(const b of places){const t=node('text',{x:mx(b.x),y:mz(b.z)+1.45,fill:'#182a23','font-size':4.6,'font-weight':800,'text-anchor':'middle','paint-order':'stroke',stroke:'#e3d9bf','stroke-width':.25});t.textContent=String(b.number);svg.append(t);}
 goal.setAttribute('fill','#67ef8b');goal.setAttribute('stroke','#e3ffe5');goal.setAttribute('stroke-width','.65');goal.setAttribute('r','2.3');svg.append(goal);
 player.setAttribute('fill','#fff7df');player.setAttribute('stroke','#19372c');player.setAttribute('stroke-width','.7');player.setAttribute('d','M0 -4L2.8 3 0 1.7-2.8 3Z');svg.append(player);
 hud.prepend(map);svg.setAttribute('aria-label','Peta jalan dan gedung HAJJI CITY, posisi pemain dan tujuan hijau');
 let last:Point|null=null,lastTarget=-1,lastTime=-Infinity,points:Point[]=[];
 function update(p:Point,yaw:number,target:number,now:number){const b=places.find(b=>b.number===target);if(!b)return;
  if(target!==lastTarget||!last||now-lastTime>1000&&Math.hypot(p.x-last.x,p.z-last.z)>3){last={...p};lastTarget=target;lastTime=now;points=cityRoute(p,b.door,roads,solids);for(const [n,box] of buildings){box.setAttribute('fill',n===target?'#4add77':'#b3aa94');box.setAttribute('stroke',n===target?'#b4ffd0':'#e4d8bf');box.setAttribute('stroke-width',n===target?'1.15':'.45');}}
  player.setAttribute('transform',`translate(${mx(p.x)} ${mz(p.z)}) rotate(${180-yaw*180/Math.PI})`);
  goal.setAttribute('cx',String(mx(b.door.x)));goal.setAttribute('cy',String(mz(b.door.z)));
  route.setAttribute('points',points.map(q=>mx(q.x)+','+mz(q.z)).join(' '));route.toggleAttribute('hidden',points.length<2);
  const remaining=points.length>1?points.reduce((sum,q,i)=>i?sum+Math.hypot(q.x-points[i-1]!.x,q.z-points[i-1]!.z):0,0):Math.hypot(p.x-b.door.x,p.z-b.door.z);
  document.getElementById('locationName')!.textContent='GEDUNG '+target;document.getElementById('targetDistance')!.textContent=Math.round(remaining)+' m';
 }
 return {update};
}
