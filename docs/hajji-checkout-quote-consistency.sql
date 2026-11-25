create or replace function hajji_ticket_private.gateway(k text, op text, secret text, ip text, data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg hajji_ticket_private.settings; r hajji_ticket_private.registrations; t text; newsecret text; result jsonb; n integer; rid text; coupon jsonb; mail text; phone_norm text; method text; 
begin
 select * into cfg from hajji_ticket_private.settings where id;
 if cfg.gateway_hash='' or k is null or length(k)<>64 or hajji_ticket_private.hash(k)<>cfg.gateway_hash then raise exception 'Layanan tidak tersedia.' using errcode='42501'; end if;
 if op not in ('get','create','report','magic-link','redeem','coupon','affiliate') then raise exception 'Permintaan tidak valid.'; end if;
 if op<>'get' then
  insert into hajji_ticket_private.rate(bucket) values(hajji_ticket_private.hash(coalesce(ip,'unknown')))
  on conflict(bucket) do update set hits=case when hajji_ticket_private.rate.started<now()-interval '30 minutes' then 1 else hajji_ticket_private.rate.hits+1 end, started=case when hajji_ticket_private.rate.started<now()-interval '30 minutes' then now() else hajji_ticket_private.rate.started end returning hits into n;
  if n>60 then return jsonb_build_object('error','Terlalu banyak permintaan. Coba lagi nanti.'); end if;
 end if;
 if secret~'^[a-f0-9]{64}$' then
  select * into r from hajji_ticket_private.registrations where secret_hash=hajji_ticket_private.hash(secret);
  if r.id is null then select rr.* into r from hajji_ticket_private.registrations rr join hajji_ticket_private.links l on l.registration_id=rr.id join hajji_ticket_private.sessions s on s.link_hash=l.token_hash where s.secret_hash=hajji_ticket_private.hash(secret) and not l.revoked and rr.status='approved'; end if;
 end if;
 if op='coupon' then
  coupon=hajji_ticket_private.quote_coupon(data->>'code');
  return jsonb_build_object('coupon',coupon,'ticket',jsonb_build_object('amount',100000,'account',cfg.account),'registration',null);
 elsif op='affiliate' then
  if r.status is distinct from 'approved' then raise exception 'Tiket aktif diperlukan.';end if;
  return jsonb_build_object('affiliate',jsonb_build_object('code',r.id,'discount',(select discount from hajji_ticket_private.referral_settings where id),'enabled',(select enabled from hajji_ticket_private.referral_settings where id),'commission_percent',(select commission_percent from hajji_ticket_private.referral_settings where id),'referrals',(select count(*) from hajji_ticket_private.registrations where referrer_id=r.id),'paid_referrals',(select count(*) from hajji_ticket_private.registrations where referrer_id=r.id and status='approved'),'earned',(select coalesce(sum(referral_commission),0) from hajji_ticket_private.registrations where referrer_id=r.id and status='approved')),'ticket',jsonb_build_object('amount',100000,'account',cfg.account),'registration',hajji_ticket_private.public_row(r));
 elsif op='create' and r.id is null then
  if not cfg.enabled and not exists(select 1 from hajji_ticket_private.qris_config where id and enabled) then raise exception 'Pendaftaran belum dibuka.'; end if;
  if length(trim(coalesce(data->>'name',''))) not between 2 and 60 or coalesce(data->>'phone','') !~ '^(\+?62|0)8[0-9]{7,12}$' or coalesce(data->>'program','') not in ('hajj','umrah') or coalesce(data->>'avatar','') not in ('male','female') or data->'consent' is distinct from 'true'::jsonb then raise exception 'Lengkapi data pendaftaran.'; end if;
  mail=lower(trim(coalesce(data->>'email','')));phone_norm=regexp_replace(regexp_replace(data->>'phone','^\+',''),'^0','62');
  if length(mail)>150 or mail !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Email belum valid.';end if;
  method=coalesce(data->>'method','');
  if method not in ('qris','transfer') or (method='transfer' and not cfg.enabled) or (method='qris' and not exists(select 1 from hajji_ticket_private.qris_config where id and enabled)) then raise exception 'Pilih metode pembayaran yang tersedia.';end if;
  coupon=hajji_ticket_private.quote_coupon(data->>'coupon');
  if data ? 'expected_amount' and (data->>'expected_amount')::integer is distinct from (coupon->>'amount')::integer then raise exception 'Harga berubah. Pakai ulang kode kupon sebelum membayar.';end if;
  if coalesce(coupon->>'code','')<>'' and exists(select 1 from hajji_ticket_private.registrations where id=coupon->>'code' and (lower(email)=mail or regexp_replace(regexp_replace(phone,'^\+',''),'^0','62')=phone_norm)) then raise exception 'Kupon sendiri tidak dapat digunakan.';end if;
  rid='HJ-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));newsecret=hajji_ticket_private.random_token();
  insert into hajji_ticket_private.registrations(id,secret_hash,name,phone,email,program,avatar,payment_method,amount,discount,referrer_id,referral_commission) values(rid,hajji_ticket_private.hash(newsecret),trim(data->>'name'),data->>'phone',mail,data->>'program',data->>'avatar',method,(coupon->>'amount')::integer,(coupon->>'discount')::integer,nullif(coupon->>'code',''),(coupon->>'commission')::integer) returning * into r;
 elsif op='report' then
  if r.id is null or r.payment_method='qris' or length(trim(coalesce(data->>'reference',''))) not between 4 and 120 then raise exception 'Isi referensi transfer yang valid.'; end if;
  update hajji_ticket_private.registrations set status='reported',reference=trim(data->>'reference'),claimed=now() where id=r.id and status in ('pending','reported') returning * into r;
  if r.id is null then raise exception 'Tiket sudah aktif. Muat ulang.'; end if;
 elsif op='magic-link' then
  t=hajji_ticket_private.issue_link(r.id);
 elsif op='redeem' then
  if coalesce(data->>'token','') !~ '^[a-f0-9]{64}$' then raise exception 'Magic link tidak valid.'; end if;
  select rr.* into r from hajji_ticket_private.registrations rr join hajji_ticket_private.links l on l.registration_id=rr.id where l.token_hash=hajji_ticket_private.hash(data->>'token') and not l.revoked and rr.status='approved';
  if r.id is null then raise exception 'Magic link tidak aktif.'; end if;
  newsecret=hajji_ticket_private.random_token();
  insert into hajji_ticket_private.sessions(secret_hash,link_hash) values(hajji_ticket_private.hash(newsecret),hajji_ticket_private.hash(data->>'token'));
 end if;
 result=jsonb_build_object('ticket',jsonb_build_object('amount',100000,'bank',cfg.bank,'account',cfg.account,'holder',cfg.holder,'manual_enabled',cfg.enabled,'qris_enabled',(select enabled from hajji_ticket_private.qris_config where id),'qris_test',(select test_mode from hajji_ticket_private.qris_config where id),'enabled',cfg.enabled or (select enabled from hajji_ticket_private.qris_config where id)),'registration',hajji_ticket_private.public_row(r));
 if t is not null then result=result||jsonb_build_object('href',t); end if;
 if newsecret is not null then result=result||jsonb_build_object('secret',newsecret); end if;
 return result;
end $$;
