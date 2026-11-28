alter table hajji_ticket_private.autojualan_content add column if not exists destination text;
update hajji_ticket_private.autojualan_content set destination='threads' where destination is null and platform='threads';
alter table hajji_ticket_private.autojualan_content add constraint autojualan_content_destination_check check(destination is null or (destination='threads' and platform='threads') or (destination in ('wa_group','wa_status') and platform='whatsapp'));
create index if not exists autojualan_content_destination_idx on hajji_ticket_private.autojualan_content(destination,created_at desc) where not archived;
create or replace function hajji_ticket_private.autojualan_admin(op text,data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); cid uuid; cfg hajji_ticket_private.autojualan_settings; c hajji_ticket_private.autojualan_content; m record; target record; dayno integer; slot integer; daily integer; dates date; dur integer; td integer; wd integer; p text; nm text; selected uuid[]; member_ids text[]; n integer:=0; skip_n integer:=0; slots integer; chosen uuid[]; rendered text; code text; link text; stamp timestamptz; offs int; r jsonb; destination_kind text; times jsonb;
begin
 if u is null or not exists(select 1 from auth.users where id=u and raw_app_meta_data->>'manasik_superadmin'='true') then raise exception 'Akses superadmin diperlukan.' using errcode='42501';end if;
 select * into cfg from hajji_ticket_private.autojualan_settings where id;
 if op='save-settings' then
  update hajji_ticket_private.autojualan_settings set planner_enabled=(data->>'planner_enabled')::boolean,duration=(data->>'duration')::integer,threads_daily=(data->>'threads_daily')::integer,whatsapp_daily=(data->>'whatsapp_daily')::integer where id;
  if data ? 'threads_times' then update hajji_ticket_private.autojualan_settings set threads_times=hajji_ticket_private.autojualan_times(data->'threads_times',5),group_times=hajji_ticket_private.autojualan_times(data->'group_times',2),status_times=hajji_ticket_private.autojualan_times(data->'status_times',4) where id;end if;
 elsif op='save-content' then
  nm=trim(coalesce(data->>'title',''));destination_kind=coalesce(data->>'destination',case when data->>'platform'='threads' then 'threads' end);
  if destination_kind is null or destination_kind not in ('threads','wa_group','wa_status') then raise exception 'Pilih tab tujuan konten: Threads, Grup WA atau Status WA.';end if;
  p=case when destination_kind='threads' then 'threads' else 'whatsapp' end;
  if length(nm) not between 2 and 120 or p not in ('both','threads','whatsapp') or data->>'category' not in ('TOFU','MOFU','BOFU') or length(trim(coalesce(data->>'body',''))) not between 1 and 4000 then raise exception 'Lengkapi judul, platform, kategori dan isi konten.';end if;
  if coalesce(data->>'media_url','')<>'' and (length(data->>'media_url')>2000 or data->>'media_url' !~ '^https://[^[:space:]]+$' or coalesce(data->>'media_type','') not in ('image','video')) then raise exception 'Media harus berupa URL HTTPS publik dan jenis gambar/video.';end if;
  if coalesce(data->>'id','')='' then
   insert into hajji_ticket_private.autojualan_content(title,category,platform,destination,body,media_url,media_type) values(nm,data->>'category',p,destination_kind,trim(data->>'body'),nullif(data->>'media_url',''),case when coalesce(data->>'media_url','')<>'' then data->>'media_type' end);
  else
   update hajji_ticket_private.autojualan_content set title=nm,category=data->>'category',platform=p,destination=destination_kind,body=trim(data->>'body'),media_url=nullif(data->>'media_url',''),media_type=case when coalesce(data->>'media_url','')<>'' then data->>'media_type' end,updated_at=now() where id=(data->>'id')::uuid and not archived and (destination is null or destination=destination_kind);
   if not found then raise exception 'Konten tidak ditemukan.';end if;
  end if;
 elsif op='archive-content' then
  update hajji_ticket_private.autojualan_content set archived=true,updated_at=now() where id=(data->>'id')::uuid;
 elsif op in ('approve-campaign','pause-campaign','resume-campaign','queue') then
  cid=(data->>'id')::uuid;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(cid::text,48174));
  if not exists(select 1 from hajji_ticket_private.autojualan_campaigns where id=cid and status='draft') then raise exception 'Campaign tidak ditemukan atau diarsipkan.';end if;
  if op='approve-campaign' then
   if data->>'confirm' is distinct from 'true' or not cfg.planner_enabled then raise exception 'Konfirmasi campaign diperlukan atau planner dijeda.';end if;
   if exists(select 1 from hajji_ticket_private.autojualan_plan where campaign_id=cid and (account_snapshot is null or consent_snapshot is null)) then raise exception 'Draft lama perlu dibuat ulang.';end if;
   if not exists(select 1 from hajji_ticket_private.autojualan_plan where campaign_id=cid and delivery_state='draft' and schedule_at>=now()+interval '15 minutes' and schedule_at<=now()+interval '31 days') then raise exception 'Tidak ada jadwal dalam rentang pengiriman.';end if;
   update hajji_ticket_private.autojualan_campaigns set dispatch_state='approved',approved_at=now(),approved_by=u where id=cid and dispatch_state='unapproved';
   if not found then raise exception 'Campaign sudah pernah disetujui. Gunakan lanjutkan.';end if;
  elsif op='pause-campaign' then
   update hajji_ticket_private.autojualan_campaigns set dispatch_state='paused' where id=cid and dispatch_state<>'unapproved';
  elsif op='resume-campaign' then
   if not cfg.planner_enabled then raise exception 'Planner dijeda.';end if;
   if exists(select 1 from hajji_ticket_private.autojualan_plan where campaign_id=cid and delivery_state in ('sending','uncertain','cancelling')) then raise exception 'Ada pengiriman atau pembatalan belum pasti. Periksa Repliz terlebih dahulu.';end if;
   update hajji_ticket_private.autojualan_campaigns set dispatch_state='approved' where id=cid and dispatch_state='paused' and approved_at is not null;
   if not found then raise exception 'Campaign tidak dapat dilanjutkan.';end if;
  elsif op='queue' then
   return jsonb_build_object('state',(select dispatch_state from hajji_ticket_private.autojualan_campaigns where id=cid),
    'total',(select count(*) from hajji_ticket_private.autojualan_plan where campaign_id=cid),
    'draft',(select count(*) from hajji_ticket_private.autojualan_plan where campaign_id=cid and delivery_state='draft'),
    'scheduled',(select count(*) from hajji_ticket_private.autojualan_plan where campaign_id=cid and delivery_state in ('scheduled','publishing','published')),
    'failed',(select count(*) from hajji_ticket_private.autojualan_plan where campaign_id=cid and delivery_state='failed'),
    'uncertain',(select count(*) from hajji_ticket_private.autojualan_plan where campaign_id=cid and delivery_state in ('sending','uncertain','cancelling')),
    'cancelled',(select count(*) from hajji_ticket_private.autojualan_plan where campaign_id=cid and delivery_state='cancelled'),
    'ids',(select coalesce(jsonb_agg(t.id order by t.schedule_at,t.id),'[]'::jsonb) from (select id,schedule_at from hajji_ticket_private.autojualan_plan where campaign_id=cid and (case when data->>'mode'='cancel' then delivery_state='scheduled' and schedule_at>now()+interval '5 minutes' else delivery_state='draft' and account_snapshot is not null and schedule_at>=now()+interval '15 minutes' and schedule_at<=now()+interval '31 days' end) order by schedule_at,id limit 25)t));
  end if;
 elsif op='archive-campaign' then
  if exists(select 1 from hajji_ticket_private.autojualan_plan where campaign_id=(data->>'id')::uuid and delivery_state in ('sending','uncertain','scheduled','publishing','cancelling')) then raise exception 'Selesaikan atau batalkan jadwal Repliz terlebih dahulu.';end if;
  update hajji_ticket_private.autojualan_campaigns set status='archived' where id=(data->>'id')::uuid and status='draft';
 elsif op='create-campaign' then
  if not cfg.planner_enabled then raise exception 'Pembuatan draft sedang dijeda.';end if;
  nm=trim(coalesce(data->>'name',''));p=data->>'platform';dates=(data->>'start_date')::date;dur=(data->>'duration')::int;td=(data->>'threads_daily')::int;wd=(data->>'whatsapp_daily')::int;
  destination_kind=data->>'destination';
  if destination_kind is null or destination_kind not in ('threads','wa_group','wa_status') then raise exception 'Tujuan campaign tidak valid.';end if;
  if destination_kind<>'legacy' then
   p=case when destination_kind='threads' then 'threads' else 'whatsapp' end;
   times=hajji_ticket_private.autojualan_times(data->'daily_times',case when destination_kind='threads' then 5 when destination_kind='wa_group' then 2 else 4 end);
   td=case when destination_kind='threads' then jsonb_array_length(times) else 1 end;wd=case when destination_kind='wa_group' then jsonb_array_length(times) else 1 end;
  end if;
  if length(nm) not between 2 and 120 or p not in ('both','threads','whatsapp') or dates<=(now() at time zone 'Asia/Jakarta')::date or dates>(now() at time zone 'Asia/Jakarta')::date+90 or dur not between 1 and 30 or td not between 1 and 5 or wd not between 1 and 2 then raise exception 'Atur jadwal mulai besok, maksimal 30 hari dan frekuensi valid.';end if;
  if jsonb_typeof(data->'content_ids') is distinct from 'array' or jsonb_array_length(data->'content_ids') not between 1 and 300 then raise exception 'Pilih 1–300 materi.';end if;
  select array_agg(distinct v::uuid) into selected from jsonb_array_elements_text(data->'content_ids') v;
  if exists(select 1 from unnest(selected) x where not exists(select 1 from hajji_ticket_private.autojualan_content b where b.id=x and not b.archived and b.destination=destination_kind)) then raise exception 'Materi tidak ditemukan, diarsipkan, atau berasal dari tab tujuan lain.';end if;
  if data ? 'member_ids' then
   if jsonb_typeof(data->'member_ids') is distinct from 'array' or jsonb_array_length(data->'member_ids') not between 1 and 200 then raise exception 'Pilih 1–200 member.';end if;
   select array_agg(distinct v) into member_ids from jsonb_array_elements_text(data->'member_ids') v;
  end if;
  insert into hajji_ticket_private.autojualan_campaigns(name,platform,start_date,duration,threads_daily,whatsapp_daily,actor,destination,daily_times) values(nm,p,dates,dur,td,wd,u,destination_kind,times) returning id into cid;
  for m in select x.registration_id,x.platform,x.targets,x.account_id,x.consent_at,r.name,a.code as affiliate_code,a.coupon_code,a.parent_coupon_code from hajji_ticket_private.threads_connections x join hajji_ticket_private.registrations r on r.id=x.registration_id join hajji_ticket_private.affiliate_members a on a.registration_id=r.id join hajji_ticket_private.promo_coupons pc on pc.code=a.parent_coupon_code and pc.enabled where x.status='connected' and x.account_id is not null and r.status='approved' and not r.access_suspended and a.active and a.approved_at is not null and (p='both' or x.platform=p) and (member_ids is null or r.id=any(member_ids)) and exists(select 1 from hajji_ticket_private.referral_settings where id and enabled) order by r.id loop
   daily=case when destination_kind<>'legacy' then jsonb_array_length(times) when m.platform='threads' then td else wd end;
   if destination_kind='wa_group' and not exists(select 1 from jsonb_array_elements(m.targets) v where v->>'type'='group' and v->>'id' like '%@g.us') then skip_n=skip_n+1;continue;end if;
   if destination_kind='wa_status' and not exists(select 1 from jsonb_array_elements(m.targets) v where v->>'id'='status' and v->>'type'='status') then skip_n=skip_n+1;continue;end if;
   select array_agg(b.id order by b.created_at,b.id) into chosen from hajji_ticket_private.autojualan_content b where b.id=any(selected) and not b.archived and b.platform=m.platform and b.destination=destination_kind;
   if coalesce(array_length(chosen,1),0)=0 then skip_n=skip_n+1;continue;end if;
   if array_length(chosen,1)<dur*daily then raise exception 'Materi % belum cukup: perlu % materi unik agar tidak mengulang konten dalam campaign.',m.platform,dur*daily;end if;
   if m.platform='whatsapp' and jsonb_array_length(m.targets)=0 then skip_n=skip_n+1;continue;end if;
   code=coalesce(m.coupon_code,m.affiliate_code,m.registration_id);
   link=case when m.affiliate_code is null or m.affiliate_code like 'HJ-%' then 'https://hajji.digital/index.html?ref='||m.registration_id else 'https://hajji.digital/'||lower(m.affiliate_code) end;
   for target in select v->>'id' as id,v->>'name' as name from jsonb_array_elements(case when m.platform='threads' then '[{"id":"feed","name":"Threads Feed"}]'::jsonb else m.targets end) v where (m.platform='threads' and v->>'id'='feed') or (m.platform='whatsapp' and ((destination_kind in ('legacy','wa_status') and v->>'id'='status' and v->>'type'='status') or (destination_kind in ('legacy','wa_group') and v->>'type'='group' and v->>'id' like '%@g.us') or (destination_kind='legacy' and v->>'type'='channel' and v->>'id' like '%@newsletter'))) loop
    for dayno in 0..dur-1 loop
     for slot in 1..daily loop
      select * into c from hajji_ticket_private.autojualan_content where id=chosen[dayno*daily+slot];
      rendered=replace(replace(replace(c.body,'{{NAMA_MEMBER}}',m.name),'{{KODE_KUPON}}',code),'{{LINK_AFFILIATE}}',link);
      if m.platform='threads' and length(rendered)>500 then raise exception 'Konten Threads "%" melebihi 500 karakter setelah personalisasi.',c.title;end if;
      stamp=((dates+dayno)+case when destination_kind<>'legacy' then (times->>(slot-1))::time when m.platform='threads' then (array['06:00'::time,'10:00'::time,'12:00'::time,'15:00'::time,'20:00'::time])[slot] else (array['08:00'::time,'19:00'::time])[slot] end) at time zone 'Asia/Jakarta';
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
  return jsonb_build_object('total',(select count(*) from hajji_ticket_private.autojualan_plan where campaign_id=(data->>'id')::uuid),'rows',(select coalesce(jsonb_agg(to_jsonb(t) order by t.schedule_at,t.id),'[]'::jsonb) from (select id,member_name,platform,target_id,target_name,content_title,body,media_url,media_type,schedule_at,delivery_state,delivery_note,repliz_id,(account_snapshot is not null) as can_submit from hajji_ticket_private.autojualan_plan where campaign_id=(data->>'id')::uuid order by schedule_at,id limit 30 offset offs)t));
 elsif op<>'get' then raise exception 'Operasi tidak tersedia.';end if;
 return jsonb_build_object(
 'settings',(select to_jsonb(s)-'id' from hajji_ticket_private.autojualan_settings s where id),
 'members',(select coalesce(jsonb_agg(to_jsonb(t) order by t.name),'[]'::jsonb) from (select r.id,r.name,x.platform,coalesce(x.status,'none') status,x.username,x.consent_at,x.updated_at,coalesce(x.targets,'[]'::jsonb) targets,coalesce(a.coupon_code,a.code,r.id) coupon_code,a.parent_coupon_code,coalesce(a.active and a.approved_at is not null and pc.enabled and exists(select 1 from hajji_ticket_private.referral_settings where id and enabled),false) coupon_active,coalesce(x.status='connected' and x.account_id is not null,false) connected,(select count(*) from hajji_ticket_private.registrations b where b.referrer_id=r.id and b.status='approved') sales from hajji_ticket_private.registrations r left join hajji_ticket_private.threads_connections x on x.registration_id=r.id left join hajji_ticket_private.affiliate_members a on a.registration_id=r.id left join hajji_ticket_private.promo_coupons pc on pc.code=a.parent_coupon_code where r.status='approved' and not r.access_suspended)t),
 'contents',(select coalesce(jsonb_agg(to_jsonb(b) order by b.created_at desc),'[]'::jsonb) from hajji_ticket_private.autojualan_content b where not archived),
 'campaigns',(select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc),'[]'::jsonb) from (select a.id,a.name,a.platform,a.destination,a.daily_times,a.start_date,a.duration,a.status,a.dispatch_state,a.approved_at,a.created_at,(select count(*) from hajji_ticket_private.autojualan_plan b where b.campaign_id=a.id) drafts from hajji_ticket_private.autojualan_campaigns a order by a.created_at desc limit 100)t));
end $$;


notify pgrst,'reload schema';