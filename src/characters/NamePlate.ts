/** Shared high contrast name plate, independent of the dark speech/interaction UI. */
export function drawNamePlate(ctx:CanvasRenderingContext2D,name:string,subtitle?:string){
 const w=ctx.canvas.width,h=ctx.canvas.height;
 ctx.clearRect(0,0,w,h);
 const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.55,'#fff9ed');gradient.addColorStop(1,'#ead3a0');
 ctx.beginPath();ctx.roundRect(3,3,w-6,h-6,Math.min(16,h*.19));ctx.fillStyle=gradient;ctx.fill();ctx.lineWidth=Math.max(2,w/180);ctx.strokeStyle='#c3a15d';ctx.stroke();
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#25211b';
 const fit=(text:string,size:number,weight:number,y:number)=>{ctx.font=weight+' '+size+'px system-ui, sans-serif';while(ctx.measureText(text).width>w-22&&size>12){size--;ctx.font=weight+' '+size+'px system-ui, sans-serif';}ctx.fillText(text,w/2,y,w-18);};
 fit(name,Math.round(h*(subtitle?.36:.48)),750,h*(subtitle?.34:.5));
 if(subtitle){ctx.fillStyle='#65502b';fit(subtitle,Math.round(h*.22),650,h*.73);}
}
