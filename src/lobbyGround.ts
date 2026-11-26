import * as THREE from 'three';
import { GATE_OFFICE } from './gateVideotronModel.ts';
import { HUMAN_RADIUS } from './sim/GroundCollision.ts';

export const PLAZA = { x: -4, width: 66, depth: 34 } as const;
export const LEGACY_PLAZA = { x: 0, width: 24, depth: 24 } as const;
export type Plaza = { x: number; width: number; depth: number };

export function groundBox(x: number, z: number, w: number, d: number, h: number) {
  return new THREE.Box3(new THREE.Vector3(x - w / 2, 0, z - d / 2), new THREE.Vector3(x + w / 2, h, z + d / 2));
}

export const parkingLayout = [-1, 1].map(side => ({
  side,
  car: { x: side * 10, z: -.25, yaw: side < 0 ? .10 : -.10 },
  scooters: Array.from({ length: 6 }, (_, i) => ({
    x: side * 7, z: -1.55 + i * 1.13, yaw: side * Math.PI / 2,
  })),
}));

export const foodCartLayout = [
  { side: -1, z: -3.15, title: 'CILOK', color: 0x368b52, food: 0xe6cd91 },
  { side: -1, z: .45, title: 'SIOMAY', color: 0xb6813b, food: 0xe8d6b2 },
  { side: 1, z: -3.15, title: 'BATAGOR', color: 0xc66b3d, food: 0xd7a45e },
  { side: 1, z: .45, title: 'ES TEH', color: 0x397c92, food: 0x9a5b34 },
] as const;

const arcade = [
  ...[-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].map(x => groundBox(x, -5.85, .64, .69, 3.3)),
  ...[-3, 0, 3].map(x => groundBox(x, -6.1, 2.53, .08, 3)),
];
const planters = (xs: number[]) => xs.flatMap(x => [-2.6, 3.5].map(z => groundBox(x, z, .98, .98, .56)));

export const gatePlazaSolids = [
  ...arcade,
  ...[-8.15, 8.15].map(x => groundBox(x, -6.5, 1.7, .4, 3.7)),
  groundBox(0, -6.5, 9.5, .4, 3.7),
  ...[-1, 1].flatMap(side => [
    groundBox(side * 10, GATE_OFFICE.z, 2, 4.5, 3.7),
    groundBox(side * 10.75, -7.65, 1.65, 1.65, 4),
    groundBox(side * 6, -8.35, 2.6, .15, 3.4),
    groundBox(side * 4.15, -3.53, 1.84, .75, 1.08),
    ...Array.from({ length: 3 }, (_, i) => groundBox(side * 15.2, -3 + i * 2.6, 1.2, .38, .5)),
  ]),
  ...planters([-8.3, 8.3]),
  ...parkingLayout.flatMap(({car,scooters}) => [
    groundBox(car.x, car.z, 2.12, 4.20, 1.53),
    ...scooters.map(({x,z}) => groundBox(x,z,1.53,.56,1.2)),
  ]),
  ...foodCartLayout.map(({side,z}) => groundBox(side * 13.1,z,.95,1.8,2.1)),
];

export const legacyPlazaSolids = [
  ...arcade,
  groundBox(0,-6.5,18,.4,3.7),
  ...[-6,6].map(x => groundBox(x,-6.1,2.53,.08,3)),
  ...planters([-6.5,6.5]),
];

export function canWalkOnPlaza(x: number, z: number, floor: Plaza, boxes: readonly THREE.Box3[], radius = HUMAN_RADIUS) {
  if (Math.abs(x - floor.x) > floor.width / 2 - radius || Math.abs(z) > floor.depth / 2 - radius) return false;
  return boxes.every(({ min, max }) => {
    const dx = Math.max(min.x - x, 0, x - max.x);
    const dz = Math.max(min.z - z, 0, z - max.z);
    return dx * dx + dz * dz >= radius * radius;
  });
}
