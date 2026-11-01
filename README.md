# StudioFlow

A multi-tenant SaaS platform for building, importing, visually editing, managing, and publishing client websites — from a single workspace.

> **Milestone 1 (shipped):** foundation only. Auth, workspace schema with RLS,
> app shell, dashboard, design system, Supabase integration.
> The visual editor, AI assistant, GitHub, Vercel, and client portal arrive in
> later milestones.

## Tech stack

- **Next.js 15** (App Router, Server Actions, `typedRoutes`)
- **TypeScript** (strict, `noUncheckedIndexedAccess`)
- **Tailwind CSS 3** with CSS variables for Minimal Luxury tokens
- **Supabase** — Auth, Postgres with Row Level Security, Storage (via SSR cookie refresh)
- **Zod** for every form boundary
- **lucide-react** for icons; `Inter` / `Fraunces` / `IBM Plex Sans Arabic` for typography

## Prerequisites

- Node.js 20 or newer
- A Supabase project (free tier works)
- The Supabase CLI (`npm i -g supabase`) if you want to run migrations from your terminal

## Setup

```bash
# 1. install
npm install

# 2. env
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from
# https://supabase.com/dashboard/project/<your-project>/settings/api

# 3. database — paste supabase/migrations/0001_initial.sql into the SQL editor,
#    OR run it with the Supabase CLI:
supabase link --project-ref <your-project-ref>
supabase db push

# 4. run
npm run dev
```

Open http://localhost:3000 — you'll land on `/login`. Sign up, confirm your
email (Supabase sends it), and you'll arrive on `/dashboard`.

## Scripts

```bash
npm run dev        # local dev server
npm run build      # production build (strict typecheck included)
npm run start      # run the production build
npm run lint       # Next's ESLint config
npm run typecheck  # tsc --noEmit
```

## Project layout

```
src/
  app/
    (auth)/                  grouped auth routes with their own layout
      login/
      signup/
      actions.ts             Server Actions: login, signup, logout
    (app)/                   authenticated app routes with sidebar + topbar
      dashboard/
      websites/
      clients/
      media/
      portal/
      settings/
    auth/callback/           Supabase email-confirmation + OAuth callback
    layout.tsx               root layout with fonts and <html lang/dir>
    globals.css              design tokens (HSL CSS variables)
  components/
    ui/                      Button, Input, Label, Card, EmptyState
    app-shell/               Sidebar, Topbar, PageHeader
    brand/                   Logo
  lib/
    env.ts                   Zod-validated env schema
    supabase/
      client.ts              browser client
      server.ts              server client (uses `next/headers` cookies)
      middleware.ts          session-refresh helper used from src/middleware.ts
      types.ts               hand-authored Database types (regenerate later)
    utils.ts                 cn()
  middleware.ts              routes requests through Supabase session refresh
supabase/
  migrations/
    0001_initial.sql         full schema + RLS policies
```

## Database overview

Everything is multi-tenant via `organization_id`. RLS is on for every table.

| Table | Purpose |
|---|---|
| `profiles` | mirror of `auth.users` with app profile fields |
| `organizations` | workspaces |
| `organization_members` | user ↔ org with role (`owner`, `admin`, `editor`, `viewer`) |
| `clients` | agency clients |
| `websites` | native-or-github sites |
| `website_pages` | pages (JSON content for native sites) |
| `website_components` | per-site component registry |
| `website_versions` | immutable snapshots for undo/publish history |
| `github_connections` | installation + token (encrypted) |
| `deployments` | preview/production builds |
| `domains` | custom domains |
| `media_assets` | storage records |
| `ai_conversations` | chat history |
| `ai_change_requests` | structured, Zod-validated edit proposals |
| `activity_logs` | audit trail |

RLS policies use two helper functions — `is_org_member(org)` and
`has_org_role(org, roles...)` — plus `can_access_website(id)` /
`can_edit_website(id)` for website-scoped tables. New tenants cannot see or
modify data in other workspaces, even via the Supabase client in the browser.

## Security notes

- Service-role keys are **never** imported in browser code (`@/lib/env`
  returns them only in server contexts).
- All auth happens through Supabase Auth cookies, refreshed in middleware.
- Protected routes are enforced server-side in `(app)/layout.tsx` and by
  `src/middleware.ts`. Client-side gating alone is not trusted.
- GitHub tokens and other secrets are stored in `github_connections.encrypted_token`;
  the plaintext column is reserved to be replaced with a `pgsodium` encrypted
  column in Milestone 4 before shipping that integration.
- AI edits never execute as code. They land in `ai_change_requests` as
  structured proposals, validated with Zod, previewed in the UI, and only
  applied after explicit user approval. (Wired in Milestone 3.)

## Internationalization

The root layout sets `lang` and `dir` on `<html>`. Latin and Arabic fonts are
preloaded. A locale switcher that reads `profiles.locale` and toggles RTL will
arrive with workspace settings in Milestone 2.

## Roadmap

- **Milestone 2** — Workspace creation, member invites, client CRUD
- **Milestone 3** — Puck-based visual editor, Claude AI assistant with
  structured proposal/approval workflow
- **Milestone 4** — GitHub App integration, framework detection, branch-per-edit
- **Milestone 5** — Vercel integration, deployments, domains, client portal

Each milestone will ship with its own migration, tests for the new workflows,
and documentation updates.

## License

Proprietary — all rights reserved.
