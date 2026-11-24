/** Read-only progression check. Never awards completion or modifies a saved checkpoint. */
export function checkGateProgress(levels:readonly {number:number;done:boolean}[],number:number){
 const level=levels.find(l=>l.number===number),previous=levels.find(l=>l.number===number-1);
 const allowed=!!level&&(number===1||previous?.done===true);
 return {allowed,previousNumber:number>1?number-1:null,previousDone:number===1||previous?.done===true};
}
