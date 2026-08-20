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

## Development

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
- runs KitCN codegen
- deploys generated Convex functions
- pushes KitCN-managed auth env, including `BETTER_AUTH_SECRET` and `JWKS`
- runs a final codegen/deploy pass

Then run the app and the long-running Convex dev server:

```bash
pnpm dev
pnpm exec convex dev
```

Manual setup commands, if you do not want to use the script:

Create local app env:

```bash
cp .env.example .env.local
```

Create or link the Convex dev deployment. This fills `CONVEX_DEPLOYMENT`,
`NEXT_PUBLIC_CONVEX_URL`, and `NEXT_PUBLIC_CONVEX_SITE_URL` in `.env.local`.

```bash
pnpm exec convex dev --once
```

Create `convex/.env` for KitCN-managed shared auth values only:

```bash
cp convex/.env.example convex/.env
```

On PowerShell:

```powershell
Copy-Item convex\.env.example convex\.env
```

Set deployment-specific auth values directly on the active Convex dev
deployment. At minimum, local auth needs the browser origin in `SITE_URL`:

```bash
pnpm exec convex env set DEPLOY_ENV development
pnpm exec convex env set SITE_URL http://localhost:3000
```

Generate KitCN auth/runtime files and deploy the generated Convex functions:

```bash
pnpm exec kitcn codegen
pnpm exec convex dev --once
```

Push KitCN-managed auth env into Convex. This generates/syncs
`BETTER_AUTH_SECRET` and `JWKS` for the active Convex deployment.

```bash
pnpm exec kitcn env push
```

Run one final generation/deploy pass after `JWKS` exists:

```bash
pnpm exec kitcn codegen
pnpm exec convex dev --once
```

Verify before shipping template changes:

```bash
pnpm run lint
pnpm run build
```

## Configuration

Copy `.env.example` to `.env.local` and let `pnpm exec convex dev --once`
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
pnpm exec convex env set DEPLOY_ENV development
pnpm exec convex env set SITE_URL http://localhost:3000
```

Google OAuth is enabled by default, so configure its credentials on each
deployment that uses it. Email provider values are optional:

```bash
pnpm exec convex env set GOOGLE_CLIENT_ID
pnpm exec convex env set GOOGLE_CLIENT_SECRET
pnpm exec convex env set RESEND_API_KEY
pnpm exec convex env set EMAIL_FROM
```

`SITE_URL` must match `NEXT_PUBLIC_SITE_URL` and the browser origin exactly,
including the port.

### KitCN / JWKS Bootstrap

This template reads `JWKS` through KitCN's typed environment helper and uses
the static key set when it exists, with the dynamic endpoint as the clean
bootstrap fallback:

```ts
const jwks = getAuthJwks()

providers: [
  jwks ? getAuthConfigProvider({ jwks }) : getAuthConfigProvider(),
]
```

Do not read `process.env.JWKS` directly in `convex/auth.config.ts`. A brand-new
Convex deployment cannot have `JWKS` until KitCN has generated auth functions,
those functions have been pushed, and `kitcn env push` has called
`generated/auth:getLatestJwks`. The helper keeps that first pass safe; the final
deploy automatically switches both Convex JWT verification and the Better Auth
plugin to static JWKS.

If `kitcn env push` fails with:

```txt
Could not find function for 'generated/auth:getLatestJwks'
```

run:

```bash
pnpm exec kitcn codegen
pnpm exec convex dev --once
pnpm exec kitcn env push
```

If `generated/auth:getLatestJwks` exists but crashes during env push, confirm
the active deployment has the correct `SITE_URL`, then rerun:

```bash
pnpm exec convex env get SITE_URL
pnpm exec kitcn env push
```

Before bootstrapping production auth, configure `SITE_URL`, `DEPLOY_ENV`, OAuth
credentials, email credentials, and any other deployment-specific values
directly on the production deployment. For example:

```bash
pnpm exec convex env set --prod DEPLOY_ENV production
pnpm exec convex env set --prod SITE_URL https://app.example.com
```

Then deploy the bootstrap auth functions, push only the KitCN-managed shared
auth values, regenerate against the resulting JWKS, and deploy again:

```bash
pnpm exec convex deploy
pnpm exec kitcn env push --prod
pnpm exec kitcn codegen
pnpm exec convex deploy
```

Use `app-auth.config.ts` to control which auth features appear in the UI. When enabling or disabling deeper auth capabilities, keep the Better Auth server/client plugin setup in sync.
