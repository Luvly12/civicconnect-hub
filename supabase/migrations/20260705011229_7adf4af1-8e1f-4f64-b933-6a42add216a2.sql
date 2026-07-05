
DROP POLICY IF EXISTS "Authenticated can update discussions" ON public.discussions;
CREATE POLICY "Authors can update own discussions" ON public.discussions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can rsvp events" ON public.events;
CREATE OR REPLACE FUNCTION public.rsvp_event(event_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.events SET volunteers = volunteers + 1 WHERE id = event_id;
$$;
REVOKE ALL ON FUNCTION public.rsvp_event(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.rsvp_event(uuid) TO authenticated;
