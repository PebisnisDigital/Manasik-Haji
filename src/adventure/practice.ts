// Diagrams are not to scale or acts of worship. Positive progress is counted in whole laps/one-way traversals.
export type PracticeMode='tawaf'|'sai';
export function practicePosition(mode:PracticeMode,progress:number){const p=Math.max(0,Math.min(7,Number.isFinite(progress)?progress:0));const count=Math.floor(p);if(mode==='tawaf'){const a=Math.PI/4-p*Math.PI*2;return {x:Math.cos(a),y:Math.sin(a),count};}const leg=Math.floor(p),t=p-leg;return {x:leg%2===0?t:1-t,y:0,count};}
