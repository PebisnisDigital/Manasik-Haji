import {DISTRICT_HQ,DISTRICT_SHOPS} from './districtLandmarks.ts';
import {SOUVENIR_NUMBER} from './citySouvenir.ts';
import {BUILDINGS,DISTRICT_ROADS,type Point,type Rect} from './districtModel.ts';
import {CITY_BOUNDS,CITY_ROADS} from './cityNavigation.ts';
import {followCityRoute} from './cityRouteFollow.ts';
type Building=Rect&{number:number;door:Point};
const ns='http://www.w3.org/2000/svg';
const mx=(x:number)=>(x-CITY_BOUNDS.minX)/(CITY_BOUNDS.maxX-CITY_BOUNDS.minX)*140;
const mz=(z:number)=>(z-CITY_BOUNDS.minZ)/(CITY_BOUNDS.maxZ-CITY_BOUNDS.minZ)*114;
const node=<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Record<string,string|number>)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
export function mountCityMinimap(places:readonly Building[],solids:readonly Rect[],board:Rect){
 const svg=document.querySelector<SVGSVGElement>('.miniMap svg')!,map=document.querySelector<HTMLElement>('.miniMap')!,hud=document.querySelector<HTMLElement>('.districtHud')!;
 const player=document.getElementById('mapPlayer')!,goal=document.getElementById('mapGoal')!,route=document.getElementById('mapRoute')!;
 const roads=[...DISTRICT_ROADS,...CITY_ROADS];const layer=node('g',{});svg.replaceChildren(node('rect',{width:140,height:114,rx:4,fill:'#141414'}),layer);
 const rect=(r:Rect,attrs:Record<string,string|number>)=>node('rect',{x:mx(r.x-r.w/2),y:mz(r.z-r.d/2),width:r.w*140/(CITY_BOUNDS.maxX-CITY_BOUNDS.minX),height:r.d*114/(CITY_BOUNDS.maxZ-CITY_BOUNDS.minZ),...attrs});
 for(const road of roads)layer.append(rect(road,{fill:'#777772'}));
 for(const b of BUILDINGS)layer.append(rect(b,{fill:'#343434',stroke:'#8b8475','stroke-width':.35}));
 layer.append(rect(board,{fill:'#d6b46b'}));
 layer.append(rect(DISTRICT_HQ,{fill:'#b79a55',stroke:'#f1da9a','stroke-width':.5,rx:.5}));
 for(const shop of DISTRICT_SHOPS)layer.append(rect(shop,{fill:'#4e8574',stroke:'#b3c6af','stroke-width':.35,rx:.3}));
 const buildings=new Map<number,SVGRectElement>();
 for(const b of places){const box=rect(b,{fill:b.number===SOUVENIR_NUMBER?'#d4b56b':'#454545',stroke:'#888278','stroke-width':.45,rx:.6});buildings.set(b.number,box);layer.append(box);}
 route.setAttribute('stroke','#f5ca70');route.setAttribute('stroke-width','2.1');route.setAttribute('stroke-linecap','round');route.setAttribute('stroke-linejoin','round');route.removeAttribute('hidden');svg.append(route);
 for(const b of places){const t=node('text',{x:mx(b.x),y:mz(b.z)+1.45,fill:'#ffffff','font-size':5.1,'font-weight':800,'text-anchor':'middle','paint-order':'stroke',stroke:'#141414','stroke-width':.25});t.textContent=b.number===SOUVENIR_NUMBER?'★':String(b.number);svg.append(t);}
 goal.setAttribute('fill','#f5ca70');goal.setAttribute('stroke','#25211b');goal.setAttribute('stroke-width','.65');goal.setAttribute('r','2.3');svg.append(goal);
 player.setAttribute('fill','#ffffff');player.setAttribute('stroke','#141414');player.setAttribute('stroke-width','.7');player.setAttribute('d','M0 -4L2.8 3 0 1.7-2.8 3Z');svg.append(player);
 map.classList.add('compactCityMap');hud.prepend(map);svg.setAttribute('aria-label','Peta jalan dan gedung HAJJI CITY, posisi pemain dan tujuan emas');
 let last:Point|null=null,lastTarget=-1,lastTime=-Infinity,points:Point[]=[],requestId=0,pending=false,lastPaint=-Infinity,latest:Point={x:0,z:0};
 const locationName=document.getElementById('locationName')!,targetDistance=document.getElementById('targetDistance')!;
 let worker:Worker|null=null;
 try{worker=new Worker(new URL('./cityRoute.worker.ts',import.meta.url),{type:'module'});worker.postMessage({type:'init',roads,solids:solids.map(r=>({x:r.x,z:r.z,w:r.w,d:r.d}))});worker.onmessage=(event:MessageEvent<{id:number;points:Point[]}>)=>{if(event.data.id!==requestId)return;pending=false;points=event.data.points;};worker.onerror=()=>{worker?.terminate();worker=null;pending=false;points=[];};}catch{worker=null;}
 function attr(el:Element,key:string,value:string){if(el.getAttribute(key)!==value)el.setAttribute(key,value);}
 function update(p:Point,yaw:number,target:number,now:number){const b=places.find(b=>b.number===target);if(!b)return;latest={x:p.x,z:p.z};
  const changed=target!==lastTarget;
  if(changed){lastTarget=target;points=[];pending=false;requestId++;last=null;for(const [n,box] of buildings){attr(box,'fill',n===target?'#d6b46b':n===SOUVENIR_NUMBER?'#d4b56b':'#454545');attr(box,'stroke',n===target?'#fff1c5':'#888278');attr(box,'stroke-width',n===target?'1.15':'.45');}attr(goal,'cx',String(mx(b.door.x)));attr(goal,'cy',String(mz(b.door.z)));locationName.textContent=target===SOUVENIR_NUMBER?'GEDUNG OLEH-OLEH':'GEDUNG '+target;}
  const follow=followCityRoute(p,points);
  if(worker&&(!pending||now-lastTime>8000)&&(changed||!last||now-lastTime>1600&&Math.hypot(p.x-last.x,p.z-last.z)>3&&follow.deviation>4)){last={...latest};lastTime=now;pending=true;worker.postMessage({type:'route',id:++requestId,start:last,goal:b.door});}
  if(!changed&&now-lastPaint<80)return;lastPaint=now;
  attr(player,'transform',`translate(${mx(p.x).toFixed(2)} ${mz(p.z).toFixed(2)}) rotate(${Math.round(180-yaw*180/Math.PI)})`);
  const line=follow.tail.length&&follow.deviation<8?[p,...follow.tail]:[];
  attr(route,'points',line.map(q=>mx(q.x).toFixed(2)+','+mz(q.z).toFixed(2)).join(' '));route.toggleAttribute('hidden',line.length<2);
  const remaining=follow.tail.length&&follow.deviation<8?follow.remaining:Math.hypot(p.x-b.door.x,p.z-b.door.z);
  const label=Math.round(remaining)+' m';if(targetDistance.textContent!==label)targetDistance.textContent=label;
 }
 return {update,dispose(){worker?.terminate();worker=null;}};
}
