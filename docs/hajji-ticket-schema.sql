-- HAJJI ticket service. No personal data exposed through table grants.
create schema if not exists hajji_ticket_private;
revoke all on schema hajji_ticket_private from public, anon, authenticated;
grant usage on schema hajji_ticket_private to anon, authenticated;
create table hajji_ticket_private.settings(
 id boolean primary key default true check(id), enabled boolean not null default false,
 bank text not null default '', account text not null default '', holder text not null default '',
 gateway_hash text not null default ''
);
insert into hajji_ticket_private.settings(id) values(true);
create table hajji_ticket_private.registrations(
 id text primary key, secret_hash text not null unique, name text not null, phone text not null,
 program text not null check(program in ('hajj','umrah')), avatar text not null check(avatar in ('male','female')),
 status text not null default 'pending' check(status in ('pending','reported','approved')),
 amount integer not null default 100000 check(amount=100000),
 reference text, bank_reference text unique, created timestamptz not null default now(), claimed timestamptz, approved timestamptz, approved_by uuid
);
create table hajji_ticket_private.links(token_hash text primary key, registration_id text not null references hajji_ticket_private.registrations(id), revoked boolean not null default false, created timestamptz not null default now());
create table hajji_ticket_private.sessions(secret_hash text primary key, link_hash text not null references hajji_ticket_private.links(token_hash), created timestamptz not null default now());
create table hajji_ticket_private.audit(id bigint generated always as identity primary key, actor uuid not null, action text not null, registration_id text, created timestamptz not null default now());
create table hajji_ticket_private.rate(bucket text primary key, started timestamptz not null default now(), hits integer not null default 1);
alter table hajji_ticket_private.settings enable row level security;
alter table hajji_ticket_private.registrations enable row level security;
alter table hajji_ticket_private.links enable row level security;
alter table hajji_ticket_private.sessions enable row level security;
alter table hajji_ticket_private.audit enable row level security;
alter table hajji_ticket_private.rate enable row level security;
revoke all on all tables in schema hajji_ticket_private from public, anon, authenticated;
create function hajji_ticket_private.hash(v text) returns text language sql immutable set search_path='' as $$select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(v,'UTF8')),'hex')$$;
create function hajji_ticket_private.random_token() returns text language sql volatile set search_path='' as $$select replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','')$$;
create function hajji_ticket_private.public_row(r hajji_ticket_private.registrations) returns jsonb language sql stable set search_path='' as $$select case when r.id is null then null else jsonb_build_object('id',r.id,'name',r.name,'program',r.program,'avatar',r.avatar,'status',r.status,'reference',r.reference,'created',r.created,'claimed',r.claimed,'approved',r.approved) end$$;
create function hajji_ticket_private.issue_link(rid text) returns text language plpgsql set search_path='' as $$
declare t text:=hajji_ticket_private.random_token(); begin
 if not exists(select 1 from hajji_ticket_private.registrations where id=rid and status='approved') then raise exception 'Tiket belum aktif.'; end if;
 insert into hajji_ticket_private.links(token_hash,registration_id) values(hajji_ticket_private.hash(t),rid);
 return './index.html?access=1#token='||t;
end $$;
create function hajji_ticket_private.gateway(k text, op text, secret text, ip text, data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
  if not cfg.enabled then raise exception 'Pendaftaran belum dibuka.'; end if;
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
 result=jsonb_build_object('ticket',jsonb_build_object('amount',100000,'bank',cfg.bank,'account',cfg.account,'holder',cfg.holder,'enabled',cfg.enabled),'registration',hajji_ticket_private.public_row(r));
 if t is not null then result=result||jsonb_build_object('href',t); end if;
 if newsecret is not null then result=result||jsonb_build_object('secret',newsecret); end if;
 return result;
end $$;
create function hajji_ticket_private.admin(op text, data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r hajji_ticket_private.registrations; cfg hajji_ticket_private.settings; uid uuid:=auth.uid(); rid text:=data->>'id'; result jsonb; search text:=left(coalesce(data->>'search',''),100); state text:=coalesce(data->>'status',''); offs integer:=greatest(0,least(100000,coalesce((data->>'offset')::integer,0))); n integer;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and raw_app_meta_data->>'manasik_superadmin'='true') then raise exception 'Akses superadmin diperlukan.' using errcode='42501'; end if;
 if op='list' then
  select * into cfg from hajji_ticket_private.settings where id;
  select jsonb_build_object('total',count(*),'pending',count(*) filter(where status='pending'),'reported',count(*) filter(where status='reported'),'approved',count(*) filter(where status='approved'),'revenue',coalesce(sum(amount) filter(where status='approved'),0)) into result from hajji_ticket_private.registrations;
  return jsonb_build_object('summary',result,'settings',jsonb_build_object('enabled',cfg.enabled,'bank',cfg.bank,'account',cfg.account,'holder',cfg.holder),'total', (select count(*) from hajji_ticket_private.registrations where (state='' or status=state) and (search='' or position(lower(search) in lower(name||' '||phone||' '||id))>0)), 'rows',(select coalesce(jsonb_agg(to_jsonb(t) order by t.created desc),'[]'::jsonb) from (select id,name,phone,program,avatar,status,amount,reference,bank_reference,created,claimed,approved from hajji_ticket_private.registrations where (state='' or status=state) and (search='' or position(lower(search) in lower(name||' '||phone||' '||id))>0) order by created desc,id limit 25 offset offs)t));
 elsif op='settings' then
  if data->'enabled' not in ('true'::jsonb,'false'::jsonb) or data->'enabled' is null then raise exception 'Status pendaftaran tidak valid.'; end if;
  if data->'enabled'='true'::jsonb and (data->'confirmed' is distinct from 'true'::jsonb or length(trim(coalesce(data->>'bank',''))) not between 2 and 50 or coalesce(data->>'account','') !~ '^[0-9]{6,24}$' or length(trim(coalesce(data->>'holder',''))) not between 2 and 100) then raise exception 'Konfirmasi rekening yang benar sebelum membuka pendaftaran.'; end if;
  update hajji_ticket_private.settings set enabled=(data->>'enabled')::boolean,bank=left(trim(coalesce(data->>'bank','')),50),account=left(trim(coalesce(data->>'account','')),24),holder=left(trim(coalesce(data->>'holder','')),100) where id;
 elsif op='approve' then
  if data->'confirmed' is distinct from 'true'::jsonb or data->>'amount' is distinct from '100000' or length(trim(coalesce(data->>'bank_reference',''))) not between 4 and 120 then raise exception 'Cocokkan mutasi dan nominal Rp100.000 terlebih dahulu.'; end if;
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
revoke execute on all functions in schema hajji_ticket_private from public,anon,authenticated;
grant execute on function hajji_ticket_private.gateway(text,text,text,text,jsonb) to anon,authenticated;
grant execute on function hajji_ticket_private.admin(text,jsonb) to authenticated;
create function public.hajji_ticket_gateway(k text,op text,secret text,ip text,data jsonb) returns jsonb language sql security invoker set search_path='' as $$select hajji_ticket_private.gateway(k,op,secret,ip,data)$$;
create function public.hajji_ticket_admin(op text,data jsonb) returns jsonb language sql security invoker set search_path='' as $$select hajji_ticket_private.admin(op,data)$$;
revoke execute on function public.hajji_ticket_gateway(text,text,text,text,jsonb) from public,anon,authenticated;
revoke execute on function public.hajji_ticket_admin(text,jsonb) from public,anon,authenticated;
grant execute on function public.hajji_ticket_gateway(text,text,text,text,jsonb) to anon,authenticated;
grant execute on function public.hajji_ticket_admin(text,jsonb) to authenticated;
notify pgrst,'reload schema';
