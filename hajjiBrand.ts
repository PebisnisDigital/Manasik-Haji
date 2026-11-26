import type {Plugin} from 'vite';

// Central, build-time brand palette. It changes colors only, not gameplay or layout.
const ink='#0a0a0a',surface='#151515',raised='#202020',gold='#d6b46b',muted='#bdb9af',white='#f8f7f4';
const hexRE=/#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![0-9a-f])/gi;
function info(hex:string){
 let c=hex.slice(1);if(c.length===3||c.length===4)c=[...c].map(x=>x+x).join('');
 const r=parseInt(c.slice(0,2),16),g=parseInt(c.slice(2,4),16),b=parseInt(c.slice(4,6),16);
 const max=Math.max(r,g,b),min=Math.min(r,g,b),lum=.2126*r+.7152*g+.0722*b;
 return {lum,green:g>r+5&&g>b-10&&g-r>=(max-min)*.28,neutral:max-min<30,warm:r>=g&&g>=b&&r-b>32,alpha:c.length===8?c.slice(6):''};
}
function cssColor(value:string,property:string,onGold:boolean,primary:boolean){
 const c=info(value),p=property.toLowerCase();let target:string|undefined;
 if(p==='color'||p==='fill'||p==='stroke'||p==='caret-color'||p==='-webkit-text-fill-color'){
  if(onGold&&c.lum<150)return ink+c.alpha;
  if(c.green)target=c.lum<145?gold:muted;
  else if(c.neutral&&c.lum<140)target=c.lum<80?white:muted;
  else if(c.warm&&c.lum<135)target=gold;
 }else if(p==='background'||p==='background-color'||p==='background-image'){
  if(c.green)target=primary?gold:c.lum<85?ink:c.lum<155?surface:raised;
  else if(c.neutral&&c.lum>180)target=c.lum>238?surface:raised;
  else if(c.warm&&c.lum>230&& !onGold)target=surface;
 }else if(p.includes('border')||p==='outline'||p==='outline-color'){
  if(c.green||c.neutral&&c.lum>140)target='#504534';
 }else if(p.includes('shadow')){
  if(c.green)target='#000000';
 }else if(p==='accent-color') {if(c.green)target=gold;}
 else if(p.startsWith('--')&&c.green){target=/ink|bg|background|surface|panel/.test(p)?ink:gold;}
 return target?target+c.alpha:value;
}
export function brandCSS(css:string){
 return css.replace(/([^{}]+)\{([^{}]*)\}/g,(all,selector:string,body:string)=>{
  const primary=/(?:\.primary\b|\.frontStart\b|\.gateEnterDistrict\b|\.travelPrimary\b|\.adminBottomNav a\[aria-current)/.test(selector);
  const backgrounds=[...body.matchAll(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/gi)].flatMap(m=>m[1]!.match(hexRE)??[]);
  const onGold=primary&&backgrounds.some(h=>info(h).green)||backgrounds.some(h=>{const c=info(h);return c.warm&&c.lum>=125&&c.lum<=230;});
  let next=body.replace(/(^|;)\s*([\w-]+)\s*:\s*([^;]*)/g,(m,sep:string,p:string,v:string)=>{
   if(v.includes('url('))return m;
   let mapped=v.replace(hexRE,h=>cssColor(h,p,onGold,primary));
   if(/^(background|background-color)$/.test(p))mapped=mapped.replace(/\bwhite\b/gi,surface);
   if(p==='color'&&onGold)mapped=mapped.replace(/\bwhite\b|#(?:fff(?:fff)?|f[0-9a-f]{5})(?![0-9a-f])/gi,ink);
   return sep+p+':'+mapped;
  });
  if(primary&&onGold&&!/(^|;)\s*color\s*:/.test(next))next+=';color:'+ink;
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
export function hajjiBrand():Plugin{
 return {name:'hajji-black-gold-brand',enforce:'pre',
  transform(code,id){const path=id.split('?')[0]!.replace(/\\/g,'/');if(!path.includes('/src/')||path.includes('/node_modules/'))return;
   if(path.endsWith('.css'))return {code:brandCSS(code),map:null};
   if(sceneFiles.test(path)||path.endsWith('/src/pwa.ts'))return {code:sceneColors(code).replace(/pwa-icon-(?:192|512)\.png/g,'pwa-icon.svg').replace(/UMROH\.DIGITAL/g,'HAJJI.DIGITAL').replace(/tujuan hijau/g,'tujuan emas'),map:null};
  },
  transformIndexHtml:{order:'pre',handler(html,ctx){
   let next=html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi,(_,attrs:string,css:string)=>'<style'+attrs+'>'+brandCSS(css)+'</style>');
   next=next.replace(/UMROH\.DIGITAL/g,'HAJJI.DIGITAL').replace(/(<meta\s+name="theme-color"\s+content=")[^"]+"/gi,'$1#0a0a0a"').replace(/pwa-(?:apple-180|icon-192|icon-512|maskable-512)\.png/g,'pwa-icon.svg');
   const page=(ctx.filename||ctx.path).replace(/\\/g,'/').split('/').pop()||'index.html';
   const gameplay=/^(?:index|legacy|manasik|district|player|sai|umrah|hajj|explore|avatar-preview|oleh-oleh|adventure|adventure-map|[a-z]+-adventure)\.html$/.test(page);
   if(gameplay)next=next.replace(/<html\b/i,'<html data-hajji-game="ivory"').replace(/(<meta\s+name="theme-color"\s+content=")[^"]+"/gi,'$1#fffdf8"');
   if(!/rel="icon"/i.test(next))next=next.replace('</head>','<link rel="icon" type="image/svg+xml" href="./pwa-icon.svg"></head>');
   return {html:next,tags:[{tag:'link',attrs:{rel:'stylesheet',href:'./hajji-brand.css'},injectTo:'head'}]};
  }}
 };
}
