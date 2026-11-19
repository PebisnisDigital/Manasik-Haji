import type {Program} from './coreProgress.ts';
export interface Certificate{id:string;name:string;program:Program;date:string;verified:boolean}
export const validCode=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
export const programName=(p:Program)=>p==='hajj'?'Manasik Haji Tamattu’':'Manasik Umroh';
export const serial=(c:Certificate)=>(c.verified?'UD-':'LATIHAN-')+(c.program==='hajj'?'H-':'U-')+c.id.toUpperCase();
export function verifyUrl(id:string,base:string){if(!validCode(id))throw Error('Kode tidak valid.');const u=new URL('./verify.html',base);u.searchParams.set('c',id.toLowerCase());return u.href;}
export function issuedDate(d:string){const v=new Date(d);return Number.isFinite(v.getTime())?v.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'}):'Tanggal tidak tercatat';}
export function certificatePdf(jpeg:Uint8Array,w:number,h:number):Uint8Array{
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<=0||h<=0||jpeg[0]!==255||jpeg[1]!==216)throw Error('Gambar tidak valid.');
 const enc=new TextEncoder(),parts:Uint8Array[]=[],offsets=[0];let size=0;
 const write=(v:string|Uint8Array)=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);size+=b.length;};
 const obj=(n:number,s:string)=>{offsets[n]=size;write(n+' 0 obj\n'+s+'\nendobj\n');};
 write('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
 offsets[4]=size;write('4 0 obj\n<< /Type /XObject /Subtype /Image /Width '+w+' /Height '+h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n');write(jpeg);write('\nendstream\nendobj\n');
 const content='q\n841.89 0 0 595.28 0 0 cm\n/Im0 Do\nQ\n';obj(5,'<< /Length '+enc.encode(content).length+' >>\nstream\n'+content+'endstream');
 const xref=size;write('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)write(String(offsets[i]).padStart(10,'0')+' 00000 n \n');write('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');const out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;
}