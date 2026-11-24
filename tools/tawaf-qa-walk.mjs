/** Exercise the real keyboard/controller, without changing player coordinates. */
export async function walkManually(page,x,z,timeout=120000){
 const started=Date.now();let held=[];
 try{while(Date.now()-started<timeout){const d=await page.locator('.miqatRoom').evaluate(el=>({...el.dataset})),dx=x-Number(d.playerX),dz=z-Number(d.playerZ),distance=Math.hypot(dx,dz);if(distance<.9)return;
  const yaw=Number(d.cameraYaw),forward=Math.sin(yaw)*dx+Math.cos(yaw)*dz,right=-Math.cos(yaw)*dx+Math.sin(yaw)*dz,keys=[];
  if(Math.abs(forward)>distance*.26)keys.push(forward>0?'w':'s');if(Math.abs(right)>distance*.26)keys.push(right>0?'d':'a');
  for(const key of held)if(!keys.includes(key))await page.keyboard.up(key);for(const key of keys)if(!held.includes(key))await page.keyboard.down(key);held=keys;await page.waitForTimeout(distance>2?350:100);
 }throw Error('Manual walk timed out toward '+x+', '+z);
 }finally{for(const key of held)await page.keyboard.up(key);await page.waitForTimeout(250);}
}
