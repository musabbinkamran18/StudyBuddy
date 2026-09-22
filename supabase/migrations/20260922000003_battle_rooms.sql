create table if not exists public.battle_rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  host_id      text not null,
  guest_id     text,
  host_name    text not null default 'Player',
  guest_name   text,
  host_avatar  text not null default '⭐',
  guest_avatar text,
  subject      text not null default '',
  topic        text not null default '',
  difficulty   text not null default 'medium',
  status       text not null default 'waiting',
  questions    jsonb not null default '[]',
  host_score   integer not null default 0,
  guest_score  integer not null default 0,
  host_correct integer not null default 0,
  guest_correct integer not null default 0,
  host_finished  boolean not null default false,
  guest_finished boolean not null default false,
  winner_id    text,
  created_at   timestamptz not null default now()
);

-- Index for fast code lookups (used on every poll/join)
create index if not exists idx_battle_rooms_code on public.battle_rooms (code);

-- Rooms older than 2 hours are stale; clean them up via a cron job or manually
-- (no automatic TTL in Postgres without pg_cron, but index helps with manual deletes)

-- RLS: any authenticated user can read any room (needed to join via code)
alter table public.battle_rooms enable row level security;

create policy "battle_rooms_select"
  on public.battle_rooms for select
  using (auth.role() = 'authenticated');

-- Only the host can create a room
create policy "battle_rooms_insert"
  on public.battle_rooms for insert
  with check (auth.uid()::text = host_id);

-- Host or guest can update the room
create policy "battle_rooms_update"
  on public.battle_rooms for update
  using (
    auth.uid()::text = host_id
    or auth.uid()::text = guest_id
  );
