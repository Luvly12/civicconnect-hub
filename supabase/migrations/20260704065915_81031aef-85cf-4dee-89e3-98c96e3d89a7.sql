
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  locality TEXT DEFAULT 'Koramangala, Bengaluru',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Issues
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Medium',
  image_url TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'Reported',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  locality TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.issues TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issues TO authenticated;
GRANT ALL ON public.issues TO service_role;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Issues are viewable by everyone" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert issues" ON public.issues FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR is_anonymous = true);
CREATE POLICY "Users can update own issues" ON public.issues FOR UPDATE USING (auth.uid() = user_id);

-- Donations
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cause TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  transaction_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.donations TO authenticated;
GRANT INSERT ON public.donations TO anon;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can donate" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own donations" ON public.donations FOR SELECT USING (auth.uid() = user_id);

-- Seed some public issues so map isn't empty
INSERT INTO public.issues (title, description, category, severity, status, lat, lng, locality, is_anonymous) VALUES
('Large pothole on 5th Main', 'Deep pothole causing traffic issues near the junction.', 'Potholes', 'High', 'Reported', 12.9352, 77.6245, 'Koramangala 4th Block', true),
('Streetlight out on 80ft Rd', 'Lights have been out for a week, area is unsafe at night.', 'Broken Streetlights', 'Medium', 'In Progress', 12.9339, 77.6270, 'Koramangala 5th Block', true),
('Garbage overflow at park entrance', 'Bin not cleared in 3 days, attracting stray animals.', 'Garbage Accumulation', 'High', 'Reported', 12.9376, 77.6218, 'Koramangala 6th Block', true),
('Water leak from main pipe', 'Continuous leak from underground main causing waste.', 'Water Leaks', 'High', 'Resolved', 12.9310, 77.6280, 'Koramangala 1st Block', true),
('Drainage blocked after rain', 'Water logging every time it rains due to blocked drain.', 'Drainage Blockage', 'Medium', 'In Progress', 12.9400, 77.6250, 'Koramangala 3rd Block', true),
('Sanitation issue near market', 'Requires immediate cleaning attention.', 'Sanitation', 'Low', 'Resolved', 12.9330, 77.6200, 'Koramangala 2nd Block', true);
