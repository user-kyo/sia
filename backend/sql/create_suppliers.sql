create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suppliers_company_idx on public.suppliers (company_id);

notify pgrst, 'reload schema';
