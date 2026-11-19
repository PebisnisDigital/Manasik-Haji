import type {Program,CoreStep} from './coreProgress.ts';
export interface ProgramSetting{program:Program;new_sessions_open:boolean;updated_at:string}
export interface Summary{participants:number;runs:number;umrah_runs:number;hajj_runs:number;umrah_done:number;hajj_done:number;active_7d:number;cert_active:number;cert_revoked:number;partners:number;partners_active:number}
export interface AdminRun{user_id:string;name:string;run_id:string;scope:string;program:Program;step:CoreStep;checkpoint:number;completed_at:string|null;updated_at:string;certificate_active:boolean}
export interface RunPage{total:number;rows:AdminRun[]}
export const complete=(r:Pick<AdminRun,'program'|'step'>)=>r.step===(r.program==='hajj'?18:5);
export function rate(done:number,total:number){return total>0?Math.round(Math.min(1,Math.max(0,done/total))*100):0;}
export function pages(total:number){return Math.max(1,Math.ceil(total/25));}
export function newSessionAllowed(settings:ProgramSetting[]|null,program:Program):boolean{return settings?.find(s=>s.program===program)?.new_sessions_open!==false;}
