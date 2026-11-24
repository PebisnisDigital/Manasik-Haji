import {tenantUrl} from '../tenant.ts';
/** Navigation preference only; district access is rechecked by its registration API. */
export function districtReturnUrl():string|null{
 try{const mode=sessionStorage.getItem('hajji-district-return');if(mode==='magic'||mode==='demo'&&['localhost','127.0.0.1'].includes(location.hostname))return tenantUrl('./district.html?board='+mode);}catch{}
 return null;
}
