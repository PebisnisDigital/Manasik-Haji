import type {DistrictSave} from './districtModel.ts';
import type {ErrandSave,Companion} from './districtActivities.ts';

/** Indonesian string table. Graphs and choice transitions use stable IDs. */
export const DISTRICT_DIALOGUE_ID={
  'speaker.farid':'Pak Farid · Ketua rombongan',
  'speaker.salma':'Bu Salma · Pembimbing',
  'speaker.hasan':'Pak Hasan · Jemaah rombongan',
  'speaker.rizal':'Pak Rizal · Petugas kedai',
  'speaker.pilgrim':'Jemaah rombongan',
  'farid.welcome':'Selamat datang di penginapan. Kita berangkat bersama, jadi mari pastikan koper dan kendaraan siap. Setelah itu, Bu Salma menunggu kita di terminal latihan.',
  'farid.luggage':'Misi perjalanan sudah kamu terima. Periksa koper di pelataran sebelum naik ke bus. Kita berangkat setelah persiapan selesai.',
  'farid.bus':'Koper sudah siap. Bus rombongan berada di tepi pelataran, dekat zebra cross. Dekati kendaraan lalu pilih Naik bus.',
  'farid.drive':'Koper sudah masuk dan bus siap. Bawa rombongan menuju terminal di sisi timur kawasan; berhenti di petak emas sebelum turun.',
  'farid.arrival':'Bus sudah tiba. Bu Salma berada di pelataran terminal. Temui beliau untuk menyelesaikan perjalanan pembuka.',
  'farid.done':'Persiapan rombongan sudah selesai. Kamu bisa melanjutkan manasik bersama Bu Salma, atau membantu jemaah di kawasan ini.',
  'farid.helped':'Terima kasih sudah menemani Pak Hasan ke halte. Beliau kini bisa beristirahat dengan tenang. Bila ingin membantu lagi, Pak Rizal berada di kedai sebelah utara.',
  'farid.carry':'Pak Hasan sudah tiba di halte, dan paket dari Pak Rizal sedang kamu bawa. Antarkan kepada Bu Salma di pelataran terminal; beliau menunggu perlengkapan rombongan.',
  'farid.all':'Pak Hasan sudah tiba dan paket perlengkapan sudah sampai ke Bu Salma. Terima kasih sudah memperhatikan rombongan, bukan hanya perjalananmu sendiri.',
  'farid.story':'Kawasan ini adalah tempat latihan persiapan rombongan. Kita mulai dari penginapan, menyiapkan koper, lalu berangkat ke terminal. Sesudah itu, perjalanan berlanjut ke level manasik yang tersedia di peta.',
  'hasan.offer':'Boleh temani saya berjalan ke halte? Saya ingin berjalan bersama, tidak terburu-buru. Kalau kamu terlalu jauh atau naik kendaraan, saya akan menunggu di jalur.',
  'hasan.walk':'Terima kasih sudah menemani. Kita berjalan melalui zebra cross menuju halte di seberang pelataran. Tetaplah dekat agar kita tidak terpisah.',
  'hasan.wait':'Saya tadi menunggu karena kita terpisah. Mari berjalan berdekatan lagi. Saya akan melanjutkan setelah kamu mendekat.',
  'hasan.bus':'Bus sedang menghalangi jalur kita. Pindahkan kendaraan dahulu, lalu kembali untuk berjalan bersama saya.',
  'hasan.arrived':'Kita sudah sampai di halte. Terima kasih sudah berjalan bersama sampai tujuan. Selesaikan pendampingan di sini untuk menerima reward; Pak Rizal juga sedang menyiapkan paket di kedai.',
  'hasan.done':'Saya beristirahat di halte. Terima kasih sudah menemani sampai tujuan. Bila ingin membantu lagi, kamu bisa menemui Pak Rizal di kedai sebelah utara penginapan.',
  'hasan.carry':'Saya sudah beristirahat di halte. Terima kasih. Paket yang kamu bawa bisa diantar ke Bu Salma di terminal; beliau masih menunggu perlengkapan rombongan.',
  'hasan.all':'Saya sudah beristirahat, dan kabarnya paket untuk Bu Salma juga sudah sampai. Terima kasih sudah membantu rombongan.',
  'hasan.story':'Saya lebih nyaman berjalan bersama seseorang. Kita cukup menjaga jarak dan berhenti bila perlu. Mendampingi sampai tujuan lebih membantu daripada berlari lebih dulu.',
  'rizal.locked':'Paket rombongan sedang saya siapkan. Temani Pak Hasan sampai halte terlebih dahulu; setelah itu, saya bisa menitipkan paket untuk Bu Salma.',
  'rizal.offer':'Pak Hasan sudah sampai, terima kasih. Bisa antarkan paket perlengkapan ini ke Bu Salma di terminal? Ambil paketnya di sini, lalu serahkan melalui Interaksi saat bertemu beliau.',
  'rizal.carry':'Paket masih kamu bawa. Bu Salma menunggu di pelataran terminal sebelah timur. Bila naik bus, turun dan dekati beliau untuk menyerahkan paket.',
  'rizal.done':'Bu Salma sudah menerima paketnya. Terima kasih; perlengkapan rombongan sudah sampai. Bantuanmu di kedai ini selesai.',
  'rizal.story':'Kedai ini menjadi tempat persiapan perlengkapan rombongan. Saya menyiapkan paket, Bu Salma menerimanya di terminal, dan kamu membantu menghubungkan keduanya.',
  'salma.early':'Selamat datang di terminal latihan. Selesaikan persiapan bersama Pak Farid, bawa koper, lalu parkir bus di petak emas. Kita akan melanjutkan perjalanan setelah rombongan tiba.',
  'salma.arrival':'Selamat tiba di terminal latihan. Buka peta kampanye 12 level untuk memulai dari Miqat dan melanjutkan hingga Tawaf Wada’. Setiap level memiliki tujuan dan checkpoint sendiri.',
  'salma.done':'Perjalanan kawasan sudah selesai. Pilih level manasik yang tersedia, atau jelajahi kawasan dan bantu rombongan. Checkpoint level sebelumnya tetap bisa dilanjutkan.',
  'salma.hasan':'Saya mendengar Pak Hasan sudah sampai di halte. Terima kasih sudah mendampinginya. Kamu bisa melanjutkan manasik atau membantu membawa paket dari Pak Rizal.',
  'salma.parcel':'Paket dari Pak Rizal sudah kamu bawa. Pilih Serahkan paket agar perlengkapan diterima dan bantuan pengantaran selesai.',
  'salma.all':'Paket sudah saya terima, dan Pak Hasan sudah sampai di halte. Kedua bantuanmu selesai. Terima kasih; kamu dapat melanjutkan manasik atau menjelajahi kawasan lagi.',
  'salma.story':'Peta kampanye menghubungkan 12 level dari Miqat hingga Tawaf Wada’. Mulai atau lanjutkan melalui peta. Akses Tawaf, Sa’i dan Tahallul di sini tetap mengikuti progres lamamu.',
  'pilgrim.early':'Kami sedang bersiap untuk perjalanan. Pak Farid memimpin rombongan dari pelataran penginapan. Kamu boleh bertanya kepada kami bila membutuhkan arah.',
  'pilgrim.done':'Rombongan sudah tiba dengan selamat. Di kawasan ini kamu masih bisa membantu Pak Hasan dan Pak Rizal, atau melanjutkan level manasik di terminal.',
  'pilgrim.all':'Pak Hasan sudah tiba dan paket perlengkapan juga sudah sampai. Terima kasih atas bantuanmu. Kami bisa bersiap melanjutkan perjalanan.',
  'pilgrim.story':'Sebagian dari kami berjalan di pelataran sambil menunggu persiapan. Penginapan berada di tengah kawasan, kedai di utara, halte di selatan, dan terminal di sisi timur.',
  'hint.0':'Temui Pak Farid di pelataran penginapan dan pilih Terima misi. Penanda emas di peta kecil menunjukkan tujuan aktifmu.',
  'hint.1':'Koper berada di pelataran, di sebelah timur Pak Farid. Dekati koper lalu pilih Ambil koper dan Bawa koper. Setelah itu, penanda berpindah ke bus.',
  'hint.2':'Bus rombongan berada di tepi jalan selatan pelataran, dekat zebra cross. Dekati sisi kendaraan dan pilih Naik bus. Koper ikut terbawa.',
  'hint.3':'Naik kembali ke bus bila kamu sedang berjalan. Ikuti garis rute di peta kecil menuju jalan timur. Parkir di petak emas terminal dan tahan rem hingga bus berhenti.',
  'hint.4':'Bus sudah tiba di terminal. Turun saat kendaraan berhenti, lalu temui Bu Salma di pelataran sebelah barat bangunan terminal.',
  'hint.hasan':'Pak Hasan berada di pelataran penginapan. Ikuti garis jalan kaki pada peta kecil, lalu bicara dengannya untuk menawarkan pendampingan.',
  'hint.escort':'Berjalan bersama Pak Hasan melalui zebra cross menuju halte selatan. Jaga jarak maksimal 7 meter; bila ia menunggu, mendekatlah hingga kurang dari 6 meter.',
  'hint.distance':'Pak Hasan menunggu di jalur karena kamu terlalu jauh. Kembali ke penanda emas dan mendekat hingga kurang dari 6 meter; beliau akan berjalan lagi.',
  'hint.vehicle':'Turun dari kendaraan agar Pak Hasan dapat melanjutkan berjalan bersamamu. Tetap berada di dekat beliau menuju halte.',
  'hint.bus':'Jalur Pak Hasan terhalang bus. Pindahkan kendaraan dari zebra cross atau jalur menuju halte, lalu kembali mendampingi beliau.',
  'hint.finish':'Pak Hasan sudah berada di halte. Bicara dengannya dan pilih Selesaikan pendampingan. Mencapai halte saja belum menyerahkan penyelesaian misi.',
  'hint.market':'Temui Pak Rizal di deretan kedai sebelah utara penginapan. Ikuti garis jalan kaki yang mengitari bangunan, lalu pilih Ambil paket.',
  'hint.delivery':'Paket harus diserahkan kepada Bu Salma di pelataran terminal timur. Ikuti garis jalan kaki, dekati beliau sambil berjalan, lalu pilih Serahkan paket.',
  'hint.tawaf':'Bantuan kawasan sudah selesai. Temui Bu Salma di terminal atau buka peta level untuk melanjutkan Tawaf. Misi tambahan tidak mengunci level manasik.',
  'hint.sai':'Tawaf sudah selesai. Bu Salma atau peta level menyediakan akses Sa’i; checkpoint Sa’i yang sudah ada tetap dapat dilanjutkan.',
  'hint.tahallul':'Sa’i sudah selesai. Bu Salma atau peta level menyediakan akses Tahallul. Kamu juga dapat kembali menjelajah kawasan.',
  'hint.complete':'Rangkaian umroh dan kedua bantuan kawasan sudah selesai. Buka peta kampanye 12 level untuk melanjutkan rangkaian Haji. Jelajah kawasan dan main ulang tetap tersedia.',
  'choice.help':'Ke mana saya harus pergi?',
  'choice.story':'Ceritakan tentang perjalanan ini',
  'choice.back':'Kembali ke percakapan',
  'choice.close':'Terima kasih',
  'choice.later':'Nanti dulu',
  'choice.walk':'Lanjut berjalan',
  'choice.explore':'Lanjut menjelajah',
  'choice.roam':'Jelajahi lagi',
  'choice.briefing':'Terima misi',
  'choice.arrival':'Selesaikan misi kawasan',
  'choice.escort':'Dampingi ke halte',
  'choice.finish':'Selesaikan pendampingan',
  'choice.parcel':'Ambil paket',
  'choice.deliver':'Serahkan paket',
  'choice.tawaf':'Masuk level Tawaf',
  'choice.sai':'Masuk level Sa’i',
  'choice.tahallul':'Masuk level Tahallul',
  'choice.map':'Lanjutkan kampanye 12 level',
  'label.conversation':'PERCAKAPAN ROMBONGAN',
  'label.question':'TANYA ROMBONGAN',
  'label.main':'MISI UTAMA · +20 POIN',
  'label.escort':'MISI TAMBAHAN · +30 POIN',
  'label.parcel':'MISI TAMBAHAN · +40 POIN',
} as const;
export type DistrictTextId=keyof typeof DISTRICT_DIALOGUE_ID;
export type DistrictSpeaker='farid'|'salma'|'hasan'|'rizal'|'pilgrim';
export type DialogueCommand='briefing'|'arrivalBriefing'|'acceptEscort'|'finishEscort'|'takeParcel'|'deliverParcel';
export interface DialogueContext {
  main:DistrictSave;errands:ErrandSave;
  companion:Pick<Companion,'gate'|'waiting'>;
  chapters:{tawaf:boolean;sai:boolean;tahallul:boolean};
}
export type DialogueChoice={id:string;text:DistrictTextId;secondary?:boolean}&(
  {to:string}|{end:true}|{command:DialogueCommand}|{href:'./tawaf-adventure.html'|'./sai-adventure.html'|'./tahallul-adventure.html'|'./adventure-map.html'});
export interface DialogueNode {line:DistrictTextId;label?:DistrictTextId;choices:DialogueChoice[]}
export interface DistrictDialogue {speaker:DistrictTextId;start:string;nodes:Record<string,DialogueNode>}
export const districtText=(id:DistrictTextId)=>DISTRICT_DIALOGUE_ID[id];

export function districtHint(c:DialogueContext):DistrictTextId {
  if(c.main.stage<5)return (['hint.0','hint.1','hint.2','hint.3','hint.4'] as const)[c.main.stage as 0|1|2|3|4];
  if(c.errands.stage===0)return 'hint.hasan';
  if(c.errands.stage===1){if(c.companion.gate===3)return 'hint.finish';return c.companion.waiting?`hint.${c.companion.waiting}`:'hint.escort';}
  if(c.errands.stage===2)return 'hint.market';
  if(c.errands.stage===3)return 'hint.delivery';
  return c.chapters.tahallul?'hint.complete':c.chapters.sai?'hint.tahallul':c.chapters.tawaf?'hint.sai':'hint.tawaf';
}

/** Build a read-only graph from existing mission state; commands occur only on choices. */
export function districtDialogue(speaker:DistrictSpeaker,c:DialogueContext):DistrictDialogue {
  const main=c.main.stage,side=c.errands.stage;
  const end=(text:DistrictTextId):DialogueChoice=>({id:'leave',text,end:true,secondary:true});
  const command=(text:DistrictTextId,command:DialogueCommand):DialogueChoice=>({id:command,text,command});
  let line:DistrictTextId,choices:DialogueChoice[];
  switch(speaker){
    case 'farid':
      line=main===5?side===4?'farid.all':side===3?'farid.carry':side===2?'farid.helped':'farid.done':(['farid.welcome','farid.luggage','farid.bus','farid.drive','farid.arrival'] as const)[main];
      choices=main===0?[command('choice.briefing','briefing'),end('choice.later')]:[end('choice.walk')];break;
    case 'hasan':
      line=side===0?'hasan.offer':side>=2?side===4?'hasan.all':side===3?'hasan.carry':'hasan.done':c.companion.gate===3?'hasan.arrived':c.companion.waiting==='distance'?'hasan.wait':c.companion.waiting==='bus'?'hasan.bus':'hasan.walk';
      choices=main===5&&side===0?[command('choice.escort','acceptEscort'),end('choice.later')]:main===5&&side===1&&c.companion.gate===3?[command('choice.finish','finishEscort')]:[end('choice.walk')];break;
    case 'rizal':
      line=side===4?'rizal.done':side===3?'rizal.carry':side===2?'rizal.offer':'rizal.locked';
      choices=main===5&&side===2?[command('choice.parcel','takeParcel'),end('choice.later')]:[end('choice.explore')];break;
    case 'salma':
      line=main<4?'salma.early':main===4?'salma.arrival':side===3?'salma.parcel':side===4?'salma.all':side===2?'salma.hasan':'salma.done';
      if(main===4)choices=[command('choice.arrival','arrivalBriefing')];
      else if(main===5&&side===3)choices=[command('choice.deliver','deliverParcel')];
      else if(main===5){choices=[{id:'map',text:'choice.map',href:'./adventure-map.html'},{id:'tawaf',text:'choice.tawaf',href:'./tawaf-adventure.html',secondary:true}];
        if(c.chapters.tawaf)choices.push({id:'sai',text:'choice.sai',href:'./sai-adventure.html'});
        if(c.chapters.tawaf&&c.chapters.sai)choices.push({id:'tahallul',text:'choice.tahallul',href:'./tahallul-adventure.html'});
        choices.push(end('choice.roam'));
      }else choices=[end('choice.close')];break;
    case 'pilgrim':line=main<5?'pilgrim.early':side===4?'pilgrim.all':'pilgrim.done';choices=[end('choice.close')];break;
  }
  choices.push({id:'help',text:'choice.help',to:'help',secondary:true},{id:'story',text:'choice.story',to:'story',secondary:true});
  const action=choices.find(v=>'command'in v),reward=action&&'command'in action?action.command:null;
  const label:DistrictTextId=reward==='acceptEscort'||reward==='finishEscort'?'label.escort':reward==='takeParcel'||reward==='deliverParcel'?'label.parcel':reward?'label.main':'label.conversation';
  const answers=(line:DistrictTextId):DialogueNode=>({line,label:'label.question',choices:[{id:'back',text:'choice.back',to:'root'},end('choice.close')]});
  return {speaker:`speaker.${speaker}`,start:'root',nodes:{root:{line,label,choices},help:answers(districtHint(c)),story:answers(`${speaker}.story`)}};
}

/** Validate authored edges, exits and reachability; no expression evaluator or script commands. */
export function validateDistrictDialogue(graph:DistrictDialogue):string[]{
  const problems:string[]=[],visited=new Set<string>(),pending=[graph.start];
  if(!DISTRICT_DIALOGUE_ID[graph.speaker])problems.push('Missing speaker text');
  while(pending.length){const id=pending.pop()!;if(visited.has(id))continue;visited.add(id);const node=graph.nodes[id];
    if(!node){problems.push('Missing node: '+id);continue;}
    if(!DISTRICT_DIALOGUE_ID[node.line])problems.push('Missing line: '+id);
    if(node.label&&!DISTRICT_DIALOGUE_ID[node.label])problems.push('Missing label: '+id);
    if(!node.choices.length)problems.push('No exit: '+id);
    const ids=new Set<string>();
    for(const choice of node.choices){if(ids.has(choice.id))problems.push('Duplicate choice: '+id+'/'+choice.id);ids.add(choice.id);
      if(!DISTRICT_DIALOGUE_ID[choice.text])problems.push('Missing choice text: '+id+'/'+choice.id);
      if('to'in choice)pending.push(choice.to);
    }
  }
  for(const id of Object.keys(graph.nodes))if(!visited.has(id))problems.push('Unreachable node: '+id);
  return problems;
}
