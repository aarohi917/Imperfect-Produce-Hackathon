CREATE TABLE public.user_settings (user_id uuid PRIMARY KEY DEFAULT auth.uid(), language text NOT NULL DEFAULT 'zh' CHECK (language IN ('zh','en','hi','mr')), currency text NOT NULL DEFAULT 'CNY' CHECK (currency IN ('USD','INR','CNY','GBP','JPY')), time_zone text NOT NULL DEFAULT 'UTC', updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_settings_select ON public.user_settings FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY own_settings_insert ON public.user_settings FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid());
CREATE POLICY own_settings_update ON public.user_settings FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
ALTER TABLE public.harvests ADD COLUMN currency text NOT NULL DEFAULT 'CNY' CHECK (currency IN ('USD','INR','CNY','GBP','JPY'));
ALTER TABLE public.farmer_goals ADD COLUMN currency text NOT NULL DEFAULT 'CNY' CHECK (currency IN ('USD','INR','CNY','GBP','JPY'));
ALTER TABLE public.guide_threads ADD COLUMN auto_topic text, ADD COLUMN title_custom boolean NOT NULL DEFAULT false;
UPDATE public.guide_threads SET title_custom=true WHERE title <> '';
ALTER TABLE public.notifications ADD COLUMN event_type text, ADD COLUMN details jsonb;
CREATE FUNCTION public.lock_reviewed_currency() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF OLD.status <> 'pending' AND NEW.currency IS DISTINCT FROM OLD.currency THEN RAISE EXCEPTION 'Reviewed record currency is locked'; END IF; RETURN NEW; END $$;
CREATE TRIGGER harvest_currency_lock BEFORE UPDATE ON public.harvests FOR EACH ROW EXECUTE FUNCTION public.lock_reviewed_currency();
CREATE OR REPLACE FUNCTION public.notify_harvest() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE fname text; payload jsonb;
BEGIN
SELECT display_name INTO fname FROM public.profiles WHERE id=NEW.farmer_id;
payload:=jsonb_build_object('farmer',COALESCE(fname,''),'vegetable',NEW.vegetable,'quantity',NEW.quantity,'destination',NEW.destination,'revenue',NEW.expected_revenue,'cost',NEW.cost,'currency',NEW.currency,'status',NEW.status,'note',NEW.review_note);
IF TG_OP='INSERT' THEN
INSERT INTO public.notifications(user_id,title,body,harvest_id,event_type,details) SELECT DISTINCT ur.user_id,'New harvest awaiting approval','',NEW.id,'harvest_submitted',payload FROM public.user_roles ur WHERE ur.role IN ('hq','ceo');
ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
INSERT INTO public.notifications(user_id,title,body,harvest_id,event_type,details) VALUES(NEW.farmer_id,'Harvest review result','',NEW.id,'harvest_reviewed',payload);
INSERT INTO public.notifications(user_id,title,body,harvest_id,event_type,details) SELECT ur.user_id,'Harvest review result','',NEW.id,'harvest_reviewed',payload FROM public.user_roles ur WHERE ur.role='ceo' AND ur.user_id <> COALESCE(NEW.reviewed_by,'00000000-0000-0000-0000-000000000000');
END IF;
RETURN NEW;
END $$;