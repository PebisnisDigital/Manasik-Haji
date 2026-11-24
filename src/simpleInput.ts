let menu=false,run=false,shift=false;
export const simpleMenuOpen=()=>menu;
export const simpleSprinting=()=>!menu&&(run||shift);
export function setSimpleMenu(open:boolean){menu=open;if(open)run=shift=false;}
export function toggleSimpleRun(){if(!menu)run=!run;return run;}
export function setSimpleShift(on:boolean){shift=on;}
export function clearSimpleInput(){run=shift=false;}
