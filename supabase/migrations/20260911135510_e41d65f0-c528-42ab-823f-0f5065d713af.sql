
-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE public.seriousness_level AS ENUM ('casual', 'regular', 'serious', 'intense');
CREATE TYPE public.question_type AS ENUM ('mcq', 'fill_blank', 'true_false', 'match', 'find_mistake', 'scenario', 'timed');
CREATE TYPE public.difficulty_level AS ENUM ('very_easy', 'easy', 'medium', 'hard', 'very_hard');
CREATE TYPE public.practice_mode AS ENUM ('practice', 'quiz', 'timed', 'revision', 'mistake_review', 'adaptive');
CREATE TYPE public.session_status AS ENUM ('in_progress', 'completed', 'abandoned');
CREATE TYPE public.chat_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE public.recommendation_status AS ENUM ('pending', 'accepted', 'dismissed', 'completed');

-- ========== SHARED FUNCTIONS ==========
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== ROLES ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- new user bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_progress (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- ========== STUDENT PROFILES ==========
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  age INTEGER CHECK (age BETWEEN 3 AND 120),
  grade TEXT,
  curriculum TEXT,
  seriousness public.seriousness_level NOT NULL DEFAULT 'regular',
  study_goals TEXT,
  target_daily_minutes INTEGER NOT NULL DEFAULT 30 CHECK (target_daily_minutes > 0),
  preferred_language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own student profile" ON public.student_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_student_profiles_updated BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== SUBJECTS & TOPICS ==========
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  curriculum TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects readable" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "subjects admin write" ON public.subjects FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  parent_topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  grade TEXT,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_topics_subject ON public.topics(subject_id);
GRANT SELECT ON public.topics TO anon, authenticated;
GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics readable" ON public.topics FOR SELECT USING (true);
CREATE POLICY "topics admin write" ON public.topics FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_topics_updated BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.student_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 1,
  current_level public.difficulty_level NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_subjects TO authenticated;
GRANT ALL ON public.student_subjects TO service_role;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own student subjects" ON public.student_subjects FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========== QUESTION ENGINE ==========
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  question_type public.question_type NOT NULL,
  prompt TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer JSONB NOT NULL DEFAULT '{}'::jsonb,
  explanation TEXT,
  hints JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  points INTEGER NOT NULL DEFAULT 10,
  time_limit_seconds INTEGER,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_questions_topic ON public.questions(topic_id);
CREATE INDEX idx_questions_type ON public.questions(question_type);
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions readable" ON public.questions FOR SELECT TO authenticated USING (is_active);
CREATE POLICY "questions admin write" ON public.questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== PRACTICE ==========
CREATE TABLE public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  mode public.practice_mode NOT NULL DEFAULT 'practice',
  status public.session_status NOT NULL DEFAULT 'in_progress',
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  score NUMERIC(6,2) NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user ON public.practice_sessions(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_sessions TO authenticated;
GRANT ALL ON public.practice_sessions TO service_role;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.practice_sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.practice_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  answer JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  is_skipped BOOLEAN NOT NULL DEFAULT false,
  time_taken_seconds NUMERIC(8,2) NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempts_user ON public.practice_attempts(user_id);
CREATE INDEX idx_attempts_question ON public.practice_attempts(question_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_attempts TO authenticated;
GRANT ALL ON public.practice_attempts TO service_role;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts" ON public.practice_attempts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES public.practice_attempts(id) ON DELETE SET NULL,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  mistake_type TEXT,
  reason TEXT,
  ai_analysis TEXT,
  times_repeated INTEGER NOT NULL DEFAULT 1,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mistakes_user ON public.mistakes(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mistakes TO authenticated;
GRANT ALL ON public.mistakes TO service_role;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mistakes" ON public.mistakes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_mistakes_updated BEFORE UPDATE ON public.mistakes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_time_seconds NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  mastery_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  current_difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  streak_correct INTEGER NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_metrics TO authenticated;
GRANT ALL ON public.learning_metrics TO service_role;
ALTER TABLE public.learning_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own metrics" ON public.learning_metrics FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_metrics_updated BEFORE UPDATE ON public.learning_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== CHAT ==========
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO authenticated;
GRANT ALL ON public.chat_sessions TO service_role;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat sessions" ON public.chat_sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_chat_sessions_updated BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.chat_role NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat messages" ON public.chat_messages FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========== GAMIFICATION ==========
CREATE TABLE public.user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_questions_answered INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_study_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress" ON public.user_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_progress_updated BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_xp_user ON public.xp_events(user_id);
GRANT SELECT, INSERT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own xp read" ON public.xp_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own xp insert" ON public.xp_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tier TEXT NOT NULL DEFAULT 'bronze',
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges readable" ON public.badges FOR SELECT USING (true);
CREATE POLICY "badges admin write" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own badges read" ON public.user_badges FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own badges insert" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ========== AI RECOMMENDATIONS ==========
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 1,
  status public.recommendation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reco_user ON public.ai_recommendations(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_recommendations TO authenticated;
GRANT ALL ON public.ai_recommendations TO service_role;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recommendations" ON public.ai_recommendations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_reco_updated BEFORE UPDATE ON public.ai_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- new user trigger last (depends on user_progress)
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
