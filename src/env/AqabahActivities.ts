import * as THREE from 'three';
import {TahallulAction} from '../characters/TahallulAction.ts';
import {humanActor} from '../characters/HumanActors.ts';
/** Additional Level 9 props; the original three-jumrah arena remains shared with tasyrik. */
export function aqabahActivities(scene:THREE.Scene,avatar:'male'|'female'){
 const group=new THREE.Group();group.name='aqabah-activity-route';scene.add(group);
 const mats=new Map<number,THREE.MeshStandardMaterial>();
 const mat=(c:number)=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.85}));return mats.get(c)!;};
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,c:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);group.add(m);return m;};
 const sign=(text:string,x:number,z:number,w=4)=>{const c=document.createElement('canvas');c.width=768;c.height=160;const ctx=c.getContext('2d')!;ctx.fillStyle='#194b3b';ctx.fillRect(0,0,768,160);ctx.fillStyle='#ffe1a0';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 38px sans-serif';ctx.fillText(text,384,80,735);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*160/768),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide,transparent:true,depthWrite:false}));m.position.set(x,2.3,z);m.userData.locationSign=true;group.add(m);};
 sign('ROMBONGAN MINA',0,10.6);sign('POS AIR',-12,10.7,3);box(-12,.45,9,1,.9,.7,0x38695a);for(let i=0;i<4;i++)box(-12.3+i*.2,1.04,9,.12,.25,.12,0xe4eff0);
 sign('JAMARAT → AQABAH',-3,4,4.8);sign('IKUTI PETUGAS',3,9.6);sign('KELUAR →',11,13.3,3);sign('PANDUAN DAM',3,15.4);box(3,.45,15,1.6,.9,.6,0xc5b28d);
 for(const x of [-12,-7,-2,3,8,13])box(x,.01,11.2,2.6,.02,.1,0xe3bd64);
 const guide=humanActor(scene,0x285846,avatar==='female',avatar==='female'?1.64:1.74);guide.position.set(1.6,0,9);
 const officer=humanActor(scene,0x497e78,false,1.74);officer.position.set(3.8,0,8);
 sign('TAHALLUL HAJI',-8,14.4,4);sign(avatar==='female'?'PETUGAS PEREMPUAN · PRIVASI':'PETUGAS CUKUR',-8,14.2,6);sign('KUMPUL IFADAH',0,21.3,4);
 box(-8,.38,16,.7,.76,.7,0x315a4b);box(-8,.8,15.66,.7,.9,.1,0x315a4b);
 if(avatar==='female'){for(const x of [-9.5,-6.5])box(x,1.15,16.2,.12,2.3,3.5,0x788579);box(-8,1.15,14.2,3.1,2.3,.12,0x788579);}
 const cut=new TahallulAction(avatar,avatar==='female'?'trim':'shave',0);cut.group.position.set(-8,0,16);scene.add(cut.group);cut.group.visible=false;
 const ambient:TahallulAction[]=[];for(let i=0;i<3;i++){const x=-2+i*4;box(x,.38,18,.7,.76,.7,0x315a4b);box(x,.8,17.65,.7,.9,.1,0x315a4b);const a=new TahallulAction(avatar,avatar==='female'?'trim':'shave',0,{ambient:true,skin:[0xb98257,0x674830,0xd3b08e][i]});a.group.position.set(x,0,18);a.group.visible=false;scene.add(a.group);ambient.push(a);}
 let beat=0,seconds=0;
 return {set(next:number,cuts:number,progress:number,active:boolean){beat=next;guide.position.set(next>=7?4.5:1.6,0,next>=7?14:9);cut.group.visible=active;cut.update(cuts,progress,progress>0&&cuts<3);ambient.forEach(a=>a.group.visible=next>=8);},update(dt:number){seconds+=dt;if(beat>=8)ambient.forEach((a,i)=>a.update(Math.floor((seconds+i*2)/3)%3,(seconds/3+i*.3)%1,true));},dispose(){cut.dispose();ambient.forEach(a=>a.dispose());group.removeFromParent();group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m instanceof THREE.MeshBasicMaterial)m.map?.dispose();m.dispose();}}});}};
}
