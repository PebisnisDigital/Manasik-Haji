create or replace function hajji_ticket_private.threads_gateway(k text,op text,secret text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare rid text; sh text; c hajji_ticket_private.threads_connections; st text:=data->>'state'; aid text:=data->>'account_id'; p text:=coalesce(data->>'platform','threads'); tok text:=data->>'token'; ident text:=data->>'identity'; scope text:=coalesce(data->>'scope','all'); next_targets jsonb;
begin
 if k is null or length(k)<>64 or not exists(select 1 from hajji_ticket_private.settings where id and gateway_hash<>'' and gateway_hash=hajji_ticket_private.hash(k)) then raise exception 'Forbidden' using errcode='42501';end if;
 if secret is null or secret!~'^[a-f0-9]{64}$' then return jsonb_build_object('error','Akses member diperlukan.');end if;
 sh:=hajji_ticket_private.hash(secret);
 select r.id into rid from hajji_ticket_private.registrations r where r.status='approved' and not coalesce(r.access_suspended,false) and (r.secret_hash=sh or exists(select 1 from hajji_ticket_private.sessions s join hajji_ticket_private.links l on l.token_hash=s.link_hash where s.secret_hash=sh and l.registration_id=r.id and not l.revoked));
 if rid is null then return jsonb_build_object('error','Tiket aktif diperlukan.');end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(rid,48172));
 select * into c from hajji_ticket_private.threads_connections where registration_id=rid;
 if op='status' then return jsonb_build_object('status',case when c.status='pending' and c.platform='threads' and c.expires_at<=now() then 'none' else coalesce(c.status,'none') end,'platform',case when c.status='pending' and c.platform='threads' and c.expires_at<=now() then null else c.platform end,'account_id',c.account_id,'username',c.username,'targets',coalesce(c.targets,'[]'::jsonb),'resumable',coalesce(c.session_hash=sh,false));end if;
 if p not in ('threads','whatsapp') then return jsonb_build_object('error','Platform tidak valid.');end if;
 if op<>'start' and c.platform is distinct from p then return jsonb_build_object('error','Platform lain sedang dipilih.');end if;
 if op='start' then
  if st is null or st!~'^[a-f0-9]{64}$' or data->>'consent' is distinct from 'true' then return jsonb_build_object('error','Persetujuan diperlukan.');end if;
  if c.status in ('connected','processing','disconnecting') or (c.status='pending' and (c.expires_at>now() or c.platform='whatsapp' and c.provider_session is not null)) then return jsonb_build_object('error','Akun sudah terhubung atau sedang diproses.');end if;
  insert into hajji_ticket_private.threads_connections(registration_id,state_hash,session_hash,expires_at,status,platform) values(rid,hajji_ticket_private.hash(st),sh,now()+case when p='whatsapp' then interval '5 minutes' else interval '10 minutes' end,'pending',p) on conflict(registration_id) do update set state_hash=excluded.state_hash,session_hash=excluded.session_hash,expires_at=excluded.expires_at,status='pending',platform=p,provider_session=null,provider_identity=null,targets='[]'::jsonb,consent_at=now(),updated_at=now();
  return jsonb_build_object('ok',true);
 elsif op='cancel_unstarted' then
  delete from hajji_ticket_private.threads_connections where registration_id=rid and status='pending' and session_hash=sh and state_hash=hajji_ticket_private.hash(st) and provider_session is null;
  return jsonb_build_object('ok',true);
 elsif op='wa_store' then
  if p<>'whatsapp' or c.status is distinct from 'pending' or c.session_hash is distinct from sh or c.state_hash is distinct from hajji_ticket_private.hash(st) or c.expires_at<=now() or c.provider_session is not null or tok is null or length(tok) not between 16 and 4096 then return jsonb_build_object('error','Sesi QR tidak valid.');end if;
  update hajji_ticket_private.threads_connections set provider_session=tok where registration_id=rid;
  return jsonb_build_object('ok',true);
 elsif op='wa_get' then
  if p<>'whatsapp' or c.status is distinct from 'pending' or c.session_hash is distinct from sh or c.provider_session is null then return jsonb_build_object('error','Buka sesi QR dari perangkat yang memulainya.');end if;
  return jsonb_build_object('token',c.provider_session,'expired',c.expires_at<=now());
 elsif op='wa_expire' then
  if p<>'whatsapp' or c.status is distinct from 'pending' or c.session_hash is distinct from sh or c.provider_session is distinct from tok then return jsonb_build_object('error','Sesi QR tidak valid.');end if;
  delete from hajji_ticket_private.threads_connections where registration_id=rid;return jsonb_build_object('ok',true);
 elsif op='wa_claim' then
  if p<>'whatsapp' or c.status is distinct from 'pending' or c.session_hash is distinct from sh or c.provider_session is distinct from tok or c.expires_at<=now() or ident is null or length(ident) not between 5 and 128 then return jsonb_build_object('error','Sesi QR kedaluwarsa atau tidak valid.');end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(ident,48173));
  if exists(select 1 from hajji_ticket_private.threads_connections where provider_identity=ident and registration_id<>rid) then return jsonb_build_object('error','Nomor ini sudah dipakai member lain.');end if;
  update hajji_ticket_private.threads_connections set status='processing',provider_identity=ident,expires_at=null,state_hash=null,updated_at=now() where registration_id=rid;
  return jsonb_build_object('ok',true);
 elsif op='targets' then
  if p<>'whatsapp' or c.status is distinct from 'connected' or scope not in ('all','group','status') or data->'targets' is null or jsonb_typeof(data->'targets')<>'array' or jsonb_array_length(data->'targets')>20 then return jsonb_build_object('error','Pilihan tujuan tidak valid.');end if;
  if data ? 'expected_account' and c.account_id is distinct from data->>'expected_account' then return jsonb_build_object('error','Akun berubah. Muat ulang AUTOJUALAN.');end if;
  if exists(select 1 from jsonb_array_elements(data->'targets') v where not coalesce((v->>'type'='status' and v->>'id'='status' and scope in ('all','status')) or (v->>'type'='group' and v->>'id' like '%@g.us' and scope in ('all','group')) or (v->>'type'='channel' and v->>'id' like '%@newsletter' and scope='all'),false)) then return jsonb_build_object('error','Jenis tujuan tidak sesuai.');end if;
  if scope='all' then next_targets=data->'targets';else
   select coalesce(jsonb_agg(v),'[]'::jsonb) into next_targets from jsonb_array_elements(c.targets) v where v->>'type' is distinct from scope;
   next_targets=next_targets||(data->'targets');
  end if;
  if jsonb_array_length(next_targets)>20 or (select count(distinct v->>'id') from jsonb_array_elements(next_targets) v)<>jsonb_array_length(next_targets) then return jsonb_build_object('error','Maksimal 20 tujuan berbeda pada satu akun.');end if;
  if exists(select 1 from hajji_ticket_private.autojualan_plan q where q.registration_id=rid and q.platform='whatsapp' and q.delivery_state in ('sending','uncertain','scheduled','publishing','cancelling') and not exists(select 1 from jsonb_array_elements(next_targets) v where v->>'id'=q.target_id)) then return jsonb_build_object('error','Ada jadwal Repliz aktif pada tujuan yang ingin dilepas. Hubungi support untuk membatalkannya terlebih dahulu.');end if;
  update hajji_ticket_private.threads_connections set targets=next_targets,updated_at=now() where registration_id=rid;return jsonb_build_object('ok',true,'targets',next_targets);
 elsif op='claim' then
  if p<>'threads' then return jsonb_build_object('error','Platform tidak sesuai.');end if;
  if c.status is distinct from 'pending' or c.expires_at<=now() or c.session_hash is distinct from sh or st is null or st!~'^[a-f0-9]{64}$' or c.state_hash is distinct from hajji_ticket_private.hash(st) then return jsonb_build_object('error','Otorisasi kedaluwarsa atau tidak valid.');end if;
  update hajji_ticket_private.threads_connections set status='processing',state_hash=null,expires_at=null,updated_at=now() where registration_id=rid;return jsonb_build_object('ok',true);
 elsif op='finish' then
  if c.status is distinct from 'processing' or c.session_hash is distinct from sh or aid is null or aid!~'^[a-f0-9]{24}$' then return jsonb_build_object('error','Koneksi tidak valid.');end if;
  update hajji_ticket_private.threads_connections set account_id=aid,username=left(data->>'username',100),status='connected',session_hash=null,provider_session=null,updated_at=now() where registration_id=rid;return jsonb_build_object('ok',true);
 elsif op='abort' then
  delete from hajji_ticket_private.threads_connections where registration_id=rid and status='processing' and session_hash=sh;return jsonb_build_object('ok',true);
 elsif op='disconnect_begin' then
  if c.status not in ('connected','disconnecting') or c.account_id is null then return jsonb_build_object('error','Akun belum terhubung.');end if;
  update hajji_ticket_private.threads_connections set status='disconnecting',updated_at=now() where registration_id=rid;return jsonb_build_object('account_id',c.account_id,'platform',c.platform);
 elsif op='disconnect_finish' then
  delete from hajji_ticket_private.threads_connections where registration_id=rid and status='disconnecting' and account_id=aid;return jsonb_build_object('ok',true);
 end if;return jsonb_build_object('error','Operasi tidak tersedia.');
end$$;
notify pgrst,'reload schema';
