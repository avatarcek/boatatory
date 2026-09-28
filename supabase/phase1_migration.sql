-- BOATPROOF PHASE 1 MIGRATION
-- Run this in Supabase SQL Editor on the existing BoatProof project.
-- It does NOT delete vessel data or history.

alter table public.vessel_files
  add column if not exists record_id uuid references public.vessel_records(id) on delete cascade;

create index if not exists vessel_files_record_id_idx
  on public.vessel_files(record_id);

drop policy if exists "file owner insert" on public.vessel_files;
create policy "file owner insert"
on public.vessel_files
for insert
to authenticated
with check (
  public.is_vessel_owner(vessel_id)
  and (record_id is null or exists(
    select 1 from public.vessel_records r
    where r.id=record_id and r.vessel_id=vessel_id
  ))
);

-- The existing Storage policies remain in place.
-- Private files are opened from the dashboard through time-limited signed URLs.
