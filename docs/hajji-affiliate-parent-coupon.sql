-- Central promo is the single source of truth for affiliate discount. Existing paid orders unchanged.
ALTER TABLE hajji_ticket_private.affiliate_members ADD COLUMN IF NOT EXISTS parent_coupon_code text REFERENCES hajji_ticket_private.promo_coupons(code) ON DELETE SET NULL;
UPDATE hajji_ticket_private.affiliate_members SET parent_coupon_code='MAUHAJJI' WHERE parent_coupon_code IS NULL AND EXISTS (SELECT 1 FROM hajji_ticket_private.promo_coupons WHERE code='MAUHAJJI');
ALTER TABLE hajji_ticket_private.affiliate_members ALTER COLUMN parent_coupon_code SET DEFAULT 'MAUHAJJI';
CREATE OR REPLACE FUNCTION hajji_ticket_private.quote_coupon(code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare c text:=upper(trim(coalesce(code,''))); price integer; disc integer:=0; comm integer:=0; promo hajji_ticket_private.promo_coupons; cfg hajji_ticket_private.referral_settings; owner_id text;
begin
 select ticket_price into price from hajji_ticket_private.settings where id;
 if c<>'' then
  select * into promo from hajji_ticket_private.promo_coupons p where p.code=c;
  if found then
   if not promo.enabled then raise exception 'Kode kupon tidak aktif atau tidak valid.';end if;
   disc=case when promo.kind='percent' then price*promo.value/100 else promo.value end;
  else
   select * into cfg from hajji_ticket_private.referral_settings where id;
   owner_id=hajji_ticket_private.affiliate_owner(c);
   if not cfg.enabled or owner_id is null then raise exception 'Kode kupon tidak aktif atau tidak valid.';end if;
   select p.* into promo from hajji_ticket_private.affiliate_members m join hajji_ticket_private.promo_coupons p on p.code=m.parent_coupon_code where m.registration_id=owner_id and p.enabled;
   if not found then raise exception 'Kupon induk affiliate tidak aktif. Pilih kupon induk yang tersedia.';end if;
   disc=case when promo.kind='percent' then price*promo.value/100 else promo.value end;comm=(price-disc)*cfg.commission_percent/100;
  end if;
 end if;
 if disc<0 or price-disc<1000 then raise exception 'Kupon melebihi harga tiket minimum.';end if;
 return jsonb_build_object('code',c,'amount',price-disc,'discount',disc,'commission',comm,'referrer_id',owner_id);
end $function$;

CREATE OR REPLACE FUNCTION hajji_ticket_private.gateway(k text, op text, secret text, ip text, data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cfg hajji_ticket_private.settings; r hajji_ticket_private.registrations; t text; newsecret text; result jsonb; n integer; rid text; coupon jsonb; mail text; phone_norm text; method text; banks jsonb; destination jsonb; selected_bank text; found_candidate boolean; lookup_state text; am hajji_ticket_private.affiliate_members; alias_code text; progress_row hajji_ticket_private.member_journey_progress; 
begin
 select * into cfg from hajji_ticket_private.settings where id;
 banks=hajji_ticket_private.bank_options(cfg);
 if cfg.gateway_hash='' or k is null or length(k)<>64 or hajji_ticket_private.hash(k)<>cfg.gateway_hash then raise exception 'Layanan tidak tersedia.' using errcode='42501'; end if;
 if op not in ('get','create','report','magic-link','redeem','coupon','affiliate','affiliate-request','affiliate-save','affiliate-withdraw','lookup','resume','progress-get','progress-save','support-group') then raise exception 'Permintaan tidak valid.'; end if;
 if op not in ('get','progress-get','support-group') then
  insert into hajji_ticket_private.rate(bucket) values(hajji_ticket_private.hash(coalesce(ip,'unknown')))
  on conflict(bucket) do update set hits=case when hajji_ticket_private.rate.started<now()-interval '30 minutes' then 1 else hajji_ticket_private.rate.hits+1 end, started=case when hajji_ticket_private.rate.started<now()-interval '30 minutes' then now() else hajji_ticket_private.rate.started end returning hits into n;
  if n>60 then return jsonb_build_object('error','Terlalu banyak permintaan. Coba lagi nanti.'); end if;
 end if;
 if secret~'^[a-f0-9]{64}$' then
  select * into r from hajji_ticket_private.registrations where secret_hash=hajji_ticket_private.hash(secret);
  if r.id is null then select rr.* into r from hajji_ticket_private.registrations rr join hajji_ticket_private.links l on l.registration_id=rr.id join hajji_ticket_private.sessions s on s.link_hash=l.token_hash where s.secret_hash=hajji_ticket_private.hash(secret) and not l.revoked and rr.status='approved' and not rr.access_suspended; end if;
 end if;
 if op='support-group' then
  if r.id is null or r.status is distinct from 'approved' or r.access_suspended then raise exception 'Akses member aktif diperlukan.' using errcode='42501';end if;
  return jsonb_build_object('url',cfg.whatsapp_group_url);
 end if;
 -- A browser may be shared by a previous registrant. Never treat its cookie as a match for unrelated identity.
 if op='create' and r.id is not null and not hajji_ticket_private.identity_typo_match(r.name,r.email,r.phone,data->>'name',data->>'email',data->>'phone') then
  r=null;
 end if;
 if op='lookup' then
  if length(trim(coalesce(data->>'name',''))) not between 2 and 60 or length(coalesce(data->>'email',''))>150 or coalesce(data->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or coalesce(data->>'phone','') !~ '^(\+?62|0)8[0-9]{7,12}$' then raise exception 'Periksa kembali nama, email, dan nomor WA.';end if;
  mail=lower(trim(data->>'email'));phone_norm=hajji_ticket_private.normalize_phone(data->>'phone');
  if r.id is not null and hajji_ticket_private.identity_typo_match(r.name,r.email,r.phone,data->>'name',mail,phone_norm) then
   lookup_state=case when r.access_suspended then 'suspended' else 'verified' end;
   if r.access_suspended then r=null;end if;
  else
   -- Recovery tolerates a minor typo in ONE field only; other two must match.
   -- Count all possible matches, including unpaid and suspended records.
   insert into hajji_ticket_private.rate(bucket) values(hajji_ticket_private.hash('lookup-recovery:'||coalesce(ip,'unknown')))
   on conflict(bucket) do update set hits=case when hajji_ticket_private.rate.started<now()-interval '30 minutes' then 1 else hajji_ticket_private.rate.hits+1 end, started=case when hajji_ticket_private.rate.started<now()-interval '30 minutes' then now() else hajji_ticket_private.rate.started end returning hits into n;
   if n>10 then return jsonb_build_object('error','Terlalu banyak percobaan. Coba kembali dalam 30 menit.');end if;
   found_candidate=hajji_ticket_private.possible_member(data->>'name',mail,data->>'phone');
   r=null;
   select count(*),min(rr.id) into n,rid from hajji_ticket_private.registrations rr
   where hajji_ticket_private.identity_typo_match(rr.name,rr.email,rr.phone,data->>'name',mail,phone_norm);
   if n=1 then
    select * into r from hajji_ticket_private.registrations where id=rid for update;
    if hajji_ticket_private.identity_typo_match(r.name,r.email,r.phone,data->>'name',mail,phone_norm) then
     if r.access_suspended then
      r=null;lookup_state='suspended';
     elsif r.status='approved' then
      t=hajji_ticket_private.issue_link(r.id);
      newsecret=hajji_ticket_private.random_token();
      insert into hajji_ticket_private.sessions(secret_hash,link_hash) values(hajji_ticket_private.hash(newsecret),hajji_ticket_private.hash(split_part(t,'#token=',2)));
      lookup_state='verified';
     elsif r.status in ('pending','reported') then
      -- Recover the existing invoice, not a second registration. Never mark a ticket paid here.
      newsecret=hajji_ticket_private.random_token();
      update hajji_ticket_private.registrations set secret_hash=hajji_ticket_private.hash(newsecret) where id=r.id returning * into r;
      lookup_state='verified';
     else
      r=null;lookup_state='review';
     end if;
    else
     r=null;lookup_state='review';
    end if;
   else
    lookup_state=case when found_candidate or n>0 then 'review' else 'new' end;
   end if;
  end if;
 elsif op in ('progress-get','progress-save') then
  if r.id is null or r.status is distinct from 'approved' or r.access_suspended or data->>'member_id' is distinct from r.id then raise exception 'Tiket aktif diperlukan.';end if;
  if op='progress-save' then
   if jsonb_typeof(data->'snapshot') is distinct from 'object' or octet_length((data->'snapshot')::text)>32000 or coalesce(data->>'rank','') !~ '^[0-9]{1,3}$' or (data->>'rank')::integer not between 1 and 168 then raise exception 'Checkpoint tidak valid.';end if;
   if exists(select 1 from jsonb_each(data->'snapshot') e where length(e.key)>150 or e.key !~ '^(manasik-(hajj-|miqat-room-|arrival-walk-|continuous-|sai-approach-|tahallul-approach-|tawaf-quest-|sai-quest-|tahallul-quest-|aqabah-activities-|city-stars-|travel-story-|player-appearance-)|umroh-digital-(preview-|checkpoint-))' or jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>6000) then raise exception 'Data checkpoint tidak valid.';end if;
   insert into hajji_ticket_private.member_journey_progress(registration_id,program,rank,snapshot) values(r.id,r.program,(data->>'rank')::integer,data->'snapshot')
   on conflict(registration_id,program) do update set rank=excluded.rank,snapshot=excluded.snapshot,updated_at=now() where member_journey_progress.rank<excluded.rank;
  end if;
  select * into progress_row from hajji_ticket_private.member_journey_progress where registration_id=r.id and program=r.program;
  return jsonb_build_object('progress',case when progress_row.registration_id is null then null else jsonb_build_object('rank',progress_row.rank,'snapshot',progress_row.snapshot) end);
 elsif op='coupon' then
  coupon=case when data ? 'reward_ref' then hajji_ticket_private.landing_reward_coupon(data->>'reward_ref') else hajji_ticket_private.quote_coupon(data->>'code') end;
  return jsonb_build_object('coupon',coupon,'ticket',jsonb_build_object('amount',cfg.ticket_price,'account',cfg.account),'registration',null);
 elsif op in ('affiliate','affiliate-request','affiliate-save','affiliate-withdraw') then
  if r.status is distinct from 'approved' or r.access_suspended then raise exception 'Tiket aktif diperlukan.';end if;
  if op='affiliate-request' then insert into hajji_ticket_private.affiliate_members(registration_id) values(r.id) on conflict do nothing;end if;
  select * into am from hajji_ticket_private.affiliate_members where registration_id=r.id for update;
  if op='affiliate-withdraw' then perform hajji_ticket_private.request_affiliate_withdrawal(r.id,data);end if;
  if op='affiliate-save' then
   if am.approved_at is null or not am.active then raise exception 'Affiliate belum aktif.';end if;
   alias_code=upper(trim(coalesce(data->>'code','')));
   if alias_code !~ '^[A-Z0-9][A-Z0-9-]{2,29}$' or alias_code ~ '^HJ-' or lower(alias_code) in ('index','checkout','affiliate','account','admin','studio','peserta','certificate-admin','voice-admin','verify','offline','district','manasik','player','sai','umrah','hajj','explore','legacy','adventure','adventure-map','avatar-preview','oleh-oleh','hajj-adventure','tawaf-adventure','sai-adventure','tahallul-adventure','mina-adventure','arafah-adventure','muzdalifah-adventure','aqabah-adventure','ifadah-adventure','tasyrik-adventure','wada-adventure','character-preview','api','assets','public') then raise exception 'Kode tidak valid atau dicadangkan.';end if;
   perform pg_catalog.pg_advisory_xact_lock(940622);
   if exists(select 1 from hajji_ticket_private.promo_coupons where code=alias_code) then raise exception 'Kode sudah digunakan.';end if;
   insert into hajji_ticket_private.affiliate_aliases(code,registration_id) values(alias_code,r.id) on conflict do nothing;
   if not exists(select 1 from hajji_ticket_private.affiliate_aliases where code=alias_code and registration_id=r.id) then raise exception 'Kode sudah digunakan affiliate lain.';end if;
   if data->>'kind'='coupon' then
    if not exists(select 1 from hajji_ticket_private.promo_coupons p where p.code=upper(trim(coalesce(data->>'parent_coupon_code',am.parent_coupon_code,''))) and p.enabled) then raise exception 'Pilih kupon induk aktif.';end if;
    update hajji_ticket_private.affiliate_members set coupon_code=alias_code,parent_coupon_code=upper(trim(coalesce(data->>'parent_coupon_code',am.parent_coupon_code))) where registration_id=r.id returning * into am; else update hajji_ticket_private.affiliate_members set code=alias_code where registration_id=r.id returning * into am;end if;
  end if;
  return jsonb_build_object('affiliate',jsonb_build_object('wallet',hajji_ticket_private.affiliate_wallet(r.id),'payout_enabled',(select payout_enabled from hajji_ticket_private.referral_settings where id),'payout_minimum',(select payout_minimum from hajji_ticket_private.referral_settings where id),'can_withdraw',am.approved_at is not null,'withdrawals',(select coalesce(jsonb_agg(jsonb_build_object('id',w.id,'amount',w.amount,'status',w.status,'created_at',w.created_at,'reference',w.reference,'note',w.note) order by w.created_at desc),'[]'::jsonb) from hajji_ticket_private.affiliate_withdrawals w where w.registration_id=r.id),'code',coalesce(am.code,r.id),'coupon_code',coalesce(am.coupon_code,am.code,r.id),'member_id',r.id,'member_name',r.name,'buyers',(select coalesce(jsonb_agg(to_jsonb(b) order by b.created desc),'[]'::jsonb) from (select x.id,left(x.name,60) as name,x.program,x.status,x.amount,x.created,case when x.status='approved' then x.referral_commission else 0 end as commission from hajji_ticket_private.registrations x where x.referrer_id=r.id order by x.created desc limit 100)b),'requested',am.registration_id is not null,'eligible',coalesce(am.active and am.approved_at is not null,false),'parent_coupon_code',am.parent_coupon_code,'parent_coupons',(select coalesce(jsonb_agg(jsonb_build_object('code',p.code,'kind',p.kind,'value',p.value,'discount',case when p.kind='percent' then cfg.ticket_price*p.value/100 else p.value end) order by p.code),'[]'::jsonb) from hajji_ticket_private.promo_coupons p where p.enabled),'discount',coalesce((select case when p.kind='percent' then cfg.ticket_price*p.value/100 else p.value end from hajji_ticket_private.promo_coupons p where p.code=am.parent_coupon_code and p.enabled),0),'enabled',(select enabled from hajji_ticket_private.referral_settings where id),'commission_percent',(select commission_percent from hajji_ticket_private.referral_settings where id),'referrals',(select count(*) from hajji_ticket_private.registrations where referrer_id=r.id),'paid_referrals',(select count(*) from hajji_ticket_private.registrations where referrer_id=r.id and status='approved'),'earned',(select coalesce(sum(referral_commission),0) from hajji_ticket_private.registrations where referrer_id=r.id and status='approved')),'ticket',jsonb_build_object('amount',cfg.ticket_price,'account',cfg.account),'registration',hajji_ticket_private.public_row(r));
 elsif op='create' and r.id is null then
  if not cfg.enabled and not exists(select 1 from hajji_ticket_private.qris_config where id and enabled) then raise exception 'Pendaftaran belum dibuka.'; end if;
  if length(trim(coalesce(data->>'name',''))) not between 2 and 60 or coalesce(data->>'phone','') !~ '^(\+?62|0)8[0-9]{7,12}$' or coalesce(data->>'program','') not in ('hajj','umrah') or coalesce(data->>'avatar','') not in ('male','female') or data->'consent' is distinct from 'true'::jsonb then raise exception 'Lengkapi data pendaftaran.'; end if;
  mail=lower(trim(coalesce(data->>'email','')));phone_norm=regexp_replace(regexp_replace(data->>'phone','^\+',''),'^0','62');
  if length(mail)>150 or mail !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Email belum valid.';end if;
  perform pg_catalog.pg_advisory_xact_lock(940621);
  if hajji_ticket_private.possible_member(data->>'name',mail,data->>'phone') then raise exception 'Ada kemungkinan data sudah terdaftar. Cek ulang nama, email, dan nomor WA sebelum membayar lagi.';end if;
  method=coalesce(data->>'method','');
  if method not in ('qris','transfer') or (method='transfer' and not cfg.enabled) or (method='qris' and not exists(select 1 from hajji_ticket_private.qris_config where id and enabled)) then raise exception 'Pilih metode pembayaran yang tersedia.';end if;
  if method='transfer' then
   selected_bank=coalesce(nullif(data->>'bank_id',''),'primary');
   select value into destination from jsonb_array_elements(banks) where value->>'id'=selected_bank;
   if destination is null then raise exception 'Rekening tidak tersedia. Pilih kembali metode pembayaran.';end if;
  end if;
  coupon=hajji_ticket_private.quote_coupon(data->>'coupon');
  if data ? 'expected_amount' and (data->>'expected_amount')::integer is distinct from (coupon->>'amount')::integer then raise exception 'Harga berubah. Pakai ulang kode kupon sebelum membayar.';end if;
  if coalesce(coupon->>'code','')<>'' and exists(select 1 from hajji_ticket_private.registrations where id=coupon->>'referrer_id' and (lower(email)=mail or regexp_replace(regexp_replace(phone,'^\+',''),'^0','62')=phone_norm)) then raise exception 'Kupon sendiri tidak dapat digunakan.';end if;
  rid='HJ-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));newsecret=hajji_ticket_private.random_token();
  insert into hajji_ticket_private.registrations(id,secret_hash,name,phone,email,program,avatar,payment_method,amount,discount,referrer_id,referral_commission,transfer_destination,coupon_code) values(rid,hajji_ticket_private.hash(newsecret),trim(data->>'name'),data->>'phone',mail,data->>'program',data->>'avatar',method,(coupon->>'amount')::integer,(coupon->>'discount')::integer,coupon->>'referrer_id',(coupon->>'commission')::integer,destination,nullif(coupon->>'code','')) returning * into r;
 elsif op='report' then
  if r.id is null or r.payment_method='qris' or length(trim(coalesce(data->>'reference',''))) not between 4 and 120 then raise exception 'Isi referensi transfer yang valid.'; end if;
  update hajji_ticket_private.registrations set status='reported',reference=trim(data->>'reference'),claimed=now() where id=r.id and status in ('pending','reported') returning * into r;
  if r.id is null then raise exception 'Tiket sudah aktif. Muat ulang.'; end if;
 elsif op='magic-link' then
  select * into r from hajji_ticket_private.registrations where id=r.id for update;
  if r.id is null or r.access_suspended or r.status<>'approved' or not (r.secret_hash=hajji_ticket_private.hash(secret) or exists(select 1 from hajji_ticket_private.sessions s join hajji_ticket_private.links l on l.token_hash=s.link_hash where s.secret_hash=hajji_ticket_private.hash(secret) and l.registration_id=r.id and not l.revoked)) then raise exception 'Akses telah berubah. Gunakan Magic Link terbaru.';end if;
  t=hajji_ticket_private.issue_link(r.id);
 elsif op='resume' then
  if coalesce(data->>'token','') !~ '^[a-f0-9]{64}$' then raise exception 'Tautan pemulihan tidak valid.';end if;
  select rr.* into r from hajji_ticket_private.registrations rr join hajji_ticket_private.resume_tokens l on l.registration_id=rr.id where l.token_hash=hajji_ticket_private.hash(data->>'token') and not l.used and l.expires_at>clock_timestamp() and rr.status in ('pending','reported') and not rr.access_suspended;
  if r.id is null then raise exception 'Tautan pemulihan tidak aktif. Minta tautan terbaru kepada admin.';end if;
  select * into r from hajji_ticket_private.registrations where id=r.id for update;
  if r.id is null or r.status not in ('pending','reported') or r.access_suspended then raise exception 'Status tiket berubah. Hubungi admin.';end if;
  update hajji_ticket_private.resume_tokens set used=true where token_hash=hajji_ticket_private.hash(data->>'token') and registration_id=r.id and not used and expires_at>clock_timestamp();
  if not found then raise exception 'Tautan pemulihan sudah digunakan atau kedaluwarsa.';end if;
  newsecret=hajji_ticket_private.random_token();
  update hajji_ticket_private.registrations set secret_hash=hajji_ticket_private.hash(newsecret) where id=r.id returning * into r;
 elsif op='redeem' then
  if coalesce(data->>'token','') !~ '^[a-f0-9]{64}$' then raise exception 'Magic link tidak valid.'; end if;
  select rr.* into r from hajji_ticket_private.registrations rr join hajji_ticket_private.links l on l.registration_id=rr.id where l.token_hash=hajji_ticket_private.hash(data->>'token') and not l.revoked and rr.status='approved' and not rr.access_suspended;
  if r.id is null then raise exception 'Magic link tidak aktif.'; end if;
  select * into r from hajji_ticket_private.registrations where id=r.id for update;
  if r.status<>'approved' or r.access_suspended or not exists(select 1 from hajji_ticket_private.links where token_hash=hajji_ticket_private.hash(data->>'token') and registration_id=r.id and not revoked) then raise exception 'Magic link tidak aktif.';end if;
  newsecret=hajji_ticket_private.random_token();
  insert into hajji_ticket_private.sessions(secret_hash,link_hash) values(hajji_ticket_private.hash(newsecret),hajji_ticket_private.hash(data->>'token'));
 end if;
 result=jsonb_build_object('ticket',jsonb_build_object('amount',cfg.ticket_price,'bank',coalesce(r.transfer_destination->>'bank',cfg.bank),'account',coalesce(r.transfer_destination->>'account',cfg.account),'holder',coalesce(r.transfer_destination->>'holder',cfg.holder),'bank_options',banks,'manual_enabled',cfg.enabled or r.transfer_destination is not null,'qris_enabled',(select enabled from hajji_ticket_private.qris_config where id),'qris_test',(select test_mode from hajji_ticket_private.qris_config where id),'enabled',cfg.enabled or (select enabled from hajji_ticket_private.qris_config where id)),'registration',hajji_ticket_private.public_row(r));
 if lookup_state is not null then result=result||jsonb_build_object('lookup',lookup_state);end if;
 if t is not null then result=result||jsonb_build_object('href',t); end if;
 if newsecret is not null then result=result||jsonb_build_object('secret',newsecret); end if;
 return result;
end $function$;

CREATE OR REPLACE FUNCTION hajji_ticket_private.referral_admin(op text, data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid();cfg hajji_ticket_private.referral_settings; w hajji_ticket_private.affiliate_withdrawals; target_owner text; ref text; reason text;begin
 if u is null or not exists(select 1 from auth.users where id=u and raw_app_meta_data->>'manasik_superadmin'='true') then raise exception 'Akses superadmin diperlukan.' using errcode='42501';end if;
 if op='save' then
  
  update hajji_ticket_private.referral_settings set enabled=coalesce((data->>'enabled')::boolean,false),commission_percent=(data->>'commission_percent')::integer,payout_enabled=coalesce((data->>'payout_enabled')::boolean,payout_enabled),payout_minimum=coalesce((data->>'payout_minimum')::integer,payout_minimum) where id;
  insert into hajji_ticket_private.audit(actor,action) values(u,'referral_settings');
 elsif op in ('approve','disable') then
  if not exists(select 1 from hajji_ticket_private.registrations where id=data->>'id' and status='approved' and not access_suspended) then raise exception 'Tiket aktif diperlukan.';end if;
  update hajji_ticket_private.affiliate_members set active=(op='approve'),approved_at=case when op='approve' then coalesce(approved_at,now()) else approved_at end where registration_id=data->>'id';
  if not found then raise exception 'Pengajuan alumni tidak ditemukan.';end if;
  insert into hajji_ticket_private.audit(actor,action) values(u,'affiliate_'||op);
 elsif op in ('payout-process','payout-paid','payout-reject') then
  select registration_id into target_owner from hajji_ticket_private.affiliate_withdrawals where id=(data->>'id')::uuid;
  if target_owner is null then raise exception 'Pengajuan tidak ditemukan.';end if;
  perform 1 from hajji_ticket_private.affiliate_members where registration_id=target_owner for update;
  select * into w from hajji_ticket_private.affiliate_withdrawals where id=(data->>'id')::uuid for update;
  if op='payout-process' then
   if w.status<>'pending' then raise exception 'Pengajuan sudah diproses.';end if;
   if (hajji_ticket_private.affiliate_wallet(target_owner)->>'shortfall')::bigint>0 then raise exception 'Saldo tidak mencukupi. Rekonsiliasi komisi dahulu.';end if;
   update hajji_ticket_private.affiliate_withdrawals set status='processing',processed_by=u,updated_at=now() where id=w.id;
  elsif op='payout-paid' then
   ref=lower(trim(coalesce(data->>'reference','')));
   if w.status<>'processing' or w.processed_by is distinct from u or length(ref) not between 4 and 120 then raise exception 'Harus diproses oleh admin yang sama dan memiliki referensi transfer.';end if;
   update hajji_ticket_private.affiliate_withdrawals set status='paid',reference=ref,updated_at=now() where id=w.id;
  else
   reason=trim(coalesce(data->>'note',''));
   if w.status not in ('pending','processing') or (w.status='processing' and w.processed_by is distinct from u) or length(reason) not between 3 and 250 then raise exception 'Status atau alasan penolakan tidak valid.';end if;
   update hajji_ticket_private.affiliate_withdrawals set status='rejected',note=reason,processed_by=u,updated_at=now() where id=w.id;
  end if;
  insert into hajji_ticket_private.audit(actor,action) values(u,op);
 elsif op<>'get' then raise exception 'Perintah tidak valid.';end if;
 select * into cfg from hajji_ticket_private.referral_settings where id;
 return jsonb_build_object('enabled',cfg.enabled,'discount',cfg.discount,'parent_coupons',(select coalesce(jsonb_agg(jsonb_build_object('code',p.code,'kind',p.kind,'value',p.value,'enabled',p.enabled) order by p.code),'[]'::jsonb) from hajji_ticket_private.promo_coupons p),'commission_percent',cfg.commission_percent,'payout_enabled',cfg.payout_enabled,'payout_minimum',cfg.payout_minimum,'withdrawals',(select coalesce(jsonb_agg(to_jsonb(wr)||jsonb_build_object('name',r.name,'mine',wr.processed_by=u) order by wr.created_at desc),'[]'::jsonb) from hajji_ticket_private.affiliate_withdrawals wr join hajji_ticket_private.registrations r on r.id=wr.registration_id),'members',(select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'name',r.name,'email',r.email,'phone',r.phone,'wallet',hajji_ticket_private.affiliate_wallet(r.id),'referrals',(select count(*) from hajji_ticket_private.registrations x where x.referrer_id=r.id),'code',m.code,'coupon_code',m.coupon_code,'parent_coupon_code',m.parent_coupon_code,'active',m.active,'requested_at',m.requested_at,'paid_referrals',(select count(*) from hajji_ticket_private.registrations x where x.referrer_id=r.id and x.status='approved'),'earned',(select coalesce(sum(x.referral_commission),0) from hajji_ticket_private.registrations x where x.referrer_id=r.id and x.status='approved')) order by m.requested_at desc),'[]'::jsonb) from hajji_ticket_private.affiliate_members m join hajji_ticket_private.registrations r on r.id=m.registration_id),'paid_referrals',(select count(*) from hajji_ticket_private.registrations where referrer_id is not null and status='approved'),'earned',(select coalesce(sum(referral_commission),0) from hajji_ticket_private.registrations where referrer_id is not null and status='approved'));
end $function$;

CREATE OR REPLACE FUNCTION hajji_ticket_private.pricing_admin(op text, data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid(); price integer; c text:=upper(trim(coalesce(data->>'code',''))); typ text:=data->>'kind'; v integer; active boolean;
begin
 if u is null or not exists(select 1 from auth.users where id=u and raw_app_meta_data->>'manasik_superadmin'='true') then raise exception 'Akses superadmin diperlukan.' using errcode='42501';end if;
 select ticket_price into price from hajji_ticket_private.settings where id for update;
 if op='pricing-save' then
  price=(data->>'price')::integer;
  if price is null or price not between 10000 and 999999 then raise exception 'Harga harus Rp10.000–Rp999.999.';end if;
  if exists(select 1 from hajji_ticket_private.promo_coupons where enabled and kind='fixed' and value>price-1000) then raise exception 'Nonaktifkan atau kecilkan kupon nominal yang melebihi harga baru.';end if;
  update hajji_ticket_private.settings set ticket_price=price where id;
 elsif op='coupon-save' then
  v=(data->>'value')::integer;active=(data->>'enabled')::boolean;
  if c !~ '^[A-Z0-9_-]{2,30}$' or c like 'HJ-%' or typ not in ('fixed','percent') or typ is null or v is null or v<=0 or active is null or (typ='percent' and v>90) or (typ='fixed' and (v>998999 or (active and v>price-1000))) then raise exception 'Kode atau nominal diskon tidak valid. Minimal pembayaran Rp1.000.';end if;
  perform pg_catalog.pg_advisory_xact_lock(940622);
  if exists(select 1 from hajji_ticket_private.affiliate_aliases a where a.code=c) then raise exception 'Kode sudah digunakan affiliate.';end if;
  insert into hajji_ticket_private.promo_coupons(code,kind,value,enabled) values(c,typ,v,active) on conflict(code) do update set kind=excluded.kind,value=excluded.value,enabled=excluded.enabled,updated_at=now();
 elsif op='coupon-remove' then
  if c='MAUHAJJI' then raise exception 'Kupon misi MAUHAJJI hanya dapat dinonaktifkan.';end if;
  delete from hajji_ticket_private.promo_coupons where code=c;
 elsif op<>'pricing-get' then raise exception 'Perintah tidak valid.';end if;
 if op<>'pricing-get' then insert into hajji_ticket_private.audit(actor,action) values(u,op);end if;
 return jsonb_build_object('price',price,'coupons',(select coalesce(jsonb_agg(to_jsonb(p) order by p.code),'[]'::jsonb) from hajji_ticket_private.promo_coupons p));
end $function$;
NOTIFY pgrst,'reload schema';
