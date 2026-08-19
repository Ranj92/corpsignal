# CorpSignal handoff

## Purpose and stack

CorpSignal is a small internal announcement and policy feed with `Member`, `Admin`, and `Manager` roles. It is a serverless application: Vue 3/Vuex/Vite/Tailwind in `client/`; Supabase Auth, Postgres, RLS, SQL functions, and Edge Functions in `supabase/`; Cloudflare R2 for images; Cloudflare Pages for the frontend.

## Structure and boundaries

- `client/src/features/`: pages and UI. Components must not call Supabase directly.
- `client/src/store/`: application state; call the contracts in `client/src/api/`.
- `client/src/api/`: UI-facing, provider-neutral adapters. Keep response shapes stable.
- `client/src/domain/`: provider-independent rules. `client/src/infrastructure/supabase/` contains provider details only.
- `client/src/security/sanitizeRichText.js`: sanitize rich text before persistence and rendering.
- `supabase/migrations/`: schema, RLS, and guarded SQL use-cases; this is the authorization source of truth.
- `supabase/functions/`: privileged operations. Shared authentication, CORS, and HTTP helpers belong in `_shared/`.
- `client/public/_redirects` and `_headers`: Cloudflare Pages routing and security headers.

## Security and data rules

- Roles in `public.profiles` are authoritative. UI/router checks are usability only; database and Edge Functions must enforce permissions.
- Members read posts and record their own receipts; Admins and Managers manage posts/media; only Managers manage accounts.
- Keep direct table writes denied. Extend guarded SQL functions and RLS rather than bypassing them from the browser.
- Images are R2 objects tracked by `media_assets` and linked through `post_assets`; preserve `data-asset-id` in rich text and the cleanup flow for detached assets.
- Supabase Auth uses normalized usernames mapped to synthetic emails. `AUTH_EMAIL_DOMAIN` and `VITE_AUTH_EMAIL_DOMAIN` must match. Keep public signup disabled.
- Never put Supabase service-role credentials, R2 credentials, or `BOOTSTRAP_SECRET` in client files or source control. The bootstrap function is one-time only and should be removed from the deployed project after the first Manager exists.

## Commands

From `client/`:

```sh
npm install
npm run dev
npm run build
```

There is currently no test or frontend typecheck script. Typecheck Edge Functions as needed:

```sh
npx -y deno check supabase/functions/<function>/index.ts
```

Supabase deployment workflow:

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase secrets set --env-file supabase/.env
supabase functions deploy admin-users
supabase functions deploy media
supabase functions deploy bootstrap-manager
```

Use `client/.env.example` and `supabase/.env.example` as the configuration references. Cloudflare Pages builds from `client/` with `npm run build` and publishes `dist/`.

## Change discipline

- Add a new timestamped migration for deployed database changes; do not casually rewrite an applied migration or weaken RLS/function grants.
- Maintain the adapter/domain/infrastructure separation and centralize browser runtime configuration in `client/src/config/runtime.js`.
- Preserve public post payload and Edge Function response contracts unless UI consumers are updated together.
- The detailed source-of-truth references are the migration, Edge Functions, and the two `.env.example` files; keep this handoff concise rather than duplicating them here.
