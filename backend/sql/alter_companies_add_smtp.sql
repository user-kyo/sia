alter table public.companies add column if not exists smtp_email text;
alter table public.companies add column if not exists smtp_password text;

notify pgrst, 'reload schema';
