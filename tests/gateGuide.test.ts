import {it,expect} from 'vitest';
import {gateGuide} from '../src/gateGuide.ts';
it('selects the matching guide independently of the chosen pilgrimage',()=>{expect(gateGuide('male')).toEqual({name:'Pak Husen',slot:'hajj'});expect(gateGuide('female')).toEqual({name:'Bu Salma',slot:'umrah'});});

import {manualWhatsAppUrl,manualRegistrationMessage,ADMIN_WHATSAPP} from '../src/registrationHandoff.ts';
it('creates a manual transfer WhatsApp draft with the saved registration and discounted total',()=>{const r={id:'HJ-DEMO',name:'Peserta & Uji',email:'demo@example.invalid',phone:'081234567890',program:'hajj' as const,amount:90000,discount:10000,coupon:'HJ-REF',status:'pending'};const b={bank:'Bank Demo',account:'12345678',holder:'Demo'};const u=new URL(manualWhatsAppUrl(r,b));expect(u.hostname).toBe('wa.me');expect(u.pathname).toBe('/'+ADMIN_WHATSAPP);expect(ADMIN_WHATSAPP).toBe('62881022445869');const msg=u.searchParams.get('text')!;expect(msg).toBe(manualRegistrationMessage(r,b));for(const part of [r.id,r.name,r.email,r.phone,r.coupon,b.account,'Rp90.000','Rp10.000','Menunggu verifikasi pembayaran'])expect(msg).toContain(part);expect(msg).not.toContain('Tiket aktif');});
