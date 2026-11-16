CREATE TYPE public.app_role AS ENUM ('farmer','hq','ceo');
CREATE TYPE public.harvest_status AS ENUM ('pending','approved','rejected');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  farm_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('hq','ceo'))
$$;

CREATE POLICY "own or staff read profiles" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "read own or staff roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "ceo manages roles insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'ceo'));
CREATE POLICY "ceo manages roles delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'ceo'));

-- New users: profile + farmer role; very first user becomes CEO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'ceo') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'ceo');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'farmer');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.harvests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL DEFAULT auth.uid(),
  photo_path text,
  vegetable text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity >= 0),
  unit text NOT NULL DEFAULT 'kg',
  destination text NOT NULL DEFAULT 'market' CHECK (destination IN ('market','factory')),
  expected_revenue numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  ai_summary text,
  notes text,
  status public.harvest_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.harvests TO authenticated;
GRANT ALL ON public.harvests TO service_role;
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farmer or staff read harvests" ON public.harvests FOR SELECT TO authenticated
  USING (farmer_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "farmer creates own pending harvest" ON public.harvests FOR INSERT TO authenticated
  WITH CHECK (farmer_id = auth.uid() AND status = 'pending' AND reviewed_by IS NULL);
CREATE POLICY "hq reviews harvests" ON public.harvests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'hq') OR public.has_role(auth.uid(),'ceo'))
  WITH CHECK (public.has_role(auth.uid(),'hq') OR public.has_role(auth.uid(),'ceo'));

CREATE TABLE public.reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  mood int NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.reflections TO authenticated;
GRANT ALL ON public.reflections TO service_role;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reflections" ON public.reflections FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  harvest_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notify HQ + CEO on new harvest; notify farmer + CEO on decision
CREATE OR REPLACE FUNCTION public.notify_harvest()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE fname text;
BEGIN
  SELECT display_name INTO fname FROM public.profiles WHERE id = NEW.farmer_id;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, body, harvest_id)
    SELECT DISTINCT ur.user_id, 'New harvest awaiting approval',
      COALESCE(fname,'A farmer') || ' reported ' || NEW.quantity || ' ' || NEW.unit || ' of ' || NEW.vegetable || ' bound for the ' || NEW.destination || '.',
      NEW.id
    FROM public.user_roles ur WHERE ur.role IN ('hq','ceo');
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    INSERT INTO public.notifications (user_id, title, body, harvest_id)
    VALUES (NEW.farmer_id, 'Your harvest was ' || NEW.status,
      NEW.quantity || ' ' || NEW.unit || ' of ' || NEW.vegetable || COALESCE(' — ' || NEW.review_note, ''), NEW.id);
    INSERT INTO public.notifications (user_id, title, body, harvest_id)
    SELECT ur.user_id, 'HQ ' || NEW.status || ' a shipment',
      NEW.quantity || ' ' || NEW.unit || ' of ' || NEW.vegetable || ' from ' || COALESCE(fname,'a farmer') || ' to the ' || NEW.destination || '.', NEW.id
    FROM public.user_roles ur WHERE ur.role = 'ceo' AND ur.user_id <> COALESCE(NEW.reviewed_by, '00000000-0000-0000-0000-000000000000');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER harvest_notify AFTER INSERT OR UPDATE ON public.harvests
  FOR EACH ROW EXECUTE FUNCTION public.notify_harvest();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;