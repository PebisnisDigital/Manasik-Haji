
create table if not exists hajji_ticket_private.autojualan_settings(
 id boolean primary key default true check(id), planner_enabled boolean not null default true,
 duration integer not null default 30 check(duration between 1 and 30), threads_daily integer not null default 5 check(threads_daily between 1 and 5), whatsapp_daily integer not null default 2 check(whatsapp_daily between 1 and 2));
insert into hajji_ticket_private.autojualan_settings(id) values(true) on conflict do nothing;
create table if not exists hajji_ticket_private.autojualan_content(
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 2 and 120), category text not null check(category in ('TOFU','MOFU','BOFU')), platform text not null check(platform in ('both','threads','whatsapp')), body text not null check(length(body) between 1 and 4000), media_url text, media_type text check(media_type in ('image','video')), archived boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists hajji_ticket_private.autojualan_campaigns(
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 120), platform text not null check(platform in ('both','threads','whatsapp')), start_date date not null, duration integer not null check(duration between 1 and 30), threads_daily integer not null check(threads_daily between 1 and 5), whatsapp_daily integer not null check(whatsapp_daily between 1 and 2), status text not null default 'draft' check(status in ('draft','archived')), created_at timestamptz not null default now(), actor uuid not null);
create table if not exists hajji_ticket_private.autojualan_plan(
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references hajji_ticket_private.autojualan_campaigns(id) on delete cascade, registration_id text not null, member_name text not null, platform text not null check(platform in ('threads','whatsapp')), target_id text not null, target_name text not null, content_title text not null, body text not null, media_url text, media_type text, schedule_at timestamptz not null, unique(campaign_id,registration_id,target_id,schedule_at));
alter table hajji_ticket_private.autojualan_settings enable row level security;
alter table hajji_ticket_private.autojualan_content enable row level security;
alter table hajji_ticket_private.autojualan_campaigns enable row level security;
alter table hajji_ticket_private.autojualan_plan enable row level security;
revoke all on hajji_ticket_private.autojualan_settings,hajji_ticket_private.autojualan_content,hajji_ticket_private.autojualan_campaigns,hajji_ticket_private.autojualan_plan from public,anon,authenticated;
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
  for m in select x.registration_id,x.platform,x.targets,r.name,a.code as affiliate_code,a.coupon_code,a.parent_coupon_code from hajji_ticket_private.threads_connections x join hajji_ticket_private.registrations r on r.id=x.registration_id join hajji_ticket_private.affiliate_members a on a.registration_id=r.id join hajji_ticket_private.promo_coupons pc on pc.code=a.parent_coupon_code and pc.enabled where x.status='connected' and x.account_id is not null and r.status='approved' and not r.access_suspended and a.active and a.approved_at is not null and (p='both' or x.platform=p) and (member_ids is null or r.id=any(member_ids)) and exists(select 1 from hajji_ticket_private.referral_settings where id and enabled) order by r.id loop
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
      insert into hajji_ticket_private.autojualan_plan(campaign_id,registration_id,member_name,platform,target_id,target_name,content_title,body,media_url,media_type,schedule_at) values(cid,m.registration_id,m.name,m.platform,target.id,left(coalesce(target.name,target.id),150),c.title,rendered,c.media_url,c.media_type,stamp);
     end loop;
    end loop;
   end loop;
  end loop;
  if n=0 then raise exception 'Tidak ada akun yang memenuhi syarat. Periksa koneksi, kupon induk dan tujuan WA.';end if;
  return jsonb_build_object('created',n,'campaign_id',cid,'skipped',skip_n);
 elsif op='plan' then
  offs=greatest(0,least(3000,coalesce((data->>'offset')::int,0)));
  return jsonb_build_object('total',(select count(*) from hajji_ticket_private.autojualan_plan where campaign_id=(data->>'id')::uuid),'rows',(select coalesce(jsonb_agg(to_jsonb(t) order by t.schedule_at,t.id),'[]'::jsonb) from (select id,member_name,platform,target_name,content_title,body,media_url,media_type,schedule_at from hajji_ticket_private.autojualan_plan where campaign_id=(data->>'id')::uuid order by schedule_at,id limit 30 offset offs)t));
 elsif op<>'get' then raise exception 'Operasi tidak tersedia.';end if;
 return jsonb_build_object(
 'settings',(select to_jsonb(s)-'id' from hajji_ticket_private.autojualan_settings s where id),
 'members',(select coalesce(jsonb_agg(to_jsonb(t) order by t.name),'[]'::jsonb) from (select r.id,r.name,x.platform,coalesce(x.status,'none') status,x.username,x.consent_at,x.updated_at,coalesce(x.targets,'[]'::jsonb) targets,coalesce(a.coupon_code,a.code,r.id) coupon_code,a.parent_coupon_code,coalesce(a.active and a.approved_at is not null and pc.enabled and exists(select 1 from hajji_ticket_private.referral_settings where id and enabled),false) coupon_active,coalesce(x.status='connected' and x.account_id is not null,false) connected,(select count(*) from hajji_ticket_private.registrations b where b.referrer_id=r.id and b.status='approved') sales from hajji_ticket_private.registrations r left join hajji_ticket_private.threads_connections x on x.registration_id=r.id left join hajji_ticket_private.affiliate_members a on a.registration_id=r.id left join hajji_ticket_private.promo_coupons pc on pc.code=a.parent_coupon_code where r.status='approved' and not r.access_suspended)t),
 'contents',(select coalesce(jsonb_agg(to_jsonb(b) order by b.created_at desc),'[]'::jsonb) from hajji_ticket_private.autojualan_content b where not archived),
 'campaigns',(select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc),'[]'::jsonb) from (select a.id,a.name,a.platform,a.start_date,a.duration,a.status,a.created_at,(select count(*) from hajji_ticket_private.autojualan_plan b where b.campaign_id=a.id) drafts from hajji_ticket_private.autojualan_campaigns a order by a.created_at desc limit 100)t));
end $$;
revoke execute on function hajji_ticket_private.autojualan_admin(text,jsonb) from public,anon,authenticated;
grant execute on function hajji_ticket_private.autojualan_admin(text,jsonb) to authenticated;
create or replace function public.hajji_autojualan_admin(op text,data jsonb) returns jsonb language sql security invoker set search_path='' as $$select hajji_ticket_private.autojualan_admin(op,data)$$;
revoke execute on function public.hajji_autojualan_admin(text,jsonb) from public,anon,authenticated;
grant execute on function public.hajji_autojualan_admin(text,jsonb) to authenticated;
notify pgrst,'reload schema';
