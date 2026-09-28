create extension if not exists pgcrypto;

create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text,
 role text not null default 'owner',
 created_at timestamptz default now()
);

create table if not exists public.vessels(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 public_id text unique not null default upper('BP-'||substr(replace(gen_random_uuid()::text,'-',''),1,10)),
 name text not null, make text, model text, year int, country text, hin text,
 engine text, engine_hours numeric, is_public boolean default true,
 created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists public.vessel_records(
 id uuid primary key default gen_random_uuid(),
 vessel_id uuid not null references public.vessels(id) on delete cascade,
 created_by uuid references public.profiles(id) on delete set null,
 record_type text not null, title text not null, record_date date default current_date,
 provider_name text, cost numeric, engine_hours numeric, notes text,
 verification_status text default 'owner_entered', is_public boolean default true,
 created_at timestamptz default now()
);

create table if not exists public.vessel_files(
 id uuid primary key default gen_random_uuid(),
 vessel_id uuid not null references public.vessels(id) on delete cascade,
 record_id uuid references public.vessel_records(id) on delete cascade,
 uploaded_by uuid references public.profiles(id) on delete set null,
 storage_path text not null, file_name text not null, mime_type text, file_size bigint,
 is_public boolean default false, created_at timestamptz default now()
);

alter table public.vessel_files add column if not exists record_id uuid references public.vessel_records(id) on delete cascade;
create index if not exists vessel_files_record_id_idx on public.vessel_files(record_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,full_name)
 values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''));
 return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_vessel_owner(v uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.vessels where id=v and owner_id=auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.vessels enable row level security;
alter table public.vessel_records enable row level security;
alter table public.vessel_files enable row level security;

create policy "profile owner" on public.profiles for all to authenticated
using(id=auth.uid()) with check(id=auth.uid());

create policy "vessel public read" on public.vessels for select
using(owner_id=auth.uid() or is_public=true);
create policy "vessel owner insert" on public.vessels for insert to authenticated
with check(owner_id=auth.uid());
create policy "vessel owner update" on public.vessels for update to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "vessel owner delete" on public.vessels for delete to authenticated
using(owner_id=auth.uid());

create policy "record public read" on public.vessel_records for select
using(exists(select 1 from public.vessels v where v.id=vessel_id and
(v.owner_id=auth.uid() or (v.is_public=true and is_public=true))));
create policy "record owner insert" on public.vessel_records for insert to authenticated
with check(public.is_vessel_owner(vessel_id));
create policy "record owner update" on public.vessel_records for update to authenticated
using(public.is_vessel_owner(vessel_id)) with check(public.is_vessel_owner(vessel_id));
create policy "record owner delete" on public.vessel_records for delete to authenticated
using(public.is_vessel_owner(vessel_id));

create policy "file public read" on public.vessel_files for select
using(public.is_vessel_owner(vessel_id) or (is_public=true and exists(
 select 1 from public.vessels v where v.id=vessel_id and v.is_public=true)));
drop policy if exists "file owner insert" on public.vessel_files;
create policy "file owner insert" on public.vessel_files for insert to authenticated
with check(
  public.is_vessel_owner(vessel_id)
  and (record_id is null or exists(
    select 1 from public.vessel_records r
    where r.id=record_id and r.vessel_id=vessel_id
  ))
);
create policy "file owner delete" on public.vessel_files for delete to authenticated
using(public.is_vessel_owner(vessel_id));

insert into storage.buckets(id,name,public)
values('vessel-files','vessel-files',false)
on conflict(id) do nothing;

create policy "storage owner upload" on storage.objects for insert to authenticated
with check(bucket_id='vessel-files' and exists(
 select 1 from public.vessels v
 where v.id::text=(storage.foldername(name))[1] and v.owner_id=auth.uid()
));
create policy "storage owner read" on storage.objects for select to authenticated
using(bucket_id='vessel-files' and exists(
 select 1 from public.vessels v
 where v.id::text=(storage.foldername(name))[1] and v.owner_id=auth.uid()
));
create policy "storage owner delete" on storage.objects for delete to authenticated
using(bucket_id='vessel-files' and exists(
 select 1 from public.vessels v
 where v.id::text=(storage.foldername(name))[1] and v.owner_id=auth.uid()
));
