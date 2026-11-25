/** Building identifier only: the pilgrimage still has exactly twelve levels. */
export const SOUVENIR_NUMBER=13;
export const SOUVENIR_BUILDING={x:6,z:-56,yaw:0,w:20,d:20,height:13,number:SOUVENIR_NUMBER,guardName:'Pak Rahmat',door:{x:6,z:-45.1}};
export function canOpenSouvenir(complete:boolean,stars:readonly number[],example=false,preview=false){return !example&&!preview&&complete&&Array.from({length:12},(_,i)=>i+1).every(n=>stars.includes(n));}
