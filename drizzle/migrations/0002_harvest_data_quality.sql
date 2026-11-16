ALTER TABLE public.harvests
  ADD COLUMN field_name text,
  ADD COLUMN grade text NOT NULL DEFAULT 'A' CHECK (grade IN ('A','B','C')),
  ADD COLUMN harvest_date date NOT NULL DEFAULT current_date;