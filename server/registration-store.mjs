import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createHash} from 'node:crypto';
export const TICKET={amount:100000,bank:'BCA',account:'1480945529',holder:'VINI J',currency:'IDR'};
const digest=value=>createHash('sha256').update(value).digest('hex');
export function registrationStore(path){
 const db=new DatabaseSync(path);db.exec(`PRAGMA journal_mode=WAL;CREATE TABLE IF NOT EXISTS registrations(
 id TEXT PRIMARY KEY, secret_hash TEXT NOT NULL UNIQUE, name TEXT NOT NULL, phone TEXT NOT NULL,
 program TEXT NOT NULL, avatar TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
 reference TEXT, created TEXT NOT NULL, claimed TEXT, approved TEXT);
 CREATE TABLE IF NOT EXISTS magic_links(token_hash TEXT PRIMARY KEY,registration_id TEXT NOT NULL REFERENCES registrations(id),created TEXT NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS access_sessions(secret_hash TEXT PRIMARY KEY,link_hash TEXT NOT NULL REFERENCES magic_links(token_hash),created TEXT NOT NULL);`);
 const publicRow=r=>r?{id:r.id,name:r.name,program:r.program,avatar:r.avatar,status:r.status,created:r.created,claimed:r.claimed,approved:r.approved,reference:r.reference}:null;
 function get(secret){if(typeof secret!=='string'||!/^[a-f0-9]{64}$/.test(secret))return null;const hash=digest(secret);return publicRow(db.prepare('SELECT * FROM registrations WHERE secret_hash=?').get(hash)??db.prepare("SELECT r.* FROM registrations r JOIN magic_links l ON l.registration_id=r.id JOIN access_sessions s ON s.link_hash=l.token_hash WHERE s.secret_hash=? AND l.revoked=0 AND r.status='approved'").get(hash));}
 function issueForId(id){const r=db.prepare("SELECT id FROM registrations WHERE id=? AND status='approved'").get(id);if(!r)throw Error('Tiket belum aktif. Magic link hanya tersedia setelah verifikasi.');const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO magic_links(token_hash,registration_id,created) VALUES(?,?,?)').run(digest(token),id,new Date().toISOString());return {token,href:'./index.html?access=1#token='+token};}
 return {
  get,close:()=>db.close(),issueForId,
  issue(secret){const r=get(secret);if(!r)throw Error('Pendaftaran tidak ditemukan.');return issueForId(r.id);},
  redeem(token){
   if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw Error('Magic link tidak valid. Gunakan tautan lengkap dari admin.');
   const hash=digest(token),r=db.prepare("SELECT r.* FROM registrations r JOIN magic_links l ON l.registration_id=r.id WHERE l.token_hash=? AND l.revoked=0 AND r.status='approved'").get(hash);
   if(!r)throw Error('Magic link tidak aktif atau telah dicabut. Hubungi admin untuk tautan baru.');
   const secret=randomBytes(32).toString('hex');db.prepare('INSERT INTO access_sessions(secret_hash,link_hash,created) VALUES(?,?,?)').run(digest(secret),hash,new Date().toISOString());return {registration:publicRow(r),secret};
  },
  revoke(id){const r=db.prepare('UPDATE magic_links SET revoked=1 WHERE registration_id=? AND revoked=0').run(id);return r.changes;},
  create(input){
   if(typeof input?.name!=='string'||input.name.trim().length<2||input.name.trim().length>60||typeof input.phone!=='string'||!/^(?:\+?62|0)8\d{7,12}$/.test(input.phone)||!['hajj','umrah'].includes(input.program)||!['male','female'].includes(input.avatar)||input.consent!==true)throw Error('Lengkapi nama, nomor WhatsApp Indonesia, pilihan perjalanan, dan persetujuan.');
   const id='HJ-'+randomBytes(6).toString('hex').toUpperCase(),secret=randomBytes(32).toString('hex');
   db.prepare('INSERT INTO registrations(id,secret_hash,name,phone,program,avatar,created) VALUES(?,?,?,?,?,?,?)').run(id,digest(secret),input.name.trim(),input.phone,input.program,input.avatar,new Date().toISOString());
   return {registration:get(secret),secret};
  },
  claim(secret,reference){
   const row=get(secret);if(!row)throw Error('Pendaftaran tidak ditemukan.');
   if(typeof reference!=='string'||reference.trim().length<4||reference.trim().length>120)throw Error('Isi nama pengirim dan waktu / nomor referensi transfer (4–120 karakter).');
   // A player's report is never evidence of cleared funds. Only the offline admin command approves.
   if(row.status!=='approved')db.prepare("UPDATE registrations SET status='reported',reference=?,claimed=? WHERE id=?").run(reference.trim(),new Date().toISOString(),row.id);
   return get(secret);
  },
  approve(id){const result=db.prepare("UPDATE registrations SET status='approved',approved=? WHERE id=? AND status='reported'").run(new Date().toISOString(),id);if(!result.changes)throw Error('ID tidak ditemukan, belum melapor transfer, atau sudah disetujui.');},
  list:()=>db.prepare('SELECT id,name,phone,program,avatar,status,reference,created,claimed,approved FROM registrations ORDER BY created DESC LIMIT 100').all(),
 };
}
