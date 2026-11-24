import assert from 'node:assert/strict';
export async function walkSaiApproach(page,{reload=false}={}){
 await page.locator('#saiDepart').waitFor();assert.match(await page.locator('#miqatDialogTitle').textContent(),/LEVEL 4/);await page.locator('#saiDepart').click();
 for(let step=1;step<=3;step++){
  await page.waitForFunction(step=>{const d=document.querySelector('.miqatRoom').dataset;return d.phase==='sai-transfer'&&d.transferStep===String(step);},step);
  await page.locator('#miqatWalk').click();await page.waitForFunction(()=>!document.querySelector('#miqatInteract').disabled,null,{timeout:120000});await page.locator('#miqatInteract').click();
  if(step===1&&reload){await page.reload();await page.locator('.miqatRoom[data-ready=true]').waitFor();}
 }
 await page.locator('#saiEnter').waitFor();await page.locator('#saiEnter').click();await page.waitForURL('**/sai-adventure.html?approach=complete');await page.waitForFunction(()=>document.body.dataset.safaRocks!==undefined);
}
