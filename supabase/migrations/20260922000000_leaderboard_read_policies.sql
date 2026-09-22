-- Allow any authenticated user to read game_state rows for the leaderboard.
-- The existing "users_own_game_state" policy already restricts writes to the
-- owner; this adds a separate SELECT policy so cross-user reads work.
create policy "authenticated_read_game_state"
  on public.game_state
  for select
  using (auth.role() = 'authenticated');

-- Allow any authenticated user to read the name of users who have completed
-- onboarding, so the leaderboard can show real names instead of "Anonymous".
create policy "authenticated_read_completed_profiles"
  on public.student_profiles
  for select
  using (onboarding_completed = true and auth.role() = 'authenticated');
