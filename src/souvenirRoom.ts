import {isExampleMode} from './adventure/exampleAccess.ts';
import {districtReturnUrl,districtVisit} from './adventure/districtReturn.ts';
import {canOpenSouvenir,SOUVENIR_NUMBER} from './adventure/citySouvenir.ts';
import {readStars} from './adventure/cityStars.ts';
import {requestArenaExit} from './adventure/arenaDoor.ts';
import * as THREE from 'three';
import {loadNusukRoute} from './adventure/nusukRoute.ts';
import {readField} from './adventure/campaignProgress.ts';
import {fieldChapter} from './adventure/hajjCampaign.ts';
import {readSetup} from './frontSettings.ts';
import {readStory} from './travelStory.ts';
import {gateGuide} from './gateGuide.ts';
import {tenantUrl} from './tenant.ts';
import {GIFTS,SOUVENIR_BOUNDS,DEMO_REFERRALS,bankDraft,commissionFor,demoWallet,validWithdrawal,courseUrl,type GiftId,type SouvenirSave} from './souvenirModel.ts';
import {ensureSouvenir,storeSouvenir} from './souvenirProgress.ts';
import {SOUVENIR_COURSES,SOUVENIR_ASSETS} from './souvenirConfig.ts';
import {souvenirCertificate,downloadSouvenirCertificate} from './souvenirCertificate.ts';
import {buildSouvenirWorld} from './souvenirWorld.ts';
import {attachWalker} from './coreWalk.ts';
import {createRenderBudget,graphicsTier} from './graphicsQuality.ts';
import {humanActor,updateHumanActors,disposeHumanActors} from './characters/HumanActors.ts';
import {installLandscape} from './coreLandscape.ts';
import {simpleMenuOpen} from './simpleInput.ts';
import {mountSimplePlayHud,notifySimplePlay} from './simplePlayHud.ts';
import './coreTraining.css';
import './souvenirRoom.css';

const $=<T extends HTMLElement>(id:string)=>document.getElementById(id)! as T;
const rupiah=(amount:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(amount);
const preview=new URLSearchParams(location.search).get('demo')==='1'&&['localhost','127.0.0.1'].includes(location.hostname);
function fallback(title:string,body:string){const box=document.createElement('section');box.className='roomFallback';const h=document.createElement('h1'),p=document.createElement('p'),a=document.createElement('a');h.textContent=title;p.textContent=body;a.textContent='Kembali ke peta perjalanan';a.href=districtReturnUrl()??tenantUrl('./adventure-map.html?journey=hajj');box.append(h,p,a);$('souvenirRoom').replaceChildren(box);$('giftDialog').remove();}
function boot(){
 const route=loadNusukRoute(),cityEntry=new URLSearchParams(location.search).get('city')==='1',fromCity=cityEntry&&districtVisit()===SOUVENIR_NUMBER&&!!districtReturnUrl();if(!preview&&isExampleMode()){fallback('Hadiah peserta berbayar','Mode CONTOH tidak menerbitkan hadiah nyata.');return;}if(cityEntry&&(!fromCity||!canOpenSouvenir(route.complete,readStars(route.chapters)))){fallback('Gedung oleh-oleh terkunci','Kumpulkan 12 bintang dan masuk melalui penjaga gedung.');return;}if(!preview&&!route.complete){fallback('Oleh-oleh menunggumu',route.done+'/12 level selesai. Tuntaskan seluruh perjalanan haji untuk membuka ruang pribadi ini.');return;}
 const completed=readField(fieldChapter('wada')!),avatar=readSetup()?.avatar??completed?.avatar??'male',guide=gateGuide(avatar).name;
 const storyName=readStory().name,name=preview?'Tamu Demo':storyName&&storyName!=='Petualang'?storyName:completed?.name||'Petualang';
 const owner=preview?'preview-local':completed?.id;if(!owner){fallback('Checkpoint belum ditemukan','Buka kembali hasil Tawaf Wada’ untuk melanjutkan.');return;}
 const initial=ensureSouvenir(owner,name);if(!initial){fallback('Ruang belum dapat disimpan','Periksa penyimpanan browser atau versi game. Progres 12 level tetap dipertahankan.');return;}
 let exiting=false;let record:SouvenirSave=initial,current:GiftId='guide',disposed=false,portrait=()=>false,pendingDemo=0;
 const requests:{amount:number;bank:string;account:string}[]=[];
 const dialog=$<HTMLDialogElement>('giftDialog'),content=$('giftContent'),actions=$('giftActions');
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xc7d9d4);scene.fog=new THREE.Fog(0xc7d9d4,35,65);
 const camera=new THREE.PerspectiveCamera(58,1,.08,80),canvas=$<HTMLCanvasElement>('souvenirWorld');
 const renderer=new THREE.WebGLRenderer({canvas,antialias:graphicsTier()!=='low',powerPreference:'low-power'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 scene.add(new THREE.HemisphereLight(0xfff4da,0x657d69,2.4));const sun=new THREE.DirectionalLight(0xffe4b6,2.4);sun.position.set(-7,13,8);scene.add(sun);
 const world=buildSouvenirWorld(scene),budget=createRenderBudget(renderer,{maxFps:30});
 const blocked=()=>disposed||simpleMenuOpen()||dialog.open||portrait()||document.hidden||budget.lost();
 const guideActor=humanActor(scene,0x285f49,avatar==='female');guideActor.position.set(.9,0,1);guideActor.rotation.y=0;
 const walker=attachWalker(scene,camera,canvas,$('souvenirRoom'),{avatar,wardrobe:'casual',lifeKind:'souvenir',arenaEntry:[0,7],blocked,onNear:()=>{paint();}},SOUVENIR_BOUNDS,world.obstacles,[0,7],[0,2]);
 document.title='Oleh-oleh '+record.name+' · HAJJI.DIGITAL';$('levelLabel').textContent='12/12 · OLEH-OLEH '+(preview?'DEMO':record.name.toUpperCase());
 function p(text:string,small=false){const el=document.createElement('p');el.textContent=text;if(small)el.className='fine';content.append(el);return el;}
 function button(label:string,fn:()=>void,secondary=false,host:HTMLElement=actions){const b=document.createElement('button');b.type='button';b.textContent=label;if(secondary)b.className='secondary';b.onclick=fn;host.append(b);return b;}
 function show(title:string){dialog.classList.remove('giftGuideTalk');walker.endTalk();content.replaceChildren();actions.replaceChildren();$('giftNotice').textContent='';$('giftTitle').textContent=title;$('giftEyebrow').textContent=(preview?'PRATINJAU · ':'')+record.name+' · '+guide;window.dispatchEvent(new Event('blur'));if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
 function focusDialog(){(actions.querySelector('button,a') as HTMLElement|null)?.focus({preventScroll:true});}
 function close(){walker.endTalk();dialog.classList.remove('giftGuideTalk');content.querySelectorAll('video,audio').forEach(el=>(el as HTMLMediaElement).pause());content.replaceChildren();dialog.close();window.dispatchEvent(new Event('blur'));paint();}
 $('giftClose').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const items=Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')).filter(el=>el.getClientRects().length>0),first=items[0],last=items.at(-1);if(!first||!last)return;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){e.preventDefault();first.focus();}});
 function update(next:SouvenirSave){if(!storeSouvenir(next)){$('giftNotice').textContent='Perubahan belum tersimpan. Periksa penyimpanan browser lalu coba lagi.';return false;}record=next;$('souvenirRoom').dataset.received=String(record.received);return true;}
 function choose(id:GiftId){if(!record.received&&id!=='guide'){notifySimplePlay('Temui '+guide+' untuk menerima oleh-oleh terlebih dahulu.');return;}current=id;const g=GIFTS.find(g=>g.id===id)!;walker.setGoal(g.x,g.z);paint();}
 function inventory(){show('Ruang oleh-oleh '+record.name);p('Ketuk tujuan, lalu pilih JALAN KE LOKASI. Kamu juga bisa berjalan sendiri dan mengetuk papan hadiah.');const grid=document.createElement('div');grid.className='giftGrid';content.append(grid);for(const g of GIFTS){const b=button(g.id==='guide'?guide:g.title,()=>{choose(g.id);close();},false,grid);const small=document.createElement('small');small.textContent=g.hint;b.append(small);}if(fromCity)button('Kembali ke pintu masuk',()=>{close();exiting=true;$('actions').replaceChildren();$('title').textContent='Kembali ke pintu masuk';requestArenaExit();},true);button('Kembali ke ruangan',close,true);focusDialog();}
 function intro(){show(record.received?'Selamat datang kembali!':'Alhamdulillah, perjalananmu tuntas!');p('Saya '+guide+'. '+(record.received?'Semua oleh-olehmu ada di ruangan ini. Silakan dibuka kembali kapan saja.':'Selamat, '+record.name+'! Dua belas level telah kamu selesaikan. Temui saya di karpet tengah untuk menerima oleh-oleh spesial Haji Digital.'));if(preview)p('Pratinjau ruangan. Progres permainan utama tidak diubah.',true);button(record.received?'Jelajahi oleh-oleh':'Temui '+guide,()=>{close();if(record.received)inventory();else choose('guide');});focusDialog();}
 function handover(){show('Oleh-oleh dari '+guide);dialog.classList.add('giftGuideTalk');walker.talkTo(guideActor.position.x,1.62,guideActor.position.z);p('Selamat, '+record.name+'! Saya berikan sertifikat Haji Digital, kupon referral komisi 30%, dompet komisi, serta koleksi penghargaan, bekal ibadah dan dua bioskop kelas animasi. Semua hadiah dapat diakses langsung di gedung ini.');button('Terima oleh-oleh spesial',()=>{if(update({...record,received:true})){close();notifySimplePlay('Alhamdulillah! Dekati masing-masing oleh-oleh untuk membukanya.');}});focusDialog();}
 function certificate(){show('Sertifikat Haji Digital');p('Diberikan kepada '+record.name+' atas penyelesaian seluruh 12 level petualangan manasik haji.');const art=document.createElement('div');content.append(art);const c=souvenirCertificate(art,record);button('Unduh sertifikat PDF',()=>downloadSouvenirCertificate(c,record));button('Kembali ke ruangan',close,true);focusDialog();}
 function coupon(){show('Kupon referral pribadi');p('Selamat alumni! Ajukan verifikasi kelulusan untuk mengaktifkan affiliate, lalu buat kode kupon dan link sendiri.');button('Aktifkan affiliate saya',()=>location.assign(tenantUrl('./affiliate.html')),true);focusDialog();}
 function wallet(example:boolean){show('Dompet komisi '+record.name);if(!example){p('Buka dashboard affiliate untuk melihat saldo, riwayat komisi dan pengajuan pencairan.');button('Buka dashboard affiliate',()=>location.assign(tenantUrl('./affiliate.html')),true);focusDialog();return;}const totals=example?demoWallet(pendingDemo):{earned:0,paid:0,pending:0,available:0};const badge=document.createElement('span');badge.className='demoBadge';badge.textContent=example?'CONTOH ANGKA · BUKAN SALDO UANG NYATA':'BELUM TERHUBUNG KE PEMBAYARAN';content.append(badge);
  const stats=document.createElement('div');stats.className='giftStats';for(const[label,value]of [['Komisi terverifikasi',totals.earned],['Sudah ditransfer admin',totals.paid],['Menunggu admin',totals.pending],['Tersedia untuk diajukan',totals.available]] as const){const d=document.createElement('div');d.className='giftStat';const labelEl=document.createElement('small'),amount=document.createElement('strong');labelEl.textContent=label;amount.textContent=rupiah(value);d.append(labelEl,amount);stats.append(d);}content.append(stats);stats.dataset.available=String(totals.available);stats.dataset.example=String(example);
  if(example){const table=document.createElement('table');table.className='ledger';table.innerHTML='<thead><tr><th>Referral contoh</th><th>Komisi 30%</th><th>Status</th></tr></thead>';const body=document.createElement('tbody');for(const r of DEMO_REFERRALS){const tr=document.createElement('tr');for(const s of [r.name,rupiah(commissionFor(r.paid)),r.status==='verified'?'Terverifikasi':'Menunggu bayar']){const td=document.createElement('td');td.textContent=s;tr.append(td);}body.append(tr);}table.append(body);content.append(table);p('Hanya pembayaran terverifikasi masuk ke komisi. Contoh Rp30.000 sudah ditransfer; pengajuan baru mengurangi saldo tersedia.',true);}else p('Belum ada transaksi terverifikasi. Saldo mulai dari Rp0. Kamu bisa mencoba alurnya dengan data contoh.',true);
  const form=document.createElement('form');form.innerHTML='<label>Bank<input name="bank" autocomplete="off" required maxlength="40" placeholder="Nama bank"></label><label>Nama pemilik rekening<input name="holder" autocomplete="off" required maxlength="60" placeholder="Nama sesuai rekening"></label><label>Nomor rekening<input name="account" autocomplete="off" inputmode="numeric" required pattern="[0-9]{5,30}" maxlength="30" placeholder="Nomor rekening"></label>';
  const sample={bank:'BANK CONTOH',holder:'PESERTA CONTOH',account:'1234567890'},bank=record.bank??(example?sample:null);for(const k of ['bank','holder','account'] as const)if(bank)(form.elements.namedItem(k) as HTMLInputElement).value=bank[k];content.append(form);p(example?'Gunakan data contoh untuk mencoba penarikan. Tidak ada transfer atau pesan yang dikirim.':'Draf rekening disimpan hanya di browser ini. Database dan proses transfer admin disambungkan nanti.',true);
  const values=()=>bankDraft(Object.fromEntries(new FormData(form)));
  if(!example){button('Simpan draf rekening',()=>{if(!form.reportValidity())return;const bank=values();if(!bank){$('giftNotice').textContent='Lengkapi bank, pemilik dan nomor rekening yang benar.';return;}if(update({...record,bank})){$('giftNotice').textContent='Draf rekening tersimpan di browser ini.';}},false,form);const withdraw=button('Ajukan penarikan',()=>{},false,form);withdraw.disabled=true;button('Coba alur dengan data contoh',()=>wallet(true));}
  else {const label=document.createElement('label');label.textContent='Nominal pengajuan contoh (Rp)';const input=document.createElement('input');input.type='number';input.name='amount';input.min='1';input.max=String(totals.available);input.step='1';input.value=String(totals.available);label.append(input);form.append(label);const submit=button('Ajukan penarikan demo',()=>{if(!form.reportValidity())return;const bank=values(),amount=Number(input.value);if(!bank||!validWithdrawal(amount,demoWallet(pendingDemo).available)){$('giftNotice').textContent='Periksa rekening dan nominal. Nominal harus sesuai saldo contoh yang tersedia.';return;}pendingDemo+=amount;requests.push({amount,bank:bank.bank,account:bank.account.slice(-4)});wallet(true);$('giftNotice').textContent='Pengajuan contoh dicatat: menunggu admin. Tidak ada uang yang ditransfer.';},false,form);submit.disabled=totals.available===0;
   for(const request of requests){const item=document.createElement('div');item.className='giftRequest';item.textContent='Menunggu admin (demo) · '+rupiah(request.amount)+' · '+request.bank+' ••••'+request.account;content.append(item);}button('Kembali ke saldo sebenarnya (Rp0)',()=>wallet(false),true);
  }
  form.onsubmit=e=>e.preventDefault();button('Kembali ke ruangan',close,true);focusDialog();
 }
 function media(url:string,kind:'video'|'audio'){
  const parsed=new URL(url);
  if(kind==='video'&&['youtube.com','www.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(parsed.hostname)){
   const id=parsed.hostname==='youtu.be'?parsed.pathname.slice(1):parsed.searchParams.get('v')??(parsed.pathname.startsWith('/embed/')?parsed.pathname.split('/')[2]:'');
   if(id&&/^[A-Za-z0-9_-]{11}$/.test(id)){const frame=document.createElement('iframe');frame.className='souvenirVideo';frame.title='Tayangan video kelas';frame.src='https://www.youtube-nocookie.com/embed/'+id;frame.allow='fullscreen; encrypted-media; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';content.append(frame);return;}
  }
  const el=document.createElement(kind);el.controls=true;el.preload='metadata';el.src=url;if(kind==='video'){el.className='souvenirVideo';(el as HTMLVideoElement).playsInline=true;}content.append(el);
 }
 function course(id:'motion'|'stickman'){
  const title=id==='motion'?'Belajar Animasi Motion':'Belajar Animasi Stickman';
  walker.lookAt(id==='motion'?-8:8,2.1,-17.5);show('Bioskop · '+title);
  const url=courseUrl(SOUVENIR_COURSES[id]);
  if(url)media(url,'video');else{const screen=document.createElement('div');screen.className='souvenirVideo souvenirScreen';screen.textContent='TAYANGAN SEGERA HADIR';content.append(screen);p('Ruang bioskop sudah tersedia. Video kelas belum diatur.',true);}
  button('Kembali ke ruangan',close,true);focusDialog();
 }
 function extra(id:GiftId){
  const g=GIFTS.find(g=>g.id===id)!;show(g.title);
  if(id==='commission'){p('Komisi dihitung dari pembayaran peserta yang terverifikasi sesuai tarif admin. Nilai aktual dapat dilihat pada dashboard affiliate.');button('Buka dashboard affiliate',()=>location.assign(tenantUrl('./affiliate.html')));}
  else if(['medal','trophy','badge','alumni','graduates'].includes(id)){
   const art=document.createElement('div');art.className='souvenirAward';const symbol=document.createElement('strong');symbol.textContent=id==='trophy'?'🏆':id==='medal'?'🥇':id==='badge'?'★ 12/12':id==='alumni'?'ALUMNI':'LULUS';const name=document.createElement('h3');name.textContent=record.name;art.append(symbol,name);content.append(art);p('Penghargaan penyelesaian 12 level simulasi manasik. Bukan penilaian sah atau mabrurnya ibadah haji.');
  }else if(id==='tasbih'){
   let count=0;const number=document.createElement('strong');number.className='souvenirCounter';number.textContent='0';content.append(number);button('Tambah hitungan',()=>{number.textContent=String(++count);});button('Reset',()=>{count=0;number.textContent='0';},true);
  }else if(id==='replay'){p('Akses ulang mengikuti kebijakan tiket yang berlaku. Tidak ada perubahan masa aktif tiket di ruang ini.');}
  else{
   const url=courseUrl(SOUVENIR_ASSETS[id]??null);
   p(g.hint);
   if(url){if(id==='audio'||id==='congrats')media(url,id==='audio'?'audio':'video');else{const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Buka hadiah';actions.append(a);}}
   else p('Segera hadir · Materi hadiah belum tersedia.',true);
  }
  button('Kembali ke ruangan',close,true);focusDialog();
 }
 function interact(){if(blocked()||exiting)return;if(!walker.near()){walker.approach();return;}if(!record.received){handover();return;}if(current==='guide')inventory();else if(current==='certificate')certificate();else if(current==='coupon')coupon();else if(current==='wallet')wallet(false);else if(current==='motion'||current==='stickman')course(current);else extra(current);}
 let lastPaint='';function paint(){if(exiting)return;const gift=GIFTS.find(g=>g.id===current)!,near=walker.near(),signature=current+near+record.received;if(signature===lastPaint)return;lastPaint=signature;$('title').textContent=current==='guide'?'Temui '+guide:gift.title;$('body').textContent=gift.hint;const b=document.createElement('button');b.textContent=near?(current==='guide'?(record.received?'Lihat isi ruangan':'Bicara dengan '+guide):current==='certificate'?'Lihat sertifikat':current==='coupon'?'Ambil kupon':current==='wallet'?'Buka dompet':current==='motion'||current==='stickman'?'Masuk bioskop':'Buka hadiah'):'Jalan ke lokasi';b.onclick=interact;$('actions').replaceChildren(b);$('souvenirRoom').dataset.target=current;}
 $('roomInventory').onclick=()=>{if(exiting)return;if(record.received)inventory();else intro();};
 const ray=new THREE.Raycaster(),point=new THREE.Vector2();let startX=0,startY=0;canvas.addEventListener('pointerdown',e=>{startX=e.clientX;startY=e.clientY;});canvas.addEventListener('pointerup',e=>{if(blocked()||Math.hypot(e.clientX-startX,e.clientY-startY)>7)return;const rect=canvas.getBoundingClientRect();point.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(point,camera);const hit=ray.intersectObjects(world.pickable)[0];if(hit)choose(hit.object.userData.gift as GiftId);});
 const resize=()=>{budget.resize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();};window.addEventListener('resize',resize);resize();paint();mountSimplePlayHud('field');portrait=installLandscape(()=>{if(dialog.open)close();});
 let last=0;function frame(now:number){if(disposed)return;const dt=last?Math.max(0,Math.min(.05,(now-last)/1000)):0;last=now;walker.update(now);if(!blocked()&&!exiting&&record.received){const nearby=GIFTS.find(g=>Math.hypot(walker.position.x-g.x,walker.position.z-g.z)<1.1);if(nearby&&nearby.id!==current)choose(nearby.id);}world.update(now);updateHumanActors(scene,dt,!blocked(),camera);budget.draw(now,scene,camera,blocked());const root=$('souvenirRoom');root.dataset.playerX=walker.position.x.toFixed(3);root.dataset.playerZ=walker.position.z.toFixed(3);root.dataset.drawCalls=String(renderer.info.render.calls);paint();}
 renderer.setAnimationLoop(frame);$('souvenirRoom').dataset.ready='true';$('souvenirRoom').dataset.received=String(record.received);notifySimplePlay(record.received?'Dekati rak, etalase atau bioskop untuk membuka oleh-oleh.':'Temui '+guide+' di karpet tengah.');
 window.addEventListener('storage',e=>{if(!preview&&(e.key===null||/manasik-hajj-|manasik-sai-|manasik-tawaf-|journey-setup/.test(e.key)))location.reload();});window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
 window.addEventListener('pagehide',()=>{disposed=true;renderer.setAnimationLoop(null);window.removeEventListener('resize',resize);walker.dispose();disposeHumanActors(scene);world.dispose();budget.dispose();renderer.dispose();},{once:true});
}
try{boot();}catch{fallback('Ruang 3D belum dapat dibuka','Pilih grafis Rendah dan buka lagi dari peta. Progres serta hadiah yang tersimpan tetap dipertahankan.');}
