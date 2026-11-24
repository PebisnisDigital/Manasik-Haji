import * as THREE from 'three';
import {CrowdRenderer,type CrowdQuality} from './CrowdRenderer.ts';
import {APPEARANCE_EVENT,playerVariant,type Wardrobe} from './playerAppearance.ts';

/** One body, face, skin and scale in every scene; only wardrobe and recorded haircut vary. */
export class PlayerRenderer{
 readonly group=new THREE.Group();
 private current!:CrowdRenderer;
 private signature='';
 private readonly refresh=()=>{
  const variant=playerVariant(this.avatar,this.wardrobe),signature=JSON.stringify(variant);if(signature===this.signature)return;
  if(this.current){this.group.remove(this.current.group);this.current.dispose();}
  this.current=new CrowdRenderer(this.capacity,this.quality,variant);this.group.add(this.current.group);this.signature=signature;
  this.group.userData.appearance={avatar:this.avatar,hair:this.avatar==='female'?'covered':variant.hair,outfit:variant.casual?'casual':'ihram'};
 };
 constructor(private capacity:number,private quality:CrowdQuality,readonly avatar:'male'|'female',public wardrobe:Wardrobe='ritual'){
  this.group.name='player-human';this.refresh();if(typeof window!=='undefined'){window.addEventListener(APPEARANCE_EVENT,this.refresh);window.addEventListener('storage',this.refresh);}
 }
 get stats(){return this.current.stats;}
 setWardrobe(wardrobe:Wardrobe){this.wardrobe=wardrobe;this.refresh();}
 beginFrame(){this.current.beginFrame();}
 submit(...args:Parameters<CrowdRenderer['submit']>){
  args[5]=this.avatar==='female'?1.64:1.74;args[6]=1;args[12]=this.avatar==='female'?8:0;args[13]=1;
  this.current.submit(...args);
  if(typeof document!=='undefined'){const data=document.documentElement.dataset,look=this.group.userData.appearance;for(const [key,value]of Object.entries({playerAvatar:look.avatar,playerHair:look.hair,playerOutfit:look.outfit})){if(data[key]!==value)data[key]=value as string;}}
 }
 endFrame(){this.current.endFrame();}
 dispose(){if(typeof window!=='undefined'){window.removeEventListener(APPEARANCE_EVENT,this.refresh);window.removeEventListener('storage',this.refresh);}this.current.dispose();this.group.clear();}
}
