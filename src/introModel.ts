export const INTRO_DURATION=4200;
export const INTRO_KEY='umroh-intro-v3';
export function shouldPlayIntro(seen:string|null,reducedMotion:boolean,hidden:boolean){return seen!=='seen'&&!reducedMotion&&!hidden;}
export function introRemaining(started:number,now:number){return Math.max(0,INTRO_DURATION-Math.max(0,now-started));}
