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
- ensures `DEPLOY_ENV=development` and `SITE_URL=http://localhost:3000`
- creates or links the Convex dev deployment
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

Create Convex deployment env for auth. At minimum, local auth needs the browser
origin in `SITE_URL`.

```bash
mkdir -p convex
printf "DEPLOY_ENV=development\nSITE_URL=http://localhost:3000\n" > convex/.env
```

On PowerShell:

```powershell
Set-Content convex\.env "DEPLOY_ENV=development`nSITE_URL=http://localhost:3000"
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

Convex deployment env lives in `convex/.env` locally and is pushed with
`pnpm exec kitcn env push`.

Required local values:

```bash
DEPLOY_ENV=development
SITE_URL=http://localhost:3000
```

Optional auth provider values:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
```

`SITE_URL` must match `NEXT_PUBLIC_SITE_URL` and the browser origin exactly,
including the port.

### KitCN / JWKS Bootstrap

This template keeps `convex/auth.config.ts` bootstrap-safe by using KitCN's
dynamic JWKS provider:

```ts
providers: [getAuthConfigProvider()]
```

Do not make a clean setup depend on `process.env.JWKS` in
`convex/auth.config.ts`. A brand-new Convex deployment cannot have `JWKS` until
KitCN has generated auth functions, those functions have been pushed, and
`kitcn env push` has called `generated/auth:getLatestJwks`.

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
`convex/.env` has `SITE_URL=http://localhost:3000`, then rerun:

```bash
pnpm exec kitcn env push
```

For production, deploy first, then push production auth env:

```bash
pnpm exec convex deploy --prod
pnpm exec kitcn env push --prod
```

Use `app-auth.config.ts` to control which auth features appear in the UI. When enabling or disabling deeper auth capabilities, keep the Better Auth server/client plugin setup in sync.
