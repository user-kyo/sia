alter table public.procurements add column if not exists invoice_url text;
notify pgrst, 'reload schema';
