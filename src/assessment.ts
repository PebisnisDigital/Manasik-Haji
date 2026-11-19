import type {Journey} from './journey.ts';
export const questions=[
 {q:'Kapan memulai ihram untuk umrah?',a:['Sebelum atau saat melewati miqat','Sesudah tawaf','Sesudah sa’i'],correct:0},
 {q:'Dalam tawaf, Ka’bah berada di sebelah…',a:['Kanan','Kiri','Bebas'],correct:1},
 {q:'Berapa putaran tawaf?',a:['Lima','Enam','Tujuh'],correct:2},
 {q:'Jika area Maqam Ibrahim padat, apa yang dilakukan?',a:['Cari tempat aman untuk salat','Tetap di jalur tawaf','Mendesak jamaah lain'],correct:0},
 {q:'Sa’i dimulai dan berakhir di mana?',a:['Marwah – Safa','Safa – Marwah','Safa – Safa'],correct:1},
 {q:'Satu lintasan sa’i berarti…',a:['Pulang pergi','Dua kali putaran','Satu perjalanan antar ujung'],correct:2},
 {q:'Kapan tahallul dalam urutan latihan umrah ini?',a:['Setelah sa’i','Sebelum tawaf','Sebelum miqat'],correct:0}
];
export function showAssessment(host:HTMLElement,j:Journey):void{
 const area=document.createElement('section');area.className='assessment';host.append(area);
 const title=document.createElement('h3');title.textContent='Evaluasi pemahaman';area.append(title);
 const form=document.createElement('form');area.append(form);
 for(let i=0;i<questions.length;i++){const field=document.createElement('fieldset');field.className='quiz';const legend=document.createElement('legend');legend.textContent=(i+1)+'. '+questions[i].q;field.append(legend);questions[i].a.forEach((a,k)=>{const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='q'+i;input.value=String(k);input.required=true;label.append(input,document.createTextNode(a));field.append(label);});form.append(field);}
 const submit=document.createElement('button');submit.className='action';submit.type='submit';submit.textContent='Periksa jawaban';form.append(submit);const result=document.createElement('p');result.setAttribute('role','status');area.append(result);
 const certificate=document.createElement('section');certificate.className='certificate';certificate.hidden=true;
 const ctitle=document.createElement('h3');ctitle.textContent='Bukti penyelesaian pembelajaran';const name=document.createElement('input');name.type='text';name.maxLength=80;name.placeholder='Nama peserta (opsional)';name.setAttribute('aria-label','Nama peserta');const paper=document.createElement('div');paper.className='print-paper';
 const tag=document.createElement('p');tag.textContent='MANASIK 3D • UMRAH EXPERIENCE';const headline=document.createElement('h2');headline.textContent='Bukti Penyelesaian Latihan';const student=document.createElement('h3');student.textContent='Peserta';const description=document.createElement('p');description.textContent='Telah menyelesaikan lima tahap pembelajaran dan evaluasi pemahaman.';const date=document.createElement('p');const note=document.createElement('p');note.textContent='Dokumen latihan mandiri, bukan sertifikat resmi manasik, kelulusan pembimbing, atau pengesahan ibadah.';paper.append(tag,headline,student,description,date,note);const print=document.createElement('button');print.className='action';print.textContent='Cetak bukti latihan';print.onclick=()=>window.print();name.oninput=()=>{student.textContent=name.value.trim()||'Peserta';};certificate.append(ctitle,name,paper,print);area.append(certificate);
 form.onsubmit=e=>{e.preventDefault();const data=new FormData(form),wrong:number[]=[];questions.forEach((q,i)=>{if(Number(data.get('q'+i))!==q.correct)wrong.push(i+1);});if(wrong.length){certificate.hidden=true;result.textContent='Benar '+(7-wrong.length)+' dari 7. Pelajari kembali soal '+wrong.join(', ')+'. Kamu dapat mencoba lagi.';return;}result.textContent='7 dari 7 benar. Evaluasi latihan selesai.';date.textContent=new Date().toLocaleDateString('id-ID')+' • Referensi sesi '+j.id;certificate.hidden=false;};
}
