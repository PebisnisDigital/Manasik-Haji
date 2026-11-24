/** Local FIFO ticket; only completed NPC services advance it. */
export type QueueTicket={ahead:number};
export function joinQueue(count:number):QueueTicket{return {ahead:Math.max(0,Math.floor(count))};}
export function serveQueue(ticket:QueueTicket):QueueTicket{return {ahead:Math.max(0,ticket.ahead-1)};}
export function queueReady(ticket:QueueTicket|null):boolean{return ticket?.ahead===0;}
