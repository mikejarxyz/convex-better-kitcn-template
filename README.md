# App Template

A reusable starter for internal tools and product apps built with Next.js, Convex, KitCN, Better Auth, Tailwind, and shadcn/ui.

The template gives you a working authenticated app shell so new projects can start from product code instead of auth and layout plumbing.

## Included

- Next.js App Router with React, TypeScript, and Tailwind v4
- Convex backend with generated API bindings
- KitCN + Better Auth integration
- Email/password auth and Google OAuth
- Account page with profile, linked accounts, 2FA, and passkey controls
- Protected `/app` dashboard shell with sidebar, breadcrumbs, dark mode, and sign out
- shadcn/ui component setup and semantic theme tokens
- Central auth feature flags in `app-auth.config.ts`

## Project Map

- `src/app` - Next.js routes
- `src/components` - app shell and UI components
- `src/features/auth` - auth screens, account controls, and auth helpers
- `convex` - Convex schema, functions, auth runtime, and HTTP routes
- `app-auth.config.ts` - turn auth features on or off
- `docs/app-shell-foundation.md` - full template architecture and setup notes
- `docs/convex-organization-pattern.md` - preferred Convex module layout
- `docs/convex-error-handling.md` - structured Convex error conventions
- `docs/auth-stack-upgrades.md` - KitCN, Better Auth, and Convex upgrade runbook

## Development

Use Node 24 and pnpm 11. Windows bootstrap verification used Node 24.20.0.
If Node 24.19 crashes with `UV_HANDLE_CLOSING` during local Convex shutdown,
upgrade to 24.20.0 before rerunning setup.

Install dependencies:

```bash
pnpm install
```

Run the local setup script:

```bash
pnpm run setup
```

The script:

- creates `.env.local` from `.env.example` if missing
- creates `convex/.env` from `convex/.env.example` if missing
- creates or links the Convex dev deployment
- sets `DEPLOY_ENV=development` and `SITE_URL=http://localhost:3000` directly on that dev deployment
- preserves existing deployment auth keys and secrets; refuses conflicting local values
- seeds `JWKS=[]` only when the deployment has no JWKS
- runs KitCN's one-shot bootstrap, including codegen, auth synchronization, migrations, and backfills
- verifies signing keys exist and runs a final generation/bootstrap pass

Then run the app and the long-running Convex dev server:

```bash
pnpm dev
pnpm exec kitcn dev
```

KitCN owns the normal Convex development loop for this repository. It runs
Convex plus project codegen, migrations, aggregate backfills, and local auth/env
sync. Use raw Convex commands only for operations KitCN does not wrap or for the
explicit first-bootstrap recovery steps below.

For first setup and recovery, use `pnpm run setup`. It initializes Convex before
pushing any functions and targets the local or development deployment recorded
in `.env.local`. Production and deployment-key overrides are rejected.

The script uses `NEXT_PUBLIC_SITE_URL` (default `http://localhost:3000`) for
`SITE_URL`. It preserves existing managed auth material, copying it into
`convex/.env` if needed. If local and remote values conflict, reconcile them
before rerunning; setup will not silently rotate the deployment secret.

If setup fails after seeding an empty JWKS, fix the reported error and rerun
`pnpm run setup`. The placeholder intentionally remains until KitCN generates
real keys. Do not start the frontend until setup succeeds.

Verify before shipping template changes:

```bash
pnpm run check
```

## Configuration

Copy `.env.example` to `.env.local` and let `pnpm exec convex init`
fill in the Convex values.

`convex/.env` is only for KitCN-managed shared auth values such as
`BETTER_AUTH_SECRET` and `JWKS`; it is pushed with `pnpm exec kitcn env push`.
Do not put deployment-specific values in this file. `kitcn env push --prod`
pushes every entry from `convex/.env`, so values such as a development
`SITE_URL` or `DEPLOY_ENV` would conflict with or overwrite production config.
If upgrading an existing checkout, remove any deployment-specific entries from
`convex/.env` after setting their equivalents directly on the appropriate
Convex deployments.

Configure deployment-specific values directly on each Convex deployment. For
the active development deployment:

```bash
pnpm exec kitcn env set DEPLOY_ENV development
pnpm exec kitcn env set SITE_URL http://localhost:3000
```

Google OAuth is enabled by default, so configure its credentials on each
deployment that uses it. Email provider values are optional:

```bash
pnpm exec kitcn env set GOOGLE_CLIENT_ID
pnpm exec kitcn env set GOOGLE_CLIENT_SECRET
pnpm exec kitcn env set RESEND_API_KEY
pnpm exec kitcn env set EMAIL_FROM
```

`SITE_URL` must match `NEXT_PUBLIC_SITE_URL` and the browser origin exactly,
including the port.

### KitCN / JWKS Bootstrap

With Convex 1.44 and KitCN 0.32.2, reading the optional `JWKS` through
`getAuthJwks()` still counts as an environment access during auth-config
analysis. An unset value can therefore fail the first deployment before the
dynamic provider fallback becomes usable.

`pnpm run setup` initializes the deployment, supplies a temporary `[]` only
when JWKS is absent, then lets `kitcn dev --bootstrap` generate the actual
signing keys. KitCN converts `[]` into a public JWKS with no keys; it cannot
authenticate users. Existing nonempty deployment keys are never replaced
with this placeholder. Keep the typed helper for runtime access.

For `generated/auth:getLatestJwks` missing-function errors or an unfinished
bootstrap, rerun `pnpm run setup`. For an already configured deployment,
explicit repair/rotation remains available through `kitcn env push`.

Before bootstrapping production auth, configure `SITE_URL`, `DEPLOY_ENV`, OAuth
credentials, email credentials, and any other deployment-specific values
directly on the production deployment. For example:

```bash
pnpm exec kitcn env set --prod DEPLOY_ENV production
pnpm exec kitcn env set --prod SITE_URL https://app.example.com
```

Inspect the selected production deployment first. **Only if JWKS is absent**
on a new deployment, set its temporary placeholder before the first push:

```bash
pnpm exec kitcn env get --prod JWKS
# Run only when the command above confirms JWKS is absent:
pnpm exec kitcn env set --prod JWKS '[]'
```

Keep traffic off that new deployment until bootstrap finishes. Preserve any
existing production keys. Reconcile `convex/.env` with production's managed
auth values before forcing a push; do not copy a development secret over an
existing production secret.

Then deploy, replace the placeholder with generated keys, and deploy again:

```bash
pnpm exec kitcn deploy --prod
pnpm exec kitcn env push --prod --force
pnpm exec kitcn codegen
pnpm exec kitcn deploy --prod
```

For dependency and auth-schema upgrades, follow
[`docs/auth-stack-upgrades.md`](docs/auth-stack-upgrades.md) before deploying.

Use `app-auth.config.ts` to control which auth features appear in the UI. When enabling or disabling deeper auth capabilities, keep the Better Auth server/client plugin setup in sync.
