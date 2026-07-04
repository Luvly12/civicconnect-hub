
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP POLICY "Anyone can donate" ON public.donations;
CREATE POLICY "Authenticated can donate" ON public.donations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anon can donate anonymously" ON public.donations FOR INSERT TO anon WITH CHECK (user_id IS NULL);
