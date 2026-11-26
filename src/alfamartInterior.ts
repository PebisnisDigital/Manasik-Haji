import * as THREE from 'three';
import { block, marketSign, round } from './marketGeometry.ts';

export const STORE_X = 16.5;
export const STORE_FRONT = -3.15;
export const STORE_BACK = -10.65;
export const STORE_SHELVES = [
  { x: 14.05, z: -6.55, title: 'CAMILAN', prices: 'Paket Rp15.000', colors: [0xe54032, 0xf8b324, 0x5b9d49] },
  { x: 14.05, z: -8.52, title: 'DAPUR', prices: 'Mi instan Rp3.500', colors: [0xf29031, 0xd02b2c, 0x578e42] },
  { x: 17.8, z: -6.55, title: 'MANDI', prices: 'Perlengkapan mandi', colors: [0x48aec6, 0xe8e8d7, 0xd785a6] },
  { x: 17.8, z: -8.52, title: 'BISKUIT & SUSU', prices: 'Biskuit Rp10.000 · Susu Rp9.000', colors: [0x975b3e, 0x5083bf, 0xe6bc69] },
] as const;
export const STORE_REPORT = { x: 18.45, z: -4.85 };
export const STORE_CHECKOUT = { x: 19.48, z: -5.68 };

const glass = new THREE.MeshStandardMaterial({ color: 0xbce2e9, opacity: .15, transparent: true, roughness: .25, depthWrite: false });
export { glass as storeGlass };
const led = new THREE.MeshBasicMaterial({ color: 0xffffee });
type Pack = { x: number; y: number; z: number; w: number; h: number; d: number; color: number };

function placePacks(root: THREE.Group, packs: Pack[], geometry: THREE.BufferGeometry) {
  const mesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({ roughness: .65 }), packs.length);
  const transform = new THREE.Object3D(), shade = new THREE.Color();
  packs.forEach(({ x, y, z, w, h, d, color }, i) => {
    transform.position.set(x, y, z);
    transform.scale.set(w, h, d);
    transform.updateMatrix();
    mesh.setMatrixAt(i, transform.matrix);
    mesh.setColorAt(i, shade.setHex(color));
  });
  mesh.computeBoundingSphere();
  root.add(mesh);
}

export function buildAlfamartInterior(root: THREE.Group) {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 128;
  const ctx = tile.getContext('2d')!;
  ctx.fillStyle = '#454954';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#f6f7f6';
  ctx.fillRect(2, 2, 124, 124);
  const map = new THREE.CanvasTexture(tile);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(14, 12);
  map.anisotropy = 4;
  // Map onto the floor with a single repeating tile.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8.35, 7.5), new THREE.MeshStandardMaterial({ map, roughness: .66 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(STORE_X, .022, -6.9);
  root.add(floor);

  for (const x of [14.05, 16.5, 18.95]) for (const z of [-5.1, -8.5]) {
    block(root, .24, .07, 2, x, 3.42, z, 0xaeb4b6);
    block(root, .16, .025, 1.93, x, 3.375, z, led);
  }
  block(root, 1.48, .34, .21, 13.8, 3.05, -10.43, 0xf9f9f5);
  block(root, 1.31, .045, .045, 13.8, 2.95, -10.31, 0x515960);

  const cartons: Pack[] = [], bottles: Pack[] = [];
  for (const shelf of STORE_SHELVES) {
    const { x, z, title, prices, colors } = shelf;
    block(root, 1.02, 1.68, .1, x, .84, z-.30, 0xe7e5df);
    for (const side of [-1, 1]) block(root, .065, 1.68, .65, x+side*.51, .84, z, 0xd2d9da);
    for (let row = 0; row < 4; row++) {
      const y = .23 + row*.39;
      block(root, 1.04, .055, .67, x, y, z, 0xdde1df);
      block(root, 1.03, .04, .035, x, y+.02, z+.34, 0xd72529);
      for (let i = 0; i < 5; i++) {
        const h = .19 + ((i + row) % 3)*.035;
        cartons.push({ x:x-.4+i*.20, y:y+.03+h/2, z:z+.03, w:.13+(row%2)*.03, h, d:.23, color:colors[(i+row)%3]! });
        cartons.push({ x:x-.4+i*.20, y:y+.055+h*.33, z:z+.152, w:.10, h:.042, d:.009, color:0xffffee });
      }
    }
    marketSign(root, title, prices, x, 1.73, z+.335, 1.03, .22, '#cf242b');
  }
  marketSign(root, 'ROTI', 'Rp8.000', 14.05, .63, -6.195, .8, .14, '#fff8e6', '#781e20');
  for (let i = 0; i < 3; i++) {
    const x = 15 + i*1.47, z = -9.96;
    block(root, 1.33, 2.28, .09, x, 1.14, z-.38, 0x37434d);
    for (const side of [-1,1]) block(root,.065,2.28,.85,x+side*.629,1.14,z,0x272b36);
    block(root,1.33,.25,.85,x,2.16,z,0x272b36);
    block(root,1.33,.22,.85,x,.11,z,0x272b36);
    block(root, 1.22, 1.83, .04, x, 1.15, z+.449, glass);
    block(root, .052, .35, .09, x+.48, 1.17, z+.49, 0xced6dd);
    block(root, .045, 1.8, .045, x-.57, 1.15, z+.435, led);
    marketSign(root, ['AIR & TEH','SUSU & JUS','SODA'][i]!, '', x, 2.12, z+.44, 1.24, .23, '#145d8f');
    for (let row=0; row<4; row++) {
      const y=.31+row*.44;
      block(root, 1.17, .035, .31, x, y, z+.28, 0xc9cdcd);
      for (let j=0; j<7; j++) {
        const xx=x-.44+j*.146, color=[0xa6d9ef,0x39672e,0xfef9da,0xcf363d,0xeb9f18][(i*2+row+j)%5]!;
        bottles.push({x:xx,y:y+.14,z:z+.32,w:.053,h:.24,d:.053,color});
        bottles.push({x:xx,y:y+.28,z:z+.32,w:.036,h:.045,d:.036,color:0xf4f4f1});
        cartons.push({x:xx,y:y+.14,z:z+.374,w:.073,h:.065,d:.008,color:0xffffed});
      }
    }
  }
  placePacks(root, cartons, new THREE.BoxGeometry());
  placePacks(root, bottles, new THREE.CylinderGeometry(1, 1, 1, 7));

  const x = STORE_CHECKOUT.x;
  block(root, 1.52, 1.02, .62, x, .51, -6.38, 0xcb282c);
  block(root, 1.62, .08, .70, x, 1.04, -6.38, 0x323745);
  block(root, .3, .29, .1, x-.36, 1.23, -6.56, 0x202329);
  block(root, .26, .23, .012, x-.36, 1.23, -6.615, 0x7dbfba);
  block(root, .22, .08, .15, x+.04, 1.12, -6.34, 0x434550);
  block(root, .13, .09, .2, x+.35, 1.125, -6.24, 0x353742);
  block(root, .37, .11, .025, x-.35, .96, -6.055, 0xb9bec5);
  block(root, .27, .35, .14, x+.6, 1.26, -6.44, 0xe6d8bf);
  for (let i=0;i<4;i++) block(root,.09,.14,.10,x+.10+i*.14,1.15,-6.58,[0xea5d42,0xeeb82b,0x72a55e,0x95c2da][i]!);
  marketSign(root, 'KASIR', '', x, 2.38, -6.64, 1.25, .31, '#d72529');
  for (let i=0;i<3;i++) {
    const z=-5.63+i*.81;
    block(root,.70,.01,.2,x,.028,z, i===0?0xf6c80c:0xc5c7c9);
  }
  buildBasket(root, x+.6, .22, -5.79, .88);
}

export function buildBasket(root: THREE.Object3D, x: number, y: number, z: number, scale = 1) {
  const basket = new THREE.Group();
  basket.position.set(x,y,z);
  basket.scale.setScalar(scale);
  root.add(basket);
  block(basket,.33,.045,.24,0,0,0,0xf4bd26);
  for (const s of [-1,1]) {
    block(basket,.34,.14,.033,0,.07,s*.115,0xf4bd26);
    block(basket,.035,.14,.24,s*.15,.07,0,0xf4bd26);
  }
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.135,.012,5,12,Math.PI), new THREE.MeshStandardMaterial({color:0x393b3e}));
  handle.position.set(0,.135,0);
  basket.add(handle);
  return basket;
}

export function buildStoreBag(root: THREE.Object3D) {
  const bag = new THREE.Group();
  block(bag,.25,.32,.16,0,0,0,0xe2cba1);
  block(bag,.24,.07,.164,0,.03,0,0xd82c27);
  for (const z of [-.05,.05]) {
    const handle = round(bag,.012,.09,0,.18,z,0x976d40);
    handle.rotation.z = Math.PI/2;
  }
  root.add(bag);
  return bag;
}
