import {configured,rest} from './commercialApi.ts';import type {Program} from './coreProgress.ts';import type {ProgramSetting,Summary,RunPage} from './adminModel.ts';
export const getProgramSettings=():Promise<ProgramSetting[]>=>configured?rest<ProgramSetting[]>('umroh_program_settings?select=program,new_sessions_open,updated_at&order=program'):Promise.resolve([]);
export const setProgramOpen=(p:Program,open:boolean)=>rest<ProgramSetting[]>('umroh_program_settings?program=eq.'+p+'&select=program,new_sessions_open,updated_at',{auth:true,method:'PATCH',prefer:'return=representation',body:{new_sessions_open:open}});
export const getSummary=()=>rest<Summary>('rpc/umroh_admin_summary',{auth:true,method:'POST',body:{}});
export const getRuns=(search:string,program:string,status:string,offset:number)=>rest<RunPage>('rpc/umroh_admin_runs',{auth:true,method:'POST',body:{p_search:search.trim().slice(0,100),p_program:program,p_status:status,p_offset:offset}});
