create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  user_id text not null,
  username text not null,
  action text not null,
  module text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_company_idx on public.audit_logs (company_id, created_at desc);

notify pgrst, 'reload schema';
