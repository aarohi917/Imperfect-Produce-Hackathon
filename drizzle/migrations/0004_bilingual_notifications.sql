CREATE OR REPLACE FUNCTION public.notify_harvest()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE fname text; st text; st_en text; dz text; de text;
BEGIN
  SELECT display_name INTO fname FROM public.profiles WHERE id = NEW.farmer_id;
  st := CASE NEW.status WHEN 'approved' THEN '已批准' WHEN 'rejected' THEN '已驳回' ELSE '待审核' END;
  st_en := NEW.status::text;
  dz := CASE NEW.destination WHEN 'factory' THEN '工厂' ELSE '市场' END;
  de := NEW.destination;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, body, harvest_id)
    SELECT DISTINCT ur.user_id, '新采收记录待审核 / New harvest awaiting approval',
      COALESCE(fname,'农户') || ' 上报 ' || NEW.vegetable || ' ' || NEW.quantity || ' 公斤，送往' || dz || '。 / '
      || COALESCE(fname,'A farmer') || ' reported ' || NEW.quantity || ' kg of ' || NEW.vegetable || ' for the ' || de || '.', NEW.id
    FROM public.user_roles ur WHERE ur.role IN ('hq','ceo');
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    INSERT INTO public.notifications (user_id, title, body, harvest_id)
    VALUES (NEW.farmer_id, '您的采收记录' || st || ' / Your harvest was ' || st_en,
      NEW.vegetable || ' ' || NEW.quantity || ' 公斤 / kg' || COALESCE('：' || NEW.review_note, ''), NEW.id);
    INSERT INTO public.notifications (user_id, title, body, harvest_id)
    SELECT ur.user_id, '总部' || st || '一批货物 / HQ ' || st_en || ' a shipment',
      COALESCE(fname,'农户') || ' · ' || NEW.vegetable || ' ' || NEW.quantity || ' 公斤 / kg → ' || dz || ' / ' || de, NEW.id
    FROM public.user_roles ur WHERE ur.role = 'ceo' AND ur.user_id <> COALESCE(NEW.reviewed_by, '00000000-0000-0000-0000-000000000000');
  END IF;
  RETURN NEW;
END $$;