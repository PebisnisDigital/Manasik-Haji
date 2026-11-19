-- Run only in a dedicated MANASIK 3D Supabase project.
-- Create the first owner account through Auth, then manually set
-- raw_app_meta_data.manasik_superadmin=true for the exact verified user UUID.
-- Never set this privilege through user_metadata or client input.
begin;
create table public.manasik_partners (
 id uuid primary key default gen_random_uuid(),
 slug text unique not null check(slug ~ '^[a-z0-9][a-z0-9-]{1,49}$' and slug <> 'demo-travel'),
 active boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.manasik_brand (
 partner_id uuid primary key references public.manasik_partners(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 100),
 logo_url text not null default '' check(logo_url='' or (logo_url ~ '^https://' and char_length(logo_url)<=500)),
 accent text not null default '#246648' check(accent ~ '^#[0-9a-fA-F]{6}$'),
 whatsapp text not null default '' check(whatsapp='' or whatsapp ~ '^[0-9]{8,15}$'),
 description text not null default '' check(char_length(description)<=240)
);
create table public.manasik_members (
 partner_id uuid references public.manasik_partners(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade,
 primary key(partner_id,user_id)
);
create index manasik_members_user on public.manasik_members(user_id);
create table public.manasik_participants (
 partner_id uuid references public.manasik_partners(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade,
 alias text not null default 'Peserta' check(char_length(alias)<=80),
 umrah_stage int not null default 0 check(umrah_stage between 0 and 5),
 hajj_stage int not null default 0 check(hajj_stage between 0 and 13),
 updated_at timestamptz not null default now(),
 primary key(partner_id,user_id)
);
create index manasik_participants_user on public.manasik_participants(user_id);
alter table public.manasik_partners enable row level security;
alter table public.manasik_brand enable row level security;
alter table public.manasik_members enable row level security;
alter table public.manasik_participants enable row level security;
revoke all on public.manasik_partners,public.manasik_brand,public.manasik_members,public.manasik_participants from anon,authenticated;
grant select on public.manasik_partners,public.manasik_brand to anon,authenticated;
grant insert,update,delete on public.manasik_partners,public.manasik_brand to authenticated;
grant select,insert,delete on public.manasik_members to authenticated;
grant select,insert,update,delete on public.manasik_participants to authenticated;
create policy members_read on public.manasik_members for select to authenticated using(user_id=(select auth.uid()) or ((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true');
create policy members_add on public.manasik_members for insert to authenticated with check(((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true');
create policy members_remove on public.manasik_members for delete to authenticated using(((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true');
create policy partners_public_read on public.manasik_partners for select to anon,authenticated using(active);
create policy partners_staff_read on public.manasik_partners for select to authenticated using(((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true' or exists(select 1 from public.manasik_members m where m.partner_id=id and m.user_id=(select auth.uid())));
create policy partners_admin_manage on public.manasik_partners for all to authenticated using(((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true') with check(((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true');
create policy brand_public_read on public.manasik_brand for select to anon,authenticated using(exists(select 1 from public.manasik_partners p where p.id=partner_id and p.active));
create policy brand_staff_read on public.manasik_brand for select to authenticated using(((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true' or exists(select 1 from public.manasik_members m where m.partner_id=manasik_brand.partner_id and m.user_id=(select auth.uid())));
create policy brand_staff_insert on public.manasik_brand for insert to authenticated with check(((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true' or exists(select 1 from public.manasik_members m where m.partner_id=manasik_brand.partner_id and m.user_id=(select auth.uid())));
create policy brand_staff_update on public.manasik_brand for update to authenticated using(((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true' or exists(select 1 from public.manasik_members m where m.partner_id=manasik_brand.partner_id and m.user_id=(select auth.uid()))) with check(((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true' or exists(select 1 from public.manasik_members m where m.partner_id=manasik_brand.partner_id and m.user_id=(select auth.uid())));
create policy brand_admin_delete on public.manasik_brand for delete to authenticated using(((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true');
create policy participant_read on public.manasik_participants for select to authenticated using(user_id=(select auth.uid()) or ((select auth.jwt())->'app_metadata'->>'manasik_superadmin')='true' or exists(select 1 from public.manasik_members m where m.partner_id=manasik_participants.partner_id and m.user_id=(select auth.uid())));
create policy participant_insert on public.manasik_participants for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.manasik_partners p where p.id=partner_id and p.active));
create policy participant_update on public.manasik_participants for update to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.manasik_partners p where p.id=partner_id and p.active)) with check(user_id=(select auth.uid()) and exists(select 1 from public.manasik_partners p where p.id=partner_id and p.active));
create policy participant_delete on public.manasik_participants for delete to authenticated using(user_id=(select auth.uid()));
-- Prevent identity reassignment and progress rollback on update.
create function public.manasik_participant_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.user_id<>old.user_id or new.partner_id<>old.partner_id then raise exception 'Participant identity immutable'; end if;
 new.umrah_stage=greatest(new.umrah_stage,old.umrah_stage);
 new.hajj_stage=greatest(new.hajj_stage,old.hajj_stage);
 new.updated_at=now();return new;
end;$$;
revoke execute on function public.manasik_participant_guard() from public,anon,authenticated;
create trigger manasik_participant_guard before update on public.manasik_participants for each row execute function public.manasik_participant_guard();
commit;
