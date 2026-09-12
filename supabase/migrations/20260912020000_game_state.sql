-- Game state table: one row per user, JSONB columns for each domain.
-- localStorage stays as the fast session cache; this table is the durable
-- backing store that survives browser clears and syncs across devices.

create table if not exists public.game_state (
  user_id        uuid        primary key references auth.users(id) on delete cascade,
  coins          jsonb       not null default '{}'::jsonb,
  rewards        jsonb       not null default '{}'::jsonb,
  extended_stats jsonb       not null default '{}'::jsonb,
  achievements   jsonb       not null default '{}'::jsonb,
  subject_progress jsonb     not null default '{}'::jsonb,
  mistakes       jsonb       not null default '[]'::jsonb,
  study_log      jsonb       not null default '{}'::jsonb,
  avatar         text        not null default '⭐',
  updated_at     timestamptz not null default now()
);

alter table public.game_state enable row level security;

create policy "users_own_game_state"
  on public.game_state
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.game_state to authenticated;
grant all on public.game_state to service_role;
