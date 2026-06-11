create table if not exists public.procurements (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  po_number text not null,
  supplier_id uuid references public.suppliers(id) on delete restrict,
  requested_by text not null,
  status text not null default 'draft', -- draft, pending_approval, approved, received, cancelled
  total_amount numeric not null default 0,
  currency text not null default 'PHP',
  items jsonb not null default '[]'::jsonb,
  remarks text,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists procurements_company_idx on public.procurements (company_id);
create index if not exists procurements_supplier_idx on public.procurements (supplier_id);

notify pgrst, 'reload schema';
