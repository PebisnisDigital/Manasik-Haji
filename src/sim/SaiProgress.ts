export const SAI_END=42;
/** One length counts only on arrival at the alternating destination. */
export class SaiProgress {
 completed=0;
 get direction():number{return this.completed%2===0?-1:1;}
 get finished():boolean{return this.completed===7;}
 get destination():string{return this.direction===-1?'Marwah':'Safa';}
 update(z:number):boolean{
   if(this.finished||!Number.isFinite(z))return false;
   if((this.direction===-1&&z<=-SAI_END)||(this.direction===1&&z>=SAI_END)){this.completed++;return true;}
   return false;
 }
 fraction(z:number):number{
   if(this.finished)return 7;
   return this.completed+Math.max(0,Math.min(1,(SAI_END+this.direction*z)/(2*SAI_END)));
 }
 reset():void{this.completed=0;}
}
