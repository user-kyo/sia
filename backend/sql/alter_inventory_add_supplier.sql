-- Run this to add the supplier_id to the existing inventory table
alter table public.inventory 
add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;

notify pgrst, 'reload schema';
