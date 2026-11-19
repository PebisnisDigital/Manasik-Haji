import { describe, it, expect } from 'vitest';
import { SaiProgress, SAI_END } from '../src/sim/SaiProgress.ts';
describe('seven alternating sa’i lengths',()=>{
 it('starts at Safa and ends at Marwah, not counting repeated visits',()=>{
   const s=new SaiProgress();
   expect(s.update(SAI_END)).toBe(false);
   expect(s.update(0)).toBe(false);
   expect(s.fraction(SAI_END)).toBe(0);
   for(let i=0;i<7;i++){
     const end=i%2===0?-SAI_END:SAI_END;
     expect(s.update(end)).toBe(true);
     expect(s.completed).toBe(i+1);
     expect(s.update(end)).toBe(false);
   }
   expect(s.finished).toBe(true);expect(s.fraction(-SAI_END)).toBe(7);
   expect(s.update(SAI_END)).toBe(false);s.reset();expect(s.completed).toBe(0);
 });
 it('tracks one-way progress and reversing',()=>{const s=new SaiProgress();expect(s.fraction(0)).toBe(.5);s.update(-SAI_END);expect(s.fraction(0)).toBe(1.5);expect(s.fraction(-SAI_END)).toBe(1);});
});
