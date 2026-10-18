ALTER TABLE public.lessons ADD COLUMN description text, ADD COLUMN resource_links text[] NOT NULL DEFAULT '{}', ADD COLUMN grouped_pages boolean NOT NULL DEFAULT false;
CREATE TABLE public.suggestions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id), message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000), created_at timestamptz NOT NULL DEFAULT now());
GRANT INSERT, SELECT, DELETE ON public.suggestions TO authenticated;
GRANT ALL ON public.suggestions TO service_role;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students submit suggestions" ON public.suggestions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND NOT public.current_user_banned());
CREATE POLICY "Admins read suggestions" ON public.suggestions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') AND NOT public.current_user_banned());
CREATE POLICY "Admins delete suggestions" ON public.suggestions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') AND NOT public.current_user_banned());
CREATE POLICY "Hidden identities restricted" ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR NOT public.has_role(id, 'hidden'));
CREATE OR REPLACE FUNCTION public.admin_set_hidden(_user_id uuid, _hidden boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
IF NOT public.has_role(auth.uid(), 'admin') OR public.current_user_banned() THEN RAISE EXCEPTION 'Forbidden'; END IF;
IF _hidden THEN INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, 'hidden') ON CONFLICT (user_id, role) DO NOTHING;
ELSE DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'hidden'; END IF; END $$;
REVOKE ALL ON FUNCTION public.admin_set_hidden(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_hidden(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.visible_author_ids() RETURNS TABLE(id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT p.id FROM public.profiles p WHERE auth.uid() IS NOT NULL AND NOT public.current_user_banned() AND (public.has_role(auth.uid(),'admin') OR NOT public.has_role(p.id,'hidden')) $$;
REVOKE ALL ON FUNCTION public.visible_author_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.visible_author_ids() TO authenticated;