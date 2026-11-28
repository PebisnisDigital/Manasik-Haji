
alter table hajji_ticket_private.autojualan_plan
 add column if not exists account_snapshot text, add column if not exists consent_snapshot timestamptz, add column if not exists coupon_snapshot text, add column if not exists parent_snapshot text, add column if not exists link_snapshot text,
 add column if not exists delivery_state text not null default 'draft' check(delivery_state in ('draft','sending','uncertain','scheduled','publishing','published','failed','cancelling','cancelled')),
 add column if not exists delivery_note text, add column if not exists repliz_id text unique, add column if not exists bridge_nonce text, add column if not exists delivery_updated_at timestamptz;
create unique index if not exists autojualan_slot_guard on hajji_ticket_private.autojualan_plan(account_snapshot,target_id,schedule_at) where delivery_state in ('sending','uncertain','scheduled','publishing','published','cancelling');
create or replace function hajji_ticket_private.autojualan_admin(op text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); cid uuid; cfg hajji_ticket_private.autojualan_settings; c hajji_ticket_private.autojualan_content; m record; target record; dayno integer; slot integer; daily integer; dates date; dur integer; td integer; wd integer; p text; nm text; selected uuid[]; member_ids text[]; n integer:=0; skip_n integer:=0; slots integer; chosen uuid[]; rendered text; code text; link text; stamp timestamptz; offs int; r jsonb;
begin
 if u is null or not exists(select 1 from auth.users where id=u and raw_app_meta_data->>'manasik_superadmin'='true') then raise exception 'Akses superadmin diperlukan.' using errcode='42501';end if;
 select * into cfg from hajji_ticket_private.autojualan_settings where id;
 if op='save-settings' then
  update hajji_ticket_private.autojualan_settings set planner_enabled=(data->>'planner_enabled')::boolean,duration=(data->>'duration')::integer,threads_daily=(data->>'threads_daily')::integer,whatsapp_daily=(data->>'whatsapp_daily')::integer where id;
 elsif op='save-content' then
  nm=trim(coalesce(data->>'title',''));p=data->>'platform';
  if length(nm) not between 2 and 120 or p not in ('both','threads','whatsapp') or data->>'category' not in ('TOFU','MOFU','BOFU') or length(trim(coalesce(data->>'body',''))) not between 1 and 4000 then raise exception 'Lengkapi judul, platform, kategori dan isi konten.';end if;
  if coalesce(data->>'media_url','')<>'' and (length(data->>'media_url')>2000 or data->>'media_url' !~ '^https://[^[:space:]]+$' or coalesce(data->>'media_type','') not in ('image','video')) then raise exception 'Media harus berupa URL HTTPS publik dan jenis gambar/video.';end if;
  if coalesce(data->>'id','')='' then
   insert into hajji_ticket_private.autojualan_content(title,category,platform,body,media_url,media_type) values(nm,data->>'category',p,trim(data->>'body'),nullif(data->>'media_url',''),case when coalesce(data->>'media_url','')<>'' then data->>'media_type' end);
  else
   update hajji_ticket_private.autojualan_content set title=nm,category=data->>'category',platform=p,body=trim(data->>'body'),media_url=nullif(data->>'media_url',''),media_type=case when coalesce(data->>'media_url','')<>'' then data->>'media_type' end,updated_at=now() where id=(data->>'id')::uuid and not archived;
   if not found then raise exception 'Konten tidak ditemukan.';end if;
  end if;
 elsif op='archive-content' then
  update hajji_ticket_private.autojualan_content set archived=true,updated_at=now() where id=(data->>'id')::uuid;
 elsif op='archive-campaign' then
  if exists(select 1 from hajji_ticket_private.autojualan_plan where campaign_id=(data->>'id')::uuid and delivery_state in ('sending','uncertain','scheduled','publishing','cancelling')) then raise exception 'Selesaikan atau batalkan jadwal Repliz terlebih dahulu.';end if;
  update hajji_ticket_private.autojualan_campaigns set status='archived' where id=(data->>'id')::uuid and status='draft';
 elsif op='create-campaign' then
  if not cfg.planner_enabled then raise exception 'Pembuatan draft sedang dijeda.';end if;
  nm=trim(coalesce(data->>'name',''));p=data->>'platform';dates=(data->>'start_date')::date;dur=(data->>'duration')::int;td=(data->>'threads_daily')::int;wd=(data->>'whatsapp_daily')::int;
  if length(nm) not between 2 and 120 or p not in ('both','threads','whatsapp') or dates<=(now() at time zone 'Asia/Jakarta')::date or dates>(now() at time zone 'Asia/Jakarta')::date+90 or dur not between 1 and 30 or td not between 1 and 5 or wd not between 1 and 2 then raise exception 'Atur jadwal mulai besok, maksimal 30 hari dan frekuensi valid.';end if;
  if jsonb_typeof(data->'content_ids') is distinct from 'array' or jsonb_array_length(data->'content_ids') not between 1 and 300 then raise exception 'Pilih 1–300 materi.';end if;
  select array_agg(distinct v::uuid) into selected from jsonb_array_elements_text(data->'content_ids') v;
  if exists(select 1 from unnest(selected) x where not exists(select 1 from hajji_ticket_private.autojualan_content b where b.id=x and not b.archived)) then raise exception 'Materi sudah diarsipkan atau tidak ditemukan.';end if;
  if data ? 'member_ids' then
   if jsonb_typeof(data->'member_ids') is distinct from 'array' or jsonb_array_length(data->'member_ids') not between 1 and 200 then raise exception 'Pilih 1–200 member.';end if;
   select array_agg(distinct v) into member_ids from jsonb_array_elements_text(data->'member_ids') v;
  end if;
  insert into hajji_ticket_private.autojualan_campaigns(name,platform,start_date,duration,threads_daily,whatsapp_daily,actor) values(nm,p,dates,dur,td,wd,u) returning id into cid;
  for m in select x.registration_id,x.platform,x.targets,x.account_id,x.consent_at,r.name,a.code as affiliate_code,a.coupon_code,a.parent_coupon_code from hajji_ticket_private.threads_connections x join hajji_ticket_private.registrations r on r.id=x.registration_id join hajji_ticket_private.affiliate_members a on a.registration_id=r.id join hajji_ticket_private.promo_coupons pc on pc.code=a.parent_coupon_code and pc.enabled where x.status='connected' and x.account_id is not null and r.status='approved' and not r.access_suspended and a.active and a.approved_at is not null and (p='both' or x.platform=p) and (member_ids is null or r.id=any(member_ids)) and exists(select 1 from hajji_ticket_private.referral_settings where id and enabled) order by r.id loop
   daily=case when m.platform='threads' then td else wd end;
   select array_agg(b.id order by b.created_at,b.id) into chosen from hajji_ticket_private.autojualan_content b where b.id=any(selected) and not b.archived and b.platform in ('both',m.platform);
   if coalesce(array_length(chosen,1),0)=0 then skip_n=skip_n+1;continue;end if;
   if array_length(chosen,1)<dur*daily then raise exception 'Materi % belum cukup: perlu % materi unik agar tidak mengulang konten dalam campaign.',m.platform,dur*daily;end if;
   if m.platform='whatsapp' and jsonb_array_length(m.targets)=0 then skip_n=skip_n+1;continue;end if;
   code=coalesce(m.coupon_code,m.affiliate_code,m.registration_id);
   link=case when m.affiliate_code is null or m.affiliate_code like 'HJ-%' then 'https://hajji.digital/index.html?ref='||m.registration_id else 'https://hajji.digital/'||lower(m.affiliate_code) end;
   for target in select v->>'id' as id,v->>'name' as name from jsonb_array_elements(case when m.platform='threads' then '[{"id":"feed","name":"Threads Feed"}]'::jsonb else m.targets end) v where (m.platform='threads' and v->>'id'='feed') or (m.platform='whatsapp' and (v->>'id'='status' or (v->>'type'='group' and v->>'id' like '%@g.us') or (v->>'type'='channel' and v->>'id' like '%@newsletter'))) loop
    for dayno in 0..dur-1 loop
     for slot in 1..daily loop
      select * into c from hajji_ticket_private.autojualan_content where id=chosen[dayno*daily+slot];
      rendered=replace(replace(replace(c.body,'{{NAMA_MEMBER}}',m.name),'{{KODE_KUPON}}',code),'{{LINK_AFFILIATE}}',link);
      if m.platform='threads' and length(rendered)>500 then raise exception 'Konten Threads "%" melebihi 500 karakter setelah personalisasi.',c.title;end if;
      stamp=((dates+dayno)+case when m.platform='threads' then (array['06:00'::time,'10:00'::time,'12:00'::time,'15:00'::time,'20:00'::time])[slot] else (array['08:00'::time,'19:00'::time])[slot] end) at time zone 'Asia/Jakarta';
      n=n+1;if n>3000 then raise exception 'Maksimal 3.000 draft per campaign. Kurangi jumlah member, tujuan, atau durasi.';end if;
      insert into hajji_ticket_private.autojualan_plan(campaign_id,registration_id,member_name,platform,target_id,target_name,content_title,body,media_url,media_type,schedule_at,account_snapshot,consent_snapshot,coupon_snapshot,parent_snapshot,link_snapshot) values(cid,m.registration_id,m.name,m.platform,target.id,left(coalesce(target.name,target.id),150),c.title,rendered,c.media_url,c.media_type,stamp,m.account_id,m.consent_at,code,m.parent_coupon_code,link);
     end loop;
    end loop;
   end loop;
  end loop;
  if n=0 then raise exception 'Tidak ada akun yang memenuhi syarat. Periksa koneksi, kupon induk dan tujuan WA.';end if;
  return jsonb_build_object('created',n,'campaign_id',cid,'skipped',skip_n);
 elsif op='plan' then
  offs=greatest(0,least(3000,coalesce((data->>'offset')::int,0)));
  return jsonb_build_object('total',(select count(*) from hajji_ticket_private.autojualan_plan where campaign_id=(data->>'id')::uuid),'rows',(select coalesce(jsonb_agg(to_jsonb(t) order by t.schedule_at,t.id),'[]'::jsonb) from (select id,member_name,platform,target_name,content_title,body,media_url,media_type,schedule_at,delivery_state,delivery_note,repliz_id,(account_snapshot is not null) as can_submit from hajji_ticket_private.autojualan_plan where campaign_id=(data->>'id')::uuid order by schedule_at,id limit 30 offset offs)t));
 elsif op<>'get' then raise exception 'Operasi tidak tersedia.';end if;
 return jsonb_build_object(
 'settings',(select to_jsonb(s)-'id' from hajji_ticket_private.autojualan_settings s where id),
 'members',(select coalesce(jsonb_agg(to_jsonb(t) order by t.name),'[]'::jsonb) from (select r.id,r.name,x.platform,coalesce(x.status,'none') status,x.username,x.consent_at,x.updated_at,coalesce(x.targets,'[]'::jsonb) targets,coalesce(a.coupon_code,a.code,r.id) coupon_code,a.parent_coupon_code,coalesce(a.active and a.approved_at is not null and pc.enabled and exists(select 1 from hajji_ticket_private.referral_settings where id and enabled),false) coupon_active,coalesce(x.status='connected' and x.account_id is not null,false) connected,(select count(*) from hajji_ticket_private.registrations b where b.referrer_id=r.id and b.status='approved') sales from hajji_ticket_private.registrations r left join hajji_ticket_private.threads_connections x on x.registration_id=r.id left join hajji_ticket_private.affiliate_members a on a.registration_id=r.id left join hajji_ticket_private.promo_coupons pc on pc.code=a.parent_coupon_code where r.status='approved' and not r.access_suspended)t),
 'contents',(select coalesce(jsonb_agg(to_jsonb(b) order by b.created_at desc),'[]'::jsonb) from hajji_ticket_private.autojualan_content b where not archived),
 'campaigns',(select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc),'[]'::jsonb) from (select a.id,a.name,a.platform,a.start_date,a.duration,a.status,a.created_at,(select count(*) from hajji_ticket_private.autojualan_plan b where b.campaign_id=a.id) drafts from hajji_ticket_private.autojualan_campaigns a order by a.created_at desc limit 100)t));
end $$;

create or replace function public.hajji_autojualan_bridge(k text,op text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); p hajji_ticket_private.autojualan_plan; c hajji_ticket_private.threads_connections; n text:=data->>'nonce'; x text:=data->>'state'; sid text:=data->>'schedule_id'; current_code text; current_parent text; current_link text; dest jsonb;
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and raw_app_meta_data->>'manasik_superadmin'='true') or k is null or length(k)<>64 or not exists(select 1 from hajji_ticket_private.settings where id and gateway_hash<>'' and gateway_hash=hajji_ticket_private.hash(k)) then raise exception 'Akses superadmin diperlukan.' using errcode='42501';end if;
 select * into p from hajji_ticket_private.autojualan_plan where id=(data->>'id')::uuid;
 if not found then raise exception 'Draft tidak ditemukan.';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p.registration_id,48172));
 select * into p from hajji_ticket_private.autojualan_plan where id=p.id for update;
 if op='claim' then
  if data->>'confirm' is distinct from 'true' or n is null or n!~'^[a-f0-9]{64}$' or p.delivery_state<>'draft' then raise exception 'Draft sudah diproses atau belum disetujui.';end if;
  if p.account_snapshot is null or p.consent_snapshot is null or p.schedule_at<now()+interval '15 minutes' or p.schedule_at>now()+interval '48 hours' then raise exception 'Pilot hanya menerima draft baru untuk 15 menit hingga 48 jam ke depan.';end if;
  if not exists(select 1 from hajji_ticket_private.autojualan_campaigns where id=p.campaign_id and status='draft') or not exists(select 1 from hajji_ticket_private.autojualan_settings where id and planner_enabled) then raise exception 'Campaign dijeda atau diarsipkan.';end if;
  select * into c from hajji_ticket_private.threads_connections where registration_id=p.registration_id;
  if c.status is distinct from 'connected' or c.platform is distinct from p.platform or c.account_id is distinct from p.account_snapshot or c.consent_at is distinct from p.consent_snapshot or c.account_id!~'^[a-f0-9]{24}$' then raise exception 'Koneksi atau persetujuan berubah. Buat draft baru.';end if;
  select coalesce(a.coupon_code,a.code,r.id),a.parent_coupon_code,case when a.code is null or a.code like 'HJ-%' then 'https://hajji.digital/index.html?ref='||r.id else 'https://hajji.digital/'||lower(a.code) end into current_code,current_parent,current_link from hajji_ticket_private.registrations r join hajji_ticket_private.affiliate_members a on a.registration_id=r.id join hajji_ticket_private.promo_coupons pc on pc.code=a.parent_coupon_code and pc.enabled where r.id=p.registration_id and r.status='approved' and not r.access_suspended and a.active and a.approved_at is not null and exists(select 1 from hajji_ticket_private.referral_settings where id and enabled);
  if not found or current_code is distinct from p.coupon_snapshot or current_parent is distinct from p.parent_snapshot or current_link is distinct from p.link_snapshot then raise exception 'Kupon atau akses affiliate berubah. Buat draft baru.';end if;
  if p.platform='whatsapp' then
   select v into dest from jsonb_array_elements(c.targets) v where v->>'id'=p.target_id and ((v->>'id'='status' and v->>'type'='status') or (v->>'type'='group' and v->>'id' like '%@g.us') or (v->>'type'='channel' and v->>'id' like '%@newsletter'));
   if dest is null then raise exception 'Tujuan WA tidak lagi disetujui.';end if;
  elsif p.target_id<>'feed' then raise exception 'Tujuan Threads tidak valid.';end if;
  if exists(select 1 from hajji_ticket_private.autojualan_plan q where q.account_snapshot=p.account_snapshot and q.target_id=p.target_id and q.delivery_state in ('sending','uncertain','scheduled','publishing','published','cancelling') and q.body=p.body and (q.schedule_at at time zone 'Asia/Jakarta')::date=(p.schedule_at at time zone 'Asia/Jakarta')::date) then raise exception 'Materi yang sama sudah diproses untuk tujuan dan hari ini.';end if;
  if (select count(*) from hajji_ticket_private.autojualan_plan q where q.account_snapshot=p.account_snapshot and q.target_id=p.target_id and q.delivery_state in ('sending','uncertain','scheduled','publishing','published','cancelling') and (q.schedule_at at time zone 'Asia/Jakarta')::date=(p.schedule_at at time zone 'Asia/Jakarta')::date)>=case when p.platform='whatsapp' then 2 else 5 end then raise exception 'Batas publikasi harian tercapai.';end if;
  update hajji_ticket_private.autojualan_plan set delivery_state='sending',bridge_nonce=n,delivery_updated_at=now(),delivery_note=null where id=p.id;
  return jsonb_build_object('account_id',c.account_id,'platform',p.platform,'target',dest,'target_id',p.target_id,'body',p.body,'media_url',p.media_url,'media_type',p.media_type,'schedule_at',p.schedule_at);
 elsif op='finish' then
  if p.delivery_state<>'sending' or n is null or p.bridge_nonce is distinct from n or x not in ('scheduled','uncertain','failed') or (x='scheduled' and (sid is null or sid!~'^[a-f0-9]{24}$')) then raise exception 'Status pengiriman tidak valid.';end if;
  update hajji_ticket_private.autojualan_plan set delivery_state=x,repliz_id=case when x='scheduled' then sid else null end,delivery_note=left(data->>'note',300),bridge_nonce=null,delivery_updated_at=now() where id=p.id;
 elsif op='lookup' then
  if p.repliz_id is null then raise exception 'Belum memiliki ID jadwal Repliz.';end if;
  return jsonb_build_object('schedule_id',p.repliz_id,'account_id',p.account_snapshot,'state',p.delivery_state,'schedule_at',p.schedule_at);
 elsif op='sync' then
  if p.repliz_id is null or p.repliz_id is distinct from sid or p.delivery_state in ('cancelled','cancelling','published') or x not in ('scheduled','publishing','published','failed') then raise exception 'Status sinkronisasi tidak valid.';end if;
  update hajji_ticket_private.autojualan_plan set delivery_state=x,delivery_note=left(data->>'note',300),delivery_updated_at=now() where id=p.id;
 elsif op='cancel-claim' then
  if data->>'confirm' is distinct from 'true' or p.delivery_state<>'scheduled' or p.repliz_id is null or p.schedule_at<now()+interval '5 minutes' or n is null or n!~'^[a-f0-9]{64}$' then raise exception 'Jadwal tidak dapat dibatalkan melalui pilot ini.';end if;
  update hajji_ticket_private.autojualan_plan set delivery_state='cancelling',bridge_nonce=n,delivery_updated_at=now() where id=p.id;
  return jsonb_build_object('schedule_id',p.repliz_id,'account_id',p.account_snapshot,'schedule_at',p.schedule_at);
 elsif op='cancel-finish' then
  if p.delivery_state<>'cancelling' or n is null or p.bridge_nonce is distinct from n or x not in ('cancelled','scheduled','uncertain') then raise exception 'Status pembatalan tidak valid.';end if;
  update hajji_ticket_private.autojualan_plan set delivery_state=x,delivery_note=left(data->>'note',300),bridge_nonce=null,delivery_updated_at=now() where id=p.id;
 else raise exception 'Operasi tidak tersedia.';end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.hajji_autojualan_bridge(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.hajji_autojualan_bridge(text,text,jsonb) to authenticated;
notify pgrst,'reload schema';
