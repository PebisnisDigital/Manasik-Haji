create or replace function hajji_ticket_private.public_row(r hajji_ticket_private.registrations) returns jsonb language sql stable set search_path='' as $$select case when r.id is null then null else jsonb_build_object('id',r.id,'name',r.name,'email',r.email,'phone',r.phone,'program',r.program,'avatar',r.avatar,'status',r.status,'reference',r.reference,'created',r.created,'claimed',r.claimed,'approved',r.approved,'amount',r.amount,'discount',r.discount,'coupon',r.referrer_id,'payment_method',r.payment_method,'access_suspended',r.access_suspended) end$$;
create or replace function hajji_ticket_private.admin(op text, data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r hajji_ticket_private.registrations; cfg hajji_ticket_private.settings; uid uuid:=auth.uid(); rid text:=data->>'id'; result jsonb; search text:=left(coalesce(data->>'search',''),100); state text:=coalesce(data->>'status',''); offs integer:=greatest(0,least(100000,coalesce((data->>'offset')::integer,0))); n integer; extras jsonb; item jsonb;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and raw_app_meta_data->>'manasik_superadmin'='true') then raise exception 'Akses superadmin diperlukan.' using errcode='42501'; end if;
 if op='list' then
  select * into cfg from hajji_ticket_private.settings where id;
  select jsonb_build_object('total',count(*),'pending',count(*) filter(where status='pending'),'reported',count(*) filter(where status='reported'),'approved',count(*) filter(where status='approved' and not access_suspended),'revenue',coalesce(sum(amount) filter(where status='approved'),0)) into result from hajji_ticket_private.registrations;
  return jsonb_build_object('summary',result,'settings',jsonb_build_object('enabled',cfg.enabled,'bank',cfg.bank,'account',cfg.account,'holder',cfg.holder,'extra_banks',cfg.extra_banks),'total', (select count(*) from hajji_ticket_private.registrations where (state='' or (state='suspended' and access_suspended) or (state=status and (state<>'approved' or not access_suspended))) and (search='' or position(lower(search) in lower(name||' '||phone||' '||id||' '||coalesce(email,'')))>0)), 'rows',(select coalesce(jsonb_agg(to_jsonb(t) order by t.created desc),'[]'::jsonb) from (select id,name,phone,email,program,avatar,status,amount,discount,referrer_id,referral_commission,payment_method,transfer_destination,reference,bank_reference,created,claimed,approved,access_suspended,updated_at,(select name from hajji_ticket_private.registrations ref where ref.id=registrations.referrer_id) as referrer_name,case when status='approved' or approved is not null or bank_reference is not null then 'paid' when exists(select 1 from hajji_ticket_private.qris_orders q where q.registration_id=registrations.id and not q.is_test) then 'real_qris' when exists(select 1 from hajji_ticket_private.registrations child where child.referrer_id=registrations.id) then 'referrals' else null end as delete_block_reason from hajji_ticket_private.registrations where (state='' or (state='suspended' and access_suspended) or (state=status and (state<>'approved' or not access_suspended))) and (search='' or position(lower(search) in lower(name||' '||phone||' '||id||' '||coalesce(email,'')))>0) order by created desc,id limit 25 offset offs)t));
 elsif op='settings' then
  if data->'enabled' not in ('true'::jsonb,'false'::jsonb) or data->'enabled' is null then raise exception 'Status pendaftaran tidak valid.'; end if;
  if data->'enabled'='true'::jsonb and (data->'confirmed' is distinct from 'true'::jsonb or length(trim(coalesce(data->>'bank',''))) not between 2 and 50 or coalesce(data->>'account','') !~ '^[0-9]{6,24}$' or length(trim(coalesce(data->>'holder',''))) not between 2 and 100) then raise exception 'Konfirmasi rekening yang benar sebelum membuka pendaftaran.'; end if;
  select * into cfg from hajji_ticket_private.settings where id for update;
  extras=coalesce(data->'extra_banks',cfg.extra_banks);
  if jsonb_typeof(extras)<>'array' or jsonb_array_length(extras)>3 then raise exception 'Maksimal tiga rekening tambahan.';end if;
  for item in select value from jsonb_array_elements(extras) loop
   if jsonb_typeof(item)<>'object' or coalesce(item->>'id','') not in ('extra-1','extra-2','extra-3') or length(trim(coalesce(item->>'bank',''))) not between 2 and 50 or coalesce(item->>'account','') !~ '^[0-9]{6,24}$' or length(trim(coalesce(item->>'holder',''))) not between 2 and 100 then raise exception 'Lengkapi data setiap rekening tambahan.';end if;
  end loop;
  if (select count(distinct value->>'id') from jsonb_array_elements(extras))<>jsonb_array_length(extras) then raise exception 'ID rekening ganda.';end if;
  if (select count(distinct value->>'account') from jsonb_array_elements(extras))<>jsonb_array_length(extras) or exists(select 1 from jsonb_array_elements(extras) where value->>'account'=trim(coalesce(data->>'account',''))) then raise exception 'Nomor rekening ganda.';end if;
  if extras is distinct from cfg.extra_banks and data->'confirmed' is distinct from 'true'::jsonb then raise exception 'Konfirmasikan rekening tambahan sebelum menyimpan.';end if;
  update hajji_ticket_private.settings set extra_banks=extras,enabled=(data->>'enabled')::boolean,bank=left(trim(coalesce(data->>'bank','')),50),account=left(trim(coalesce(data->>'account','')),24),holder=left(trim(coalesce(data->>'holder','')),100) where id;
 elsif op='approve' then
  if data->'confirmed' is distinct from 'true'::jsonb or coalesce(data->>'amount','') !~ '^[0-9]{1,6}$' or length(trim(coalesce(data->>'bank_reference',''))) not between 4 and 120 then raise exception 'Cocokkan mutasi dan nominal tagihan terlebih dahulu.'; end if;
  update hajji_ticket_private.registrations set status='approved',approved=now(),approved_by=uid,bank_reference=lower(trim(data->>'bank_reference')) where id=rid and (status='reported' or (status='pending' and payment_method='transfer')) and amount=(data->>'amount')::integer and payment_method is distinct from 'qris' returning * into r;
  if r.id is null then raise exception 'Pendaftaran transfer tidak ditemukan, nominal tidak sesuai, atau sudah disetujui.'; end if;
 elsif op='edit' then
  select * into r from hajji_ticket_private.registrations where id=rid for update;
  if r.id is null then raise exception 'Pendaftar tidak ditemukan.';end if;
  if (data->>'updated_at')::timestamptz is distinct from r.updated_at then raise exception 'Data berubah. Muat ulang sebelum mengedit.';end if;
  if length(trim(coalesce(data->>'name',''))) not between 2 and 60 or coalesce(data->>'phone','') !~ '^(\+?62|0)8[0-9]{7,12}$' or length(trim(coalesce(data->>'email','')))>150 or (coalesce(data->>'email','')<>'' and trim(data->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') or data->'access_suspended' is null or data->'access_suspended' not in ('true'::jsonb,'false'::jsonb) then raise exception 'Periksa nama, email, WhatsApp dan status member.';end if;
  if (data->>'access_suspended')::boolean is distinct from r.access_suspended and r.status<>'approved' then raise exception 'Verifikasi pembayaran sebelum mengubah status akses.';end if;
  update hajji_ticket_private.registrations set name=trim(data->>'name'),email=nullif(lower(trim(coalesce(data->>'email',''))),''),phone=data->>'phone',access_suspended=(data->>'access_suspended')::boolean where id=rid;
  if (data->>'access_suspended')::boolean and not r.access_suspended then
   update hajji_ticket_private.links set revoked=true where registration_id=rid and not revoked;
   update hajji_ticket_private.registrations set secret_hash=hajji_ticket_private.hash(hajji_ticket_private.random_token()) where id=rid;
  end if;
 elsif op='delete' then
  if data->'confirmed' is distinct from 'true'::jsonb then raise exception 'Konfirmasi penghapusan permanen diperlukan.';end if;
  select * into r from hajji_ticket_private.registrations where id=rid for update;
  if r.id is null then raise exception 'Pendaftar tidak ditemukan.';end if;
  if (data->>'updated_at')::timestamptz is distinct from r.updated_at then raise exception 'Data berubah. Muat ulang sebelum menghapus.';end if;
  if r.status='approved' or r.approved is not null or r.bank_reference is not null then raise exception 'Tiket sudah memiliki catatan pembayaran terverifikasi. Nonaktifkan akses, jangan hapus transaksi.';end if;
  if exists(select 1 from hajji_ticket_private.qris_orders where registration_id=rid and not is_test) then raise exception 'Tiket memiliki transaksi QRIS real. Rekonsiliasi transaksi sebelum menghapus.';end if;
  if exists(select 1 from hajji_ticket_private.registrations where referrer_id=rid) then raise exception 'Kode referral telah digunakan. Pertahankan riwayat afiliasi.';end if;
  if r.status='reported' and data->'verified_no_payment' is distinct from 'true'::jsonb then raise exception 'Pastikan laporan transfer tidak memiliki dana masuk sebelum menghapus.';end if;
  delete from hajji_ticket_private.sessions s using hajji_ticket_private.links l where s.link_hash=l.token_hash and l.registration_id=rid;
  delete from hajji_ticket_private.links where registration_id=rid;
  delete from hajji_ticket_private.qris_orders where registration_id=rid;
  delete from hajji_ticket_private.registrations where id=rid;
  result=jsonb_build_object('deleted',true);
 elsif op='reset-link' then
  select * into r from hajji_ticket_private.registrations where id=rid for update;
  if r.id is null or r.status<>'approved' or r.access_suspended then raise exception 'Aktifkan tiket yang sudah lunas dahulu.';end if;
  update hajji_ticket_private.links set revoked=true where registration_id=rid and not revoked;
  update hajji_ticket_private.registrations set secret_hash=hajji_ticket_private.hash(hajji_ticket_private.random_token()) where id=rid;
  result=jsonb_build_object('href',hajji_ticket_private.issue_link(rid));
 elsif op='issue' then
  result=jsonb_build_object('href',hajji_ticket_private.issue_link(rid));
 elsif op='revoke' then
  update hajji_ticket_private.links set revoked=true where registration_id=rid and not revoked; get diagnostics n=row_count;result=jsonb_build_object('revoked',n);
 else raise exception 'Perintah tidak tersedia.'; end if;
 insert into hajji_ticket_private.audit(actor,action,registration_id) values(uid,op,rid);
 return coalesce(result,jsonb_build_object('ok',true));
end $$;

notify pgrst,'reload schema';