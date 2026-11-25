alter table hajji_ticket_private.qris_orders alter column created set default clock_timestamp();
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
  if r.status<>'pending' or not c.enabled then raise exception 'QRIS tidak tersedia untuk tiket ini.';end if;
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
