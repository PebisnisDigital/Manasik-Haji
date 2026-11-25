create table hajji_ticket_private.qris_config(id boolean primary key check(id), enabled boolean not null default false, test_mode boolean not null default true, account_id text not null default '', secret_token text not null default '', signing_secret text not null default '', fee_by text not null default 'user' check(fee_by in ('user','buyer')), qris_method text not null default 'default', qris_name text not null default '');
insert into hajji_ticket_private.qris_config(id) values(true);
create table hajji_ticket_private.qris_orders(id uuid primary key default gen_random_uuid(), registration_id text not null references hajji_ticket_private.registrations(id), transaction_id text unique, status text not null default 'creating' check(status in ('creating','pending','success','failed','expired')), is_test boolean not null, amount integer not null check(amount=100000), total_amount integer, qr_url text, payment_url text, expires_at timestamptz, created timestamptz not null default now(), last_check timestamptz, paid_at timestamptz);
create unique index hajji_qris_one_open on hajji_ticket_private.qris_orders(registration_id) where status in ('creating','pending');
alter table hajji_ticket_private.qris_config enable row level security;
alter table hajji_ticket_private.qris_orders enable row level security;
revoke all on hajji_ticket_private.qris_config,hajji_ticket_private.qris_orders from public,anon,authenticated;
create or replace function hajji_ticket_private.gateway(k text, op text, secret text, ip text, data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg hajji_ticket_private.settings; r hajji_ticket_private.registrations; t text; newsecret text; result jsonb; n integer; rid text;
begin
 select * into cfg from hajji_ticket_private.settings where id;
 if cfg.gateway_hash='' or k is null or length(k)<>64 or hajji_ticket_private.hash(k)<>cfg.gateway_hash then raise exception 'Layanan tidak tersedia.' using errcode='42501'; end if;
 if op not in ('get','create','report','magic-link','redeem') then raise exception 'Permintaan tidak valid.'; end if;
 if op<>'get' then
  insert into hajji_ticket_private.rate(bucket) values(hajji_ticket_private.hash(coalesce(ip,'unknown')))
  on conflict(bucket) do update set hits=case when hajji_ticket_private.rate.started<now()-interval '30 minutes' then 1 else hajji_ticket_private.rate.hits+1 end, started=case when hajji_ticket_private.rate.started<now()-interval '30 minutes' then now() else hajji_ticket_private.rate.started end returning hits into n;
  if n>60 then return jsonb_build_object('error','Terlalu banyak permintaan. Coba lagi nanti.'); end if;
 end if;
 if secret~'^[a-f0-9]{64}$' then
  select * into r from hajji_ticket_private.registrations where secret_hash=hajji_ticket_private.hash(secret);
  if r.id is null then select rr.* into r from hajji_ticket_private.registrations rr join hajji_ticket_private.links l on l.registration_id=rr.id join hajji_ticket_private.sessions s on s.link_hash=l.token_hash where s.secret_hash=hajji_ticket_private.hash(secret) and not l.revoked and rr.status='approved'; end if;
 end if;
 if op='create' and r.id is null then
  if not cfg.enabled and not exists(select 1 from hajji_ticket_private.qris_config where id and enabled) then raise exception 'Pendaftaran belum dibuka.'; end if;
  if length(trim(coalesce(data->>'name',''))) not between 2 and 60 or coalesce(data->>'phone','') !~ '^(\+?62|0)8[0-9]{7,12}$' or coalesce(data->>'program','') not in ('hajj','umrah') or coalesce(data->>'avatar','') not in ('male','female') or data->'consent' is distinct from 'true'::jsonb then raise exception 'Lengkapi data pendaftaran.'; end if;
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

create function hajji_ticket_private.qris_admin(op text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c hajji_ticket_private.qris_config; u uuid:=auth.uid(); begin
 if u is null or not exists(select 1 from auth.users where id=u and raw_app_meta_data->>'manasik_superadmin'='true') then raise exception 'Akses superadmin diperlukan.' using errcode='42501';end if;
 select * into c from hajji_ticket_private.qris_config where id for update;
 if op='save' then
  if exists(select 1 from hajji_ticket_private.qris_orders where status in ('creating','pending')) and (coalesce(data->>'account_id','')<>c.account_id or coalesce(data->>'secret_token','')<>'' or coalesce(data->>'signing_secret','')<>'' or (data->>'test_mode')::boolean is distinct from c.test_mode) then raise exception 'Selesaikan transaksi QRIS tertunda sebelum mengganti merchant atau mode.';end if;
  c.account_id=trim(coalesce(data->>'account_id',''));c.secret_token=coalesce(nullif(trim(data->>'secret_token'),''),c.secret_token);c.signing_secret=coalesce(nullif(trim(data->>'signing_secret'),''),c.signing_secret);
  c.enabled=coalesce((data->>'enabled')::boolean,false);c.test_mode=coalesce((data->>'test_mode')::boolean,true);c.fee_by=coalesce(data->>'fee_by','user');c.qris_method=coalesce(data->>'qris_method','default');c.qris_name=left(coalesce(data->>'qris_name',''),80);
  if length(c.account_id)>200 or length(c.secret_token)>1000 or length(c.signing_secret)>1000 or c.fee_by not in ('user','buyer') or c.qris_method not in ('default','qris_two','qris_five') then raise exception 'Konfigurasi tidak valid.';end if;
  if c.enabled and (length(c.account_id)<5 or length(c.secret_token)<8 or length(c.signing_secret)<8 or (not c.test_mode and data->'confirmed' is distinct from 'true'::jsonb)) then raise exception 'Lengkapi kredensial merchant dan konfirmasi mode real.';end if;
  update hajji_ticket_private.qris_config set account_id=c.account_id,secret_token=c.secret_token,signing_secret=c.signing_secret,enabled=c.enabled,test_mode=c.test_mode,fee_by=c.fee_by,qris_method=c.qris_method,qris_name=c.qris_name where id;
  insert into hajji_ticket_private.audit(actor,action) values(u,'qris_settings');
 elsif op<>'get' then raise exception 'Perintah tidak tersedia.';end if;
 return jsonb_build_object('account_id',c.account_id,'has_token',c.secret_token<>'','has_signing',c.signing_secret<>'','enabled',c.enabled,'test_mode',c.test_mode,'fee_by',c.fee_by,'qris_method',c.qris_method,'qris_name',c.qris_name);
end $$;
create function hajji_ticket_private.qris_public(q hajji_ticket_private.qris_orders) returns jsonb language sql stable set search_path='' as $$select case when q.id is null then null else jsonb_build_object('status',q.status,'is_test',q.is_test,'amount',q.amount,'total_amount',q.total_amount,'qr_url',q.qr_url,'payment_url',q.payment_url,'expires_at',q.expires_at,'transaction_id',q.transaction_id) end$$;
create function hajji_ticket_private.qris_guard() returns trigger language plpgsql set search_path='' as $$begin
 if new.status is distinct from old.status and new.status in ('reported','approved') and exists(select 1 from hajji_ticket_private.qris_orders where registration_id=new.id and status in ('creating','pending') and not is_test) then raise exception 'Selesaikan QRIS aktif sebelum transfer manual.';end if;return new;end$$;
create trigger hajji_qris_guard before update on hajji_ticket_private.registrations for each row execute function hajji_ticket_private.qris_guard();
create function hajji_ticket_private.qris_gateway(k text,op text,secret text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
 else select * into q from hajji_ticket_private.qris_orders where registration_id=rid order by created desc limit 1 for update;end if;
 if op='reserve' then
  if r.status<>'pending' or not c.enabled then raise exception 'QRIS tidak tersedia untuk tiket ini.';end if;
  if q.status in ('creating','pending') then return jsonb_build_object('qris',hajji_ticket_private.qris_public(q));end if;
  if q.status='success' and not q.is_test then return jsonb_build_object('qris',hajji_ticket_private.qris_public(q));end if;
  insert into hajji_ticket_private.qris_orders(registration_id,is_test,amount) values(rid,c.test_mode,r.amount) returning * into q;
  return jsonb_build_object('id',q.id,'registration_id',rid,'amount',q.amount,'config',cfg);
 elsif op='save' then
  if q.status<>'creating' or q.id is null or coalesce(data->>'transaction_id','') !~ '^[A-Za-z0-9_-]{1,100}$' or (data->>'amount')::integer is distinct from q.amount or (data->>'is_test')::boolean is distinct from q.is_test or (data->>'total_amount')::integer<q.amount then raise exception 'Respons QRIS tidak cocok.';end if;
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
revoke execute on function hajji_ticket_private.qris_admin(text,jsonb),hajji_ticket_private.qris_gateway(text,text,text,jsonb),hajji_ticket_private.qris_public(hajji_ticket_private.qris_orders),hajji_ticket_private.qris_guard() from public,anon,authenticated;
grant execute on function hajji_ticket_private.qris_admin(text,jsonb) to authenticated;
grant execute on function hajji_ticket_private.qris_gateway(text,text,text,jsonb) to anon,authenticated;
create function public.hajji_qris_admin(op text,data jsonb) returns jsonb language sql security invoker set search_path='' as $$select hajji_ticket_private.qris_admin(op,data)$$;
create function public.hajji_qris_gateway(k text,op text,secret text,data jsonb) returns jsonb language sql security invoker set search_path='' as $$select hajji_ticket_private.qris_gateway(k,op,secret,data)$$;
revoke execute on function public.hajji_qris_admin(text,jsonb),public.hajji_qris_gateway(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.hajji_qris_admin(text,jsonb) to authenticated;
grant execute on function public.hajji_qris_gateway(text,text,text,jsonb) to anon,authenticated;
notify pgrst,'reload schema';