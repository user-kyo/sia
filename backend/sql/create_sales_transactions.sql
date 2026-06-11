create table if not exists public.sales_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  transaction_code text not null,
  total_amount numeric not null default 0,
  currency text not null default 'PHP',
  item_count integer not null default 0,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sales_transactions_company_created_idx
  on public.sales_transactions (company_id, created_at desc);

create unique index if not exists sales_transactions_company_code_idx
  on public.sales_transactions (company_id, transaction_code);

notify pgrst, 'reload schema';
