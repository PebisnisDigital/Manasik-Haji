import {it,expect} from 'vitest';
import {gateGuide} from '../src/gateGuide.ts';
it('selects the matching guide independently of the chosen pilgrimage',()=>{expect(gateGuide('male')).toEqual({name:'Pak Husen',slot:'hajj'});expect(gateGuide('female')).toEqual({name:'Bu Salma',slot:'umrah'});});

import {manualWhatsAppUrl,manualRegistrationMessage,ADMIN_WHATSAPP} from '../src/registrationHandoff.ts';
it('creates a manual transfer WhatsApp draft with the saved registration and discounted total',()=>{const r={id:'HJ-DEMO',name:'Peserta & Uji',email:'demo@example.invalid',phone:'081234567890',program:'hajj' as const,amount:90000,discount:10000,coupon:'HJ-REF',status:'pending'};const b={bank:'Bank Demo',account:'12345678',holder:'Demo'};const u=new URL(manualWhatsAppUrl(r,b));expect(u.hostname).toBe('wa.me');expect(u.pathname).toBe('/'+ADMIN_WHATSAPP);expect(ADMIN_WHATSAPP).toBe('62881022445869');const msg=u.searchParams.get('text')!;expect(msg).toBe(manualRegistrationMessage(r,b));for(const part of [r.id,r.name,r.email,r.phone,r.coupon,b.account,'Rp90.000','Rp10.000','Menunggu verifikasi pembayaran'])expect(msg).toContain(part);expect(msg).not.toContain('Tiket aktif');});

import {manualConfirmationUrl,registrationSummary} from '../src/registrationHandoff.ts';
it('prepares a distinct proof-of-transfer WhatsApp draft and receipt without claiming payment approval',()=>{const r={id:'HJ-DEMO',name:'Peserta Demo',email:'demo@example.invalid',phone:'081234567890',program:'hajj' as const,amount:90000,discount:10000,coupon:'HJ-REF',status:'pending'};const b={bank:'Bank Demo',account:'12345678',holder:'Demo'};const u=new URL(manualConfirmationUrl(r,b));expect(u.pathname).toBe('/'+ADMIN_WHATSAPP);expect(u.searchParams.get('text')).toContain('foto atau screenshot bukti transfer');expect(u.searchParams.get('text')).toContain('Rp90.000');expect(u.searchParams.get('text')).toContain(r.id);expect(u.searchParams.get('text')).not.toContain('Tiket aktif');expect(u.href).not.toBe(manualWhatsAppUrl(r,b));const fields=Object.fromEntries(registrationSummary(r));expect(fields['Harga tiket']).toBe('Rp100.000');expect(fields['Potongan']).toBe('Rp10.000');expect(fields['Email']).toBe(r.email);expect(fields['WhatsApp']).toBe(r.phone);});

import {gateGreeting} from '../src/gateGuide.ts';
it('uses Akhi and Ukhti according to player character',()=>{expect(gateGreeting('male')).toBe('Akhi');expect(gateGreeting('female')).toBe('Ukhti');});

import {GATE_OFFICE,GATE_VIDEOTRON,youtubeGateEmbed} from '../src/gateVideotronModel.ts';
it('reserves a 16:9 facade spanning the second and third storeys of a four-storey building',()=>{const o=GATE_OFFICE,v=GATE_VIDEOTRON;expect(o.floors).toBe(4);expect(v.width/v.height).toBeCloseTo(16/9);expect(v.y-v.height/2).toBeGreaterThan(o.groundTop);expect(v.y+v.height/2).toBeLessThan(o.groundTop+2*o.floorHeight);expect(v.y-v.height/2).toBeLessThan(o.groundTop+o.floorHeight);expect(v.y+v.height/2).toBeGreaterThan(o.groundTop+o.floorHeight);});
it('embeds the requested YouTube video with single-video loop, autoplay, audible audio and hidden player controls',()=>{const u=new URL(youtubeGateEmbed());expect(u.hostname).toBe('www.youtube.com');expect(u.pathname).toBe('/embed/Ch-uCsEO8yM');for(const [k,v] of Object.entries({autoplay:'1',mute:'0',loop:'1',playlist:'Ch-uCsEO8yM',controls:'0',playsinline:'1'}))expect(u.searchParams.get(k)).toBe(v);expect(()=>youtubeGateEmbed('bad')).toThrow();});

it('uses the current site origin for the official YouTube iframe audio API',()=>{const url=new URL(youtubeGateEmbed('Ch-uCsEO8yM','https://example.com'));expect(url.searchParams.get('enablejsapi')).toBe('1');expect(url.searchParams.get('origin')).toBe('https://example.com');expect(url.searchParams.get('mute')).toBe('0');});

import {guideLookupAction} from '../src/gateGuide.ts';
it('routes only verified existing players past the queue and keeps new registrations at the clerk',()=>{
 expect(guideLookupAction('new',null)).toBe('queue');expect(guideLookupAction('verified',{status:'approved'})).toBe('enter');expect(guideLookupAction('verified',{status:'pending'})).toBe('invoice');expect(guideLookupAction('verified',{status:'reported'})).toBe('invoice');expect(guideLookupAction('verified',{status:'approved',access_suspended:true})).toBe('suspended');expect(guideLookupAction('review',null)).toBe('review');expect(guideLookupAction('verified',null)).toBe('error');expect(guideLookupAction('new',{status:'approved'})).toBe('error');expect(guideLookupAction(undefined,{status:'approved'})).toBe('error');
});

import * as THREE from 'three';
import {marketWalkable,planMarketRoute} from '../src/buburMarket.ts';
import {sweepGround,bodyClear} from '../src/sim/GroundCollision.ts';
it('routes both standing guides through the correct portal without crossing plaza obstacles or a waiting line',()=>{for(const side of [-1,1]){const goal=new THREE.Vector3(side*6,0,-7.15);expect(marketWalkable(goal.x,goal.z)).toBe(true);const bodies=Array.from({length:10},(_,i)=>({x:side*4.15,z:-2.77+i*.77,radius:.32}));const start=new THREE.Vector3(side*2.5,0,.15);const path=planMarketRoute(start,goal,(x,z)=>marketWalkable(x,z,.36)&&bodyClear(start,{x,z},bodies,.36));expect(path.length).toBeGreaterThan(0);let from=start;for(const to of path){const moved=sweepGround(from,to,bodies,marketWalkable);expect(moved.hit).toBe(false);from=to;}expect(from.distanceTo(goal)).toBeLessThan(.01);}});
