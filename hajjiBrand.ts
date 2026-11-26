import type {Plugin} from 'vite';

// Central, build-time brand palette. It changes colors only, not gameplay or layout.
const ink='#25211b',surface='#fffdf8',raised='#f5f1e8',gold='#d6b46b',muted='#5e564c',white='#ffffff';
const hexRE=/#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![0-9a-f])/gi;
function info(hex:string){
 let c=hex.slice(1);if(c.length===3||c.length===4)c=[...c].map(x=>x+x).join('');
 const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);
 const max=Math.max(r,g,b),min=Math.min(r,g,b),lum=.2126*r+.7152*g+.0722*b;
 return {lum,green:g>r+5&&g>b-10&&g-r>=(max-min)*.28,neutral:max-min<30,warm:r>=g&&g>=b&&r-b>32,alpha:c.length===8?c.slice(6):''};
}
function cssColor(value:string,property:string,primary:boolean,dark:boolean){
 const c=info(value),p=property.toLowerCase();let target:string|undefined;
 if(p==='color'||p==='caret-color'||p==='-webkit-text-fill-color'){
  if(dark){if(c.green||c.neutral||c.warm&&c.lum>170)target=white;}
  else if(c.green||c.neutral)target=c.lum<105?ink:c.lum<185?muted:ink;
  else if(c.warm&&c.lum>120)target='#805c22';
 }else if(p==='background'||p==='background-color'||p==='background-image'){
  if(dark){if(c.green||c.neutral)target='#252525';}
  else if(c.green||c.neutral)target=primary?gold:c.lum>238?white:c.lum>180?raised:surface;
  else if(c.warm&&c.lum>230)target=surface;
 }else if(p.includes('border')||p==='outline'||p==='outline-color'){
  if(c.green||c.neutral)target=dark?'#d6b46b':'#e3d9c7';
 }else if(p.includes('shadow')){
  if(c.green)target='#25211b';
 }else if(p==='accent-color') {if(c.green)target=gold;}
 else if(p.startsWith('--')&&c.green){
  target=/ink|text|fg|foreground/.test(p)?ink:/bg|background|surface|panel/.test(p)?surface:gold;
 }
 return target?target+c.alpha:value;
}
export function brandCSS(css:string){
 return css.replace(/([^{}]+)\{([^{}]*)\}/g,(all,selector:string,body:string)=>{
  // Keep dimmers, camera controls, and actual media dark; ordinary cards are light.
  const dark=/(?:::backdrop|\.shade\b|\.cinemaShade\b|\.joystick\b|\.walkJoy\b|\.districtJoy\b|\.joy\b|\.gateCameraPad\b|\.arenaLookPad\b|\.districtLookStick\b|\.video(?:Frame|Screen)\b)/i.test(selector)
    ||(/(?:\.overlay\b|\.layer\b)/.test(selector)&&/inset\s*:\s*0\b/.test(body));
  const primary=!dark&&/(?:\.primary\b|\.frontStart\b|\.gateEnterDistrict\b|\.travelPrimary\b|\.miqatPrimary\b)/.test(selector)&&!/(?:\.secondary\b|\.ghost\b)/.test(selector);
  let next=body.replace(/(^|;)\s*([\w-]+)\s*:\s*([^;]*)/g,(m,sep:string,p:string,v:string)=>{
   if(v.includes('url('))return m;
   let mapped=v.replace(hexRE,h=>cssColor(h,p,primary,dark));
   if(p==='color'&&!dark)mapped=mapped.replace(/\bwhite\b/gi,ink);
   if(/^(background|background-color)$/.test(p)&&!dark)mapped=mapped.replace(/\bblack\b/gi,surface);
   if(p==='color-scheme')mapped='light';
   return sep+p+':'+mapped;
  });
  return selector+'{'+next+'}';
 });
}
// Only intentional branded paint and sign backgrounds; foliage, natural terrain,
// ihram, skin, glass, prayer spaces and functional warning colors are not filtered.
const paint:Record<string,string>={
 '194c3c':'181818','194b3c':'111111','163b30':'141414','427b69':'45413b','305e55':'252525','145a43':'202020','143d35':'111111',
 '1a4839':'151515','1c5040':'202020','17634e':'242424','0e4739':'111111','193d31':'151515','173b32':'111111','263a36':'292929','35413e':'343434',
 '215847':'252525','173d32':'151515','203b34':'151515','234f47':'212121','14392e':'111111','316851':'6b5428','30483e':'303030','193d2f':'141414','37533c':'302719',
 '1c5141':'232323','164638':'151515','214e43':'252525','204d41':'111111','24533f':'151515','356f56':'484039','425747':'383838','52796b':'56504a',
 '244639':'252525','21352e':'151515','62ed89':'edcb76','67ef8b':'edcb76','e3ffe5':'fff1cf','4add77':'d6b46b','b4ffd0':'fff0c6','182a23':'171717','19372c':'151515','53df76':'e8c76f','62e389':'e8c76f','63e88a':'e8c76f',
 '12634e':'242424','124b3e':'151515','155341':'242424','c3d2c6':'d0cfca','667e65':'58524a','71877a':'5e5c55'
};
const sceneFiles=/(?:\/src\/(?:lobby|registrationHall|souvenirWorld|miqatRoom|hajjScenes|miniScenes|player|sai|salmaWelcome|gateRegistration|tawafAtmosphere)\.ts|\/src\/adventure\/(?:missionCity|districtWorld|cityLivePlazas|districtBoard|district|districtGuardTalk|cityMinimap|souvenirCelebration|tawafGame|saiGame|tahallulGame|hajjFieldExperience|muzdalifahExperience|aqabahExperience)\.(?:ts|js))$/;
function sceneColors(code:string){
 return code.replace(/(0x|#)([0-9a-f]{6})([0-9a-f]{2})?(?![0-9a-f])/gi,(all,prefix:string,color:string,alpha:string|undefined)=>paint[color.toLowerCase()]?prefix+paint[color.toLowerCase()]+(alpha??''):all);
}
// Wayfinding is a deliberate exception to the ivory/gold brand: only physical location signs.
const wayfinding:Record<string,readonly (readonly [string,string])[]> = {
  "registrationHall.ts": [
    [
      "g.fillStyle='#194b3c'",
      "g.fillStyle='#00664f'"
    ],
    [
      "g.strokeStyle='#d8ba78'",
      "g.strokeStyle='#ffffff'"
    ],
    [
      "g.fillStyle='#f9e1a7'",
      "g.fillStyle='#ffffff'"
    ],
    [
      "g.fillStyle='#eef3e6'",
      "g.fillStyle='#ffffff'"
    ]
  ],
  "lobby.ts": [
    [
      "g.fillStyle='#1a4839'",
      "g.fillStyle='#00664f'"
    ],
    [
      "g.strokeStyle='#cfb577'",
      "g.strokeStyle='#ffffff'"
    ],
    [
      "g.fillStyle='#f5dda4'",
      "g.fillStyle='#ffffff'"
    ],
    [
      "g.fillStyle='#e4eee3'",
      "g.fillStyle='#ffffff'"
    ]
  ],
  "missionCity.ts": [
    [
      "t.fillStyle=gift?'#0e4739':'#193d31'",
      "t.fillStyle='#00664f'"
    ],
    [
      "t.strokeStyle='#d8b972'",
      "t.strokeStyle='#ffffff'"
    ],
    [
      "t.fillStyle='#f2d18b'",
      "t.fillStyle='#ffffff'"
    ],
    [
      "t.fillStyle='#fff4d9'",
      "t.fillStyle='#ffffff'"
    ]
  ],
  "cityLivePlazas.ts": [
    [
      "background='#173d32'",
      "background='#00664f'"
    ],
    [
      "ctx.strokeStyle='#d7b776'",
      "ctx.strokeStyle='#ffffff'"
    ],
    [
      "ctx.fillStyle='#fff1c9'",
      "ctx.fillStyle='#ffffff'"
    ]
  ],
  "districtWorld.ts": [
    [
      "ctx.fillStyle='#203b34';ctx.fillRect(0,0,1024,128);ctx.fillStyle=color;",
      "ctx.fillStyle='#00664f';ctx.fillRect(0,0,1024,128);ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.strokeRect(7,7,1010,114);ctx.fillStyle='#ffffff';"
    ]
  ],
  "souvenirWorld.ts": [
    [
      "g.fillStyle='#164638'",
      "g.fillStyle='#00664f'"
    ],
    [
      "g.strokeStyle='#cfaf65'",
      "g.strokeStyle='#ffffff'"
    ],
    [
      "g.fillStyle='#fff0c5'",
      "g.fillStyle='#ffffff'"
    ]
  ],
  "miqatRoom.ts": [
    [
      "ctx.fillStyle='#204d41'",
      "ctx.fillStyle='#00664f'"
    ],
    [
      "ctx.strokeStyle='#d7b870'",
      "ctx.strokeStyle='#ffffff'"
    ],
    [
      "ctx.fillStyle='#fff0c2'",
      "ctx.fillStyle='#ffffff'"
    ]
  ],
  "hajjScenes.ts": [
    [
      "a.fillStyle='#24533f';a.fillRect(0,0,512,128);",
      "a.fillStyle='#00664f';a.fillRect(0,0,512,128);a.strokeStyle='#ffffff';a.lineWidth=3;a.strokeRect(5,5,502,118);"
    ]
  ]
};
function locationSigns(code:string,path:string){
 const changes=wayfinding[path.split('/').pop()??''];
 if(!changes)return code;
 for(const [before,after] of changes)code=code.replace(before,after);
 return code;
}
// Target only constructed surfaces; never recolor natural foliage, clothing or sacred landmarks.
const architecture:Record<string,readonly (readonly [string,string])[]> = {
 'registrationHall.ts':[
  ['const stone=material(0xf2e9d9)','const stone=material(0xfffaf0)'],
  ['box(scene,1.72,.99,.58,x,.5,-3.53,green)','box(scene,1.72,.99,.58,x,.5,-3.53,paper)'],
  ['box(scene,1.84,.085,.75,x,1.035,-3.53,wood)','box(scene,1.84,.085,.75,x,1.035,-3.53,cream)'],
  ['box(scene,.09,2.65,.09,x-.84,1.33,-3.95,green);box(scene,.09,2.65,.09,x+.84,1.33,-3.95,green)','box(scene,.09,2.65,.09,x-.84,1.33,-3.95,cream);box(scene,.09,2.65,.09,x+.84,1.33,-3.95,cream)'],
  ['box(scene,1.92,.11,1.35,x,2.69,-3.56,green)','box(scene,1.92,.11,1.35,x,2.69,-3.56,paper)']
 ],
 'lobby.ts':[
  ['const limestone=mat(0xe0d6bc),sand=mat(0xc8bc9c)','const limestone=mat(0xfffaf0),sand=mat(0xf0e8d9)'],
  ['const facade=mat(0xf2e9d9)','const facade=mat(0xfffaf0)'],
  ['box(2.53,1.9,.08,dark,x,.97,-6.10,s);const inner=mesh(new THREE.CircleGeometry(1.22,32,0,Math.PI),dark','box(2.53,1.9,.08,facadeInset,x,.97,-6.10,s);const inner=mesh(new THREE.CircleGeometry(1.22,32,0,Math.PI),facadeInset'],
  ['for(const x of [-6,-3,0,3,6]){const arc=','const facadeInset=mat(0xf0e7d7);for(const x of [-6,-3,0,3,6]){const arc=']
 ],
 'missionCity.ts':[
  ['gift?0xf5efdf:[0xf5f1e8,0xeee6d6,0xf8f4eb]','gift?0xfffaf0:[0xfffaf0,0xf8f4eb,0xfffdf8]'],
  ['box(g,3.8,3.15,.08,0,1.62,7.24,dark)','box(g,3.8,3.15,.08,0,1.62,7.24,white)'],
  ['const doorMat=mat(0x82633a,.48)','const doorMat=mat(0xe8d7b3,.48)']
 ],
 'districtWorld.ts':[
  ['missionCity?0xf0e8d9:b.color','missionCity?0xfffaf0:b.color'],
  ['missionCity?0xf0e8d9:0xc8c2b1','missionCity?0xfffaf0:0xc8c2b1']
 ],
 'souvenirWorld.ts':[
  ['wall=mat(0xf5f0e5)','wall=mat(0xfffaf0)']
 ],
 'miqatRoom.ts':[
  ['const stone=mat(0xe8ddc4)','const stone=mat(0xfffaf0)']
 ]
};
function architectureColors(code:string,path:string){
 for(const [before,after] of architecture[path.split('/').pop()??'']??[])code=code.replace(before,after);
 return code;
}
export function hajjiBrand():Plugin{
 return {name:'hajji-ivory-gold-brand',enforce:'pre',
  transform(code,id){const path=id.split('?')[0]!.replace(/\\/g,'/');if(!path.includes('/src/')||path.includes('/node_modules/'))return;
   if(path.endsWith('.css'))return {code:brandCSS(code),map:null};
   if(sceneFiles.test(path)||path.endsWith('/src/pwa.ts'))return {code:sceneColors(architectureColors(locationSigns(code,path),path)).replace(/pwa-icon-(?:192|512)\.png/g,'pwa-icon.svg').replace(/UMROH\.DIGITAL/g,'HAJJI.DIGITAL').replace(/tujuan hijau/g,'tujuan emas'),map:null};
  },
  transformIndexHtml:{order:'pre',handler(html,ctx){
   let next=html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi,(_,attrs:string,css:string)=>'<style'+attrs+'>'+brandCSS(css)+'</style>');
   next=next.replace(/UMROH\.DIGITAL/g,'HAJJI.DIGITAL').replace(/(<meta\s+name="theme-color"\s+content=")[^"]+"/gi,'$1#0a0a0a"').replace(/pwa-(?:apple-180|icon-192|icon-512|maskable-512)\.png/g,'pwa-icon.svg');
   const page=(ctx.filename||ctx.path).replace(/\\/g,'/').split('/').pop()||'index.html';
   const gameplay=/^(?:index|legacy|manasik|district|player|sai|umrah|hajj|explore|avatar-preview|oleh-oleh|adventure|adventure-map|[a-z]+-adventure)\.html$/.test(page);
   next=next.replace(/<html\b/i,gameplay?'<html data-hajji-game="ivory"':'<html data-hajji-office="ivory"').replace(/(<meta\s+name="theme-color"\s+content=")[^"]+"/gi,'$1#fffdf8"');
   if(!/rel="icon"/i.test(next))next=next.replace('</head>','<link rel="icon" type="image/svg+xml" href="./pwa-icon.svg"></head>');
   return {html:next,tags:[{tag:'link',attrs:{rel:'stylesheet',href:'./hajji-brand.css'},injectTo:'head'}]};
  }}
 };
}
