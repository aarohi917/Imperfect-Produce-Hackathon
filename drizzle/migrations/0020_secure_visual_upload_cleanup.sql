CREATE OR REPLACE FUNCTION public.harvest_photo_attached(p_path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$ SELECT EXISTS(SELECT 1 FROM public.harvests WHERE photo_path=p_path) $$;
REVOKE ALL ON FUNCTION public.harvest_photo_attached(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.harvest_photo_attached(text) TO authenticated;
ALTER POLICY harvest_unattached_upload_cleanup ON storage.objects USING (bucket_id='harvest-photos' AND (storage.foldername(name))[1]=auth.uid()::text AND NOT public.harvest_photo_attached(name));