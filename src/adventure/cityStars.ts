import {playerKey} from '../playerCloud.ts';
export type Completion={number:number;done:boolean};
export function validStars(raw:unknown,levels:readonly Completion[]):number[]{
 if(!Array.isArray(raw))return [];
 return [...new Set(raw.filter((n):n is number=>Number.isInteger(n)&&levels.some(l=>l.number===n&&l.done)))].sort((a,b)=>a-b);
}
export function awardStar(raw:unknown,levels:readonly Completion[],number:number){
 const current=validStars(raw,levels);
 if(!levels.some(l=>l.number===number&&l.done)||current.includes(number))return {stars:current,awarded:false};
 return {stars:[...current,number].sort((a,b)=>a-b),awarded:true};
}
const key=()=>playerKey('manasik-city-stars-v1');
export function readStars(levels:readonly Completion[]){try{return validStars(JSON.parse(localStorage.getItem(key())??'[]'),levels);}catch{return [];}}
export function claimStar(levels:readonly Completion[],number:number){const result=awardStar(readStars(levels),levels,number);if(!result.awarded)return {...result,stored:result.stars.includes(number)};try{localStorage.setItem(key(),JSON.stringify(result.stars));return {...result,stored:true};}catch{return {stars:readStars(levels),awarded:false,stored:false};}}
