-- New signups get sensible defaults: a profile row already exists, and now a
-- default student_profiles row too (regular commitment, 30 min/day, English).
-- Replaces the previous handle_new_user which only created profiles/user_roles/user_progress.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  default_name TEXT;
BEGIN
  default_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  IF default_name IS NULL OR default_name = '' THEN
    default_name := 'Student';
  END IF;

  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, default_name)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;

  INSERT INTO public.user_progress (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  INSERT INTO public.student_profiles (user_id, full_name, seriousness, target_daily_minutes, preferred_language)
  VALUES (NEW.id, default_name, 'regular', 30, 'en')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END; $$;