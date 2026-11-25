import * as THREE from 'three';
type Identity={name:string;email:string;phone:string};
type Anchor={x:number;z:number};
type Options={title:string;playerName:string;practice:boolean;example:boolean;validCode:(code:string)=>boolean;verify:(identity:Identity)=>Promise<boolean>;check:(code:string)=>{allowed:boolean;done:boolean;message:string};onEnter:(code:string)=>void;onDone:()=>void;onClose:()=>void};
export function mountDistrictGuard(o:Options){
 const root=document.createElement('section');root.className='districtGuardTalk';root.setAttribute('aria-label','Percakapan dengan '+o.title);
 const bubble=document.createElement('div');bubble.className='districtSpeech';bubble.setAttribute('aria-live','polite');
 const who=document.createElement('strong'),line=document.createElement('p');bubble.append(who,line);
 const answer=document.createElement('div');answer.className='districtGuardAnswer';
 const close=document.createElement('button');close.type='button';close.className='districtGuardClose';close.textContent='×';close.setAttribute('aria-label','Tutup percakapan');
 root.append(bubble,answer,close);document.body.append(root);
 let disposed=false,timer:ReturnType<typeof setTimeout>|undefined,side:'guard'|'player'='guard',code='';
 const identity:Identity={name:o.playerName,email:'',phone:''};
 function say(text:string,s:'guard'|'player'='guard'){side=s;who.textContent=s==='guard'?o.title:identity.name||'Pemain';line.textContent=text;}
 function dispose(){if(disposed)return;disposed=true;clearTimeout(timer);document.removeEventListener('keydown',escape);root.remove();o.onClose();}
 function escape(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();dispose();}}
 close.onclick=dispose;document.addEventListener('keydown',escape);
 function choose(label:string,run:()=>void){const b=document.createElement('button');b.type='button';b.className='primary';b.textContent=label;b.onclick=run;answer.append(b);}
 function ask(text:string){clearTimeout(timer);answer.replaceChildren();say(text);}
 function reply(text:string,next:()=>void){answer.replaceChildren();say(text,'player');clearTimeout(timer);timer=setTimeout(()=>{if(!disposed)next();},950);}
 function field(question:string,placeholder:string,type:string,value:string,valid:(v:string)=>boolean,next:(v:string)=>void,max=150){
  ask(question);const form=document.createElement('form');const input=document.createElement('input');input.type=type;input.required=true;input.placeholder=placeholder;input.setAttribute('aria-label',placeholder);input.value=value;input.maxLength=max;input.autocomplete=type==='email'?'email':type==='tel'?'tel':'off';const b=document.createElement('button');b.className='primary';b.type='submit';b.textContent='KIRIM';form.append(input,b);answer.append(form);
  input.oninput=()=>input.setCustomValidity('');form.onsubmit=e=>{e.preventDefault();const v=input.value.trim();if(!valid(v)){input.setCustomValidity('Periksa kembali isian ini.');input.reportValidity();return;}next(v);};input.focus({preventScroll:true});
 }
 function result(){const r=o.check(code);ask(r.message);if(r.done){choose('Terima bintang',()=>{dispose();o.onDone();});}else if(r.allowed){choose('MASUK',()=>{const current=o.check(code);if(!current.allowed||current.done){result();return;}dispose();o.onEnter(code);});}else choose('Baik',dispose);}
 async function verify(){ask('Terima kasih. Mohon tunggu, saya cek identitas dan progresnya dulu.');try{const ok=await o.verify(identity);if(disposed)return;if(ok){identity.email='';identity.phone='';result();}else{ask('Maaf, data belum cocok dengan tiket aktif. Gunakan data pendaftaran yang sama.');choose('Perbaiki data',name);}}catch{if(!disposed){ask('Pemeriksaan belum tersambung. Silakan coba lagi.');choose('Coba lagi',()=>void verify());}}}
 function phone(){field('Nomor WhatsApp-nya berapa?','Nomor WhatsApp','tel',identity.phone,v=>/^\+?[0-9]{10,16}$/.test(v.replace(/[\s()-]/g,'')),v=>{identity.phone=v;reply('Nomor WA sudah saya isi.',()=>void verify());},24);}
 function email(){field('Emailnya apa?','Alamat email','email',identity.email,v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),v=>{identity.email=v;reply('Email sudah saya isi.',phone);});}
 function name(){field('Boleh tahu namanya siapa?','Nama lengkap','text',identity.name,v=>v.length>=2,v=>{identity.name=v;reply('Nama saya '+v+'.',email);},60);}
 function exampleCode(){field('Untuk latihan gratis, masukkan kata kunci akses.','Kata kunci','text',code,o.validCode,v=>{code=v;reply('Kode sudah saya isi.',result);},30);}
 ask('Assalamualaikum! Selamat datang. Saya periksa akses dan progres perjalanan Anda dulu, ya.');
 choose('LANJUT',()=>o.example?exampleCode():o.practice?result():name());
 function layout(camera:THREE.Camera,guard:Anchor){
  const p=new THREE.Vector3(guard.x,2.18,guard.z).project(camera),w=innerWidth,h=innerHeight,bw=bubble.offsetWidth,bh=bubble.offsetHeight;
  const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(Math.max(a,b),v));
  const x=clamp((p.x*.5+.5)*w-bw/2,12,w-bw-12);
  const y=side==='player'?clamp(h-answer.offsetHeight-bh-30,60,h-bh-12):clamp((.5-p.y*.5)*h-bh-12,60,h-bh-12);
  bubble.style.left=x+'px';bubble.style.top=y+'px';bubble.dataset.side=side;
 }
 return {dispose,layout};
}
export async function verifyDistrictIdentity(identity:Identity,program:string){
 const res=await fetch(new URL('./api/registration',location.href),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(8000)});
 if(!res.ok)throw Error('Pemeriksaan gagal');
 const r=(await res.json()).registration;
 const text=(v:unknown)=>typeof v==='string'?v.trim().toLowerCase().replace(/\s+/g,' '):'';
 const phone=(v:unknown)=>{const n=typeof v==='string'?v.replace(/\D/g,''):'';return n.startsWith('0')?'62'+n.slice(1):n;};
 return !!r&&r.status==='approved'&&!r.access_suspended&&r.program===program&&!!text(r.email)&&!!phone(r.phone)&&text(r.name)===text(identity.name)&&text(r.email)===text(identity.email)&&phone(r.phone)===phone(identity.phone);
}
