import {it,expect} from 'vitest';
import {gateGuide} from '../src/gateGuide.ts';
it('selects the matching guide independently of the chosen pilgrimage',()=>{expect(gateGuide('male')).toEqual({name:'Pak Husen',slot:'hajj'});expect(gateGuide('female')).toEqual({name:'Bu Salma',slot:'umrah'});});
