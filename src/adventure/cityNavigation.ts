import type {Point,Rect} from './districtModel.ts';
import {CITY_BOUNDS,CITY_ROADS} from './cityLayout.ts';
export {CITY_BOUNDS,CITY_ROADS};
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
const within=(p:Point,r:Rect,pad=0)=>Math.abs(p.x-r.x)<r.w/2+pad&&Math.abs(p.z-r.z)<r.d/2+pad;
const STEP=3,W=Math.floor((CITY_BOUNDS.maxX-CITY_BOUNDS.minX-2)/STEP)+1,H=Math.floor((CITY_BOUNDS.maxZ-CITY_BOUNDS.minZ-2)/STEP)+1;
const point=(id:number):Point=>({x:CITY_BOUNDS.minX+1+id%W*STEP,z:CITY_BOUNDS.minZ+1+Math.floor(id/W)*STEP});
const blocked=(p:Point,solids:readonly Rect[],pad:number)=>p.x<CITY_BOUNDS.minX+pad||p.x>CITY_BOUNDS.maxX-pad||p.z<CITY_BOUNDS.minZ+pad||p.z>CITY_BOUNDS.maxZ-pad||solids.some(r=>within(p,r,pad));
function clear(a:Point,b:Point,solids:readonly Rect[],pad:number){const n=Math.max(1,Math.ceil(dist(a,b)/.8));for(let i=0;i<=n;i++)if(blocked({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n},solids,pad))return false;return true;}
/** A* on the same geometry used by the city. Prefer roads; use open plaza only to connect them. */
export function cityRoute(start:Point,goal:Point,roads:readonly Rect[],solids:readonly Rect[],pad=.55):Point[]{
 if(clear(start,goal,solids,pad))return [start,goal];
 const size=W*H,walk=new Uint8Array(size),cost=new Float64Array(size),best=new Float64Array(size),prev=new Int32Array(size),closed=new Uint8Array(size);
 best.fill(Infinity);prev.fill(-1);
 let source=-1,target=-1,sd=Infinity,td=Infinity;
 for(let i=0;i<size;i++){const p=point(i);if(blocked(p,solids,pad))continue;walk[i]=1;cost[i]=roads.some(r=>within(p,r))?1:1.35;const a=dist(p,start),b=dist(p,goal);if(a<sd&&clear(start,p,solids,Math.min(pad,.4))){sd=a;source=i;}if(b<td&&clear(p,goal,solids,Math.min(pad,.4))){td=b;target=i;}}
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
 const result=[start,...nodes,goal];const simplified=[start];let i=0;while(i<result.length-1){let j=result.length-1;while(j>i+1&&!clear(result[i]!,result[j]!,solids,pad))j--;simplified.push(result[j]!);i=j;}return simplified.filter((p,k)=>k===0||dist(p,simplified[k-1]!)>.05);
}
