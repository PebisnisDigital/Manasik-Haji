import * as THREE from 'three';
import { batchMarketBlocks, block, marketSign } from './marketGeometry.ts';
import { buildAlfamartInterior, buildBasket, storeGlass, STORE_BACK, STORE_FRONT, STORE_SHELVES, STORE_X } from './alfamartInterior.ts';

const bounds = (left: number, front: number, right: number, back: number, height: number) =>
  new THREE.Box3(new THREE.Vector3(left, 0, front), new THREE.Vector3(right, height, back));

export const alfamartSolids = [
  bounds(12.22, STORE_BACK, 12.47, STORE_FRONT, 3.75),
  bounds(20.53, STORE_BACK, 20.78, STORE_FRONT, 3.75),
  bounds(12.22, STORE_BACK, 20.78, -10.43, 3.75),
  bounds(12.22, -3.24, 15.30, -3.06, 3.5),
  bounds(17.70, -3.24, 20.78, -3.06, 3.5),
  ...STORE_SHELVES.map(({ x, z }) => bounds(x-.52, z-.35, x+.52, z+.35, 1.84)),
  bounds(14.32, -10.43, 18.61, -9.50, 2.28),
  bounds(18.65, -6.73, 20.31, -6.03, 1.40),
  bounds(12.35, -.94, 12.6, -.69, 2.95),
  bounds(20.4, -.94, 20.65, -.69, 2.95),
  bounds(13.8, -2.75, 14.7, -2.25, .72),
];

export function insideAlfamart(x: number, z: number) {
  return x > 12.46 && x < 20.54 && z < STORE_FRONT && z > -10.44;
}

export type MarketAudioCue = 'door' | 'scan' | 'fridge' | 'ride' | 'whistle';

export function createAlfamartStore(root: THREE.Group, audio: (cue: MarketAudioCue) => void) {
  const store = new THREE.Group();
  store.name = 'Alfamart';
  root.add(store);
  const red = 0xd71d2b, yellow = 0xffd337, white = 0xf6f6f4, frame = 0xbdc7cd;
  block(store,.25,3.5,7.55,12.35,1.75,-6.9,white);
  block(store,.25,3.5,7.55,20.65,1.75,-6.9,white);
  block(store,8.6,3.5,.22,STORE_X,1.75,-10.54,white);
  block(store,8.7,.18,7.65,STORE_X,3.59,-6.9,white);
  block(store,8.75,.9,.28,STORE_X,3.22,-3.07,white);
  block(store,8.75,.29,2.46,STORE_X,2.82,-1.96,red);
  block(store,8.81,.07,.08,STORE_X,2.76,-.718,yellow);
  block(store,8.65,.065,.08,STORE_X,2.96,-.71,red);
  marketSign(store,'Alfamart','',STORE_X,3.27,-2.91,4.55,.68,'#fff','#d71d2b');
  block(store,2.02,.065,.03,STORE_X-1.13,2.98,-2.885,red);
  block(store,2.02,.065,.03,STORE_X+1.13,2.98,-2.885,yellow);

  const lamp = new THREE.MeshBasicMaterial({ color: 0xfff4d7 });
  for (const side of [-1, 1]) {
    block(store,.23,2.8,.23,STORE_X+side*4.02,1.4,-.81,white);
    block(store,.28,.19,.28,STORE_X+side*4.02,.095,-.81,red);
    block(store,1.05,.04,.10,STORE_X+side*2.58,2.657,-1.8,lamp);
    const x=STORE_X+side*2.66;
    block(store,2.9,2.53,.09,x,1.29,STORE_FRONT,storeGlass);
    for (const j of [-1,0,1]) block(store,.065,2.56,.10,x+j*1.44,1.28,STORE_FRONT,frame);
    block(store,2.92,.10,.14,x,.08,STORE_FRONT,white);
    block(store,2.92,.08,.13,x,2.56,STORE_FRONT,frame);
    block(store,.79,.53,.28,x+side*.85,3.19,-2.81,0xe1e4e7);
    for (let i=0;i<5;i++) block(store,.49,.025,.024,x+side*.85,3.025+i*.075,-2.657,0xa4aeb6);
    marketSign(store, side===1?'SEGAR':'PROMO', side===1?'Minuman dingin':'Roti & camilan', x,2.1,-3.08,1.23,.53,side===1?'#136289':'#d0262e');
  }

  const doors = [-1,1].map(side => {
    const panel = new THREE.Group();
    store.add(panel);
    block(panel,1.16,2.53,.07,0,1.28,0,storeGlass);
    for(const x of [-.56,.56]) block(panel,.04,2.55,.08,x,1.28,0,frame);
    for(const y of [.035,2.55]) block(panel,1.15,.046,.08,0,y,0,frame);
    block(panel,.045,.31,.145,-side*.43,1.15,.03,0x53717c);
    return panel;
  });
  block(store,2.5,.06,.53,STORE_X,.028,-2.94,0xa3aeb1);
  for(let i=0;i<3;i++) buildBasket(store,14.3,.14+i*.12,-2.52);
  block(store,.39,.62,.38,19.95,.32,-2.65,0x515a5a);
  block(store,.46,.09,.43,19.95,.65,-2.65,0xf0cd41);
  block(store,8.7,.015,5.12,STORE_X,.025,.73,0x565a60);
  for (const x of [14.72,18.25,20.28]) block(store,.04,.013,3.8,x,.036,1.32,0xf8e4a6);
  for (let i=0;i<5;i++) block(store,.64,.014,.16,STORE_X,.038,.6+i*.43,0xe9e6d5);
  buildAlfamartInterior(store);
  batchMarketBlocks(store);

  let opening = 0, wasOpen = false, fridge = 0;
  function update(dt: number, player: THREE.Vector3, shoppers: readonly THREE.Group[]) {
    const nearDoor = (p: THREE.Vector3) => Math.abs(p.x-STORE_X)<1.8 && Math.abs(p.z-STORE_FRONT)<1.45;
    const open = nearDoor(player) || shoppers.some(a=>a.visible&&nearDoor(a.position));
    if (open && !wasOpen && player.distanceToSquared(new THREE.Vector3(STORE_X,0,STORE_FRONT))<65) audio('door');
    wasOpen = open;
    opening = THREE.MathUtils.damp(opening, Number(open), 11, dt);
    doors.forEach((door,i) => door.position.set(STORE_X+(i===0?-1:1)*(.59+opening*1.14),0,STORE_FRONT));
    fridge -= dt;
    if(fridge <= 0 && insideAlfamart(player.x,player.z)) {
      audio('fridge');
      fridge = 1.7;
    }
    store.userData.doorOpen = opening > .8;
  }
  return { update, root:store };
}
