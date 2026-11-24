import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const BASE=process.env.ADVENTURE_QA_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const report=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:960,height:540},deviceScaleFactor:.65}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));await page.goto(BASE+'/offline.html');
 for(let level=1;level<=11;level++){
  const save={version:1,level,avatar:level%2?'female':'male',campaign:'hajj',quest:0,...(level===11?{flightRoute:'madinah'}:{})};
  await page.evaluate(save=>{localStorage.setItem('manasik-adventure-v46',JSON.stringify(save));localStorage.setItem('manasik-tawaf-quest-v1','route-save-sentinel');},save);
  await page.goto(BASE+'/adventure.html?classic=1');await page.locator('#locationTag').waitFor();await page.waitForTimeout(350);
  assert.equal(await page.locator('#fallback').isVisible(),false,'classic renderer fallback at '+level);assert.equal(await page.locator('#world').isVisible(),true);
  assert.equal(await page.locator('.lifeHud').evaluate(e=>getComputedStyle(e).display),'block');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('manasik-adventure-v46'))),save);assert.equal(await page.evaluate(()=>localStorage.getItem('manasik-tawaf-quest-v1')),'route-save-sentinel');
  await page.getByRole('button',{name:'Buka tas dan kondisi karakter'}).click();const bag=page.getByRole('dialog',{name:'Tas dan kondisi karakter'});await bag.waitFor();assert.equal(await bag.locator('.lifeStats progress').count(),5);await page.keyboard.press('Escape');await bag.waitFor({state:'hidden'});
  if([1,5,8,11].includes(level))await page.screenshot({path:`qa-output/classic-cast-${level}.png`});report.push({level,avatar:save.avatar,passed:true});console.log('PASS classic',level);
 }
 assert.deepEqual(errors,[]);await writeFile('qa-output/classic-cast.json',JSON.stringify({passed:true,report,errors,scope:'Production startup smoke of all 11 existing preparation levels, alternating avatars. Retains the current saved quest; does not complete their missions.'},null,2));
}finally{await browser.close();}
