import {rest} from './commercialApi.ts';import {validCode,type Certificate} from './certificateModel.ts';import type {Program} from './coreProgress.ts';
export interface RegistryRow{id:string;name:string;program:Program;issued_at:string;revoked_at:string|null;source_ref?:string}
const cols='id,name,program,issued_at,revoked_at';
export async function lookupCertificate(id:string):Promise<RegistryRow|null>{if(!validCode(id))return null;const code=id.toLowerCase();return (await rest<RegistryRow[]>('manasik_certificates?select='+cols+'&id=eq.'+code,{clientInfo:'umroh-cert/1 '+code}))[0]??null;}
export const registryModel=(r:RegistryRow):Certificate=>({id:r.id,name:r.name,program:r.program,date:r.issued_at,verified:true});
export const listCertificates=()=>rest<RegistryRow[]>('manasik_certificates?select='+cols+',source_ref&order=issued_at.desc&limit=100',{auth:true});
export const issueCertificate=(name:string,program:Program,source:string)=>rest<RegistryRow[]>('manasik_certificates?select='+cols+',source_ref',{method:'POST',auth:true,prefer:'return=representation',body:{name:name.trim(),program,source_ref:source.trim(),consent_public:true,reviewed:true}});
export function revokeCertificate(id:string){if(!validCode(id))throw Error('Kode tidak valid.');return rest<RegistryRow[]>('manasik_certificates?id=eq.'+id+'&revoked_at=is.null&select='+cols,{method:'PATCH',auth:true,prefer:'return=representation',body:{revoked_at:new Date().toISOString()}});}
