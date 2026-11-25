import {SOUVENIR_NUMBER} from './citySouvenir.ts';
import {isExampleMode,exampleKey} from './exampleAccess.ts';
import {playerKey} from '../playerCloud.ts';
import {tenantUrl} from '../tenant.ts';
/** Navigation preference only; district access is rechecked by its registration API. */
export function districtReturnUrl():string|null{
 try{const mode=sessionStorage.getItem(exampleKey('hajji-district-return'));if(mode==='contoh'&&isExampleMode()||mode==='magic'&&!isExampleMode()||mode==='demo'&&['localhost','127.0.0.1'].includes(location.hostname))return tenantUrl('./district.html?board='+mode);}catch{}
 return null;
}

const visitKey=()=>playerKey('manasik-city-visit-v1');
export function recordDistrictVisit(number:number):boolean{try{if(!Number.isInteger(number)||number<1||number>SOUVENIR_NUMBER)return false;sessionStorage.setItem(visitKey(),String(number));return true;}catch{return false;}}
export function districtVisit():number|null{try{const n=Number(sessionStorage.getItem(visitKey()));return Number.isInteger(n)&&n>=1&&n<=SOUVENIR_NUMBER?n:null;}catch{return null;}}
export function clearDistrictVisit(){try{sessionStorage.removeItem(visitKey());}catch{}}
export function districtExitLabel(fallback:string){return districtReturnUrl()&&districtVisit()!==null?'Keluar lewat pintu gedung':fallback;}
