import type {Point} from './districtModel.ts';
export function distanceToSegment(p:Point,a:Point,b:Point){
 const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz;
 const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l)):0;
 return {distance:Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t),t};
}
export function followCityRoute(p:Point,points:readonly Point[]){
 let nearest=Infinity,index=0,t=0;
 for(let i=0;i+1<points.length;i++){const v=distanceToSegment(p,points[i]!,points[i+1]!);if(v.distance<nearest){nearest=v.distance;index=i;t=v.t;}}
 if(!Number.isFinite(nearest))return {deviation:Infinity,remaining:0,tail:[] as Point[]};
 let remaining=(1-t)*Math.hypot(points[index+1]!.x-points[index]!.x,points[index+1]!.z-points[index]!.z)+nearest;
 for(let i=index+1;i+1<points.length;i++)remaining+=Math.hypot(points[i+1]!.x-points[i]!.x,points[i+1]!.z-points[i]!.z);
 return {deviation:nearest,remaining,tail:points.slice(index+1)};
}
