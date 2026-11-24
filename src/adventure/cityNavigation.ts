import type {Point,Rect} from './districtModel.ts';
export const CITY_BOUNDS={minX:-150,maxX:150,minZ:-128,maxZ:128};
export const CITY_ROADS:readonly Rect[]=[
 ...[-82,82].map(z=>({x:0,z,w:264,d:11})),
 ...[-102,102].map(x=>({x,z:0,w:11,d:164})),
 ...[-38,38].flatMap(x=>[-57,57].map(z=>({x,z,w:9,d:66}))),
 ...[-24,24].flatMap(z=>[-70,70].map(x=>({x,z,w:64,d:9}))),
];
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
const within=(p:Point,r:Rect,pad=0)=>Math.abs(p.x-r.x)<r.w/2+pad&&Math.abs(p.z-r.z)<r.d/2+pad;
const STEP=3,W=101,H=85;
const point=(id:number):Point=>({x:-150+id%W*STEP,z:-126+Math.floor(id/W)*STEP});
const blocked=(p:Point,solids:readonly Rect[],pad:number)=>p.x<CITY_BOUNDS.minX+pad||p.x>CITY_BOUNDS.maxX-pad||p.z<CITY_BOUNDS.minZ+pad||p.z>CITY_BOUNDS.maxZ-pad||solids.some(r=>within(p,r,pad));
function clear(a:Point,b:Point,solids:readonly Rect[],pad:number){const n=Math.max(1,Math.ceil(dist(a,b)/.8));for(let i=0;i<=n;i++)if(blocked({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n},solids,pad))return false;return true;}
/** A* on the same geometry used by the city. Prefer roads; use open plaza only to connect them. */
export function cityRoute(start:Point,goal:Point,roads:readonly Rect[],solids:readonly Rect[],pad=.55):Point[]{
 const size=W*H,walk=new Uint8Array(size),cost=new Float64Array(size),best=new Float64Array(size),prev=new Int32Array(size),closed=new Uint8Array(size);
 best.fill(Infinity);prev.fill(-1);
 let source=-1,target=-1,sd=Infinity,td=Infinity;
 for(let i=0;i<size;i++){const p=point(i);if(blocked(p,solids,pad))continue;walk[i]=1;cost[i]=roads.some(r=>within(p,r))?1:3.8;const a=dist(p,start),b=dist(p,goal);if(a<sd&&clear(start,p,solids,Math.min(pad,.4))){sd=a;source=i;}if(b<td&&clear(p,goal,solids,Math.min(pad,.4))){td=b;target=i;}}
 if(source<0||target<0)return [];
 const heap:{id:number;f:number}[]=[];
 function push(id:number,f:number){let k=heap.length;heap.push({id,f});while(k>0){const p=(k-1)>>1;if(heap[p]!.f<=f)break;heap[k]=heap[p]!;k=p;heap[k]={id,f};}}
 function pop(){const root=heap[0]!,last=heap.pop()!;if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1]!.f<heap[c]!.f)c++;if(heap[c]!.f>=last.f)break;heap[i]=heap[c]!;i=c;}heap[i]=last;}return root;}
 best[source]=0;push(source,dist(point(source),point(target)));
 const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
 while(heap.length){const {id}=pop();if(closed[id])continue;closed[id]=1;if(id===target)break;const x=id%W,z=Math.floor(id/W),p=point(id);
  for(const [dx,dz] of dirs){const nx=x+dx!,nz=z+dz!;if(nx<0||nx>=W||nz<0||nz>=H)continue;const j=nz*W+nx;if(!walk[j]||closed[j])continue;if(dx&&dz&&(!walk[z*W+nx]||!walk[nz*W+x]))continue;const q=point(j);if(!clear(p,q,solids,pad))continue;const v=best[id]!+dist(p,q)*(cost[id]!+cost[j]!)*.5;if(v>=best[j]!)continue;best[j]=v;prev[j]=id;push(j,v+dist(q,point(target)));}
 }
 if(!closed[target])return [];
 const nodes:Point[]=[];for(let i=target;i>=0;i=prev[i]!){nodes.push(point(i));if(i===source)break;}nodes.reverse();
 const result=[start,...nodes,goal];return result.filter((p,i)=>i===0||dist(p,result[i-1]!)>.05);
}
