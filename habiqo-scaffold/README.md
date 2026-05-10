# HABIQUO

> *Smart living. Smart real estate.*
> AI-native CRM for Italian real estate agencies.

This is the HABIQUO monorepo. It contains the Next.js 15 web app, shared
packages (UI, AI, auth, database, types, utils), and Supabase migrations.

---

## Stack

- **Frontend:** Next.js 15 (App Router, RSC, Server Actions), React 19, Tailwind v4
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime), pgvector, PostGIS
- **AI:** Anthropic Claude (Haiku/Sonnet/Opus, tier-routed), Vercel AI SDK, OpenAI fallback
- **Tooling:** pnpm 9, Turborepo, Biome, TypeScript 5.6 strict
- **Hosting:** Vercel (web) + Supabase (database, auth, storage)

---

## Getting started

```bash
# 1. Install
nvm use                         # Node 20.10
pnpm install

# 2. Set up Supabase locally
pnpm dlx supabase start         # Spins up Postgres on :54322, Studio on :54323
pnpm db:push                    # Applies migrations
pnpm db:types                   # Generates TypeScript types from schema

# 3. Configure env
cp apps/web/.env.example apps/web/.env.local
# Edit values — pnpm dlx supabase status prints the local keys

# 4. Run
pnpm dev                        # Web on http://localhost:3000
```

First-time signup at `/registrazione` triggers `handle_new_user()` which
creates a profile and a starter agency. Then run `psql ... -f supabase/seed.sql`
to load three demo leads.

---

## Repository layout

```
apps/web                # Next.js 15 customer-facing app
packages/ui             # Shared component library (shadcn-derived)
packages/ai             # AI client, prompts, router, RAG
packages/auth           # RBAC permissions, errors
packages/database       # Generated Supabase types
packages/types          # Domain types
packages/utils          # Italian formatters, pure helpers
packages/config         # Shared tsconfig, biome, design tokens
supabase/migrations     # SQL, version-controlled
```

---

## Architectural rules

These are enforced by code review. Violations are blockers.

1. **Server Components by default.** Add `"use client"` only at the leaf where
   interactivity is required.
2. **Type safety end-to-end.** No `any`, no untyped Supabase queries.
3. **RLS is the lock, not the app.** Never filter by `agency_id` in app code
   for security purposes.
4. **All AI calls go through `@habiquo/ai`.** Never import `@ai-sdk/anthropic`
   directly outside that package.
5. **Server Actions return `ActionResult<T>` (discriminated union).** Callers
   must handle both `ok: true` and `ok: false` branches.
6. **Italian for users, English for code.** All UI copy and prompts are
   Italian. Variable names, comments, commit messages are English.
7. **Tokens before classes.** Use semantic CSS variables (`var(--accent)`)
   over hardcoded Tailwind colors.

Full details in [docs/blueprint.md](./docs/blueprint.md).

---

## Common tasks

```bash
pnpm dev                  # All apps in watch mode
pnpm build                # Production build, all apps
pnpm lint                 # Biome lint
pnpm type-check           # TypeScript across all packages
pnpm format               # Biome format --write
pnpm db:reset             # Wipe and re-apply migrations
pnpm db:types             # Regenerate DB types
```

---

## Adding a new feature

1. Read the relevant section in [docs/blueprint.md](./docs/blueprint.md).
2. Schema changes? Add a new file in `supabase/migrations/`.
3. New mutation? Add a server action in `apps/web/src/lib/actions/<domain>.ts`
   with a Zod schema and `ActionResult<T>` return type.
4. New read? Add a query function in `apps/web/src/lib/queries/<domain>.ts`.
5. New AI call? Add a prompt module in `packages/ai/src/prompts/<task>/v1.ts`
   and route it via `TIER_BY_TASK`.
6. UI: server component default, client island only at interaction leaves.
7. Loading skeleton + empty state + error state.
8. PR with green CI.

---

## Status

This is the **MVP scaffold**. The Lead Detail Drawer page renders, basic
auth works, the pipeline kanban displays leads. Substantial work remains
on AI integrations, real-time, payments, and integrations with Italian
property portals. See `docs/blueprint.md` §20 ("What we explicitly defer")
for what's intentionally out of scope.
