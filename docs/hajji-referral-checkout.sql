-- Preserve all existing ticket and QRIS rows; freeze discounts at registration.
alter table hajji_ticket_private.registrations add column email text, add column payment_method text check(payment_method in ('qris','transfer')),add column discount integer not null default 0 check(discount between 0 and 50000),add column referrer_id text references hajji_ticket_private.registrations(id),add column referral_commission integer not null default 0 check(referral_commission>=0);
alter table hajji_ticket_private.registrations drop constraint registrations_amount_check,add constraint registrations_amount_check check(amount=100000-discount);
alter table hajji_ticket_private.qris_orders drop constraint qris_orders_amount_check,add constraint qris_orders_amount_check check(amount between 50000 and 100000);
create index hajji_registration_referrer on hajji_ticket_private.registrations(referrer_id);
create table hajji_ticket_private.referral_settings(id boolean primary key check(id), enabled boolean not null default false, discount integer not null default 10000 check(discount between 1000 and 50000), commission_percent integer not null default 30 check(commission_percent between 0 and 50));
insert into hajji_ticket_private.referral_settings(id) values(true);
alter table hajji_ticket_private.referral_settings enable row level security;
revoke all on hajji_ticket_private.referral_settings from public,anon,authenticated;
create function hajji_ticket_private.quote_coupon(code text) returns jsonb language plpgsql stable set search_path='' as $$
declare c text:=upper(trim(coalesce(code,''))); cfg hajji_ticket_private.referral_settings; begin
 if c='' then return jsonb_build_object('code','','amount',100000,'discount',0,'commission',0);end if;
 select * into cfg from hajji_ticket_private.referral_settings where id;
 if not cfg.enabled or c !~ '^HJ-[A-F0-9]{12}$' or not exists(select 1 from hajji_ticket_private.registrations where id=c and status='approved') then raise exception 'Kode kupon tidak aktif atau tidak valid.';end if;
 return jsonb_build_object('code',c,'amount',100000-cfg.discount,'discount',cfg.discount,'commission',(100000-cfg.discount)*cfg.commission_percent/100);
end $$;
create or replace function hajji_ticket_private.public_row(r hajji_ticket_private.registrations) returns jsonb language sql stable set search_path='' as $$select case when r.id is null then null else jsonb_build_object('id',r.id,'name',r.name,'email',r.email,'program',r.program,'avatar',r.avatar,'status',r.status,'reference',r.reference,'created',r.created,'claimed',r.claimed,'approved',r.approved,'amount',r.amount,'discount',r.discount,'coupon',r.referrer_id,'payment_method',r.payment_method) end$$;
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
  mail=lower(trim(coalesce(data->>'email','')));phone_norm=regexp_replace(regexp_replace(data->>'phone','^\\+',''),'^0','62');
  if length(mail)>150 or mail !~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));newsecret=hajji_ticket_private.random_token();
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

 then raise exception 'Email belum valid.';end if;
  method=coalesce(data->>'method','');
  if method not in ('qris','transfer') or (method='transfer' and not cfg.enabled) or (method='qris' and not exists(select 1 from hajji_ticket_private.qris_config where id and enabled)) then raise exception 'Pilih metode pembayaran yang tersedia.';end if;
  coupon=hajji_ticket_private.quote_coupon(data->>'coupon');
  if coalesce(coupon->>'code','')<>'' and exists(select 1 from hajji_ticket_private.registrations where id=coupon->>'code' and (lower(email)=mail or regexp_replace(regexp_replace(phone,'^\\+',''),'^0','62')=phone_norm)) then raise exception 'Kupon sendiri tidak dapat digunakan.';end if;
  rid='HJ-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));newsecret=hajji_ticket_private.random_token();
  insert into hajji_ticket_private.registrations(id,secret_hash,name,phone,program,avatar) values(rid,hajji_ticket_private.hash(newsecret),trim(data->>'name'),data->>'phone',data->>'program',data->>'avatar') returning * into r;
 elsif op='report' then
  if r.id is null or length(trim(coalesce(data->>'reference',''))) not between 4 and 120 then raise exception 'Isi referensi transfer yang valid.'; end if;
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


create or replace function hajji_ticket_private.admin(op text, data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r hajji_ticket_private.registrations; cfg hajji_ticket_private.settings; uid uuid:=auth.uid(); rid text:=data->>'id'; result jsonb; search text:=left(coalesce(data->>'search',''),100); state text:=coalesce(data->>'status',''); offs integer:=greatest(0,least(100000,coalesce((data->>'offset')::integer,0))); n integer;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and raw_app_meta_data->>'manasik_superadmin'='true') then raise exception 'Akses superadmin diperlukan.' using errcode='42501'; end if;
 if op='list' then
  select * into cfg from hajji_ticket_private.settings where id;
  select jsonb_build_object('total',count(*),'pending',count(*) filter(where status='pending'),'reported',count(*) filter(where status='reported'),'approved',count(*) filter(where status='approved'),'revenue',coalesce(sum(amount) filter(where status='approved'),0)) into result from hajji_ticket_private.registrations;
  return jsonb_build_object('summary',result,'settings',jsonb_build_object('enabled',cfg.enabled,'bank',cfg.bank,'account',cfg.account,'holder',cfg.holder),'total', (select count(*) from hajji_ticket_private.registrations where (state='' or status=state) and (search='' or position(lower(search) in lower(name||' '||phone||' '||id||' '||coalesce(email,'')))>0)), 'rows',(select coalesce(jsonb_agg(to_jsonb(t) order by t.created desc),'[]'::jsonb) from (select id,name,phone,email,program,avatar,status,amount,discount,referrer_id,referral_commission,payment_method,reference,bank_reference,created,claimed,approved from hajji_ticket_private.registrations where (state='' or status=state) and (search='' or position(lower(search) in lower(name||' '||phone||' '||id||' '||coalesce(email,'')))>0) order by created desc,id limit 25 offset offs)t));
 elsif op='settings' then
  if data->'enabled' not in ('true'::jsonb,'false'::jsonb) or data->'enabled' is null then raise exception 'Status pendaftaran tidak valid.'; end if;
  if data->'enabled'='true'::jsonb and (data->'confirmed' is distinct from 'true'::jsonb or length(trim(coalesce(data->>'bank',''))) not between 2 and 50 or coalesce(data->>'account','') !~ '^[0-9]{6,24}$' or length(trim(coalesce(data->>'holder',''))) not between 2 and 100) then raise exception 'Konfirmasi rekening yang benar sebelum membuka pendaftaran.'; end if;
  update hajji_ticket_private.settings set enabled=(data->>'enabled')::boolean,bank=left(trim(coalesce(data->>'bank','')),50),account=left(trim(coalesce(data->>'account','')),24),holder=left(trim(coalesce(data->>'holder','')),100) where id;
 elsif op='approve' then
  if data->'confirmed' is distinct from 'true'::jsonb or coalesce(data->>'amount','') !~ '^[0-9]{1,6} or length(trim(coalesce(data->>'bank_reference',''))) not between 4 and 120 then raise exception 'Cocokkan mutasi dan nominal tagihan terlebih dahulu.'; end if;
  update hajji_ticket_private.registrations set status='approved',approved=now(),approved_by=uid,bank_reference=lower(trim(data->>'bank_reference')) where id=rid and status='reported' and amount=(data->>'amount')::integer and payment_method is distinct from 'qris' returning * into r;
  if r.id is null then raise exception 'Pendaftaran belum melapor atau sudah disetujui.'; end if;
 elsif op='issue' then
  result=jsonb_build_object('href',hajji_ticket_private.issue_link(rid));
 elsif op='revoke' then
  update hajji_ticket_private.links set revoked=true where registration_id=rid and not revoked; get diagnostics n=row_count;result=jsonb_build_object('revoked',n);
 else raise exception 'Perintah tidak tersedia.'; end if;
 insert into hajji_ticket_private.audit(actor,action,registration_id) values(uid,op,rid);
 return coalesce(result,jsonb_build_object('ok',true));
end $$;
 or length(trim(coalesce(data->>'bank_reference',''))) not between 4 and 120 then raise exception 'Cocokkan mutasi dan nominal Rp100.000 terlebih dahulu.'; end if;
  update hajji_ticket_private.registrations set status='approved',approved=now(),approved_by=uid,bank_reference=lower(trim(data->>'bank_reference')) where id=rid and status='reported' returning * into r;
  if r.id is null then raise exception 'Pendaftaran belum melapor atau sudah disetujui.'; end if;
 elsif op='issue' then
  result=jsonb_build_object('href',hajji_ticket_private.issue_link(rid));
 elsif op='revoke' then
  update hajji_ticket_private.links set revoked=true where registration_id=rid and not revoked; get diagnostics n=row_count;result=jsonb_build_object('revoked',n);
 else raise exception 'Perintah tidak tersedia.'; end if;
 insert into hajji_ticket_private.audit(actor,action,registration_id) values(uid,op,rid);
 return coalesce(result,jsonb_build_object('ok',true));
end $$;

create or replace function hajji_ticket_private.qris_gateway(k text,op text,secret text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c hajji_ticket_private.qris_config; r hajji_ticket_private.registrations; q hajji_ticket_private.qris_orders; rid text; cfg jsonb; st text; begin
 if k is null or length(k)<>64 or not exists(select 1 from hajji_ticket_private.settings where id and gateway_hash<>'' and gateway_hash=hajji_ticket_private.hash(k)) then raise exception 'Layanan tidak tersedia.' using errcode='42501';end if;
 select * into c from hajji_ticket_private.qris_config where id for share;
 cfg=jsonb_build_object('account_id',c.account_id,'secret_token',c.secret_token,'signing_secret',c.signing_secret,'fee_by',c.fee_by,'qris_method',c.qris_method,'qris_name',c.qris_name,'test_mode',c.test_mode);
 if op='webhook-config' then return jsonb_build_object('signing_secret',c.signing_secret);end if;
 if op in ('save','apply') then
  select registration_id into rid from hajji_ticket_private.qris_orders where (op='save' and id::text=data->>'id') or (op='apply' and transaction_id=data->>'transaction_id');
 elsif secret~'^[a-f0-9]{64}$' then select id into rid from hajji_ticket_private.registrations where secret_hash=hajji_ticket_private.hash(secret);end if;
 if rid is null then return jsonb_build_object('qris',null);end if;
 select * into r from hajji_ticket_private.registrations where id=rid for update;
 if op='save' then select * into q from hajji_ticket_private.qris_orders where id::text=data->>'id' and registration_id=rid for update;
 elsif op='apply' then select * into q from hajji_ticket_private.qris_orders where transaction_id=data->>'transaction_id' and registration_id=rid for update;
 else select * into q from hajji_ticket_private.qris_orders where registration_id=rid order by (status in ('creating','pending')) desc, created desc,id desc limit 1 for update;end if;
 if op='reserve' then
  if r.status<>'pending' or r.payment_method='transfer' or not c.enabled then raise exception 'QRIS tidak tersedia untuk tiket ini.';end if;
  if q.status in ('creating','pending') then return jsonb_build_object('qris',hajji_ticket_private.qris_public(q));end if;
  if q.status='success' and not q.is_test then return jsonb_build_object('qris',hajji_ticket_private.qris_public(q));end if;
  insert into hajji_ticket_private.qris_orders(registration_id,is_test,amount) values(rid,c.test_mode,r.amount) returning * into q;
  return jsonb_build_object('id',q.id,'registration_id',rid,'amount',q.amount,'config',cfg);
 elsif op='save' then
  if q.status<>'creating' or q.id is null or coalesce(data->>'transaction_id','') !~ '^[A-Za-z0-9_-]{1,100}$' or (data->>'amount')::integer is distinct from q.amount or (data->>'is_test')::boolean is distinct from q.is_test or coalesce((data->>'total_amount')::integer,0)<q.amount or (data->>'total_amount')::integer>q.amount+100000 then raise exception 'Respons QRIS tidak cocok.';end if;
  update hajji_ticket_private.qris_orders set transaction_id=data->>'transaction_id',status='pending',total_amount=(data->>'total_amount')::integer,qr_url=data->>'qr_url',payment_url=data->>'payment_url',expires_at=(data->>'expires_at')::timestamptz where id=q.id returning * into q;
 elsif op='check' then
  if q.status='pending' and (q.last_check is null or q.last_check<=now()-interval '20 seconds') then update hajji_ticket_private.qris_orders set last_check=now() where id=q.id;return jsonb_build_object('qris',hajji_ticket_private.qris_public(q),'config',cfg);end if;
 elsif op='apply' then
  if q.id is null then return jsonb_build_object('qris',null);end if;
  st=data->>'status';
  if st not in ('pending','success','failed','expired') then raise exception 'Status QRIS tidak valid.';end if;
  if q.status='success' then return jsonb_build_object('qris',hajji_ticket_private.qris_public(q));end if;
  if st='success' then
   if (data->>'amount')::integer is distinct from q.amount or (data->>'total_amount')::integer is distinct from q.total_amount or (data->>'is_test')::boolean is distinct from q.is_test then raise exception 'Nominal atau mode transaksi tidak cocok.';end if;
   update hajji_ticket_private.qris_orders set status='success',paid_at=now() where id=q.id returning * into q;
   if not q.is_test then update hajji_ticket_private.registrations set status='approved',approved=now(),bank_reference='buatqris:'||q.transaction_id where id=rid and status='pending';end if;
  elsif st in ('failed','expired') and q.status='pending' then update hajji_ticket_private.qris_orders set status=st where id=q.id returning * into q;end if;
 elsif op<>'get' then raise exception 'Perintah QRIS tidak valid.';end if;
 return jsonb_build_object('qris',hajji_ticket_private.qris_public(q));
end $$;

create function hajji_ticket_private.referral_admin(op text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();cfg hajji_ticket_private.referral_settings;begin
 if u is null or not exists(select 1 from auth.users where id=u and raw_app_meta_data->>'manasik_superadmin'='true') then raise exception 'Akses superadmin diperlukan.' using errcode='42501';end if;
 if op='save' then
  update hajji_ticket_private.referral_settings set enabled=coalesce((data->>'enabled')::boolean,false),discount=(data->>'discount')::integer,commission_percent=(data->>'commission_percent')::integer where id;
  insert into hajji_ticket_private.audit(actor,action) values(u,'referral_settings');
 elsif op<>'get' then raise exception 'Perintah tidak valid.';end if;
 select * into cfg from hajji_ticket_private.referral_settings where id;
 return jsonb_build_object('enabled',cfg.enabled,'discount',cfg.discount,'commission_percent',cfg.commission_percent,'paid_referrals',(select count(*) from hajji_ticket_private.registrations where referrer_id is not null and status='approved'),'earned',(select coalesce(sum(referral_commission),0) from hajji_ticket_private.registrations where referrer_id is not null and status='approved'));
end $$;
revoke execute on function hajji_ticket_private.quote_coupon(text),hajji_ticket_private.referral_admin(text,jsonb) from public,anon,authenticated;
grant execute on function hajji_ticket_private.referral_admin(text,jsonb) to authenticated;
create function public.hajji_referral_admin(op text,data jsonb) returns jsonb language sql security invoker set search_path='' as $$select hajji_ticket_private.referral_admin(op,data)$$;
revoke execute on function public.hajji_referral_admin(text,jsonb) from public,anon,authenticated;
grant execute on function public.hajji_referral_admin(text,jsonb) to authenticated;
notify pgrst,'reload schema';