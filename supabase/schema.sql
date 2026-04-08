create extension if not exists pgcrypto;

create table if not exists public.app_users (
    id text primary key,
    payload jsonb not null,
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_master_data (
    id text primary key,
    payload jsonb not null,
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_quotations (
    id text primary key,
    payload jsonb not null,
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_invoices (
    id text primary key,
    payload jsonb not null,
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_notifications (
    id text primary key,
    payload jsonb not null,
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_email_drafts (
    id text primary key,
    payload jsonb not null,
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_email_signatures (
    id text primary key,
    payload jsonb not null,
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_email_messages (
    id text primary key,
    payload jsonb not null,
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_email_templates (
    id text primary key,
    payload jsonb not null,
    updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at
before update on public.app_users
for each row
execute function public.set_updated_at();

drop trigger if exists app_master_data_set_updated_at on public.app_master_data;
create trigger app_master_data_set_updated_at
before update on public.app_master_data
for each row
execute function public.set_updated_at();

drop trigger if exists app_quotations_set_updated_at on public.app_quotations;
create trigger app_quotations_set_updated_at
before update on public.app_quotations
for each row
execute function public.set_updated_at();

drop trigger if exists app_invoices_set_updated_at on public.app_invoices;
create trigger app_invoices_set_updated_at
before update on public.app_invoices
for each row
execute function public.set_updated_at();

drop trigger if exists app_notifications_set_updated_at on public.app_notifications;
create trigger app_notifications_set_updated_at
before update on public.app_notifications
for each row
execute function public.set_updated_at();

drop trigger if exists app_email_drafts_set_updated_at on public.app_email_drafts;
create trigger app_email_drafts_set_updated_at
before update on public.app_email_drafts
for each row
execute function public.set_updated_at();

drop trigger if exists app_email_signatures_set_updated_at on public.app_email_signatures;
create trigger app_email_signatures_set_updated_at
before update on public.app_email_signatures
for each row
execute function public.set_updated_at();

drop trigger if exists app_email_messages_set_updated_at on public.app_email_messages;
create trigger app_email_messages_set_updated_at
before update on public.app_email_messages
for each row
execute function public.set_updated_at();

drop trigger if exists app_email_templates_set_updated_at on public.app_email_templates;
create trigger app_email_templates_set_updated_at
before update on public.app_email_templates
for each row
execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.app_master_data enable row level security;
alter table public.app_quotations enable row level security;
alter table public.app_invoices enable row level security;
alter table public.app_notifications enable row level security;
alter table public.app_email_drafts enable row level security;
alter table public.app_email_signatures enable row level security;
alter table public.app_email_messages enable row level security;
alter table public.app_email_templates enable row level security;

drop policy if exists "Allow anon full access app_users" on public.app_users;
create policy "Allow anon full access app_users"
on public.app_users
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow anon full access app_master_data" on public.app_master_data;
create policy "Allow anon full access app_master_data"
on public.app_master_data
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow anon full access app_quotations" on public.app_quotations;
create policy "Allow anon full access app_quotations"
on public.app_quotations
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow anon full access app_invoices" on public.app_invoices;
create policy "Allow anon full access app_invoices"
on public.app_invoices
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow anon full access app_notifications" on public.app_notifications;
create policy "Allow anon full access app_notifications"
on public.app_notifications
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow anon full access app_email_drafts" on public.app_email_drafts;
create policy "Allow anon full access app_email_drafts"
on public.app_email_drafts
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow anon full access app_email_signatures" on public.app_email_signatures;
create policy "Allow anon full access app_email_signatures"
on public.app_email_signatures
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow anon full access app_email_messages" on public.app_email_messages;
create policy "Allow anon full access app_email_messages"
on public.app_email_messages
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow anon full access app_email_templates" on public.app_email_templates;
create policy "Allow anon full access app_email_templates"
on public.app_email_templates
for all
to anon, authenticated
using (true)
with check (true);
