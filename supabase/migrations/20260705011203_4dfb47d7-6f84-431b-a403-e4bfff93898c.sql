
-- DISCUSSIONS
CREATE TABLE public.discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'Neighbor',
  title text NOT NULL,
  body text NOT NULL,
  locality text DEFAULT 'Koramangala, Bengaluru',
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discussions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.discussions TO authenticated;
GRANT ALL ON public.discussions TO service_role;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Discussions viewable by everyone" ON public.discussions FOR SELECT USING (true);
CREATE POLICY "Authenticated can post discussions" ON public.discussions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Authenticated can update discussions" ON public.discussions FOR UPDATE TO authenticated USING (true);

-- EVENTS
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_date text NOT NULL,
  event_time text NOT NULL,
  location text NOT NULL,
  volunteers int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, UPDATE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated can rsvp events" ON public.events FOR UPDATE TO authenticated USING (true);

-- SEED
INSERT INTO public.discussions (author_name, title, body, comments) VALUES
('Priya M.', 'Traffic signal timing broken on 100ft Rd', 'Long queues every evening — anyone else facing this?', '["Yes! Especially after 6pm.","I''ll file a report today."]'::jsonb),
('Rahul K.', 'Weekend cleanup drive at Rose Garden', 'Organizing a 2-hour cleanup Sunday morning. RSVP if interested!', '["Count me in."]'::jsonb),
('Anonymous', 'Stray dog vaccination camp needed', 'Which local NGOs handle this? Sharing contacts here.', '[]'::jsonb);

INSERT INTO public.events (title, event_date, event_time, location, volunteers) VALUES
('Community Cleanup — Rose Garden', 'Sat, Aug 9', '7:00 AM', 'Koramangala 3rd Block', 12),
('Tree Plantation Drive', 'Sun, Aug 17', '6:30 AM', 'Ejipura Park', 24),
('Blood Donation Camp', 'Sat, Aug 23', '10:00 AM', 'Community Hall, 5th Block', 8);
