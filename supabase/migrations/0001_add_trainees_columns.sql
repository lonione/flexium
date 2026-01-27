-- Add trainees payload support for multi-trainee workouts and plans.

alter table public.workouts
add column if not exists trainees jsonb not null default '[]'::jsonb;

alter table public.plans
add column if not exists trainees jsonb not null default '[]'::jsonb;

-- Optional: refresh PostgREST schema cache after applying.
-- notify pgrst, 'reload schema';
