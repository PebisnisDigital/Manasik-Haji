export const backendUrl=(import.meta.env.VITE_SUPABASE_URL??'').replace(/\/$/,'');
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY??'';
export const configured=Boolean(/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(backendUrl)&&key);
const SESSION='manasik-auth-v3';
export interface Account{id:string;email?:string;app_metadata?:{manasik_superadmin?:boolean}}
interface Session{access_token:string;refresh_token:string;expires_at?:number;expires_in?:number;user:Account}
export function session():Session|null{try{return JSON.parse(sessionStorage.getItem(SESSION)??'null');}catch{return null;}}
function store(s:Session){if(!s.expires_at)s.expires_at=Math.floor(Date.now()/1000)+(s.expires_in??3600);sessionStorage.setItem(SESSION,JSON.stringify(s));}
export function logoutLocal(){sessionStorage.removeItem(SESSION);}
async function request<T>(path:string,method='GET',body?:unknown,token?:string,prefer?:string):Promise<T>{
 if(!configured)throw new Error('Database belum dikonfigurasi.');
 const headers:Record<string,string>={apikey:key,'Content-Type':'application/json'};
 if(token)headers.Authorization='Bearer '+token;if(prefer)headers.Prefer=prefer;
 const res=await fetch(backendUrl+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await res.text();let data:any=null;try{data=raw?JSON.parse(raw):null;}catch{}
 if(!res.ok)throw new Error(data?.message??data?.msg??data?.error_description??'Permintaan gagal ('+res.status+').');
 return data as T;
}
export async function signIn(email:string,password:string){const s=await request<Session>('/auth/v1/token?grant_type=password','POST',{email,password});store(s);return s.user;}
export async function signUp(email:string,password:string){const result=await request<Partial<Session>>('/auth/v1/signup','POST',{email,password});if(result.access_token&&result.refresh_token&&result.user){store(result as Session);return true;}return false;}
let refreshing:Promise<string>|null=null;
export async function token():Promise<string>{
 let s=session();if(!s)throw new Error('Silakan masuk terlebih dahulu.');
 if((s.expires_at??0)>Date.now()/1000+60)return s.access_token;
 if(!refreshing)refreshing=request<Session>('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:s.refresh_token}).then(v=>{store(v);return v.access_token;}).catch(e=>{logoutLocal();throw e;}).finally(()=>{refreshing=null;});
 return refreshing;
}
export async function me(){return request<Account>('/auth/v1/user','GET',undefined,await token());}
export async function logout(){try{if(session())await request('/auth/v1/logout','POST',undefined,await token());}catch{}finally{logoutLocal();}}
export async function rest<T>(path:string,opts:{method?:string;body?:unknown;auth?:boolean;prefer?:string}={}):Promise<T>{return request<T>('/rest/v1/'+path,opts.method??'GET',opts.body,opts.auth?await token():undefined,opts.prefer);}
