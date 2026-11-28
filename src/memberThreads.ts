export const threadsIcon='<path d="M17.8 9.6c-.4-3-2.3-4.7-5.6-4.7-4.4 0-7 3.2-7 7.1s2.5 7.1 7 7.1c3.7 0 6.6-2.1 6.6-5.2 0-2.7-2.1-4.3-5.4-4.3-2.7 0-4.3 1.4-4.3 3.1 0 1.6 1.3 2.7 3 2.7 2.2 0 3.8-2 3.8-5.1 0-2.3-1.3-3.8-3.4-3.8-1.4 0-2.4.5-3.2 1.4"/>';
type State={status?:string;username?:string;enabled?:boolean;url?:string;error?:string};
async function request(action:string,data:Record<string,unknown>={}):Promise<State>{
 const res=await fetch('/api/threads?action='+action,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(25000)});
 const d=await res.json();if(!res.ok)throw Error(d.error||'Layanan Threads belum tersedia.');return d;
}
export async function paidMember(){try{const r=await fetch('/api/registration',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(8000)});const d=await r.json();return r.ok&&d.registration?.status==='approved'&&!d.registration.access_suspended;}catch{return false;}}
export function threadsContent(){
 const body=document.createElement('div');body.className='memberThreadsContent';
 const intro=document.createElement('p');intro.textContent='Konten jalan. Anda tinggal berinteraksi.';
 const benefits=document.createElement('ul');for(const t of ['150 konten selama 30 hari','5 postingan per hari: teks dan gambar','Tim HAJJI.DIGITAL menyiapkan dan menjadwalkan konten otomatis','Tidak perlu memberikan password']){const li=document.createElement('li');li.textContent=t;benefits.append(li);}
 const action=document.createElement('button');action.type='button';action.className='threadsPrimaryButton';action.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+threadsIcon+'</svg><span>Hubungkan Threads</span><span aria-hidden="true">→</span>';
 const disconnect=document.createElement('button');disconnect.type='button';disconnect.className='disconnect';disconnect.textContent='Putuskan koneksi';disconnect.hidden=true;
 const note=document.createElement('p');note.className='threadsNote';note.setAttribute('role','status');note.hidden=true;
 let gen=0,busy=false,processing=false;
 function say(message:string){note.textContent=message;note.hidden=!message;}
 function update(){action.disabled=busy||processing;}
 async function refresh(){
  const id=++gen;busy=false;processing=false;action.hidden=false;benefits.hidden=false;disconnect.hidden=true;intro.textContent='Konten jalan. Anda tinggal berinteraksi.';say('');update();
  try{const d=await request('status');if(id!==gen)return;
   if(['connected','disconnected','disconnecting'].includes(d.status??'')){
    intro.textContent=(d.username?'@'+d.username+' · ':'')+(d.status==='connected'?'Akun Threads sudah terhubung.':'Koneksi terputus atau sedang dihentikan.');
    action.hidden=true;benefits.hidden=true;disconnect.hidden=false;say('Anda dapat menghentikan layanan kapan saja.');
   }else if(d.status==='processing'){processing=true;say('Koneksi sedang diperiksa. Hubungi tim support jika belum selesai.');}
   update();
  }catch{if(id===gen){update();}}
 }
 action.onclick=async()=>{
  if(busy||processing)return;const id=++gen;busy=true;update();say('Membuka halaman resmi Threads…');
  try{const d=await request('start',{consent:true});if(id!==gen)return;const url=new URL(d.url??'');if(url.protocol!=='https:'||!['threads.net','www.threads.net','threads.com','www.threads.com'].includes(url.hostname))throw Error('URL otorisasi tidak valid.');location.assign(url.href);}
  catch(e){if(id===gen){say(e instanceof Error?e.message:'Koneksi gagal.');busy=false;update();}}
 };
 disconnect.onclick=async()=>{if(busy||!confirm('Hentikan layanan konten otomatis HAJJI.DIGITAL dan putuskan koneksi akun Threads ini?'))return;busy=true;disconnect.disabled=true;try{await request('disconnect',{confirm:true});await refresh();}catch(e){say(e instanceof Error?e.message:'Koneksi belum diputus.');}finally{busy=false;disconnect.disabled=false;update();}};
 function clear(){gen++;busy=false;processing=false;update();say('');}
 body.append(intro,benefits,action,disconnect,note);return {body,refresh,clear};
}
export function mountStandaloneThreads(){
 if(window.parent!==window||document.getElementById('gameThreadsButton')||document.getElementById('memberThreadsShortcut'))return;
 const button=document.createElement('button');button.type='button';button.id='memberThreadsShortcut';button.className='memberSupportStandalone';button.title='Threads';button.setAttribute('aria-label','Threads Autopilot');button.setAttribute('aria-expanded','false');button.hidden=true;button.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+threadsIcon+'</svg>';
 const panel=document.createElement('aside');panel.id='memberThreadsPanel';panel.hidden=true;panel.setAttribute('aria-label','Threads Autopilot');const header=document.createElement('header'),title=document.createElement('strong'),close=document.createElement('button');title.textContent='Threads Autopilot';close.type='button';close.textContent='×';close.setAttribute('aria-label','Tutup');header.append(title,close);const content=threadsContent();panel.append(header,content.body);document.body.append(button,panel);
 const finish=()=>{panel.hidden=true;content.clear();button.setAttribute('aria-expanded','false');};button.onclick=()=>{if(!panel.hidden){finish();return;}panel.hidden=false;button.setAttribute('aria-expanded','true');void content.refresh();};close.onclick=finish;document.addEventListener('pointerdown',e=>{if(e.target instanceof Node&&!panel.contains(e.target)&&!button.contains(e.target))finish();},true);document.addEventListener('keydown',e=>{if(e.key==='Escape')finish();});void paidMember().then(ok=>{if(ok&&!document.getElementById('gameThreadsButton'))button.hidden=false;});
}
