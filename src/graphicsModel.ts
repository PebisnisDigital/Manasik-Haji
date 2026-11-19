export type GraphicsTier='low'|'medium'|'high';
export type GraphicsMode='auto'|GraphicsTier;
export interface Hardware{touch:boolean;cores:number;memory?:number}
export interface GraphicsProfile{dpr:number;pixels:number;fps:number;shadows:number;texture:number;anisotropy:number;tawaf:number;sai:number;fieldDensity:number;near:number;far:number}
export const PROFILES:Record<GraphicsTier,GraphicsProfile>={
 low:{dpr:.8,pixels:700000,fps:30,shadows:0,texture:128,anisotropy:1,tawaf:72,sai:42,fieldDensity:.5,near:4,far:24},
 medium:{dpr:1.15,pixels:1500000,fps:60,shadows:512,texture:256,anisotropy:2,tawaf:124,sai:78,fieldDensity:1,near:7,far:45},
 high:{dpr:1.6,pixels:3200000,fps:60,shadows:1024,texture:512,anisotropy:4,tawaf:216,sai:144,fieldDensity:1.45,near:10,far:70}
};
export const parseGraphics=(v:string|null):GraphicsMode=>v==='low'||v==='medium'||v==='high'?v:'auto';
export function initialTier(mode:GraphicsMode,h:Hardware):GraphicsTier{if(mode!=='auto')return mode;return h.touch||h.cores<=4||(h.memory!==undefined&&h.memory<=4)?'low':'medium';}
export function renderDpr(p:GraphicsProfile,w:number,h:number,device:number,scale=1){const cap=Math.min(p.dpr,Math.sqrt(p.pixels/Math.max(1,w*h)),Math.max(.1,device||1));return Math.max(.1,cap*Math.max(.5,Math.min(1,scale)));}
export interface Adapt{scale:number;fast:number;slow:number}
export const startAdapt=():Adapt=>({scale:1,fast:0,slow:0});
export function adaptWindow(s:Adapt,meanMs:number,targetFps:number):Adapt{
 if(!Number.isFinite(meanMs)||meanMs<=0)return s;
 const target=1000/targetFps;
 if(meanMs>target*1.25){const slow=s.slow+1;return slow>=2?{scale:Math.max(.5,Math.round((s.scale-.15)*100)/100),fast:0,slow:0}:{...s,fast:0,slow};}
 if(meanMs<target*1.03){const fast=s.fast+1;return fast>=4?{scale:Math.min(1,Math.round((s.scale+.1)*100)/100),fast:0,slow:0}:{...s,slow:0,fast};}
 return {...s,fast:0,slow:0};
}
