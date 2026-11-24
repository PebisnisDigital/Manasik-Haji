// Procedural visual kit. Educational depiction, not an exact geographic/architectural replica.
// No downloads, licenses, or network runtime dependencies. Does not touch quest or save state.
export function createAdventureVisuals(THREE){
const TAU=Math.PI*2;
const low=typeof navigator!=='undefined'&&/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand=n=>{const x=Math.sin(n*127.1+3.7)*43758.55;return x-Math.floor(x);};
let currentRoot=null,currentScene=null,currentMode='',layer=null,sky=null,dust=null,arms=[],ground=null,materials=[],geometries=[],textures=[];
const ownMat=m=>{materials.push(m);return m;},ownGeo=g=>{geometries.push(g);return g;};
function add(g,m,x=0,y=0,z=0,parent=layer){const o=new THREE.Mesh(ownGeo(g),m);o.position.set(x,y,z);parent.add(o);return o;}
function mat(c,metalness=0,emissive=0){return ownMat(new THREE.MeshStandardMaterial({color:c,roughness:.88,metalness,emissive:c,emissiveIntensity:emissive}));}
function tex(c,rx=1,ry=1){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=low?2:4;textures.push(t);return t;}
function canvas(w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tileTexture(mode,width,height){
  const sand=['mina','arafah','muzdalifah','makkah','hotel','departure'].includes(mode);
  const night=mode==='muzdalifah',c=canvas(),ctx=c.getContext('2d');
  ctx.fillStyle=night?'#978b7c':sand?'#c8baa4':mode==='jamarat'?'#bebfb9':'#d8d6ce';
  ctx.fillRect(0,0,512,512);
  if(sand){
    for(let i=0;i<3200;i++){ctx.fillStyle=i%3?'rgba(65,58,42,.07)':'rgba(252,244,222,.13)';
      ctx.fillRect(rand(i*2+3)*512,rand(i*7+19)*512,1+rand(i*31)*2,1+rand(i*11)*2);}
    for(let i=0;i<20;i++){ctx.strokeStyle='rgba(95,82,68,.045)';ctx.beginPath();ctx.moveTo(0,i*27);ctx.lineTo(512,i*27+rand(i)*6);ctx.stroke();}
  }else{
    for(let i=0;i<8;i++)for(let j=0;j<8;j++){
      const v=mode==='jamarat'?187:215,offset=Math.round((rand(i*19+j*31)-.5)*17);
      ctx.fillStyle='rgb('+[v+offset,v+offset-2,v+offset-7].join(',')+')';
      ctx.fillRect(i*64+1.3,j*64+1.3,61.5,61.5);
      ctx.strokeStyle='rgba(105,109,102,.14)';ctx.strokeRect(i*64+4,j*64+4,56,56);
    }
    for(let i=0;i<1300;i++){ctx.fillStyle=i%2?'rgba(255,255,255,.1)':'rgba(80,79,69,.07)';ctx.fillRect(rand(i*5+33)*512,rand(i*13+47)*512,1,1);}
  }
  return tex(c,Math.max(1,width/(sand?45:48)),Math.max(1,height/(sand?45:48)));
}
function floorUpgrade(root,mode){
 let candidate=null;
 root.traverse(o=>{if(candidate||!o.isMesh||o.geometry?.type!=='PlaneGeometry')return;
   const size=o.geometry.parameters;
   if(Math.abs(o.rotation.x+Math.PI/2)<.07&&size?.width>=30&&size?.height>=30&&o.position.y<.05)candidate=o;});
 if(candidate){
   const {width,height}=candidate.geometry.parameters;
   const m=ownMat(new THREE.MeshStandardMaterial({map:tileTexture(mode,width,height),color:0xffffff,roughness:.97,metalness:.012}));
   ground={mesh:candidate,old:candidate.material,material:m};candidate.material=m;
 }else if(mode==='sai'){
   add(new THREE.PlaneGeometry(26.7,101.5),ownMat(new THREE.MeshStandardMaterial({map:tileTexture(mode,26.7,101.5),roughness:.97})),0,-.039,0).rotation.x=-Math.PI/2;
 }
}
function skyDome(mode){
 const night=mode==='muzdalifah',haram=mode==='haram'||mode==='sai',c=canvas(24,512),ctx=c.getContext('2d');
 const g=ctx.createLinearGradient(0,0,0,512);
 if(night){g.addColorStop(0,'#08132a');g.addColorStop(.45,'#293954');g.addColorStop(.73,'#5d6271');g.addColorStop(1,'#c2a990');}
 else if(haram){g.addColorStop(0,'#5f9aaf');g.addColorStop(.48,'#adc9d1');g.addColorStop(.8,'#e5dcc9');g.addColorStop(1,'#f2d4a2');}
 else {g.addColorStop(0,'#649ab0');g.addColorStop(.48,'#c3d1c6');g.addColorStop(.8,'#e8d6b7');g.addColorStop(1,'#f0cdaa');}
 ctx.fillStyle=g;ctx.fillRect(0,0,24,512);
 const skyMat=ownMat(new THREE.MeshBasicMaterial({map:tex(c),side:THREE.BackSide,fog:false,depthWrite:false}));
 sky=add(new THREE.SphereGeometry(150,20,12),skyMat);sky.frustumCulled=false;
 const sunMat=mat(night?0xe7e6d7:0xfff0cc,0,night?.19:.31);
 add(new THREE.SphereGeometry(night?3.1:4.6,12,10),sunMat,-92,night?60:75,-75);
 if(night){
   const n=low?80:165,positions=new Float32Array(n*3);
   for(let i=0;i<n;i++){const a=rand(i*3+1)*TAU,r=98,el=.2+rand(i*12+3)*1.2;
     positions[i*3]=Math.cos(a)*r*Math.cos(el);positions[i*3+1]=r*Math.sin(el)+12;positions[i*3+2]=Math.sin(a)*r*Math.cos(el);}
   const geo=ownGeo(new THREE.BufferGeometry());geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
   const starMat=ownMat(new THREE.PointsMaterial({color:0xfff3dc,size:1.6,sizeAttenuation:false,transparent:true,opacity:.8,depthWrite:false,fog:false}));
   layer.add(new THREE.Points(geo,starMat));
 }
}
function kiswah(){
 const c=canvas(),ctx=c.getContext('2d');ctx.fillStyle='#131612';ctx.fillRect(0,0,512,512);
 for(let i=0;i<135;i++){ctx.strokeStyle=i%4?'rgba(210,201,177,.023)':'rgba(146,150,111,.09)';ctx.beginPath();ctx.moveTo(i*3.8,0);ctx.lineTo(i*3.8+2,512);ctx.stroke();}
 ctx.fillStyle='#a68a4d';ctx.fillRect(0,136,512,48);ctx.fillStyle='#28261e';ctx.fillRect(0,142,512,35);
 for(const y of [140,146,177,183]){ctx.fillStyle='#c6a86a';ctx.fillRect(0,y,512,2);}
 for(let i=0;i<16;i++){const x=i*33+16;ctx.strokeStyle='#cfb16a';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(x,149);ctx.lineTo(x+10,163);ctx.lineTo(x,175);ctx.lineTo(x-10,163);ctx.closePath();ctx.stroke();}
 return tex(c);
}
function decorateKaaba(root){
 let cube=null;
 root.traverse(o=>{
  if(cube||!o.isMesh||o.geometry?.type!=='BoxGeometry')return;
  const g=o.geometry.parameters;
  if(g.width>=10.5&&g.width<=16&&g.height>=11&&g.height<=16&&g.depth>=10.5&&g.depth<=16&&Math.abs(g.width-g.depth)<2&&Math.abs(o.position.x)<3&&Math.abs(o.position.z)<3)cube=o;
 });
 if(!cube)return;
 const {width:w,height:h,depth:d}=cube.geometry.parameters,{x,y,z}=cube.position;
 const m=ownMat(new THREE.MeshStandardMaterial({map:kiswah(),roughness:.94,side:THREE.DoubleSide}));
 for(const side of [-1,1]){
  add(new THREE.PlaneGeometry(w-.04,h-.06),m,x,y,z+side*(d/2+.023)).rotation.y=side===1?0:Math.PI;
  add(new THREE.PlaneGeometry(d-.04,h-.06),m,x+side*(w/2+.023),y,z).rotation.y=side*Math.PI/2;
 }
}
function minaret(x,z){
 const stone=mat(0xe1d6c3),gold=mat(0xb79d67,.22),dark=mat(0x62746a);
 const o=new THREE.Group();o.position.set(x,0,z);o.scale.setScalar(.86);layer.add(o);
 add(new THREE.CylinderGeometry(2.45,2.8,15,12),stone,0,7.5,0,o);
 add(new THREE.CylinderGeometry(3,3,.6,12),gold,0,15.1,0,o);
 add(new THREE.CylinderGeometry(2.1,2.35,9,12),stone,0,19.7,0,o);
 add(new THREE.CylinderGeometry(2.6,2.6,.65,12),gold,0,24.2,0,o);
 add(new THREE.CylinderGeometry(1.5,1.8,8,12),stone,0,28.2,0,o);
 add(new THREE.ConeGeometry(2.2,5,12),dark,0,34,0,o);
}
function haramDetail(){
 if(!low){minaret(-66,-66);minaret(66,66);}
 const stone=mat(0xe3d9c7),gold=mat(0xb9a477,.16);
 for(const z of [-60,60])for(let x=-47;x<=47;x+=13){
  add(new THREE.CylinderGeometry(.48,.55,9,9),stone,x,4.5,z);
  add(new THREE.BoxGeometry(11.8,.6,2.5),gold,x,9.3,z);
 }
}
function saiDetail(){
 const mint=mat(0x70cba1,0,.48),gold=mat(0xd0c094,.1);
 for(const z of [-12,12]){
  for(const x of [-12.2,12.2])add(new THREE.BoxGeometry(.22,4.6,.2),mint,x,4.0,z);
  add(new THREE.BoxGeometry(25.6,.2,.2),mint,0,9.9,z);
 }
 for(const z of [-37,-20,-4,12,28,36])add(new THREE.BoxGeometry(24.8,.1,.1),gold,0,.06,z);
}
function palm(x,z,s=.92){
 const wood=mat(0x887152),leaf=mat(0x457759),p=new THREE.Group();p.position.set(x,0,z);p.scale.setScalar(s);layer.add(p);
 add(new THREE.CylinderGeometry(.19,.27,6.4,7),wood,0,3.2,0,p);
 for(let i=0;i<7;i++){const a=i*TAU/7,tip=add(new THREE.ConeGeometry(.64,4.5,4),leaf,Math.cos(a)*1.25,6.4,Math.sin(a)*1.25,p);tip.rotation.y=a;tip.rotation.z=Math.PI/2-.17;}
 add(new THREE.SphereGeometry(.54,8,6),leaf,0,6.55,0,p);
}
function props(mode){
 if(['makkah','hotel','departure'].includes(mode)){for(const [x,z] of (low?[[-44,-32],[43,32]]:[[-44,-32],[43,32],[-44,32],[44,-32]]))palm(x,z);}
 if(mode==='mina'){for(const [x,z] of [[-47,38],[47,38],[-48,-39]])palm(x,z,.85);}
 if(mode==='arafah'){for(const [x,z] of [[-49,40],[48,-39]])palm(x,z,.77);}
 if(['makkah','hotel','departure','mina','arafah','muzdalifah'].includes(mode)){
  const steel=mat(0x8b968b,.15),light=mat(0xffe1a4,0,mode==='muzdalifah'?1:.3);
  for(const x of [-47,0,47])for(const z of [-40,40]){
   add(new THREE.CylinderGeometry(.12,.14,5.9,8),steel,x,2.95,z);
   add(new THREE.SphereGeometry(.3,9,7),light,x,5.93,z);
  }
 }
 if(mode==='jamarat'){const rail=mat(0x9aaba0,.22);
   for(const z of [-16.5,16.5]){add(new THREE.BoxGeometry(132,.15,.13),rail,0,1.5,z);
    for(let x=-64;x<=64;x+=8)add(new THREE.CylinderGeometry(.09,.11,2.3,7),rail,x,1.15,z);}
 }
}
function crowdDetails(root,player){
 arms=[];const groups=[];
 root.traverse(o=>{
  if(!o.isGroup||o===player||o===layer||groups.length>=(low?12:22))return;
  const children=o.children.filter(c=>c.isMesh);
  const torso=children.find(c=>c.position.y>.85&&c.position.y<1.3&&Math.abs(c.position.x)<.1&&c.geometry?.type==='CylinderGeometry');
  const head=children.find(c=>c.position.y>1.9&&c.position.y<2.2&&c.geometry?.type==='SphereGeometry');
  if(torso&&head)groups.push([o,torso.material,head.material]);
 });
 const sleeve=ownGeo(new THREE.CylinderGeometry(.125,.15,.6,7)),hand=ownGeo(new THREE.SphereGeometry(.1,8,6));
 for(let i=0;i<groups.length;i++){const [root,robe,skin]=groups[i],limbs=[];
  for(const side of [-1,1]){
    const pivot=new THREE.Group();pivot.position.set(side*.44,1.57,0);
    const arm=new THREE.Mesh(sleeve,robe);arm.position.set(side*.07,-.31,0);arm.rotation.z=side*.1;pivot.add(arm);
    const fingers=new THREE.Mesh(hand,skin);fingers.position.set(side*.1,-.65,0);pivot.add(fingers);
    root.add(pivot);limbs.push(pivot);
  }
  arms.push({limbs,offset:i*1.31});
 }
}
function motes(mode){
 if(!['arafah','mina','muzdalifah','makkah','departure','hotel'].includes(mode)||reduced)return;
 const n=low?55:130,positions=new Float32Array(n*3);
 for(let i=0;i<n;i++){positions[i*3]=(rand(i*3+2)-.5)*55;positions[i*3+1]=.4+rand(i*9+21)*7;positions[i*3+2]=(rand(i*7+14)-.5)*55;}
 const g=ownGeo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const m=ownMat(new THREE.PointsMaterial({size:.12,color:mode==='muzdalifah'?0xf5d9b5:0xdfc9a9,transparent:true,opacity:.4,depthWrite:false}));
 dust=new THREE.Points(g,m);dust.frustumCulled=false;layer.add(dust);
}
function cleanup(){
 if(ground&&ground.mesh.material===ground.material)ground.mesh.material=ground.old;
 if(layer?.parent)layer.parent.remove(layer);
 for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();
 layer=null;sky=null;dust=null;arms=[];ground=null;materials=[];geometries=[];textures=[];
}
function setup(root,scene,mode,player){
 cleanup();currentRoot=root;currentScene=scene;currentMode=mode;
 layer=new THREE.Group();layer.name='manasik-visual-assets-v3';root.add(layer);
 floorUpgrade(root,mode);skyDome(mode);
 if(mode==='haram'){decorateKaaba(root);haramDetail();}
 if(mode==='sai')saiDetail();
 props(mode);crowdDetails(root,player);motes(mode);
}
function update({root,scene,player,mode,now=0}){
 if(!root||!scene||!player)return;
 if(root!==currentRoot||scene!==currentScene||mode!==currentMode)setup(root,scene,mode,player);
 if(sky){sky.position.x=player.position.x;sky.position.z=player.position.z;}
 if(dust){dust.position.x=player.position.x;dust.position.z=player.position.z;dust.rotation.y=Math.sin(now*.00004)*.1;}
 if(!reduced)for(const a of arms){const wave=Math.sin(now*.0035+a.offset)*.15;a.limbs[0].rotation.x=wave;a.limbs[1].rotation.x=-wave;}
}
return {update};
}
