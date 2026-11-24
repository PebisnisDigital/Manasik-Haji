import {describe,it,expect} from 'vitest';
import {districtDialogue,districtHint,districtText,validateDistrictDialogue,type DialogueContext,type DistrictSpeaker,type DialogueChoice} from '../src/adventure/districtDialogue.ts';
import {advanceDistrict,districtReward,type DistrictStage} from '../src/adventure/districtModel.ts';
import {advanceErrand,errandReward,type ErrandSave} from '../src/adventure/districtActivities.ts';
const speakers:DistrictSpeaker[]=['farid','salma','hasan','rizal','pilgrim'];
const context=(stage:DistrictStage=5,side:ErrandSave['stage']=0):DialogueContext=>({main:{version:1,stage,avatar:'female'},errands:{version:1,stage:side,escortGate:side>=2?3:0},companion:{gate:side>=2?3:0,waiting:null},chapters:{tawaf:false,sai:false,tahallul:false}});
const commands=(speaker:DistrictSpeaker,c:DialogueContext)=>districtDialogue(speaker,c).nodes.root.choices.filter((v):v is DialogueChoice&{command:string}=>'command'in v).map(v=>v.command);

describe('district conversation graphs',()=>{
  it('validates every mission/side stage, waiting cause and chapter state, with an exit from each answer',()=>{
    for(const main of [0,1,2,3,4,5] as const)for(const side of [0,1,2,3,4] as const)for(const waiting of [null,'distance','bus','vehicle'] as const)for(const completed of [0,1,2,3])for(const speaker of speakers){
      const c=context(main,side);c.companion.waiting=waiting;c.chapters={tawaf:completed>0,sai:completed>1,tahallul:completed>2};const graph=districtDialogue(speaker,c);
      expect(validateDistrictDialogue(graph)).toEqual([]);
      for(const choice of graph.nodes.root.choices)if('to'in choice){const answer=graph.nodes[choice.to];expect(districtText(answer.line).length).toBeGreaterThan(10);expect(answer.choices.some(c=>'end'in c)).toBe(true);expect(answer.choices.some(c=>'to'in c&&c.to===graph.start)).toBe(true);}
    }
  });
  it('finds missing targets, dead ends, unreachable nodes, missing text and duplicate choice IDs',()=>{
    const graph=districtDialogue('farid',context(0));graph.nodes.help.choices=[];graph.nodes.orphan={line:'farid.story',choices:[]};graph.nodes.root.choices.push({id:'help',text:'choice.help',to:'missing'});
    expect(validateDistrictDialogue(graph)).toEqual(expect.arrayContaining(['No exit: help','Missing node: missing','Duplicate choice: root/help','Unreachable node: orphan']));
    // Invalid authoring data is diagnosed even when introduced outside TypeScript.
    Object.assign(graph.nodes.story,{line:'missing-text'});expect(validateDistrictDialogue(graph)).toContain('Missing line: story');
  });
  it('makes questions read-only and rebuilds current hints without persisting dialogue flags',()=>{
    const c=context(0),before=JSON.stringify(c);for(const speaker of speakers){const graph=districtDialogue(speaker,c);for(const id of ['help','story']){expect(graph.nodes[id].choices.every(v=>!('command'in v))).toBe(true);}}
    expect(JSON.stringify(c)).toBe(before);c.main={...c.main,stage:1};expect(districtDialogue('farid',c).nodes.help.line).toBe('hint.1');
  });
  it('only exposes the exact mission transition at its valid stage',()=>{
    expect(commands('farid',context(0))).toEqual(['briefing']);for(const stage of [1,2,3,4,5] as const)expect(commands('farid',context(stage))).toEqual([]);
    expect(commands('salma',context(4))).toEqual(['arrivalBriefing']);expect(commands('hasan',context(4))).toEqual([]);
    expect(commands('hasan',context(5,0))).toEqual(['acceptEscort']);expect(commands('hasan',context(5,1))).toEqual([]);
    const arrived=context(5,1);arrived.companion.gate=3;arrived.errands.escortGate=3;expect(commands('hasan',arrived)).toEqual(['finishEscort']);
    expect(districtDialogue('hasan',arrived).nodes.root.label).toBe('label.escort');expect(districtDialogue('rizal',context(5,2)).nodes.root.label).toBe('label.parcel');
    expect(commands('rizal',context(5,1))).toEqual([]);expect(commands('rizal',context(5,2))).toEqual(['takeParcel']);expect(commands('salma',context(5,3))).toEqual(['deliverParcel']);
    for(const speaker of speakers)expect(commands(speaker,context(5,4))).toEqual([]);
  });
  it('preserves old chapter prerequisites independently of side activities',()=>{
    for(const side of [0,1,2,4] as const){const c=context(5,side),links=()=>districtDialogue('salma',c).nodes.root.choices.filter(v=>'href'in v).map(v=>'href'in v?v.href:'');
      expect(links()).toEqual(['./adventure-map.html','./tawaf-adventure.html']);c.chapters.sai=true;expect(links()).not.toContain('./tahallul-adventure.html');
      c.chapters.tawaf=true;expect(links()).toContain('./sai-adventure.html');expect(links()).toContain('./tahallul-adventure.html');}
  });
  it('keeps completion rewards idempotent when a transition is picked again',()=>{
    const c=context(0);c.main=advanceDistrict(c.main,'briefing');c.main=advanceDistrict(c.main,'briefing');expect(districtReward(c.main)).toBe(20);expect(commands('farid',c)).toEqual([]);
    c.main={...c.main,stage:5};c.errands={version:1,stage:3,escortGate:3};c.errands=advanceErrand(c.errands,'deliverParcel');c.errands=advanceErrand(c.errands,'deliverParcel');
    expect(errandReward(c.errands)).toBe(70);expect(commands('salma',c)).toEqual([]);
  });
});

describe('progress-aware directions and acknowledgements',()=>{
  it('gives the current main objective before optional directions',()=>{for(const stage of [0,1,2,3,4] as const)expect(districtHint(context(stage,4))).toBe('hint.'+stage);});
  it('explains escort waiting, arrival handover and the market/delivery destinations',()=>{
    const c=context(5,1);expect(districtHint(c)).toBe('hint.escort');for(const waiting of ['distance','bus','vehicle'] as const){c.companion.waiting=waiting;expect(districtHint(c)).toBe('hint.'+waiting);}
    c.companion.gate=3;expect(districtHint(c)).toBe('hint.finish');expect(districtHint(context(5,2))).toBe('hint.market');expect(districtHint(context(5,3))).toBe('hint.delivery');
  });
  it('acknowledges completed help and carried packages instead of offering them again',()=>{
    expect(districtDialogue('farid',context(5,2)).nodes.root.line).toBe('farid.helped');
    expect(districtDialogue('farid',context(5,3)).nodes.root.line).toBe('farid.carry');expect(districtDialogue('hasan',context(5,3)).nodes.root.line).toBe('hasan.carry');
    for(const speaker of ['farid','salma','hasan','pilgrim'] as const)expect(districtDialogue(speaker,context(5,4)).nodes.root.line).toBe(speaker+'.all');
    expect(districtDialogue('rizal',context(5,4)).nodes.root.line).toBe('rizal.done');
  });
});
