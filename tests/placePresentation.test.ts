import {afterEach,describe,expect,it,vi} from 'vitest';
import * as THREE from 'three';
import {buildCharacterMesh} from '../src/characters/CharacterMesh.ts';
import {BONE_COUNT} from '../src/characters/Rig.ts';
import {placeDetails,disposePlaceDetails,type PlaceTheme} from '../src/env/PlaceDetails.ts';
import {COMPANIONS,companionChapter} from '../src/adventure/companionModel.ts';
import {HAJJ_CHAPTERS} from '../src/adventure/hajjCampaign.ts';
afterEach(()=>vi.unstubAllGlobals());

describe('human geometry keeps the shipped animation contract',()=>{
  it.each(['male','female'] as const)('%s near face and distant silhouette fit VAT and bone limits',pilgrimStyle=>{
    const meshes=[0,1,2].map(lod=>buildCharacterMesh(lod,{robeLength:pilgrimStyle==='male'?.19:.065,coverHead:pilgrimStyle==='female',pilgrimStyle}));
    expect(meshes[0].vertexCount).toBeLessThan(4096);expect(meshes[0].vertexCount).toBeGreaterThan(meshes[1].vertexCount);expect(meshes[1].vertexCount).toBeGreaterThan(meshes[2].vertexCount);
    expect([...meshes[0].zone]).toContain(4);expect([...meshes[0].zone]).toContain(5);expect([...meshes[2].zone]).not.toContain(5);
    for(const m of meshes){
      for(let i=0;i<m.vertexCount;i++){
        expect(Number.isFinite(m.position[i*3]+m.position[i*3+1]+m.position[i*3+2])).toBe(true);
        expect(Math.hypot(...m.normal.slice(i*3,i*3+3))).toBeCloseTo(1,5);
        expect(m.skinWeight[i*2]+m.skinWeight[i*2+1]).toBeCloseTo(1,6);
        expect(m.skinIndex[i*2]).toBeLessThan(BONE_COUNT);expect(m.skinIndex[i*2+1]).toBeLessThan(BONE_COUNT);
      }
      expect(Math.max(...m.index)).toBeLessThan(m.vertexCount);
      for(let i=0;i<m.index.length;i+=3){const [a,b,c]=m.index.slice(i,i+3);const p=(v:number)=>new THREE.Vector3().fromArray(m.position,v*3),n=(v:number)=>new THREE.Vector3().fromArray(m.normal,v*3);const cross=p(b).sub(p(a)).cross(p(c).sub(p(a))),normal=n(a).add(n(b)).add(n(c));expect(cross.dot(normal),'outward winding at triangle '+i).toBeGreaterThanOrEqual(-1e-10);}
    }
  });
});

describe('dressing preserves walkable space and draw-call budget',()=>{
  const bounds:Record<Exclude<PlaceTheme,'haram'>,number[]>={sai:[-10.9,10.9,-42,42],tahallul:[-22,24,-17,17],prep:[-4.7,4.7,-2.5,4.7],post:[-4.7,4.7,-2.5,4.7],trim:[-4.7,4.7,-2.5,4.7],arafah:[-18,18,-10,13],muzdalifah:[-18,18,-10,13],mina:[-18,18,-10,13],jamarat:[-14,14,3.45,10]};
  function canvas(){const ctx={createImageData:(w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},fillRect(){},strokeRect(){},fillText(){}};vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>ctx})});}
  it.each(Object.keys(bounds) as Exclude<PlaceTheme,'haram'>[])('%s adds no solid triangle in the walking envelope',theme=>{
    canvas();const root=placeDetails(theme),[minX,maxX,minZ,maxZ]=bounds[theme];let draws=0;
    root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;draws++;const p=o.geometry.getAttribute('position'),idx=o.geometry.index!;
      for(let i=0;i<idx.count;i+=3){const xs:number[]=[],ys:number[]=[],zs:number[]=[];for(let j=0;j<3;j++){const k=idx.getX(i+j);xs.push(p.getX(k)+o.position.x);ys.push(p.getY(k)+o.position.y);zs.push(p.getZ(k)+o.position.z);}
        const overlaps=Math.max(...ys)>.05&&Math.min(...ys)<2.1&&Math.max(...xs)>minX&&Math.min(...xs)<maxX&&Math.max(...zs)>minZ&&Math.min(...zs)<maxZ;
        expect(overlaps,theme+' triangle '+i).toBe(false);
        if(['tahallul','arafah','muzdalifah','mina','jamarat'].includes(theme)&&Math.max(...ys)>1.8&&Math.min(...ys)<4.5){
          const boom=theme==='tahallul'?5.8:4.2;
          const cameraOverlap=Math.max(...xs)>minX-boom&&Math.min(...xs)<maxX+boom&&Math.max(...zs)>minZ-boom&&Math.min(...zs)<maxZ+boom;
          expect(cameraOverlap,theme+' camera envelope at triangle '+i).toBe(false);
        }
      }
    });expect(draws).toBeLessThanOrEqual(8);disposePlaceDetails(root);
  });
  it.each([36,56])('haram dressing stays beyond the %s m walk radius',radius=>{
    canvas();const root=placeDetails('haram',radius);root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++)expect(Math.hypot(p.getX(i)+o.position.x,p.getZ(i)+o.position.z)).toBeGreaterThan(radius);});disposePlaceDetails(root);
  });
});

it('every campaign chapter has a distinct authored conversation and every training step resolves',()=>{
  for(const c of HAJJ_CHAPTERS){expect(COMPANIONS[c.id]?.story.length).toBeGreaterThan(80);expect(COMPANIONS[c.id]?.care.length).toBeGreaterThan(60);}
  for(let step=0;step<=18;step++)expect(COMPANIONS[companionChapter(step)]).toBeDefined();
  expect(new Set(Object.values(COMPANIONS).map(c=>c.story)).size).toBe(12);
});
