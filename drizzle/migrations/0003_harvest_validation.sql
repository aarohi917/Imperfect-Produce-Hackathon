CREATE OR REPLACE FUNCTION public.validate_harvest()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.vegetable := btrim(NEW.vegetable);
  IF NEW.vegetable NOT IN ('白菜','菠菜','青菜','生菜','芹菜','韭菜','西兰花','花菜','胡萝卜','白萝卜','土豆','红薯','洋葱','大蒜','生姜','番茄','黄瓜','茄子','辣椒','南瓜','冬瓜','豆角','莲藕') THEN
    RAISE EXCEPTION '蔬菜名称不在标准列表中: %', NEW.vegetable;
  END IF;
  IF NEW.quantity <= 0 OR NEW.quantity > 100000 THEN RAISE EXCEPTION '重量必须在 0 到 100000 公斤之间'; END IF;
  IF NEW.expected_revenue < 0 OR NEW.cost < 0 THEN RAISE EXCEPTION '收入和成本不能为负数'; END IF;
  IF NEW.harvest_date > current_date + 1 THEN RAISE EXCEPTION '采收日期不能晚于今天'; END IF;
  NEW.unit := 'kg';
  NEW.quantity := round(NEW.quantity, 1);
  NEW.expected_revenue := round(NEW.expected_revenue, 2);
  NEW.cost := round(NEW.cost, 2);
  -- once reviewed, the numbers are locked
  IF TG_OP = 'UPDATE' AND OLD.status <> 'pending' AND (NEW.quantity, NEW.expected_revenue, NEW.cost, NEW.vegetable) IS DISTINCT FROM (OLD.quantity, OLD.expected_revenue, OLD.cost, OLD.vegetable) THEN
    RAISE EXCEPTION '已审核的记录不能修改数据';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER harvest_validate BEFORE INSERT OR UPDATE ON public.harvests
  FOR EACH ROW EXECUTE FUNCTION public.validate_harvest();

CREATE OR REPLACE FUNCTION public.notify_harvest()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE fname text; st text;
BEGIN
  SELECT display_name INTO fname FROM public.profiles WHERE id = NEW.farmer_id;
  st := CASE NEW.status WHEN 'approved' THEN '已批准' WHEN 'rejected' THEN '已驳回' ELSE '待审核' END;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, body, harvest_id)
    SELECT DISTINCT ur.user_id, '新采收记录待审核',
      COALESCE(fname,'农户') || ' 上报 ' || NEW.vegetable || ' ' || NEW.quantity || ' 公斤，送往' || CASE NEW.destination WHEN 'factory' THEN '工厂' ELSE '市场' END || '。', NEW.id
    FROM public.user_roles ur WHERE ur.role IN ('hq','ceo');
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    INSERT INTO public.notifications (user_id, title, body, harvest_id)
    VALUES (NEW.farmer_id, '您的采收记录' || st, NEW.vegetable || ' ' || NEW.quantity || ' 公斤' || COALESCE('：' || NEW.review_note, ''), NEW.id);
    INSERT INTO public.notifications (user_id, title, body, harvest_id)
    SELECT ur.user_id, '总部' || st || '一批货物',
      COALESCE(fname,'农户') || ' 的 ' || NEW.vegetable || ' ' || NEW.quantity || ' 公斤', NEW.id
    FROM public.user_roles ur WHERE ur.role = 'ceo' AND ur.user_id <> COALESCE(NEW.reviewed_by, '00000000-0000-0000-0000-000000000000');
  END IF;
  RETURN NEW;
END $$;