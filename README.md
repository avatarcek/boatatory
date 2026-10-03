# Boatatory — Phase 1 MVP

Phase 1 focuses on real-user testing, not feature creep.

## Included
- Supabase Auth + Postgres + RLS
- Permanent Vessel ID
- Full vessel profile form (name, make, model, year, country, HIN, engine, hours)
- History entry table: date, work, category, engine hours, cost, provider, notes, evidence
- Multiple history records can be saved in one action
- Evidence upload attached to a history record
- Private cloud files with signed viewing links for the logged-in owner
- Public vessel history page
- QR code and public Vessel ID link
- Responsive mobile layout

## Supabase migration
Because you already have the MVP database, run **only** `supabase/phase1_migration.sql` in Supabase SQL Editor. It adds `record_id` to `vessel_files` and updates the file-insert policy. It does not delete vessel data or history.

Do not use a service-role key in the browser.

## Local
1. `npm install`
2. Copy `.env.example` to `.env.local` and add the Supabase URL + publishable key.
3. `npm run dev`

## Phase 1 real-user test
Test with two real boat owners:
1. Create account.
2. Add a real vessel.
3. Enter HIN, engine and current engine hours.
4. Add 3–5 real history records.
5. Attach at least one real photo/PDF to a record.
6. Open the public Vessel ID page.
7. Report every confusing field, error, or missing piece.

The goal is a real owner being able to create a useful vessel history in a few minutes.
Boatatory Phase 1
