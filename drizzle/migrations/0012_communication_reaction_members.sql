ALTER TABLE public.comm_reactions ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.comm_reactions DROP CONSTRAINT comm_reactions_pkey;
ALTER TABLE public.comm_reactions ADD PRIMARY KEY(id);
ALTER TABLE public.comm_reactions ADD CONSTRAINT comm_reaction_message FOREIGN KEY(message_id) REFERENCES public.comm_messages(id);