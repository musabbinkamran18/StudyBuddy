-- Add curriculum column to topics so rows can be scoped to a specific curriculum key
-- (e.g. 'matric', 'igcse', 'fsc'). NULL means generic / applies to all curricula.

alter table public.topics
  add column if not exists curriculum text;

create index if not exists idx_topics_curriculum
  on public.topics (curriculum);

create index if not exists idx_topics_grade_curriculum
  on public.topics (grade, curriculum);
