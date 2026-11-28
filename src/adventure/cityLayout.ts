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
export const DISTRICT_HQ={x:8,z:-34,w:29.6,d:7.2,height:23,scale:1.25} as const;
export const DISTRICT_SHOPS=[
 {name:'KOKOSALAMA',x:-55,z:43,sourceX:-26,sourceZ:-6.4,w:8.7,d:7.1,height:4.3},
 {name:'INDOMARET',x:-44,z:43,sourceX:-16.5,sourceZ:-6.4,w:8.7,d:7.1,height:4.3},
 {name:'Alfamart',x:-33,z:43,sourceX:16.5,sourceZ:-6.9,w:8.9,d:7.9,height:3.8},
] as const;
export const SOUVENIR_POSITION={x:-55,z:-38} as const;
