import type {Rect} from './districtModel.ts';
// Compact member hub. The legacy transfer arena keeps its own coordinates.
export const CITY_BOUNDS={minX:-79,maxX:79,minZ:-63,maxZ:63};
export const CITY_LAYOUT=[[-16,49,Math.PI],[16,49,Math.PI],[48,49,Math.PI],[65,16,-Math.PI/2],[65,-16,-Math.PI/2],[48,-49,0],[16,-49,0],[-16,-49,0],[-48,-49,0],[-65,-16,Math.PI/2],[-65,16,Math.PI/2],[-48,49,Math.PI]] as const;
export const CITY_ROADS:readonly Rect[]=[
 ...[-29,29].map(z=>({x:0,z,w:96,d:8})),
 ...[-44,44].map(x=>({x,z:0,w:8,d:58})),
];
export const CITY_BOARD_POINT={x:0,z:0} as const;
export const CITY_BOARD_SPAWN={x:0,z:6.1} as const;
export const SOUVENIR_POSITION={x:22,z:0} as const;
