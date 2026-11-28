import {describe,it,expect} from 'vitest';
import {createTawafPilgrims,pilgrimPosition,stepPilgrim,TAWAF_CROWD_COUNTS,TAWAF_ORIGINS} from '../src/tawafAtmosphereModel.ts';
import {TAWAF_EXTRA_SOLIDS} from '../src/continuousTawafModel.ts';
import {safePosition} from '../src/coreWalk.ts';
describe('mixed moving Tawaf congregation',()=>{
 it('uses reproducible graphics budgets, with varied people in every origin group',()=>{for(const tier of ['low','medium','high'] as const){const people=createTawafPilgrims(tier);expect(people).toHaveLength(TAWAF_CROWD_COUNTS[tier]);expect(people).toEqual(createTawafPilgrims(tier));for(const origin of TAWAF_ORIGINS){const group=people.filter(p=>p.origin===origin);expect(new Set(group.map(p=>p.palette)).size).toBeGreaterThan(3);expect(group.some(p=>p.female)).toBe(true);expect(group.some(p=>!p.female)).toBe(true);}expect(people.filter(p=>!p.female).every(p=>p.palette<8)).toBe(true);expect(new Set(people.map(p=>p.height)).size).toBeGreaterThan(15);expect(new Set(people.map(p=>p.build)).size).toBeGreaterThan(15);}});
 it('circulates anticlockwise with Kaaba on the left and finite tangent headings',()=>{const p=createTawafPilgrims('low')[0],old=pilgrimPosition(p);stepPilgrim(p,.05,{x:99,z:99});const at=pilgrimPosition(p);expect(at.z).toBeLessThan(old.z);expect(at.x).toBeLessThan(old.x);expect(Number.isFinite(at.yaw)).toBe(true);});
 it('keeps complete circulation lanes outside central structures and Zamzam',()=>{for(const p of createTawafPilgrims('high').slice(0,6))for(let i=0;i<720;i++){const at=pilgrimPosition({...p,angle:i/720*Math.PI*2});expect(safePosition(at.x,at.z,[{x:0,z:64,w:24,d:24},...TAWAF_EXTRA_SOLIDS],[-60,60,4,124])).toBe(true);}});
 it('pauses without positional jumps and resumes at the same place',()=>{const p=createTawafPilgrims('low')[5],old={...p};stepPilgrim(p,30,{x:0,z:0},false);expect(p).toEqual(old);stepPilgrim(p,.05,{x:0,z:0});expect(Math.hypot(pilgrimPosition(p).x-pilgrimPosition(old).x,pilgrimPosition(p).z-pilgrimPosition(old).z)).toBeLessThan(.1);});
 it('yields locally to the player without blocking the gameplay controller',()=>{const a=createTawafPilgrims('low')[6],b={...a},old=a.angle;stepPilgrim(a,.05,pilgrimPosition(a));stepPilgrim(b,.05,{x:99,z:99});expect(a.angle).toBe(b.angle);expect(a.angle).not.toBe(old);expect(Math.abs(a.yieldOffset??0)).toBeGreaterThan(0);expect(b.yieldOffset).toBe(0);});
 it('clamps stalled frame times and ignores invalid elapsed time',()=>{const a=createTawafPilgrims('low')[0],b={...a};stepPilgrim(a,10,{x:99,z:99});stepPilgrim(b,.05,{x:99,z:99});expect(a).toEqual(b);const snapshot={...a};for(const dt of [NaN,-1,0])stepPilgrim(a,dt,{x:0,z:0});expect(a).toEqual(snapshot);});
});

it('keeps every lane moving for two minutes even with a stationary player at the bottleneck',()=>{
 const people=createTawafPilgrims('high'),before=people.map(p=>p.angle);
 const player={x:Math.cos(.45)*30,z:64+Math.sin(.45)*30};
 for(let frame=0;frame<2400;frame++)for(const p of people)stepPilgrim(p,.05,player);
 for(const [i,p] of people.entries()){const expected=before[i]!-p.speed/p.radius*120;expect(Math.cos(p.angle)).toBeCloseTo(Math.cos(expected),6);expect(Math.sin(p.angle)).toBeCloseTo(Math.sin(expected),6);expect(Math.abs(p.yieldOffset??0)).toBeLessThanOrEqual(.45);}
});
it('preserves separation when all six lanes curve around the Zamzam area',()=>{
 const lanes=createTawafPilgrims('high').slice(0,6);
 for(let i=0;i<360;i++){const positions=lanes.map(p=>pilgrimPosition({...p,angle:i*Math.PI/180}));for(let j=1;j<positions.length;j++)expect(Math.hypot(positions[j]!.x-positions[j-1]!.x,positions[j]!.z-positions[j-1]!.z)).toBeGreaterThan(2);}
});
