-- Adds a structured "changes" column so update events can list exactly which
-- fields changed (e.g. ["cost 750 → 850", "price 100 → 150"]) and the UI can
-- render them in their own column.
alter table public.audit_logs
  add column if not exists changes jsonb;

-- Enable realtime so audit log inserts push to connected clients immediately
-- (no need to reload / re-login to see new entries). Idempotent: skips if the
-- table is already part of the realtime publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'audit_logs'
  ) then
    alter publication supabase_realtime add table public.audit_logs;
  end if;
end $$;

notify pgrst, 'reload schema';
