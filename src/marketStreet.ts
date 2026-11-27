import * as THREE from 'three';
import { humanActor,registerGroundBody } from './characters/HumanActors.ts';
import { Clip } from './sim/States.ts';
import { batchMarketBlocks, block, marketPaint, marketPoint as point, marketSign, round, type MarketWalk } from './marketGeometry.ts';
import { storeGlass } from './alfamartInterior.ts';
import type { MarketSpeech } from './alfamartNPC.ts';
import type { MarketAudioCue } from './alfamartStore.ts';

export const vendorInfo = [
  { name:'Penjual Bakso', food:'Bakso', x:-29.2, z:1.0, serviceSide:-1, color:0x25806b, foodColor:0xaf7648 },
  { name:'Penjual Siomay', food:'Siomay', x:-14.6, z:4.8, serviceSide:1, color:0x3479a8, foodColor:0xf1d7a3 },
];
const rides = [
  { x:13.32,z:-.03,name:'Kereta',color:0xe73539 },
  { x:13.32,z:1.48,name:'Unicorn',color:0xd25b9b },
  { x:13.32,z:3.01,name:'Mobil balap',color:0x2d7dbd },
];
function solid(x:number,z:number,w:number,d:number,h:number) {
  return new THREE.Box3(new THREE.Vector3(x-w/2,0,z-d/2),new THREE.Vector3(x+w/2,h,z+d/2));
}
export const streetSolids = [
  ...vendorInfo.flatMap(({x,z})=>[solid(x,z,1.88,.95,2.18),solid(x-.57,z+1.23,.74,.57,.69)]),
  ...rides.map(({x,z})=>solid(x,z,1.14,1.16,1.46)),
];

function person(scene:THREE.Scene,palette:number,female=false,height?:number) {
  return humanActor(scene,0xffe1c1,female,height,undefined,{palette,build:1,brightness:1,cull:true,registration:true});
}

type CanSpawn = (actor:THREE.Group,point:THREE.Vector3)=>boolean;

function createVendors(scene:THREE.Scene,root:THREE.Group,speak:MarketSpeech,walk:MarketWalk,canSpawn:CanSpawn) {
  return vendorInfo.map(({name,food,x,z,color,foodColor,serviceSide}, index)=>{
    const actor=person(scene,index===0?2:4,index===1);actor.position.set(x,0,z-1.0);
    block(root,1.76,.74,.8,x,.47,z,color);
    block(root,1.86,.10,.89,x,.89,z,0xe5caa9);
    block(root,1.95,.14,1.03,x,2.07,z,color);
    block(root,1.56,.53,.025,x,1.22,z+.393,storeGlass);
    for (const s of [-1,1]) {
      const wheel=round(root,.28,.13,x+s*.86,.28,z,0x262831);wheel.rotation.z=Math.PI/2;
      block(root,.045,1.23,.048,x+s*.86,1.48,z+.39,0x404449);
    }
    round(root,.23,.27,x+.53,1.045,z,0xabadb5);
    round(root,.25,.035,x+.53,1.19,z,0xdae0de);
    round(root,.047,.04,x+.53,1.22,z,0x363a3d);
    block(root,.32,.055,.27,x-.4,.97,z+.18,0xebdfcf);
    for(let i=0;i<5;i++) round(root,.048,.068,x-.52+i*.061,1.04,z+.18,foodColor);
    block(root,.73,.66,.53,x-.57,.34,z+1.23,0x7f5d3f);
    block(root,.47,.45,.30,x+.1,.23,z+1.23,color);
    marketSign(root,food,'Hangat',x,1.82,z+.43,1.54,.30,index===0?'#19705a':'#246f9c');
    const visitors=Array.from({length:1},(_,i)=>{
      const customer=person(scene,5+index+i,i===1);
      customer.visible=false;
      const bowl=round(customer,.10,.065,.03,1.08,.25,0xe5d7b9);bowl.visible=false;
      return {customer,bowl,state:'arrive',time:index*4+i*6};
    });
    const line:typeof visitors=[];
    const sideX=x+serviceSide*1.70;
    const lane=point(sideX,z+2.55), order=point(sideX,z+.12), seat=point(sideX,z+1.10), departure=lane.clone();
    return { actor,name,food, update(dt:number,player:THREE.Vector3) {
      const near=actor.position.distanceToSquared(player)<75;
        for(const visitor of visitors) {
        const {customer,bowl}=visitor;
        if(visitor.state==='arrive') {
          visitor.time-=dt;
          if(visitor.time<=0 && canSpawn(customer,lane)) {
            customer.position.copy(lane);customer.visible=true;line.push(visitor);visitor.state='queue';
          }
        } else if(visitor.state==='queue') {
          const place=line.indexOf(visitor);
          const slot=order;
          if(walk(customer,slot,dt,1.15)&&place===0&&!visitors.some(v=>v.state==='seat'||v.state==='eat')) {
            customer.rotation.y=Math.atan2(x-customer.position.x,z-customer.position.z);
            visitor.state='order';visitor.time=2;
            if(near) speak(customer,index===0?'Tamu Bakso':'Tamu Siomay','Pesan satu porsi, ya.');
          }
        } else if(visitor.state==='order') {
          visitor.time-=dt;
          actor.rotation.y=Math.atan2(customer.position.x-x,customer.position.z-actor.position.z);
          actor.userData.campPose={clip:Clip.MARKET_CARRY,phase:visitor.time%1};
          if(visitor.time<=0) {
            delete actor.userData.campPose;line.shift();bowl.visible=true;visitor.state='seat';
            if(near) speak(actor,name,'Silakan, masih hangat.');
          }
        } else if(visitor.state==='seat') {
          if(walk(customer,seat,dt,1.2)) {
            visitor.state='eat';visitor.time=4.5;customer.rotation.y=serviceSide<0?Math.PI/2:-Math.PI/2;
          }
        } else if(visitor.state==='eat') {
          visitor.time-=dt;
          customer.userData.campPose={clip:Clip.MARKET_EAT,phase:visitor.time%1+1};
          if(visitor.time<=0){
            delete customer.userData.campPose;bowl.visible=false;visitor.state='leave';
            if(near) speak(customer,'Pengunjung','Enak! Terima kasih.');
          }
        } else if(walk(customer,departure,dt,1.15)) {
          customer.visible=false;visitor.state='arrive';visitor.time=5+index;
        }
      }
    }};
  });
}

function createRides(scene:THREE.Scene,root:THREE.Group,speak:MarketSpeech,audio:(cue:MarketAudioCue)=>void,walk:MarketWalk,canSpawn:CanSpawn) {
  const bulbs=[0xf55a36,0x41d1de,0xffd934,0xa278fc].map(color=>new THREE.MeshBasicMaterial({color}));
  const models=rides.map(({x,z,name,color}, i)=>{
    block(root,1.12,.18,1.15,x,.09,z,0xf5c531);
    const prop=new THREE.Group();prop.position.set(x,0,z);root.add(prop);
    block(prop,.71,.35,.87,0,.47,0,color);
    if(i===0) {
      round(prop,.23,.48,0,.65,.25,0x1b93ab).rotation.x=Math.PI/2;
      round(prop,.083,.22,0,.89,.38,0x383449);
      block(prop,.62,.13,.43,0,1.06,-.13,0x29a78b);
      for(const sx of [-.33,.33])block(prop,.06,.46,.06,sx,.83,-.22,0x29a78b);
    } else if(i===1) {
      const ball=new THREE.SphereGeometry(1,10,8);
      const shape=(w:number,h:number,d:number,y:number,z:number,c:number)=>{
        const mesh=new THREE.Mesh(ball,marketPaint(c));
        mesh.scale.set(w,h,d);mesh.position.set(0,y,z);prop.add(mesh);
      };
      shape(.22,.26,.43,.60,0,0xffe1f0);shape(.17,.34,.16,.8,.24,0xffe1f0);
      shape(.17,.16,.25,1.08,.37,0xffe1f0);
      round(prop,.05,.16,0,1.23,.39,0xffca36).rotation.x=.28;
      block(prop,.39,.08,.32,0,.80,-.10,color);
    } else {
      block(prop,.63,.08,.38,0,.75,.27,0x9bd6e1).rotation.x=-.48;
      block(prop,.75,.11,.15,0,.83,-.42,color);
      for(const x of [-.34,.34])for(const z of [-.32,.32]) round(prop,.16,.09,x,.39,z,0x292731).rotation.z=Math.PI/2;
    }
    marketSign(prop,name,'',0,.31,.44,.63,.14,'#542349');
    for (let j=0;j<4;j++) block(prop,.11,.09,.09,-.23+j*.15,.35,.47,bulbs[j]!);
    return prop;
  });
  const parent=person(scene,4,true), child=person(scene,1,false,1.12);
  const away=point(11.62,4.91),childAway=point(12.27,4.64);
  parent.position.copy(away);child.position.copy(childAway);parent.visible=child.visible=false;
  const sidePoints=rides.map(({x,z})=>point(x-1.43,z));
  const childPoints=rides.map(({x,z})=>point(x-1.04,z+.52));
  let cycle=0, state:'rest'|'arrive'|'ride'|'leave'='rest',time=1.5, pulse=0;
  return (dt:number,player:THREE.Vector3)=>{
    pulse+=dt;
    bulbs.forEach((b,i)=>{b.color.setHex(Math.floor(pulse*5+i)%4===0?0xfffffa:[0xf55a36,0x41d1de,0xffd934,0xa278fc][i]!);});
    const {x,z}=rides[cycle]!;
    if(state==='rest'){
      time-=dt;
      if(time<=0&&canSpawn(parent,away)&&canSpawn(child,childAway)){parent.visible=child.visible=true;state='arrive';}
    } else if(state==='arrive'){
      const ready=walk(parent,sidePoints[cycle]!,dt,1.3);
      if(walk(child,childPoints[cycle]!,dt,1.25)&&ready){
        state='ride';time=6;child.position.set(x,.52,z-.02);
        child.userData.campPose={clip:Clip.MARKET_SEAT,phase:0};
        parent.rotation.y=Math.PI/2;
        if(parent.position.distanceToSquared(player)<65){speak(parent,'Orang tua','Main sebentar, ya. Ibu tunggu di sini.');audio('ride');}
      }
    } else if(state==='ride'){
      time-=dt;models[cycle]!.position.y=Math.sin(pulse*5)*.07;models[cycle]!.rotation.x=Math.sin(pulse*4)*.10;
      child.position.y=.52+models[cycle]!.position.y;
      if (time<=0&&canSpawn(child,childPoints[cycle]!)){
        delete child.userData.campPose;child.position.copy(childPoints[cycle]!);
        models[cycle]!.position.y=0;models[cycle]!.rotation.x=0;state='leave';
        if(parent.position.distanceToSquared(player)<65) speak(child,'Anak','Sudah selesai! Ayo, Bu.');
      }
    } else {
      const ready=walk(parent,away,dt,1.26);
      if(walk(child,childAway,dt,1.2)&&ready){
        state='rest';cycle=(cycle+1)%rides.length;time=3;parent.visible=child.visible=false;
      }
    }
  };
}

function createParking(scene:THREE.Scene,root:THREE.Group,speak:MarketSpeech,audio:(cue:MarketAudioCue)=>void,walk:MarketWalk,canSpawn:CanSpawn) {
  const actor=person(scene,11);
  const home=point(21.15,3.85),parking=point(22.35,.86),street=point(22.35,7.95),guide=point(21.55,2.93);
  actor.position.copy(home);
  block(actor,.25,.09,.25,0,1.73,.025,0x344255);
  block(actor,.18,.028,.17,0,1.70,.194,0x344255);
  block(actor,.05,.08,.038,0,1.37,.18,0xddd9c1);
  block(actor,.05,.48,.05,.34,.93,.12,0xef8b20).rotation.z=.36;
  block(actor,.048,.16,.047,.285,1.12,.12,0xf1ecda).rotation.z=.36;
  const motor=new THREE.Group();root.add(motor);motor.position.copy(street);motor.visible=false;
  registerGroundBody(scene,motor,.54);
  block(motor,.35,.32,.68,0,.47,0,0x477691);
  block(motor,.26,.11,.52,0,.68,-.075,0x292d35);
  block(motor,.17,.51,.18,0,.58,.51,0x477691);
  block(motor,.30,.055,.085,0,.84,.48,0x202832);
  block(motor,.14,.075,.055,0,.74,.615,0xffecbc);
  for (const z of [-.47,.47]) round(motor,.212,.103,0,.23,z,0x232731).rotation.z=Math.PI/2;
  const driver=person(scene,6);
  driver.userData.campPose={clip:Clip.MARKET_SEAT,phase:0};
  driver.userData.noCollision=true;
  driver.visible=false;
  let elapsed=0;
  return {actor,update(dt:number,player:THREE.Vector3){
    const before=elapsed;
    const inbound=elapsed<6, parked=elapsed>=6&&elapsed<15, outbound=elapsed>=15&&elapsed<21;
    if(inbound&&!motor.visible){
      if(!canSpawn(motor,street))return;
      motor.position.copy(street);
    }
    motor.visible=driver.visible=inbound||outbound||parked;
    if(inbound||outbound){
      const arrived=walk(motor,inbound?parking:street,dt,1.30,false);
      const end=inbound?6:21;
      elapsed=arrived?end:Math.min(end-.001,elapsed+dt);
    }else elapsed=(elapsed+dt)%24;
    motor.rotation.y=inbound||parked?Math.PI:0;
    driver.position.copy(motor.position);driver.position.y=.29;driver.rotation.y=motor.rotation.y;
    walk(actor,(inbound||outbound)?guide:home,dt,1.2);
    if(inbound||outbound){
      actor.rotation.y=Math.atan2(motor.position.x-actor.position.x,motor.position.z-actor.position.z);
      actor.userData.campPose={clip:Clip.GUIDE_WAVE,phase:(elapsed*.9)%1};
    }else delete actor.userData.campPose;
    if(actor.position.distanceToSquared(player)<77) {
      if(before<2&&elapsed>=2){audio('whistle');speak(actor,'Tukang parkir','Pelan-pelan, parkir di garis sebelah kanan.');}
      if(before<17&&elapsed>=17)speak(actor,'Tukang parkir','Jalan sudah aman. Terima kasih!');
    }
  }};
}

export function createMarketStreet(scene:THREE.Scene,root:THREE.Group,_detail:boolean,speak:MarketSpeech,audio:(cue:MarketAudioCue)=>void,walk:MarketWalk,canSpawn:CanSpawn) {
  const street=new THREE.Group();root.add(street);
  const vendors=createVendors(scene,street,speak,walk,canSpawn);
  const ridesUpdate=createRides(scene,street,speak,audio,walk,canSpawn);
  const parking=createParking(scene,street,speak,audio,walk,canSpawn);
  batchMarketBlocks(street);
  return {
    talkers:[
      ...vendors.map(v=>({actor:v.actor,name:v.name,line:'Silakan, '+v.food.toLowerCase()+' hangat baru matang.'})),
      {actor:parking.actor,name:'Tukang parkir',line:'Jalur masuk toko ada di tengah. Motor silakan masuk dari kanan.'},
    ],
    update(dt:number,player:THREE.Vector3) {
      for(const vendor of vendors)vendor.update(dt,player);
      if(player.x>=-7){ridesUpdate(dt,player);parking.update(dt,player);}
    },
  };
}
