import {cityRoute} from './cityNavigation.ts';
import type {Point,Rect} from './districtModel.ts';
let roads:Rect[]=[],solids:Rect[]=[];
self.onmessage=(event:MessageEvent<{type:'init';roads:Rect[];solids:Rect[]}|{type:'route';id:number;start:Point;goal:Point}>)=>{
 const m=event.data;
 if(m.type==='init'){roads=m.roads;solids=m.solids;return;}
 try{self.postMessage({id:m.id,points:cityRoute(m.start,m.goal,roads,solids)});}
 catch{self.postMessage({id:m.id,points:[]});}
};
