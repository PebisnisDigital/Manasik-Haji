/** Use the same visible two-button controls as a player; never force-click hidden UI. */
export async function pressAction(page,name,touch=false){
 const press=l=>touch?l.tap():l.click();
 if(!await page.locator('#simplePlay').count())return press(page.getByRole('button',{name,exact:true}));
 await press(page.locator('#simpleAction'));
 const menu=page.locator('#simpleSettings[open]');
 if(await menu.count())await press(menu.getByRole('button',{name,exact:true}));
}
export async function fieldAction(page,name,touch=false){
 await page.waitForFunction(name=>Array.from(document.querySelectorAll('#actions button')).some(b=>!b.disabled&&(b.textContent===name||b.textContent==='Jalan ke lokasi'||b.textContent?.startsWith('Dekati '))),name,{timeout:150000});
 const approach=await page.locator('#actions button').evaluateAll(bs=>bs.find(b=>!b.disabled&&(b.textContent==='Jalan ke lokasi'||b.textContent?.startsWith('Dekati ')))?.textContent);
 if(approach)await pressAction(page,approach,touch);
 await page.waitForFunction(name=>Array.from(document.querySelectorAll('#actions button')).some(b=>!b.disabled&&b.textContent===name),name,{timeout:150000});
 await pressAction(page,name,touch);
}
export async function miqatArrive(page){
 if(await page.locator('#miqatInteract').isDisabled())await page.locator('#simpleAction').click();
 await page.waitForFunction(()=>!document.querySelector('#miqatInteract').disabled,null,{timeout:150000});
 const phase=await page.locator('.miqatRoom').getAttribute('data-phase'),step=await page.locator('.miqatRoom').getAttribute('data-transfer-step');
 await page.locator('#simpleAction').click();
 if(phase==='sai-transfer'&&Number(step)<3)return;
 if(phase==='arrival'&&await page.locator('.miqatRoom').getAttribute('data-arrival-stage')==='3'&&!await page.locator('.miqatDialog[open]').count()){await page.waitForFunction(()=>document.querySelector('.miqatRoom')?.dataset.kaabaVisible==='true');await page.locator('#simpleAction').click();}
 await page.locator('.miqatDialog[open]').waitFor();
}
