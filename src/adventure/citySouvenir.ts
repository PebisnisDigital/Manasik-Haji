import {SOUVENIR_POSITION} from './cityLayout.ts';
/** Building identifier only: the pilgrimage still has exactly twelve levels. */
export const SOUVENIR_NUMBER=13;
export const SOUVENIR_BUILDING={...SOUVENIR_POSITION,yaw:0,w:20,d:20,height:13,number:SOUVENIR_NUMBER,guardName:'Pak Rahmat',door:{x:SOUVENIR_POSITION.x,z:SOUVENIR_POSITION.z+10.9}};
export function canOpenSouvenir(complete:boolean,stars:readonly number[],example=false,preview=false){return !example&&!preview&&complete&&Array.from({length:12},(_,i)=>i+1).every(n=>stars.includes(n));}

export const CELEBRATION_FLAGS=['HAJJI|DIGITAL','SELAMAT|PESERTA','12|BINTANG','OLEH|OLEH'] as const;
export type CelebrationRole='visitor'|'press'|'committee';
export function celebrationGuests(){return Array.from({length:32},(_,i)=>{const side=i%2?-1:1,k=Math.floor(i/2),role:CelebrationRole=k<3?'press':k<5?'committee':'visitor';return {x:side*(4.2+(k%4)*1.55),z:17.8+Math.floor(k/4)*1.75+(k%2)*.35,role,female:i%3===1};});}
