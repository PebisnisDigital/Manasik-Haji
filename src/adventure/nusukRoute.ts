import {NUSUK_LEVELS,nusukCompletion} from './nusukModel.ts';
import {loadCampaign} from './campaignProgress.ts';
import {readAqabah} from './aqabahModel.ts';
export function loadNusukRoute(){
 const campaign=loadCampaign(),by=Object.fromEntries(campaign.chapters.map(c=>[c.id,c])),aq=by.aqabah.save;
 const activity=aq?readAqabah(aq.id,aq.step>=9?7:0,aq.step>=9):null;
 const completion=nusukCompletion(Object.fromEntries(campaign.chapters.map(c=>[c.id,c.done])),aq?.step??8,activity?.beat??0);
 const chapters=NUSUK_LEVELS.map((l,i)=>{
  const source=l.id==='dam'||l.id==='hajj-tahallul'?by.aqabah:by[l.id];
  let href=source.href;
  if(l.id==='tawaf'&&!by.arrival.done)href=by.arrival.href;

  if(l.id==='dam'||l.id==='hajj-tahallul')href+='&segment='+l.id;
  const saved=!!source.save||l.id==='tawaf'&&by.arrival.done||l.id==='sai'&&by.sai.done;
  const legacyAvailable=l.id==='dam'?(aq?.step??0)>=9:l.id==='hajj-tahallul'?(aq?.step??0)>=9&&(activity?.beat??0)>=9:l.id==='tawaf'?by.arrival.available&&!!by.arrival.save||by.tawaf.done:l.id==='sai'?by.sai.available||by.tahallul.done:!!source.save;
  return {...l,href,done:completion[i],saved,field:true,available:completion[i]||i===0||completion[i-1]||legacyAvailable};
 });
 return {chapters,done:completion.filter(Boolean).length,complete:completion.every(Boolean),reward:campaign.reward,next:chapters.find(c=>!c.done&&c.available)??chapters[11]};
}
