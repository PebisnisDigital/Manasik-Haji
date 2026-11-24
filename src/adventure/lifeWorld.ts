import type * as THREE from 'three';
import {campaignContext} from './hajjCampaign.ts';
import {playerKey} from '../playerCloud.ts';
import {readLife} from './lifeModel.ts';
type Point={x:number;z:number};
interface Options{chapter:string;station:Point;bag:Point;active:()=>boolean}
export const lifeOpen=()=>false;
export const lifeChapter=(fallback:string)=>campaignContext()?.id??fallback;
/** Simple adventure: no survival HUD, depletion, hidden speed penalty or writes to old condition saves. */
export function installLife(_scene:THREE.Scene,o:Options){
 const storage={getItem:(k:string)=>localStorage.getItem(k),setItem:(k:string,v:string)=>localStorage.setItem(k,v)};
 const old=readLife(storage,playerKey('manasik-life-v1')).save;
 return {canSprint:()=>true,factor:(_p:Point)=>1,tick:(_dt:number,_p:Point,_active:boolean,_sprint=false,_vehicle=false)=>{},campCare:(_action:'refill'|'rest'|'hydrate')=>true,
  snapshot:()=>({chapter:o.chapter,save:old,station:o.station,bag:o.bag,modal:false,travel:0,disabled:true}),dispose:()=>{}};
}
