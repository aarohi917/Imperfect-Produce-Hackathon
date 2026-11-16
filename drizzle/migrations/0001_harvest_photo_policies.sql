CREATE POLICY "farmers upload own harvest photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'harvest-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "owner or staff read harvest photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'harvest-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));