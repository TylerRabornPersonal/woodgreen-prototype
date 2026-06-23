-- ============================================================================
-- 25 Woodgreen — Row-Level Security starter (Supabase)
-- ----------------------------------------------------------------------------
-- Run AFTER `db:push`/`db:migrate` creates the tables. Apply in the Supabase
-- SQL editor. This is the hard backstop: even if app code forgets to scope a
-- query, the database refuses to return another tenant's rows.
--
-- Model: a Supabase auth user maps to a row in `users` carrying organization_id.
-- Tenant users may read only rows belonging to their org. Landlord/admin users
-- (role owner/manager) bypass via the service-role key (RLS does not apply to it).
--
-- NOTE: public inventory tables (floors, offices, add_ons, term_options,
-- pricing_config, conf_hour_tiers) are world-readable — they back the public
-- marketing site. Everything tenant-specific is locked down.
-- ============================================================================

-- Helper: the caller's organization_id, derived from their users row.
create or replace function public.current_org_id()
returns uuid
language sql stable security definer
as $$
  select organization_id from public.users where id = auth.uid()
$$;

-- ── Public, read-only inventory ──────────────────────────────────────────────
alter table public.floors            enable row level security;
alter table public.offices           enable row level security;
alter table public.add_ons           enable row level security;
alter table public.term_options      enable row level security;
alter table public.pricing_config    enable row level security;
alter table public.conf_hour_tiers   enable row level security;

create policy "inventory is public read" on public.floors          for select using (true);
create policy "inventory is public read" on public.offices         for select using (true);
create policy "inventory is public read" on public.add_ons         for select using (true);
create policy "inventory is public read" on public.term_options    for select using (true);
create policy "inventory is public read" on public.pricing_config  for select using (true);
create policy "inventory is public read" on public.conf_hour_tiers for select using (true);

-- ── Tenant-scoped tables: read only your own org ─────────────────────────────
-- Pattern to repeat for every org-owned table (licenses, invoices, payments,
-- conf_hour_banks, bookings, agreements, applications, requests, contacts …):
--
--   alter table public.<table> enable row level security;
--   create policy "own org read" on public.<table>
--     for select using (organization_id = public.current_org_id());
--
-- For tables that reference org indirectly (e.g. license_line_items → licenses,
-- conf_hour_usage → conf_hour_banks → licenses), gate via a subquery/join to the
-- owning license's organization_id.

alter table public.licenses        enable row level security;
alter table public.invoices        enable row level security;
alter table public.payments        enable row level security;
alter table public.conf_hour_banks enable row level security;
alter table public.organizations   enable row level security;
alter table public.contacts        enable row level security;

create policy "own org read" on public.licenses        for select using (organization_id = public.current_org_id());
create policy "own org read" on public.invoices        for select using (organization_id = public.current_org_id());
create policy "own org read" on public.payments        for select using (organization_id = public.current_org_id());
create policy "own org read" on public.contacts        for select using (organization_id = public.current_org_id());
create policy "own org read" on public.organizations   for select using (id = public.current_org_id());
create policy "own org read" on public.conf_hour_banks for select using (
  license_id in (select id from public.licenses where organization_id = public.current_org_id())
);

-- Writes (insert/update) generally go through the service-role key (admin client)
-- in server actions, so tenant write policies are intentionally omitted for now.
