begin;
create table if not exists hajji_ticket_private.threads_connections(
 registration_id text primary key references hajji_ticket_private.registrations(id) on delete restrict,
 account_id text unique, username text, state_hash text, session_hash text, expires_at timestamptz,
 status text not null check(status in ('pending','processing','connected','disconnecting')), consent_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table hajji_ticket_private.threads_connections enable row level security;
revoke all on hajji_ticket_private.threads_connections from public,anon,authenticated;
create or replace function hajji_ticket_private.threads_gateway(k text,op text,secret text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare rid text; sh text; c hajji_ticket_private.threads_connections; st text:=data->>'state'; aid text:=data->>'account_id';
begin
 if k is null or length(k)<>64 or not exists(select 1 from hajji_ticket_private.settings where id and gateway_hash<>'' and gateway_hash=hajji_ticket_private.hash(k)) then raise exception 'Forbidden' using errcode='42501';end if;
 if secret is null or secret!~'^[a-f0-9]{64}$' then return jsonb_build_object('error','Akses member diperlukan.');end if;
 sh:=hajji_ticket_private.hash(secret);
 select r.id into rid from hajji_ticket_private.registrations r where r.status='approved' and not coalesce(r.access_suspended,false) and (r.secret_hash=sh or exists(select 1 from hajji_ticket_private.sessions s join hajji_ticket_private.links l on l.token_hash=s.link_hash where s.secret_hash=sh and l.registration_id=r.id and not l.revoked));
 if rid is null then return jsonb_build_object('error','Tiket aktif diperlukan.');end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(rid,48172));
 select * into c from hajji_ticket_private.threads_connections where registration_id=rid;
 if op='status' then return jsonb_build_object('status',coalesce(c.status,'none'),'account_id',c.account_id,'username',c.username);end if;
 if op='start' then
  if st is null or st!~'^[a-f0-9]{64}$' or data->>'consent' is distinct from 'true' then return jsonb_build_object('error','Persetujuan diperlukan.');end if;
  if c.status in ('connected','processing','disconnecting') then return jsonb_build_object('error','Akun sudah terhubung atau sedang diproses.');end if;
  insert into hajji_ticket_private.threads_connections(registration_id,state_hash,session_hash,expires_at,status) values(rid,hajji_ticket_private.hash(st),sh,now()+interval '10 minutes','pending') on conflict(registration_id) do update set state_hash=excluded.state_hash,session_hash=excluded.session_hash,expires_at=excluded.expires_at,status='pending',consent_at=now(),updated_at=now();
  return jsonb_build_object('ok',true);
 elsif op='claim' then
  if c.status is distinct from 'pending' or c.expires_at<=now() or c.session_hash is distinct from sh or st is null or st!~'^[a-f0-9]{64}$' or c.state_hash is distinct from hajji_ticket_private.hash(st) then return jsonb_build_object('error','Otorisasi kedaluwarsa atau tidak valid.');end if;
  update hajji_ticket_private.threads_connections set status='processing',state_hash=null,expires_at=null,updated_at=now() where registration_id=rid;return jsonb_build_object('ok',true);
 elsif op='finish' then
  if c.status is distinct from 'processing' or c.session_hash is distinct from sh or aid is null or aid!~'^[a-f0-9]{24}$' then return jsonb_build_object('error','Koneksi tidak valid.');end if;
  update hajji_ticket_private.threads_connections set account_id=aid,username=left(data->>'username',100),status='connected',session_hash=null,updated_at=now() where registration_id=rid;return jsonb_build_object('ok',true);
 elsif op='abort' then
  delete from hajji_ticket_private.threads_connections where registration_id=rid and status='processing' and session_hash=sh;return jsonb_build_object('ok',true);
 elsif op='disconnect_begin' then
  if c.status not in ('connected','disconnecting') or c.account_id is null then return jsonb_build_object('error','Akun belum terhubung.');end if;
  update hajji_ticket_private.threads_connections set status='disconnecting',updated_at=now() where registration_id=rid;return jsonb_build_object('account_id',c.account_id);
 elsif op='disconnect_finish' then
  delete from hajji_ticket_private.threads_connections where registration_id=rid and status='disconnecting' and account_id=aid;return jsonb_build_object('ok',true);
 end if;return jsonb_build_object('error','Operasi tidak tersedia.');
end$$;
revoke execute on function hajji_ticket_private.threads_gateway(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function hajji_ticket_private.threads_gateway(text,text,text,jsonb) to anon,authenticated;
create or replace function public.hajji_threads_gateway(k text,op text,secret text,data jsonb) returns jsonb language sql security invoker set search_path='' as $$select hajji_ticket_private.threads_gateway(k,op,secret,data)$$;
revoke execute on function public.hajji_threads_gateway(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.hajji_threads_gateway(text,text,text,jsonb) to anon,authenticated;
commit;