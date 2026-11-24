import assert from 'node:assert/strict';
import {TRANSFER_ROUTE} from '../src/adventure/transferRoute.ts';
export async function driveTransfer(page,chapter){const production=true,report=[];let tripKey='manasik-transfer-hajj:'+chapter+'-v1';
async function finishBus(chapter){tripKey='manasik-transfer-hajj:'+chapter+'-v1';lastBusYaw=null;await page.waitForURL(/district.html/);await page.locator('#startDistrict').click();await page.locator('#simpleRun').click();await page.locator('#simpleAction').click();await page.waitForFunction(()=>!document.getElementById('vehicleInfo').hidden);await page.getByRole('button',{name:'Rem',exact:true}).waitFor();assert.equal(await page.locator('#simpleRun').getAttribute('aria-pressed'),'false');await page.screenshot({path:'qa-output/simple-bus-controls.png'});await drive(true);await page.locator('#simpleAction').click();await walk(30,-12);await page.locator('#simpleAction').click();await page.getByRole('button',{name:new RegExp('Mulai Level .*'+(chapter==='ihram'?'Mina':chapter==='muzdalifah'?'Mabit':chapter==='aqabah'?'Jumrah':'Wukuf'))}).click();await page.waitForURL(/hajj-adventure.html/);await page.locator('#start').click();await page.waitForURL(u=>u.searchParams.has('core'));}
let lastBusYaw=null;
const snap=async()=>{const state=await page.evaluate(({production,tripKey})=>{
 if(!production)return window.__districtDebug.snapshot();
 const transform=document.getElementById('mapPlayer').getAttribute('transform'),parts=transform.match(/translate\(([-.\d]+) ([-.\d]+)\) rotate\(([-.\d]+)\)/),x=Number(parts[1])-70,z=Number(parts[2])-57,yaw=(180-Number(parts[3]))*Math.PI/180,save=JSON.parse(localStorage.getItem(tripKey));
 return {x,z,cameraYaw:1.3,stage:save.stage,transfer:{gate:save.gate},driving:!document.getElementById('vehicleInfo').hidden,bus:{x,z,yaw,speed:Number(document.getElementById('speed').textContent)/3.6}};
},{production,tripKey});if(production){if(state.driving)lastBusYaw=state.bus.yaw;else state.cameraYaw=lastBusYaw??1.3;}return state;};
async function release(pressed){for(const k of pressed)await page.keyboard.up(k);}
async function drive(resume=false){let pressed=[],didResume=resume;const deadline=Date.now()+240000;
 while(Date.now()<deadline){const s=await snap(),gate=s.transfer.gate;if(s.stage>=4){await release(pressed);return;}
  if(Date.now()%10000<150)console.log('drive checkpoint',gate,'at',s.bus.x);if(!didResume&&gate>=9){await release(pressed);await page.keyboard.down('Space');await page.waitForTimeout(650);await page.keyboard.up('Space');const checkpoint=await snap();await page.reload();await page.locator('#startDistrict').click();await page.locator('#simpleAction').click();await page.waitForFunction(()=>!document.getElementById('vehicleInfo').hidden);assert.equal((await snap()).transfer.gate,checkpoint.transfer.gate);report.push('bus route checkpoint resumes after reload without resetting old district progress');return drive(true);}
  const target=TRANSFER_ROUTE[Math.min(gate,TRANSFER_ROUTE.length-1)],b=s.bus,d=Math.hypot(target.x-b.x,target.z-b.z),delta=Math.atan2(Math.sin(Math.atan2(target.x-b.x,target.z-b.z)-b.yaw),Math.cos(Math.atan2(target.x-b.x,target.z-b.z)-b.yaw));
  const final=gate>=TRANSFER_ROUTE.length-1,targetSpeed=final?Math.min(4,Math.max(.5,d*.75)):Math.abs(delta)>.2?3.1:6,next=[];
  if(final&&d<3||b.speed>targetSpeed+.25)next.push('Space');else if(b.speed<targetSpeed)next.push('KeyW');if(Math.abs(delta)>.05&&!(final&&d<3))next.push(delta<0?'KeyD':'KeyA');
  for(const k of pressed)if(!next.includes(k))await page.keyboard.up(k);for(const k of next)if(!pressed.includes(k))await page.keyboard.down(k);pressed=next;await page.waitForTimeout(90);
 }await release(pressed);throw Error('Bus did not arrive: '+JSON.stringify(await snap()));
}
async function walk(x,z){let pressed=[];const deadline=Date.now()+90000;while(Date.now()<deadline){const s=await snap(),dx=x-s.x,dz=z-s.z;if(Math.hypot(dx,dz)<1.6){await release(pressed);return;}const f=Math.sin(s.cameraYaw)*dx+Math.cos(s.cameraYaw)*dz,r=-Math.cos(s.cameraYaw)*dx+Math.sin(s.cameraYaw)*dz,next=[];if(Math.abs(f)>.35)next.push(f>0?'KeyW':'KeyS');if(Math.abs(r)>.35)next.push(r>0?'KeyD':'KeyA');for(const k of pressed)if(!next.includes(k))await page.keyboard.up(k);for(const k of next)if(!pressed.includes(k))await page.keyboard.down(k);pressed=next;await page.waitForTimeout(90);}await release(pressed);throw Error('Could not walk to Bu Salma');}
return finishBus(chapter);
}
