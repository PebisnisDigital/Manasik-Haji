export type PlayMode='standard'|'comfort';
export const parsePlayMode=(v:string|null):PlayMode=>v==='comfort'?'comfort':'standard';
export const movementFactor=(mode:PlayMode,auto=false)=>mode==='comfort'?(auto?.85:.72):1;
export const cameraFactor=(mode:PlayMode)=>mode==='comfort'?.65:1;
export const saiPace=(mode:PlayMode,normal:number,brisk:number,eligible:boolean)=>mode==='comfort'?normal:eligible?brisk:normal;
