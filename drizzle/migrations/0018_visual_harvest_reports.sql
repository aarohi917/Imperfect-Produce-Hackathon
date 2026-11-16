ALTER TABLE public.harvests ADD COLUMN report_type text NOT NULL DEFAULT 'harvest', ADD COLUMN visual_items jsonb;
ALTER TABLE public.harvests ADD CONSTRAINT harvest_report_type_valid CHECK (report_type IN ('harvest','visual_intelligence'));
CREATE OR REPLACE FUNCTION public.validate_harvest() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE item jsonb; scores numeric; count_scores integer; good integer; fair integer; poor integer;
BEGIN
IF TG_OP='UPDATE' AND NEW.report_type IS DISTINCT FROM OLD.report_type THEN RAISE EXCEPTION 'Report type is immutable'; END IF;
IF NEW.report_type='visual_intelligence' THEN
 IF TG_OP='UPDATE' AND (NEW.visual_items IS DISTINCT FROM OLD.visual_items OR NEW.photo_path IS DISTINCT FROM OLD.photo_path) THEN RAISE EXCEPTION 'Visual snapshot is immutable'; END IF;
 IF NEW.photo_path IS NULL OR NEW.photo_path NOT LIKE NEW.farmer_id::text || '/%' THEN RAISE EXCEPTION 'Invalid photo owner'; END IF;
 IF jsonb_typeof(NEW.visual_items) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Visual items required'; END IF;
 IF jsonb_array_length(NEW.visual_items)<1 OR jsonb_array_length(NEW.visual_items)>500 THEN RAISE EXCEPTION 'Invalid item count'; END IF;
 scores:=0; count_scores:=0; good:=0; fair:=0; poor:=0;
 FOR item IN SELECT * FROM jsonb_array_elements(NEW.visual_items) LOOP
  IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR length(trim(COALESCE(item->>'type','')))=0 OR length(item->>'type')>80 OR jsonb_typeof(item->'confidence') IS DISTINCT FROM 'number' OR (item->>'confidence')::numeric NOT BETWEEN 0 AND 1 OR jsonb_typeof(item->'id') IS DISTINCT FROM 'number' OR (item->>'id')::numeric<1 THEN RAISE EXCEPTION 'Invalid detection'; END IF;
  IF item->>'sizeCm' IS NOT NULL AND ((item->>'sizeCm')::numeric<=0 OR (item->>'sizeCm')::numeric>100000) THEN RAISE EXCEPTION 'Invalid size'; END IF;
  IF item->>'qualityScore' IS NOT NULL THEN IF (item->>'qualityScore')::numeric NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'Invalid quality'; END IF; scores:=scores+(item->>'qualityScore')::numeric; count_scores:=count_scores+1; END IF;
  IF item->>'blemishPct' IS NOT NULL AND (item->>'blemishPct')::numeric NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'Invalid blemish'; END IF;
  IF item->>'grade' IS NOT NULL AND item->>'grade' NOT IN ('Good','Fair','Poor') THEN RAISE EXCEPTION 'Invalid visual grade'; END IF;
  good:=good+CASE WHEN item->>'grade'='Good' THEN 1 ELSE 0 END; fair:=fair+CASE WHEN item->>'grade'='Fair' THEN 1 ELSE 0 END; poor:=poor+CASE WHEN item->>'grade'='Poor' THEN 1 ELSE 0 END;
 END LOOP;
 NEW.quantity:=0; NEW.unit:='kg'; NEW.expected_revenue:=0; NEW.cost:=0; NEW.grade:='A'; NEW.vegetable:='Visual Intelligence'; NEW.destination:='market';
 NEW.ai_summary:=jsonb_array_length(NEW.visual_items)::text || ' items; avg quality ' || CASE WHEN count_scores>0 THEN round(scores/count_scores)::text ELSE 'unknown' END || '; ' || good::text || ' Good, ' || fair::text || ' Fair, ' || poor::text || ' Poor. Visual estimates only; no measured weight or food-safety certification.';
 RETURN NEW;
END IF;
IF NEW.visual_items IS NOT NULL THEN RAISE EXCEPTION 'Visual details require visual report type'; END IF;
NEW.vegetable := btrim(NEW.vegetable);
IF NEW.vegetable NOT IN ('白菜','菠菜','青菜','生菜','芹菜','韭菜','西兰花','花菜','胡萝卜','白萝卜','土豆','红薯','洋葱','大蒜','生姜','番茄','黄瓜','茄子','辣椒','南瓜','冬瓜','豆角','莲藕') THEN RAISE EXCEPTION '蔬菜名称不在标准列表中: %', NEW.vegetable; END IF;
IF NEW.quantity <= 0 OR NEW.quantity > 100000 THEN RAISE EXCEPTION '重量必须在 0 到 100000 公斤之间'; END IF;
IF NEW.expected_revenue < 0 OR NEW.cost < 0 THEN RAISE EXCEPTION '收入和成本不能为负数'; END IF;
IF NEW.harvest_date > current_date + 1 THEN RAISE EXCEPTION '采收日期不能晚于今天'; END IF;
NEW.unit := 'kg'; NEW.quantity := round(NEW.quantity, 1); NEW.expected_revenue := round(NEW.expected_revenue, 2); NEW.cost := round(NEW.cost, 2);
IF TG_OP = 'UPDATE' AND OLD.status <> 'pending' AND (NEW.quantity, NEW.expected_revenue, NEW.cost, NEW.vegetable) IS DISTINCT FROM (OLD.quantity, OLD.expected_revenue, OLD.cost, OLD.vegetable) THEN RAISE EXCEPTION '已审核的记录不能修改数据'; END IF;
RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.submit_operational_harvest(p_record jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ DECLARE new_id uuid; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
IF p_record ?| ARRAY['expected_revenue','cost','currency','status','reviewed_by','farmer_id'] THEN RAISE EXCEPTION 'Restricted fields'; END IF;
IF (p_record->>'photo_path') IS NOT NULL AND (p_record->>'photo_path') NOT LIKE auth.uid()::text || '/%' THEN RAISE EXCEPTION 'Invalid photo owner'; END IF;
IF p_record->>'report_type'='visual_intelligence' THEN
 INSERT INTO public.harvests(farmer_id,vegetable,quantity,photo_path,report_type,visual_items,currency) VALUES(auth.uid(),'Visual Intelligence',0,p_record->>'photo_path','visual_intelligence',p_record->'visual_items',COALESCE((SELECT currency FROM public.user_settings WHERE user_id=auth.uid()),'CNY')) RETURNING id INTO new_id; RETURN new_id;
END IF;
IF p_record ? 'report_type' OR p_record ? 'visual_items' THEN RAISE EXCEPTION 'Invalid report type'; END IF;
INSERT INTO public.harvests(farmer_id,vegetable,quantity,unit,destination,grade,field_name,harvest_date,photo_path,notes,ai_summary,expected_revenue,cost,currency) VALUES(auth.uid(),p_record->>'vegetable',(p_record->>'quantity')::numeric,'kg',p_record->>'destination',COALESCE(p_record->>'grade','A'),p_record->>'field_name',(p_record->>'harvest_date')::date,p_record->>'photo_path',p_record->>'notes',p_record->>'ai_summary',0,0,COALESCE((SELECT currency FROM public.user_settings WHERE user_id=auth.uid()),'CNY')) RETURNING id INTO new_id; RETURN new_id; END $$;
CREATE OR REPLACE FUNCTION public.notify_harvest() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$ DECLARE payload jsonb; avg_quality numeric; BEGIN
IF NEW.report_type='visual_intelligence' THEN
 IF TG_OP='INSERT' OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status<>'pending') THEN
 SELECT round(avg((i->>'qualityScore')::numeric)) INTO avg_quality FROM jsonb_array_elements(NEW.visual_items) i WHERE i->>'qualityScore' IS NOT NULL;
 payload:=jsonb_build_object('reportType',NEW.report_type,'photoPath',NEW.photo_path,'itemCount',jsonb_array_length(NEW.visual_items),'averageQuality',avg_quality,'status',NEW.status);
 INSERT INTO public.notifications(user_id,title,body,harvest_id,event_type,details) SELECT DISTINCT user_id,'Visual Intelligence report: ' || jsonb_array_length(NEW.visual_items)::text || ' items, avg quality ' || COALESCE(avg_quality::text,'unknown'),NEW.ai_summary,NEW.id,'visual_intelligence',payload FROM public.user_roles WHERE role IN ('hq','ceo');
 END IF; RETURN NEW;
END IF;
payload:=jsonb_build_object('vegetable',NEW.vegetable,'quantity',NEW.quantity,'destination',NEW.destination,'revenue',NEW.expected_revenue,'cost',NEW.cost,'currency',NEW.currency,'status',NEW.status);
IF TG_OP='INSERT' OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status<>'pending') THEN INSERT INTO public.notifications(user_id,title,body,harvest_id,event_type,details) SELECT DISTINCT user_id,'Harvest update','',NEW.id,CASE WHEN TG_OP='INSERT' THEN 'harvest_submitted' ELSE 'harvest_reviewed' END,payload FROM public.user_roles WHERE role='hq'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.operational_harvests() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT COALESCE(jsonb_agg(to_jsonb(h) ORDER BY h.harvest_date DESC,h.id),'[]'::jsonb) FROM (SELECT id,farmer_id,photo_path,vegetable,quantity,unit,destination,status,created_at,field_name,grade,harvest_date,reviewed_at FROM public.harvests WHERE report_type='harvest' AND (farmer_id=auth.uid() OR public.can_manage_farm(farmer_id))) h WHERE auth.uid() IS NOT NULL $$;
COMMENT ON COLUMN public.harvests.visual_items IS 'Immutable scanner observations, never confirmed kilograms, harvest grades, or financial measurements.';