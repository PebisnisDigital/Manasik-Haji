import * as THREE from 'three';
import { humanActor } from './characters/HumanActors.ts';
import { Clip } from './sim/States.ts';
import { ALFAMART_PRODUCTS } from './alfamartProducts.ts';
import { buildBasket, buildStoreBag, STORE_CHECKOUT, STORE_SHELVES } from './alfamartInterior.ts';
import { block, marketPoint as point, walkMarketActor as walk } from './marketGeometry.ts';
import type { MarketAudioCue } from './alfamartStore.ts';

export type MarketSpeech = (actor: THREE.Group, name: string, text: string) => void;
type CustomerState = 'SPAWN'|'WALK_TO_STORE'|'ENTER_STORE'|'BROWSE'|'PICK_PRODUCT'|'QUEUE'|'CHECKOUT'|'RECEIVE_BAG'|'EXIT_STORE'|'DEPART';
type Shopper = {
  actor: THREE.Group;
  name: string;
  state: CustomerState;
  route: THREE.Vector3[];
  wait: number;
  shelf: number;
  picked?: boolean;
  selected: number;
  basket: THREE.Group | null;
  sale?: number;
  bag?: THREE.Group;
};
const entry = () => [point(16.03,-1.62),point(16.03,-4.27)];
const exit = () => [point(20.16,-5.68),point(20.16,-3.75),point(16.92,-3.75),point(16.92,-1.63)];
const checkoutPoint = point(STORE_CHECKOUT.x,STORE_CHECKOUT.z);
const spawnPoints = [point(15.28,3.6),point(16.09,4.28),point(16.85,4.52)];
const queueSpot = (i: number) => i<3?point(STORE_CHECKOUT.x, STORE_CHECKOUT.z + .79*i):point(17.9,-3.87);
const sStand = point(16.36,-5.03);

export function createAlfamartNPCs(scene: THREE.Scene, root: THREE.Group, count: number, speak: MarketSpeech, audio: (cue: MarketAudioCue) => void, served: (id: number) => void) {
  const cashier = humanActor(scene, 0xde2833, false, undefined, undefined, { palette:10, build:1, brightness:1, cull:true, registration:true });
  cashier.position.set(19.48,0,-7.22);
  const ambient = Array.from({length:count}, (_,i):Shopper => {
    const actor=humanActor(scene,0x84a5b2,i%2===1,undefined,undefined,{palette:i+3,build:1,brightness:1,cull:true,registration:true});
    actor.visible=false;
    return {actor,name:['Maya','Rafi','Nisa'][i]!,state:'SPAWN',route:[],wait:1+i*7,shelf:0,selected:i,basket:null};
  });
  const line: Shopper[] = [];
  const mission = new Map<number,Shopper>();
  let current: Shopper | undefined;
  let browsing: Shopper | undefined;
  let cycles=0;
  let activeActors: THREE.Group[] = [];
  let playerNear = false;
  const bagOrigin = new THREE.Vector3(19.48,1.11,-6.26);
  const bagEnd = new THREE.Vector3();
  const displays = [0x8fcbe2,0xe5ba63,0x65924c,0x956445,0x39aebd,0xd55749,0xf8ab3d];

  function browse(buyer: Shopper) {
    const shelf=STORE_SHELVES[buyer.shelf]!;
    buyer.state='BROWSE';
    buyer.route=[point(16.04,buyer.actor.position.z),point(16.04,shelf.z+.88),point(shelf.x,shelf.z+.88)];
    buyer.wait=1.5;
  }
  function routeDone(buyer: Shopper, dt: number) {
    const next=buyer.route[0];
    if(next&&walk(buyer.actor,next,dt,1.52,activeActors)) buyer.route.shift();
    return buyer.route.length===0;
  }
  function attachBasket(buyer: Shopper) {
    buyer.basket = buildBasket(buyer.actor,-.31,.78,.16,.86);
    buyer.actor.userData.campPose={clip:Clip.MARKET_CARRY,phase:0};
  }
  function addItem(buyer: Shopper) {
    if(!buyer.basket) attachBasket(buyer);
    const item=ALFAMART_PRODUCTS[buyer.selected];
    if(item) block(buyer.basket!,.09,.19,.10,.025,.11,0,displays[buyer.selected]!);
  }
  function enqueue(buyer: Shopper) {
    buyer.state='QUEUE';
    buyer.route=[point(16.04,buyer.actor.position.z),point(16.04,-4.60),point(18.6,-4.60)];
    line.push(buyer);
  }
  function handoff(id: number, actor: THREE.Group, name: string, product: number) {
    if(mission.has(id)) return false;
    const buyer:Shopper={actor,name,state:'QUEUE',route:[point(18.6,actor.position.z)],wait:0,shelf:0,selected:product,basket:null,sale:id};
    mission.set(id,buyer);
    addItem(buyer);
    line.push(buyer);
    return true;
  }
  function reset() {
    for(const buyer of mission.values()) {
      buyer.basket?.removeFromParent();buyer.bag?.removeFromParent();
      delete buyer.actor.userData.campPose;
      const index=line.indexOf(buyer);
      if(index!==-1) line.splice(index,1);
      if(current===buyer) current=undefined;
    }
    delete cashier.userData.campPose;
    mission.clear();
  }
  function updateBuyer(buyer: Shopper, dt: number, hold: THREE.Group | null) {
    if (buyer.actor === hold) return;
    const actor=buyer.actor;
    switch(buyer.state) {
      case 'SPAWN': {
        buyer.wait-=dt;
        if(buyer.wait>0||browsing||line.length>=2) return;
        browsing=buyer;
        actor.position.copy(spawnPoints[ambient.indexOf(buyer)]!);
        actor.visible=true;
        buyer.route=[point(16.04,3.4),entry()[0]!];
        buyer.state='WALK_TO_STORE';
        break;
      }
      case 'WALK_TO_STORE':
        if(routeDone(buyer,dt)) { buyer.state='ENTER_STORE';buyer.route=entry(); }
        break;
      case 'ENTER_STORE':
        if(routeDone(buyer,dt)) { attachBasket(buyer);buyer.shelf=ambient.indexOf(buyer);buyer.picked=false;browse(buyer); }
        break;
      case 'BROWSE':
        if(routeDone(buyer,dt)) {
          actor.rotation.y=Math.PI;buyer.wait-=dt;
          if(buyer.wait<=0) { buyer.state='PICK_PRODUCT';buyer.wait=.65; }
        }
        break;
      case 'PICK_PRODUCT':
        buyer.wait-=dt;
        actor.userData.campPose={clip:Clip.GUIDE_WAVE,phase:THREE.MathUtils.clamp(1-buyer.wait/.65,0,1)};
        if(buyer.wait<=0) {
          addItem(buyer);
          actor.userData.campPose={clip:Clip.MARKET_CARRY,phase:0};
          if(!buyer.picked) {buyer.picked=true;buyer.shelf=(buyer.shelf+2)%STORE_SHELVES.length;browse(buyer);}
          else enqueue(buyer);
        }
        break;
      case 'QUEUE': {
        if(!routeDone(buyer,dt)) return;
        if(browsing===buyer)browsing=undefined;
        const index=line.indexOf(buyer);
        if(index===-1) return;
        const spot = queueSpot(index);
        if(Math.abs(actor.position.z-spot.z)>.07) {
          if(actor.position.x>18.66&&actor.position.x<19.2) walk(actor,point(18.6,actor.position.z),dt,1.35,activeActors);
          else walk(actor,point(actor.position.x,spot.z),dt,1.35,activeActors);
          return;
        }
        if(!walk(actor,spot,dt,1.35,activeActors)) return;
        actor.rotation.y=Math.PI;
        if(index===0&&!current&&actor.position.distanceTo(checkoutPoint)<.08) {
          current=buyer;buyer.state='CHECKOUT';buyer.wait=1.1;
          if(playerNear) audio('scan');
        }
        break;
      }
      case 'CHECKOUT':
        buyer.wait-=dt;
        if(buyer.wait<=0) {
          buyer.state='RECEIVE_BAG';buyer.wait=.75;
          buyer.bag=buildStoreBag(root);
          buyer.bag.position.copy(bagOrigin);
          if(playerNear) speak(cashier,'Kasir Alfamart','Ini tas belanjaannya, silakan.');
        }
        break;
      case 'RECEIVE_BAG': {
        buyer.wait-=dt;
        const transfer=THREE.MathUtils.clamp(1-buyer.wait/.75,0,1);
        cashier.userData.campPose={clip:Clip.GUIDE_WAVE,phase:transfer*.86};
        actor.localToWorld(bagEnd.set(.29,.68,.1));
        buyer.bag!.position.lerpVectors(bagOrigin,bagEnd,transfer);
        if(buyer.wait<=0) {
          actor.attach(buyer.bag!);buyer.basket?.removeFromParent();buyer.basket=null;
          delete actor.userData.campPose;delete cashier.userData.campPose;
          if(playerNear) speak(actor,buyer.name,'Terima kasih!');
          if(buyer.sale!==undefined) served(buyer.sale);
          cycles++;buyer.state='EXIT_STORE';buyer.route=exit();buyer.wait=1.05;
        }
        break;
      }
      case 'EXIT_STORE':
        buyer.wait-=dt;
        if(buyer.wait<=0&&routeDone(buyer,dt)) {
          buyer.state='DEPART';buyer.route=[point(16.93,3.55),point(buyer.sale===undefined?16.9:15.2,4.42)];
        }
        // Release the checkout when the previous customer actually leaves its lane.
        if(current===buyer&&actor.position.x>20.09) {line.shift();current=undefined;}
        break;
      case 'DEPART':
        if(routeDone(buyer,dt)) {
          buyer.bag?.removeFromParent();buyer.bag=undefined;
          if(buyer.sale===undefined){actor.visible=false;buyer.state='SPAWN';buyer.wait=4;}
          else{mission.delete(buyer.sale);actor.userData.marketPurchase='done';}
        }
        break;
    }
  }

  return { cashier, handoff, reset, has:(id:number)=>mission.has(id), update(dt:number,hold:THREE.Group|null,player:THREE.Vector3) {
    playerNear=player.distanceToSquared(sStand)<100;
    if(player.distanceToSquared(sStand)>29**2&&!mission.size) return [];
    const shoppers=[...ambient,...mission.values()];
    activeActors=shoppers.map(buyer=>buyer.actor);
    for(const buyer of shoppers) updateBuyer(buyer,dt,hold);
    document.documentElement.dataset.alfamartQueue=String(line.length);
    document.documentElement.dataset.alfamartServed=String(cycles);
    return activeActors;
  }};
}
