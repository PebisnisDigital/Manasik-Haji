export type CameraMode='far'|'near'|'first';
export type CameraPreferences={mode:CameraMode;distance:number;pitch:number;sensitivity:number;indoor:boolean};
export const cameraDefaults:CameraPreferences={mode:'far',distance:9.65,pitch:.19,sensitivity:1,indoor:true};
const KEY='hajji-lobby-camera-v1';
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function normalizeCamera(value:unknown):CameraPreferences{
 const d={...cameraDefaults};if(!value||typeof value!=='object')return d;const p=value as Partial<CameraPreferences>;
 if(p.mode==='far'||p.mode==='near'||p.mode==='first')d.mode=p.mode;
 if(typeof p.distance==='number'&&Number.isFinite(p.distance))d.distance=clamp(p.distance,2.5,10.6);
 if(typeof p.pitch==='number'&&Number.isFinite(p.pitch))d.pitch=clamp(p.pitch,.045,.75);
 if(typeof p.sensitivity==='number'&&Number.isFinite(p.sensitivity))d.sensitivity=clamp(p.sensitivity,.4,2);
 if(typeof p.indoor==='boolean')d.indoor=p.indoor;return d;
}
function load(){try{return normalizeCamera(JSON.parse(localStorage.getItem(KEY)??'null'));}catch{return {...cameraDefaults};}}
export const cameraPrefs=load();
export let cameraRevision=0;
export function setCameraPreferences(p:Partial<CameraPreferences>,reset=false){
 Object.assign(cameraPrefs,normalizeCamera({...cameraPrefs,...p}));cameraRevision++;
 try{localStorage.setItem(KEY,JSON.stringify(cameraPrefs));}catch{}
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('hajji-camera-change',{detail:{reset}}));
}
export const cameraDistance=(indoor=false)=>indoor&&cameraPrefs.indoor?Math.min(cameraPrefs.distance,2.85):cameraPrefs.mode==='near'?Math.min(cameraPrefs.distance,3.5):cameraPrefs.distance;
export function mountCameraSettings(host:HTMLElement){
 const panel=document.createElement('section');panel.className='gameplayCameraSettings';panel.style.cssText='display:grid;gap:7px;padding:12px 0 0;border-top:1px solid #e3d9c7;max-width:100%';
 const title=document.createElement('strong');title.textContent='Kamera';panel.append(title);
 const modeRow=document.createElement('label');modeRow.className='cameraModeRow';modeRow.textContent='Sudut pandang';const select=document.createElement('select');select.setAttribute('aria-label','Sudut pandang kamera');
 for(const [value,label] of [['far','Kamera jauh'],['near','Kamera dekat'],['first','Mata pemain (first-person)']]){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);}modeRow.append(select);panel.append(modeRow);
 function slider(label:string,min:number,max:number,step:number,format:(v:number)=>string,apply:(v:number)=>void){
  const row=document.createElement('label');row.className='cameraSliderRow';const name=document.createElement('span');name.textContent=label;const out=document.createElement('output');const range=document.createElement('input');range.type='range';range.min=String(min);range.max=String(max);range.step=String(step);range.setAttribute('aria-label',label);
  const sync=()=>{out.textContent=format(Number(range.value));};range.oninput=()=>{apply(Number(range.value));sync();};for(const event of ['pointerdown','pointermove','pointerup'])range.addEventListener(event,e=>e.stopPropagation());row.append(name,out,range);panel.append(row);return {range,sync};
 }
 const distance=slider('Jarak kamera',2.5,10.6,.1,v=>v.toFixed(1)+' m',v=>setCameraPreferences({distance:v}));
 const pitch=slider('Sudut kamera',3,43,1,v=>v+'°',v=>setCameraPreferences({pitch:v*Math.PI/180}));
 const sensitivity=slider('Sensitivitas kamera',.4,2,.1,v=>Math.round(v*100)+'%',v=>setCameraPreferences({sensitivity:v}));
 const indoorRow=document.createElement('label');indoorRow.className='cameraIndoorRow';indoorRow.textContent='Kamera dekat saat masuk toko';const indoor=document.createElement('input');indoor.type='checkbox';indoor.onchange=()=>setCameraPreferences({indoor:indoor.checked});indoorRow.append(indoor);panel.append(indoorRow);
 const sync=()=>{select.value=cameraPrefs.mode;distance.range.value=String(cameraPrefs.distance);distance.range.disabled=cameraPrefs.mode==='first';pitch.range.value=String(Math.round(cameraPrefs.pitch*180/Math.PI));sensitivity.range.value=String(cameraPrefs.sensitivity);indoor.checked=cameraPrefs.indoor;distance.sync();pitch.sync();sensitivity.sync();};
 select.onchange=()=>{const mode=select.value as CameraMode;setCameraPreferences({mode,distance:mode==='near'?3.2:cameraDefaults.distance});sync();};
 const reset=document.createElement('button');reset.type='button';reset.textContent='Reset kamera';reset.onclick=()=>{setCameraPreferences(cameraDefaults,true);sync();};panel.append(reset);host.append(panel);sync();return panel;
}
