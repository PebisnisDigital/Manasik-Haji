create or replace function hajji_ticket_private.qris_admin(op text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c hajji_ticket_private.qris_config; u uuid:=auth.uid(); begin
 if u is null or not exists(select 1 from auth.users where id=u and raw_app_meta_data->>'manasik_superadmin'='true') then raise exception 'Akses superadmin diperlukan.' using errcode='42501';end if;
 select * into c from hajji_ticket_private.qris_config where id for update;
 if op='save' then
  if exists(select 1 from hajji_ticket_private.qris_orders where status in ('creating','pending')) and (coalesce(data->>'account_id','')<>c.account_id or coalesce(data->>'secret_token','')<>'' or coalesce(data->>'signing_secret','')<>'' or (data->>'test_mode')::boolean is distinct from c.test_mode) then raise exception 'Selesaikan transaksi QRIS tertunda sebelum mengganti merchant atau mode.';end if;
  c.account_id=trim(coalesce(data->>'account_id',''));c.secret_token=coalesce(nullif(trim(data->>'secret_token'),''),c.secret_token);c.signing_secret=coalesce(nullif(trim(data->>'signing_secret'),''),c.signing_secret);
  c.enabled=coalesce((data->>'enabled')::boolean,false);c.test_mode=coalesce((data->>'test_mode')::boolean,true);c.fee_by=coalesce(data->>'fee_by','user');c.qris_method=coalesce(data->>'qris_method','default');c.qris_name=left(coalesce(data->>'qris_name',''),80);
  if length(c.account_id)>200 or length(c.secret_token)>1000 or length(c.signing_secret)>1000 or c.fee_by not in ('user','buyer') or c.qris_method not in ('default','qris_two','qris_five') then raise exception 'Konfigurasi tidak valid.';end if;
  if (c.account_id<>'' and c.account_id ~ '[[:space:]]') or (c.secret_token<>'' and c.secret_token ~ '[[:space:]]') or (c.signing_secret<>'' and c.signing_secret ~ '[[:space:]]') then raise exception 'Salin nilai Account ID, Secret Token dan Signing Secret satu per satu, tanpa label atau spasi.';end if;
  if c.enabled and (length(c.account_id)<5 or length(c.secret_token)<8 or length(c.signing_secret)<8 or (not c.test_mode and data->'confirmed' is distinct from 'true'::jsonb)) then raise exception 'Lengkapi kredensial merchant dan konfirmasi mode real.';end if;
  update hajji_ticket_private.qris_config set account_id=c.account_id,secret_token=c.secret_token,signing_secret=c.signing_secret,enabled=c.enabled,test_mode=c.test_mode,fee_by=c.fee_by,qris_method=c.qris_method,qris_name=c.qris_name where id;
  insert into hajji_ticket_private.audit(actor,action) values(u,'qris_settings');
 elsif op='test' then
  if length(c.account_id)<5 or length(c.secret_token)<8 or c.account_id ~ '[[:space:]]' or c.secret_token ~ '[[:space:]]' then raise exception 'Format kredensial tidak valid. Salin ulang Secret Token saja, tanpa label atau spasi.';end if;
  if exists(select 1 from hajji_ticket_private.audit where actor=u and action='qris_sandbox_test' and created>now()-interval '45 seconds') then raise exception 'Tunggu 45 detik sebelum uji koneksi berikutnya.';end if;
  insert into hajji_ticket_private.audit(actor,action) values(u,'qris_sandbox_test');
 elsif op<>'get' then raise exception 'Perintah tidak tersedia.';end if;
 return jsonb_build_object('account_id',c.account_id,'has_token',c.secret_token<>'','token_format_ok',length(c.secret_token)>=8 and c.secret_token !~ '[[:space:]]','account_format_ok',length(c.account_id)>=5 and c.account_id !~ '[[:space:]]','signing_format_ok',length(c.signing_secret)>=8 and c.signing_secret !~ '[[:space:]]','has_signing',c.signing_secret<>'','enabled',c.enabled,'test_mode',c.test_mode,'fee_by',c.fee_by,'qris_method',c.qris_method,'qris_name',c.qris_name);
end $$;

create or replace function hajji_ticket_private.qris_gateway(k text,op text,secret text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare c hajji_ticket_private.qris_config; r hajji_ticket_private.registrations; q hajji_ticket_private.qris_orders; rid text; cfg jsonb; st text; begin
 if k is null or length(k)<>64 or not exists(select 1 from hajji_ticket_private.settings where id and gateway_hash<>'' and gateway_hash=hajji_ticket_private.hash(k)) then raise exception 'Layanan tidak tersedia.' using errcode='42501';end if;
 select * into c from hajji_ticket_private.qris_config where id for share;
 cfg=jsonb_build_object('account_id',c.account_id,'secret_token',c.secret_token,'signing_secret',c.signing_secret,'fee_by',c.fee_by,'qris_method',c.qris_method,'qris_name',c.qris_name,'test_mode',c.test_mode);
 if op='diagnostic-config' then return cfg;end if;
 if op='webhook-config' then return jsonb_build_object('signing_secret',c.signing_secret);end if;
 if op in ('save','apply','reject-create') then
  select registration_id into rid from hajji_ticket_private.qris_orders where (op in ('save','reject-create') and id::text=data->>'id') or (op='apply' and transaction_id=data->>'transaction_id');
 elsif secret~'^[a-f0-9]{64}$' then select id into rid from hajji_ticket_private.registrations where secret_hash=hajji_ticket_private.hash(secret);end if;
 if rid is null then return jsonb_build_object('qris',null);end if;
 select * into r from hajji_ticket_private.registrations where id=rid for update;
 if op in ('save','reject-create') then select * into q from hajji_ticket_private.qris_orders where id::text=data->>'id' and registration_id=rid for update;
 elsif op='apply' then select * into q from hajji_ticket_private.qris_orders where transaction_id=data->>'transaction_id' and registration_id=rid for update;
 else select * into q from hajji_ticket_private.qris_orders where registration_id=rid order by (status in ('creating','pending')) desc, created desc,id desc limit 1 for update;end if;
 if op='reserve' then
  if r.status<>'pending' or r.payment_method='transfer' or not c.enabled then raise exception 'QRIS tidak tersedia untuk tiket ini.';end if;
  -- Only an abandoned sandbox reservation can be retried without provider reconciliation.
  if q.status='creating' and q.is_test and q.transaction_id is null and q.created<clock_timestamp()-interval '60 seconds' then
   update hajji_ticket_private.qris_orders set status='failed',create_error='sandbox_retry' where id=q.id;
  elsif q.status in ('creating','pending') then return jsonb_build_object('qris',hajji_ticket_private.qris_public(q));end if;
  if q.status='success' and not q.is_test then return jsonb_build_object('qris',hajji_ticket_private.qris_public(q));end if;
  insert into hajji_ticket_private.qris_orders(registration_id,is_test,amount) values(rid,c.test_mode,r.amount) returning * into q;
  return jsonb_build_object('id',q.id,'registration_id',rid,'amount',q.amount,'config',cfg);
 elsif op='reject-create' then
  if q.status='creating' and q.transaction_id is null and data->>'code' in ('provider_rejected','rate_limited') then
   update hajji_ticket_private.qris_orders set status='failed',create_error=data->>'code' where id=q.id returning * into q;
  end if;
 elsif op='save' then
  if q.status<>'creating' or q.id is null or coalesce(data->>'transaction_id','') !~ '^[A-Za-z0-9_-]{1,100}$' or (data->>'amount')::integer is distinct from q.amount or (data->>'is_test')::boolean is distinct from q.is_test or coalesce((data->>'total_amount')::integer,0)<q.amount or (data->>'total_amount')::integer>q.amount+100000 then raise exception 'Respons QRIS tidak cocok.';end if;
  update hajji_ticket_private.qris_orders set transaction_id=data->>'transaction_id',status='pending',total_amount=(data->>'total_amount')::integer,qr_url=data->>'qr_url',qr_image=data->>'qr_image',payment_url=data->>'payment_url',create_error=null,expires_at=(data->>'expires_at')::timestamptz where id=q.id returning * into q;
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


notify pgrst,'reload schema';