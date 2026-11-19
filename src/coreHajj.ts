import {type CoreStep} from './coreProgress.ts';
export const JUMRAH_NAMES=['Ula','Wustha','Aqabah'] as const;
export const requiredTargets=(step:CoreStep):readonly number[]=>step===8?[2]:step===13||step===14||step===16?[0,1,2]:[];
export interface ThrowState{index:number;counts:readonly number[]}
export function nextThrow(s:ThrowState,targets:readonly number[],target:number):ThrowState{if(s.index>=targets.length||targets[s.index]!==target||s.counts[target]>=7)return s;const counts=[...s.counts];counts[target]++;return {counts,index:s.index+(counts[target]===7?1:0)};}
export function dayLabel(step:CoreStep):string{return step===8?'10 Zulhijah':step===13?'11 Zulhijah':step===14?'12 Zulhijah':'13 Zulhijah';}

export function restoreThrows(targets:readonly number[],count:number):ThrowState{let state:ThrowState={index:0,counts:[0,0,0]};if(!Number.isInteger(count)||count<0||count>targets.length*7)return state;for(let i=0;i<count;i++)state=nextThrow(state,targets,targets[state.index]);return state;}
