import type {Rect} from './districtModel.ts';
// Shared compact district geometry. Keep the legacy transfer scene independent.
export const CITY_BOUNDS={minX:-104,maxX:104,minZ:-91,maxZ:91};
export const CITY_LAYOUT=[[-22,75,Math.PI],[22,75,Math.PI],[66,75,Math.PI],[88,25,-Math.PI/2],[88,-25,-Math.PI/2],[66,-75,0],[22,-75,0],[-22,-75,0],[-66,-75,0],[-88,-25,Math.PI/2],[-88,25,Math.PI/2],[-66,75,Math.PI]] as const;
export const CITY_ROADS:readonly Rect[]=[
 ...[-54,54].map(z=>({x:0,z,w:147,d:8})),
 ...[-69.5,69.5].map(x=>({x,z:0,w:8,d:108})),
 {x:-38,z:-41,w:8,d:26},{x:38,z:-41,w:8,d:26},{x:38,z:41,w:8,d:26},
 {x:-20,z:41,w:8,d:26},
 {x:-55.75,z:0,w:27.5,d:8},{x:55.75,z:24,w:27.5,d:8},
];
export const SOUVENIR_POSITION={x:-55,z:-38} as const;
