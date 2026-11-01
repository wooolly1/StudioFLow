-- =============================================================================
-- StudioFlow — initial schema
-- =============================================================================
-- Multi-tenant: every tenant-owned resource is scoped to an organization.
-- RLS is enforced on every table; access is governed by organization membership.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.member_role as enum ('owner','admin','editor','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.website_status as enum ('draft','published','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.website_source as enum ('native','github');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deployment_status as enum ('queued','building','ready','error','canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deployment_target as enum ('preview','production');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_change_status as enum ('proposed','approved','rejected','applied');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Updated_at trigger helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- profiles — mirrors auth.users with app-specific profile data
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- organizations
-- -----------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_owner_id_idx on public.organizations(owner_id);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- organization_members
-- -----------------------------------------------------------------------------
create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'editor',
  invited_by uuid references public.profiles(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx on public.organization_members(user_id);

-- Helper: is the current user a member of the org?
create or replace function public.is_org_member(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org and user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org uuid, variadic roles public.member_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org and user_id = auth.uid() and role = any(roles)
  );
$$;

-- Auto-add owner as a member when an org is created
create or replace function public.handle_new_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_organization_created on public.organizations;
create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_org();

-- -----------------------------------------------------------------------------
-- clients
-- -----------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_organization_id_idx on public.clients(organization_id);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- websites
-- -----------------------------------------------------------------------------
create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  slug text not null,
  source public.website_source not null default 'native',
  status public.website_status not null default 'draft',
  github_repo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index if not exists websites_organization_id_idx on public.websites(organization_id);
create index if not exists websites_client_id_idx on public.websites(client_id);
create index if not exists websites_status_idx on public.websites(status);

create trigger websites_set_updated_at
  before update on public.websites
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- website_pages
-- -----------------------------------------------------------------------------
create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  path text not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (website_id, path)
);

create index if not exists website_pages_website_id_idx on public.website_pages(website_id);

create trigger website_pages_set_updated_at
  before update on public.website_pages
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- website_components — reusable component registry entries per website
-- -----------------------------------------------------------------------------
create table if not exists public.website_components (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  key text not null,
  name text not null,
  schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (website_id, key)
);

create index if not exists website_components_website_id_idx on public.website_components(website_id);

create trigger website_components_set_updated_at
  before update on public.website_components
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- website_versions — immutable snapshots for undo/publish history
-- -----------------------------------------------------------------------------
create table if not exists public.website_versions (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  label text,
  snapshot jsonb not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists website_versions_website_id_idx on public.website_versions(website_id, created_at desc);

-- -----------------------------------------------------------------------------
-- github_connections — one per website or per org
-- -----------------------------------------------------------------------------
create table if not exists public.github_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid references public.websites(id) on delete cascade,
  installation_id bigint,
  repo_full_name text,
  default_branch text default 'main',
  -- Encrypted at rest via pgsodium / vault in production. Never stored plaintext.
  encrypted_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists github_connections_organization_id_idx on public.github_connections(organization_id);
create index if not exists github_connections_website_id_idx on public.github_connections(website_id);

create trigger github_connections_set_updated_at
  before update on public.github_connections
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- deployments
-- -----------------------------------------------------------------------------
create table if not exists public.deployments (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  target public.deployment_target not null default 'preview',
  status public.deployment_status not null default 'queued',
  provider text not null default 'vercel',
  provider_deployment_id text,
  url text,
  commit_sha text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deployments_website_id_idx on public.deployments(website_id, created_at desc);
create index if not exists deployments_status_idx on public.deployments(status);

create trigger deployments_set_updated_at
  before update on public.deployments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- domains
-- -----------------------------------------------------------------------------
create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  domain text not null unique,
  verified boolean not null default false,
  provider text default 'vercel',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists domains_website_id_idx on public.domains(website_id);

create trigger domains_set_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- media_assets
-- -----------------------------------------------------------------------------
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid references public.websites(id) on delete set null,
  storage_path text not null,          -- supabase storage object path
  mime_type text,
  size_bytes bigint,
  width int,
  height int,
  alt text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists media_assets_organization_id_idx on public.media_assets(organization_id);
create index if not exists media_assets_website_id_idx on public.media_assets(website_id);

-- -----------------------------------------------------------------------------
-- ai_conversations + ai_change_requests
-- -----------------------------------------------------------------------------
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  website_id uuid references public.websites(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  title text,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_conversations_website_id_idx on public.ai_conversations(website_id, updated_at desc);

create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create table if not exists public.ai_change_requests (
  id uuid primary key default gen_random_uuid(),
  website_id uuid not null references public.websites(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  prompt text not null,
  proposal jsonb not null,                      -- structured edit proposal (Zod-validated server-side)
  status public.ai_change_status not null default 'proposed',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_change_requests_website_id_idx on public.ai_change_requests(website_id, created_at desc);
create index if not exists ai_change_requests_status_idx on public.ai_change_requests(status);

create trigger ai_change_requests_set_updated_at
  before update on public.ai_change_requests
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- activity_logs — audit trail
-- -----------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_organization_id_idx on public.activity_logs(organization_id, created_at desc);
create index if not exists activity_logs_entity_idx on public.activity_logs(entity_type, entity_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.clients enable row level security;
alter table public.websites enable row level security;
alter table public.website_pages enable row level security;
alter table public.website_components enable row level security;
alter table public.website_versions enable row level security;
alter table public.github_connections enable row level security;
alter table public.deployments enable row level security;
alter table public.domains enable row level security;
alter table public.media_assets enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_change_requests enable row level security;
alter table public.activity_logs enable row level security;

-- profiles: a user can see and edit only their own profile
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- organizations: visible to members; only owner/admin can modify
drop policy if exists orgs_member_select on public.organizations;
create policy orgs_member_select on public.organizations
  for select using (public.is_org_member(id));

drop policy if exists orgs_authenticated_insert on public.organizations;
create policy orgs_authenticated_insert on public.organizations
  for insert with check (auth.uid() = owner_id);

drop policy if exists orgs_admin_update on public.organizations;
create policy orgs_admin_update on public.organizations
  for update using (public.has_org_role(id, 'owner','admin'))
  with check (public.has_org_role(id, 'owner','admin'));

drop policy if exists orgs_owner_delete on public.organizations;
create policy orgs_owner_delete on public.organizations
  for delete using (public.has_org_role(id, 'owner'));

-- organization_members
drop policy if exists org_members_self_select on public.organization_members;
create policy org_members_self_select on public.organization_members
  for select using (public.is_org_member(organization_id));

drop policy if exists org_members_admin_insert on public.organization_members;
create policy org_members_admin_insert on public.organization_members
  for insert with check (public.has_org_role(organization_id, 'owner','admin'));

drop policy if exists org_members_admin_update on public.organization_members;
create policy org_members_admin_update on public.organization_members
  for update using (public.has_org_role(organization_id, 'owner','admin'))
  with check (public.has_org_role(organization_id, 'owner','admin'));

drop policy if exists org_members_admin_delete on public.organization_members;
create policy org_members_admin_delete on public.organization_members
  for delete using (public.has_org_role(organization_id, 'owner','admin'));

-- Generic org-scoped policies via a macro-like approach. Each table repeats the
-- same shape: members can read; editors+ can write.
-- clients
drop policy if exists clients_member_select on public.clients;
create policy clients_member_select on public.clients
  for select using (public.is_org_member(organization_id));
drop policy if exists clients_editor_write on public.clients;
create policy clients_editor_write on public.clients
  for all using (public.has_org_role(organization_id, 'owner','admin','editor'))
  with check (public.has_org_role(organization_id, 'owner','admin','editor'));

-- websites
drop policy if exists websites_member_select on public.websites;
create policy websites_member_select on public.websites
  for select using (public.is_org_member(organization_id));
drop policy if exists websites_editor_write on public.websites;
create policy websites_editor_write on public.websites
  for all using (public.has_org_role(organization_id, 'owner','admin','editor'))
  with check (public.has_org_role(organization_id, 'owner','admin','editor'));

-- Helper: can current user access this website (via its org)?
create or replace function public.can_access_website(w uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.websites s
    where s.id = w and public.is_org_member(s.organization_id)
  );
$$;

create or replace function public.can_edit_website(w uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.websites s
    where s.id = w and public.has_org_role(s.organization_id, 'owner','admin','editor')
  );
$$;

-- website_pages
drop policy if exists website_pages_select on public.website_pages;
create policy website_pages_select on public.website_pages
  for select using (public.can_access_website(website_id));
drop policy if exists website_pages_write on public.website_pages;
create policy website_pages_write on public.website_pages
  for all using (public.can_edit_website(website_id))
  with check (public.can_edit_website(website_id));

-- website_components
drop policy if exists website_components_select on public.website_components;
create policy website_components_select on public.website_components
  for select using (public.can_access_website(website_id));
drop policy if exists website_components_write on public.website_components;
create policy website_components_write on public.website_components
  for all using (public.can_edit_website(website_id))
  with check (public.can_edit_website(website_id));

-- website_versions (read for members; write via server-side only using service role is fine too)
drop policy if exists website_versions_select on public.website_versions;
create policy website_versions_select on public.website_versions
  for select using (public.can_access_website(website_id));
drop policy if exists website_versions_insert on public.website_versions;
create policy website_versions_insert on public.website_versions
  for insert with check (public.can_edit_website(website_id));

-- github_connections (admin+ only — contains secrets)
drop policy if exists github_connections_admin_select on public.github_connections;
create policy github_connections_admin_select on public.github_connections
  for select using (public.has_org_role(organization_id, 'owner','admin'));
drop policy if exists github_connections_admin_write on public.github_connections;
create policy github_connections_admin_write on public.github_connections
  for all using (public.has_org_role(organization_id, 'owner','admin'))
  with check (public.has_org_role(organization_id, 'owner','admin'));

-- deployments
drop policy if exists deployments_select on public.deployments;
create policy deployments_select on public.deployments
  for select using (public.can_access_website(website_id));
drop policy if exists deployments_write on public.deployments;
create policy deployments_write on public.deployments
  for all using (public.can_edit_website(website_id))
  with check (public.can_edit_website(website_id));

-- domains
drop policy if exists domains_select on public.domains;
create policy domains_select on public.domains
  for select using (public.can_access_website(website_id));
drop policy if exists domains_write on public.domains;
create policy domains_write on public.domains
  for all using (public.can_edit_website(website_id))
  with check (public.can_edit_website(website_id));

-- media_assets
drop policy if exists media_assets_select on public.media_assets;
create policy media_assets_select on public.media_assets
  for select using (public.is_org_member(organization_id));
drop policy if exists media_assets_write on public.media_assets;
create policy media_assets_write on public.media_assets
  for all using (public.has_org_role(organization_id, 'owner','admin','editor'))
  with check (public.has_org_role(organization_id, 'owner','admin','editor'));

-- ai_conversations
drop policy if exists ai_conv_select on public.ai_conversations;
create policy ai_conv_select on public.ai_conversations
  for select using (public.is_org_member(organization_id));
drop policy if exists ai_conv_write on public.ai_conversations;
create policy ai_conv_write on public.ai_conversations
  for all using (public.has_org_role(organization_id, 'owner','admin','editor'))
  with check (public.has_org_role(organization_id, 'owner','admin','editor'));

-- ai_change_requests
drop policy if exists ai_cr_select on public.ai_change_requests;
create policy ai_cr_select on public.ai_change_requests
  for select using (public.can_access_website(website_id));
drop policy if exists ai_cr_write on public.ai_change_requests;
create policy ai_cr_write on public.ai_change_requests
  for all using (public.can_edit_website(website_id))
  with check (public.can_edit_website(website_id));

-- activity_logs: members read; write via server (service role) to prevent spoofing
drop policy if exists activity_logs_select on public.activity_logs;
create policy activity_logs_select on public.activity_logs
  for select using (public.is_org_member(organization_id));

-- =============================================================================
-- Done.
-- =============================================================================
