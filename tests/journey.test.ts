import { describe,it,expect } from 'vitest';
import { decodeJourney,advance,newJourney } from '../src/journey.ts';
describe('umrah journey checkpoints',()=>{
 it('only advances the expected stage and cannot exceed the end',()=>{
   let j=newJourney('female');expect(advance(j,3)).toEqual(j);
   j=advance(j,0);j=advance(j,1);j=advance(j,2);j=advance(j,3);j=advance(j,4);
   expect(j.stage).toBe(5);expect(j.avatar).toBe('female');expect(advance(j,5)).toEqual(j);
 });
 it('validates stored checkpoint data',()=>{
   const j=newJourney('male');expect(decodeJourney(JSON.stringify(j))).toEqual(j);
   expect(decodeJourney('invalid')).toBeNull();expect(decodeJourney(JSON.stringify({...j,stage:6}))).toBeNull();
 });
});
