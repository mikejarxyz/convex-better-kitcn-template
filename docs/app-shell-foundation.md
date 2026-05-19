# App shell foundation

This is the canonical guide for this reusable template: **Next.js App Router + Convex + KitCN + Better Auth + shadcn/ui**.

The template should be self-contained. It should not depend on another product app, historical extraction notes, or project-specific cleanup lists. When this document and the codebase diverge, trust the codebase and update this file.

**Target baseline:** a protected `/app` dashboard shell with email/password auth, **Google OAuth**, Convex-backed sessions, shadcn/ui primitives, and server-side authorization through Convex identity.

---

## Table of Contents

1. [Template Goal](#1-template-goal)
2. [Stack](#2-stack)
3. [Phases](#3-phases)
4. [Architecture](#4-architecture)
5. [Setup Process](#5-setup-process)
6. [KitCN and JWKS Bootstrap](#6-kitcn-and-jwks-bootstrap)
7. [Environment Variables](#7-environment-variables)
8. [File Manifest](#8-file-manifest)
9. [App Shell Composition](#9-app-shell-composition)
10. [Auth Configuration](#10-auth-configuration)
11. [Authorization Patterns](#11-authorization-patterns)
12. [Route Protection](#12-route-protection)
13. [Optional Modules](#13-optional-modules)
14. [Troubleshooting](#14-troubleshooting)
15. [Verification Checklist](#15-verification-checklist)
16. [Convex Rules](#16-convex-rules)
17. [References](#17-references)

---

## 1. Template Goal

This repository is a reusable app starter. A new project created from it should already have:

| Layer | Delivers |
| --- | --- |
| Framework | Next.js App Router in `src/app`, React 19, TypeScript, Tailwind v4 |
| UI | shadcn/ui, semantic theme tokens, app shell primitives |
| Backend | Convex schema, functions, generated API, HTTP auth routes |
| Auth | Better Auth through KitCN only: email/password, Google OAuth, Convex session store, JWT validation |
| Client | `ConvexAuthProvider`, `authClient`, sign-in/up/account flows |
| Protected UI | `/app` layout with sidebar, top bar, breadcrumbs, theme, toaster, `AppAuthGate` |
| Security boundary | Convex functions derive identity with `ctx.auth.getUserIdentity()` |

Feature-gated in the starter shell:

- Credentials, Google OAuth, account profile editing, linked accounts, two-factor authentication, and passkeys are controlled from `app-auth.config.ts`.
- UI should read `AUTH_FEATURES` instead of hard-coding whether auth features are enabled.
- Server-side Better Auth and Convex configuration must still match the enabled feature set.

Out of scope for the reusable shell: product-specific routes, tables, assets, copy, and integrations. Larger SaaS capabilities such as billing and transactional email belong in [Optional Modules](#13-optional-modules).

---

## 2. Stack

| Package | Role |
| --- | --- |
| `next` | App Router and `/api/auth` route handler |
| `react`, `react-dom` | UI runtime |
| `convex` | Database, functions, generated API, HTTP router |
| `kitcn` | Better Auth + Convex integration: codegen, `defineAuth`, HTTP registration, Next proxy, provider hooks |
| `better-auth` | Auth protocols, plugins, client API |
| `shadcn` | UI CLI and component source |
| `tailwindcss` | Tailwind v4 styling |

### Ownership

| Layer | Owner | Responsibility |
| --- | --- | --- |
| Credential/session protocols | Better Auth | Email/password, Google OAuth, plugin model, client methods |
| Convex + Next glue | KitCN | Generated auth runtime, `convex()` plugin, `registerRoutes`, `convexBetterAuth`, `ConvexAuthProvider`, `useAuth` |
| Runtime and persistence | Convex | Auth tables, JWT validation, HTTP routes, server-side identity |
| App shell | This template | UI, route structure, auth pages, authorization helpers, branding placeholders |

Do not hand-roll Better Auth's Convex adapter or raw Next auth routes unless KitCN cannot support a requirement.

This project uses **root-level** `convex/*.ts` files. It does not use `convex/functions/*.ts`.

---

## 3. Phases

### Phase 1: Initial Template Shell

Required for the first reusable GitHub template:

- Next.js App Router scaffold
- Convex connected and codegen working
- KitCN + Better Auth core auth
- Email/password sign-up and sign-in
- **Google OAuth**
- shadcn initialized
- Root provider stack
- `/sign-in`, `/sign-up`
- Protected `/app`, `/app/account`
- `AppAuthGate`
- App shell sidebar/top bar/content layout
- One protected Convex query proving authenticated access
- `.env.example`
- Lint/build verification

### Optional Modules

The repository may include optional auth modules, but they should be controlled from `app-auth.config.ts` so a new app can quickly switch them on or off:

- `AUTH_CONFIG.providers.credentials`
- `AUTH_CONFIG.providers.google`
- `AUTH_CONFIG.account.profile`
- `AUTH_CONFIG.account.linkedAccounts`
- `AUTH_CONFIG.security.twoFactor`
- `AUTH_CONFIG.security.passkeys`

Keep non-auth SaaS modules optional and removable. The base template should not require Resend or Polar credentials to run.

---

## 4. Architecture

### Auth Request Flow

```txt
Browser
  -> authClient
  -> same-origin /api/auth/*
  -> Next route: src/app/api/auth/[...all]/route.ts
  -> kitcn convexBetterAuth handler
  -> Convex site URL
  -> convex/http.ts registerRoutes(...)
  -> convex/auth.ts defineAuth(...)
  -> Convex auth tables
```

### Protected Data Flow

```txt
Browser
  -> ConvexReactClient query/mutation with auth token
  -> convex/auth.config.ts validates JWT
  -> KitCN/Better Auth session lookup
  -> Convex handler calls ctx.auth.getUserIdentity()
  -> app data scoped by server-derived identity
```

### Security Boundary

| Layer | Purpose | Security boundary? |
| --- | --- | --- |
| `AppAuthGate` | Client redirect and loading UX | No |
| Optional Next `proxy.ts` | Faster optimistic redirects | No |
| Convex functions | Real authorization | Yes |

Never authorize from a client-passed `userId`. Always derive identity server-side.

---

## 5. Setup Process

Follow this order for a clean template.

### 1. Install and Confirm Core Project

- Next.js App Router under `src/app`
- TypeScript strict mode
- Tailwind v4 via `src/app/globals.css`
- Convex initialized
- Package manager: `pnpm`

### 2. Initialize shadcn

Create `components.json` and align it with this template:

- Tailwind CSS file: `src/app/globals.css`
- Import alias: `@/*`
- UI destination: `src/components/ui`
- Utility helper: `src/lib/utils.ts`
- Icon library: decide once and use consistently

Use shadcn components before writing custom UI primitives.

### 3. Add KitCN Auth

Install and scaffold KitCN + Better Auth for Convex:

```bash
pnpm add kitcn better-auth convex
npx kitcn codegen
```

Expected Convex auth files:

- `convex/auth.ts`
- `convex/auth.config.ts`
- `convex/authSchema.ts`
- `convex/generated/auth.ts`
- `convex/http.ts`

### 4. Configure Environment

Create `.env.local` and `.env.example` with the variables in [Environment Variables](#7-environment-variables).

Follow [KitCN and JWKS Bootstrap](#6-kitcn-and-jwks-bootstrap) for the first auth runtime deployment and JWKS push.

### 5. Wire Next Auth Proxy

Create:

- `src/lib/convex/auth-client.ts`
- `src/lib/convex/server.ts`
- `src/app/api/auth/[...all]/route.ts`
- `src/components/ConvexClientProvider.tsx`

The browser should call same-origin `/api/auth/*`; Next proxies to Convex through KitCN.

### 6. Wire Root Providers

`src/app/layout.tsx` should wrap the app with:

```txt
ConvexClientProvider
  ThemeProvider
    TooltipProvider
      children
    Toaster
```

### 7. Build Auth UI

Initial shell auth UI:

- `/sign-in`
- `/sign-up`
- Google OAuth button
- Account page at `/app/account`
- Sign-out action in the user menu

### 8. Build Protected App Shell

Create:

- `src/app/app/layout.tsx`
- `src/app/app/page.tsx`
- `src/app/app/account/page.tsx`
- `src/components/app-auth-gate.tsx`
- `src/components/app-shell.tsx`
- `src/components/app-sidebar.tsx`
- `src/components/app-shell-top-bar.tsx`
- `src/components/app-page-content.tsx`
- `src/components/app-breadcrumbs.tsx`
- `src/components/nav-user.tsx`
- `src/config/app-shell.ts`
- `src/lib/constants/routes.ts`

### 9. Add Protected Convex Helper

Create `convex/lib/auth.ts`:

```ts
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx | ActionCtx;

export async function requireIdentity(ctx: Pick<AuthCtx, "auth">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity;
}
```

### 10. Follow Convex Domain Organization

For app-owned Convex domains, follow [convex-organization-pattern.md](./convex-organization-pattern.md):

```txt
convex/<domain>.ts          # public query/mutation/action entrypoints
convex/<domain>_impl/       # schema, model, repo, errors, access helpers
```

Keep Better Auth-owned tables in `convex/authSchema.ts`. For real app domains, put tables in `<domain>_impl/schema.ts` and spread them into `convex/schema.ts`.

### 11. Verify

Run:

```bash
pnpm run lint
pnpm run build
```

Then verify auth in the browser against running `pnpm dev` and `npx convex dev`.

---

## 6. KitCN and JWKS Bootstrap

KitCN auth has a one-time bootstrap ordering requirement for new Convex deployments:

1. The generated auth functions must exist in Convex before `kitcn env push` can call `generated/auth:getLatestJwks`.
2. The static `JWKS` env value should be pushed after those functions exist.
3. After `JWKS` exists, restore the static-JWKS fallback in `convex/auth.config.ts` and regenerate.

### First Bootstrap for a New Template Deployment

Start with the dynamic provider only:

```ts
// convex/auth.config.ts - temporary first bootstrap form
import { getAuthConfigProvider } from "kitcn/auth/config";
import type { AuthConfig } from "convex/server";

export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig;
```

Then run:

```bash
pnpm exec kitcn codegen
pnpm exec convex dev --once
pnpm exec kitcn env push
```

What each command does:

| Command | Purpose |
| --- | --- |
| `pnpm exec kitcn codegen` | Generates KitCN auth runtime files and Convex bindings |
| `pnpm exec convex dev --once` | Pushes current Convex functions to the active dev deployment once |
| `pnpm exec kitcn env push` | Generates/syncs `BETTER_AUTH_SECRET` and `JWKS` to Convex env |

After `kitcn env push` succeeds, switch `convex/auth.config.ts` to the normal static-JWKS fallback:

```ts
import { getAuthConfigProvider } from "kitcn/auth/config";
import type { AuthConfig } from "convex/server";

export default {
  providers: [
    process.env.JWKS
      ? getAuthConfigProvider({ jwks: process.env.JWKS })
      : getAuthConfigProvider(),
  ],
} satisfies AuthConfig;
```

Then run:

```bash
pnpm exec kitcn codegen
pnpm exec convex dev --once
```

### Normal Repeatable Flow After Bootstrap

After `JWKS` exists in Convex env:

```bash
pnpm exec kitcn codegen
pnpm exec convex dev --once
pnpm exec kitcn env push
```

Use `kitcn env push` again when adding auth plugins, rotating keys, or repairing a deployment. Key rotation signs users out:

```bash
pnpm exec kitcn env push --rotate
```

For production:

```bash
pnpm exec convex deploy --prod
pnpm exec kitcn env push --prod
```

### Common Bootstrap Failure

If `kitcn env push` fails with:

```txt
Could not find function for 'generated/auth:getLatestJwks'
```

then the generated auth functions are not deployed yet. Run:

```bash
pnpm exec kitcn codegen
pnpm exec convex dev --once
pnpm exec kitcn env push
```

If codegen fails because `JWKS` is referenced but missing, temporarily use the dynamic-only `auth.config.ts` form above, deploy once, push env, then restore static-JWKS fallback.

---

## 7. Environment Variables

### `.env.local`

| Variable | Required | Role |
| --- | --- | --- |
| `CONVEX_DEPLOYMENT` | Yes | Local Convex deployment id |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex client WebSocket URL |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Yes | Convex HTTP site URL for KitCN proxy |
| `NEXT_PUBLIC_SITE_URL` | Yes | Browser app origin and Better Auth client base URL |
| `GOOGLE_CLIENT_ID` | Yes for Phase 1 OAuth | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Yes for Phase 1 OAuth | Google OAuth client secret |

### Convex Deployment Env

| Variable | Required | Role |
| --- | --- | --- |
| `SITE_URL` | Yes | Better Auth base URL, trusted origin, CORS origin |
| `BETTER_AUTH_SECRET` | Yes | Better Auth secret pushed by KitCN |
| `JWKS` | Yes for deployed auth | Static JWKS JSON pushed by KitCN |
| `GOOGLE_CLIENT_ID` | Yes for Phase 1 OAuth | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Yes for Phase 1 OAuth | Google OAuth client secret |
| `AUTH_EXTRA_ORIGINS` | No | Comma-separated extra origins for alternate local ports/tunnels |

### Optional Module Env

| Variable | Module |
| --- | --- |
| `RESEND_API_KEY` | Resend email |
| `EMAIL_FROM` | Resend email |
| `POLAR_ACCESS_TOKEN` | Polar billing |
| `POLAR_SERVER` | Polar billing, `sandbox` or `production` |

### Origin Rule

```txt
SITE_URL === NEXT_PUBLIC_SITE_URL === origin in the browser
```

The scheme, host, and port must match. If Next runs on `http://localhost:3001` but Convex `SITE_URL` is `http://localhost:3000`, auth will fail with fetch, CORS, or trusted-origin errors.

---

## 8. File Manifest

### Convex Required

| File | Responsibility |
| --- | --- |
| `convex/auth.ts` | Better Auth options, Google OAuth, KitCN `convex()` plugin |
| `convex/auth.config.ts` | Convex JWT provider config |
| `convex/authSchema.ts` | Better Auth table definitions generated by KitCN |
| `convex/schema.ts` | `defineSchema({ ...authSchema, ...appTables })` |
| `convex/generated/auth.ts` | KitCN generated auth runtime; do not edit |
| `convex/http.ts` | `registerRoutes(http, getAuth, { cors })` |
| `convex/authOrigins.ts` | Optional helper for `AUTH_EXTRA_ORIGINS` |
| `convex/auth_impl/access.ts` | `requireIdentity()` helper and auth access gates |
| `convex/lib/auth.ts` | Compatibility re-export for auth helpers |
| `convex/lib/errors.ts` | Structured app error catalog |
| `convex/<domain>.ts` | Thin public entrypoints for app-owned domains |
| `convex/<domain>_impl/schema.ts` | Domain tables spread into `convex/schema.ts` |
| `convex/<domain>_impl/model.ts` | Domain business rules and orchestration |
| `convex/<domain>_impl/repo.ts` | Indexed `ctx.db` reads/writes |
| `convex/_generated/ai/guidelines.md` | Convex AI rules; read before editing Convex code |

### Next / React Required

| File | Responsibility |
| --- | --- |
| `src/lib/convex/auth-client.ts` | `createAuthClient`, `convexClient()`, Google auth client wiring |
| `src/lib/convex/server.ts` | `convexBetterAuth({ api, convexSiteUrl })` |
| `src/app/api/auth/[...all]/route.ts` | Exports `GET` and `POST` from KitCN handler |
| `src/components/ConvexClientProvider.tsx` | `ConvexAuthProvider` and `ConvexReactClient` |
| `src/app/layout.tsx` | Root provider stack |
| `src/app/page.tsx` | Public landing or redirect |
| `src/app/app/layout.tsx` | Protected app layout |
| `src/app/app/page.tsx` | Dashboard placeholder |
| `src/app/app/account/page.tsx` | Account page |
| `src/app/sign-in/page.tsx` | Sign-in UI |
| `src/app/sign-up/page.tsx` | Sign-up UI |
| `src/components/app-auth-gate.tsx` | Client auth gate |
| `src/components/app-shell.tsx` | App frame |
| `src/components/app-sidebar.tsx` | Navigation |
| `src/components/app-shell-top-bar.tsx` | Breadcrumbs/mobile controls |
| `src/components/app-page-content.tsx` | Content layout |
| `src/components/app-breadcrumbs.tsx` | Route breadcrumbs |
| `src/components/nav-user.tsx` | User menu and sign-out |
| `src/config/app-shell.ts` | Shell configuration |
| `src/lib/constants/routes.ts` | Route constants |

### shadcn Required

| File | Responsibility |
| --- | --- |
| `components.json` | shadcn project config |
| `src/app/globals.css` | Tailwind v4 and theme variables |
| `src/components/ui/*` | shadcn primitives |
| `src/lib/utils.ts` | `cn()` helper |

### Optional Modules

| File | Module |
| --- | --- |
| `convex/email.ts` | Resend email sending |
| `convex/emails/*` | Email templates |
| `convex/convex.config.ts` | Convex component registration, if needed |
| `src/app/sign-in/2fa/page.tsx` | Two-factor challenge |
| `src/app/app/billing/page.tsx` | Polar billing UI |
| `convex/billing*.ts` | Billing functions |
| `convex/polarWebhooks.ts` | Polar webhook handling |

---

## 9. App Shell Composition

### Root Provider Stack

```txt
src/app/layout.tsx
  ConvexClientProvider
    ThemeProvider
      TooltipProvider
        children
      Toaster
```

### Protected Stack

```txt
src/app/app/layout.tsx
  AppAuthGate
    AppShell
      AppSidebar
      AppShellTopBar
      AppPageContent
        children
```

### Starter Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing or redirect |
| `/sign-in` | Email/password and Google sign-in |
| `/sign-up` | Registration and Google sign-up |
| `/app` | Authenticated dashboard |
| `/app/account` | Account and session controls |

### Redirect Policy

```txt
Authenticated -> /sign-in or /sign-up  => /app
Unauthenticated -> /app/*              => /sign-in
Sign-in/sign-up success                => /app
Sign-out success                       => /sign-in or /
```

### Branding Placeholders

Keep these easy to replace:

- `APP_NAME`
- `APP_DESCRIPTION`
- `APP_URL`
- `APP_DASHBOARD_PATH`
- `DEFAULT_THEME`

---

## 10. Auth Configuration

### Feature Flags

`app-auth.config.ts` is the template-level source of truth for optional auth UI. Keep feature checks centralized there:

```ts
export const AUTH_CONFIG = {
  providers: {
    credentials: true,
    google: true,
  },
  account: {
    profile: true,
    linkedAccounts: true,
  },
  security: {
    passkeys: true,
    twoFactor: true,
  },
} as const;
```

Use `AUTH_FEATURES` in pages and components rather than duplicating feature decisions. When a feature is disabled, its UI entry points should disappear and routes should redirect or render an unavailable state. When a feature is enabled, confirm the matching Better Auth server plugin, client plugin, routes, and environment variables are wired.

### Server Auth

`convex/auth.ts` should include:

- Email/password auth
- Google OAuth provider
- Feature plugins that match `app-auth.config.ts`
- `convex({ authConfig, jwks })`
- `baseURL: process.env.SITE_URL!`
- `trustedOrigins: [process.env.SITE_URL!, ...extraOrigins]`
- Session expiration policy
- Telemetry disabled unless intentionally enabled

Minimal shape:

```ts
import { convex } from "kitcn/auth";
import authConfig from "./auth.config";
import { defineAuth } from "./generated/auth";

export default defineAuth(() => ({
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  baseURL: process.env.SITE_URL!,
  plugins: [
    convex({
      authConfig,
      jwks: process.env.JWKS,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24 * 15,
  },
  telemetry: { enabled: false },
  trustedOrigins: [process.env.SITE_URL!],
}));
```

### Client Auth

`src/lib/convex/auth-client.ts` should include:

- `createAuthClient`
- `baseURL: process.env.NEXT_PUBLIC_SITE_URL!`
- `convexClient()`
- Feature client plugins that match `app-auth.config.ts`

Feature-gated UI should import from `src/config/auth.ts`, which re-exports the root `app-auth.config.ts`.

### Convex HTTP

`convex/http.ts`:

```ts
import { httpRouter } from "convex/server";
import { registerRoutes } from "kitcn/auth/http";
import { getAuth } from "./generated/auth";

const http = httpRouter();

registerRoutes(http, getAuth, {
  cors: {
    allowedOrigins: [process.env.SITE_URL!],
  },
});

export default http;
```

### JWT Config

`convex/auth.config.ts`:

```ts
import type { AuthConfig } from "convex/server";
import { getAuthConfigProvider } from "kitcn/auth/config";

export default {
  providers: [
    process.env.JWKS
      ? getAuthConfigProvider({ jwks: process.env.JWKS })
      : getAuthConfigProvider(),
  ],
} satisfies AuthConfig;
```

---

## 11. Authorization Patterns

Use an auth access helper in `convex/auth_impl/access.ts` with structured errors:

```ts
import { throwAppError } from "../lib/errors";

export async function requireIdentity(ctx: { auth: QueryCtx["auth"] }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throwAppError("UNAUTHORIZED", "Not authenticated");
  return identity;
}
```

Use `identity.tokenIdentifier` as the default owner key for app-owned rows.

Example domain table in `convex/things_impl/schema.ts`:

```ts
export const thingsTable = defineTable({
  ownerTokenIdentifier: v.string(),
  label: v.string(),
  createdAt: v.number(),
}).index("by_ownerTokenIdentifier", ["ownerTokenIdentifier"]),
```

Spread it into `convex/schema.ts`:

```ts
export default defineSchema({
  ...authSchema,
  things: thingsTable,
});
```

Thin public entrypoint in `convex/things.ts`:

```ts
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return await listMineModel(ctx, identity);
  },
});
```

Rules:

1. Validate all public function arguments.
2. Call `requireIdentity` at the start of protected handlers.
3. Never trust client-supplied user identifiers.
4. Use indexes for ownership filters.
5. Bound reads with `.take()` or pagination.
6. Do not use `Date.now()` in queries.
7. Schedule only internal functions from mutations/actions.
8. Follow `convex-organization-pattern.md` for app-owned domains.
9. Keep auth-specific helpers in `convex/auth_impl/`.
10. Use `convex/lib/errors.ts` and domain `_impl/errors.ts` for structured `ConvexError` payloads.

---

## 12. Route Protection

### Client Gate

`AppAuthGate` should use KitCN auth state:

```ts
const { isAuthenticated, isLoading } = useAuth();
```

Behavior:

- `isLoading`: render stable loading state
- `!isAuthenticated`: redirect to `/sign-in`
- `isAuthenticated`: render children

Use `isAuthenticated` for protected views, not only token presence.

### Optional Next Proxy

Add `proxy.ts` only if redirect flash becomes a problem. Treat it as UX only, not authorization.

If added, scope it narrowly:

```txt
matcher: ["/app/:path*"]
```

### Required Convex Enforcement

Every protected query, mutation, and action must enforce identity server-side.

---

## 13. Optional Modules

Optional modules should either be controlled by `app-auth.config.ts` for auth features or isolated behind their own config/env gates for product modules. A new app should be able to disable unused modules without editing unrelated shell code.

### Resend Email

Adds:

- Email verification
- Password reset
- Auth email templates

Expected changes:

- Add Resend dependency/component
- Add `convex/email.ts`
- Add `convex/emails/*`
- Add `RESEND_API_KEY` and `EMAIL_FROM`
- Wire Better Auth email callbacks in `convex/auth.ts`

The base template should run without Resend configured.

### Two-Factor Authentication

Controlled by `AUTH_CONFIG.security.twoFactor`. When enabled, it uses:

- Better Auth `twoFactor` server plugin
- `twoFactorClient` client plugin
- `/sign-in/2fa`
- Account page controls for setup/disable
- Backup codes if supported by the chosen Better Auth config

When disabled, hide account controls and prevent the 2FA challenge route from being part of normal auth flow.

### Passkeys

Controlled by `AUTH_CONFIG.security.passkeys`. When enabled, it uses:

- Better Auth `passkey` server plugin
- `passkeyClient` client plugin
- Account page passkey management
- Passkey sign-in option

When disabled, hide passkey sign-in and account controls. Passkey RP settings must derive from `SITE_URL` and app branding.

### Polar Billing

Adds:

- Polar Better Auth plugin
- Billing page under `/app/billing`
- Checkout/customer portal actions
- Polar webhook HTTP route
- `POLAR_ACCESS_TOKEN`
- `POLAR_SERVER`

Keep billing isolated so projects that do not need payments can remove it cleanly.

---

## 14. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Failed to fetch` on sign-in | Origin mismatch | Align `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, and browser URL |
| CORS error from Convex site | Origin missing from allowed list | Update `SITE_URL` or `AUTH_EXTRA_ORIGINS` |
| `getUserIdentity()` is always null | Missing/wrong `auth.config.ts` or JWKS | Run `npx kitcn env push`; verify `JWKS` |
| Auth UI works but Convex queries fail | Convex client is not auth-wrapped | Confirm `ConvexAuthProvider` wraps app |
| Generated auth is disabled | Missing `convex/auth.ts` | Add auth config and run KitCN codegen |
| Google OAuth redirects fail | OAuth callback mismatch | Confirm Google console callback matches site origin and auth route |
| `generated/auth:getLatestJwks` missing | Auth functions not pushed yet | Run first bootstrap flow in §6 |
| Codegen says `JWKS` is used but unset | Static-JWKS config before first push | Temporarily use dynamic provider, push functions, run `kitcn env push`, then restore static fallback |

Useful commands:

```bash
pnpm exec kitcn codegen
pnpm exec convex dev --once
pnpm exec kitcn env push
pnpm run lint
pnpm run build
```

---

## 15. Verification Checklist

### Automated

- [ ] `pnpm install` works from a clean checkout
- [ ] `pnpm run lint`
- [ ] `pnpm run build`
- [ ] Convex codegen succeeds
- [ ] `pnpm exec convex dev --once` succeeds
- [ ] `pnpm exec kitcn env push` succeeds after auth functions are deployed
- [ ] `convex/_generated/ai/guidelines.md` exists
- [ ] `components.json` exists

### Auth HTTP

- [ ] `src/app/api/auth/[...all]/route.ts` exports `GET` and `POST`
- [ ] `convex/http.ts` calls `registerRoutes(http, getAuth, ...)`
- [ ] `convex/generated/auth.ts` is not in disabled mode

### Browser

- [ ] Email/password sign-up creates user/session
- [ ] Email/password sign-in lands on `/app`
- [ ] Google OAuth sign-in lands on `/app`
- [ ] Unauthenticated `/app` redirects to `/sign-in`
- [ ] Authenticated `/sign-in` redirects to `/app`
- [ ] Sign-out clears session
- [ ] Protected Convex query returns data when signed in
- [ ] Protected Convex query rejects when signed out

### Optional Modules

- [ ] Resend email verification
- [ ] Password reset
- [ ] Enabled auth features in `app-auth.config.ts` match server/client plugins
- [ ] 2FA setup and challenge, if enabled
- [ ] Passkey registration and login, if enabled
- [ ] Polar checkout/portal in sandbox
- [ ] Polar webhook handling

---

## 16. Convex Rules

Before editing Convex code, read:

```txt
convex/_generated/ai/guidelines.md
```

Rules to preserve:

- Schemas live in `convex/schema.ts`.
- Every public function has argument validators.
- Authorization uses `ctx.auth.getUserIdentity()` or `requireIdentity`.
- Prefer `identity.tokenIdentifier` for ownership indexes.
- Use index-backed queries.
- Avoid unbounded `.collect()`.
- Do not use `Date.now()` in queries.
- Schedule internal functions only.
- Use `"use node"` only in action files that need Node APIs.
- Auth helpers live in `convex/auth_impl/`; `convex/lib/auth.ts` may re-export for compatibility.
- App-owned domains use `convex/<domain>.ts` plus `convex/<domain>_impl/`.
- Structured errors use `convex/lib/errors.ts` or domain `_impl/errors.ts`.

---

## 17. References

| Topic | URL |
| --- | --- |
| KitCN Auth overview | https://www.better-convex.com/docs/auth |
| KitCN Auth server | https://www.better-convex.com/docs/auth/server |
| KitCN Auth client | https://www.better-convex.com/docs/auth/client |
| KitCN Next.js | https://www.better-convex.com/docs/nextjs |
| Better Auth Next.js | https://better-auth.com/docs/integrations/next |
| Better Auth Convex | https://better-auth.com/docs/integrations/convex |
| Convex auth in functions | https://docs.convex.dev/auth/functions-auth |
| Next.js authentication guide | https://nextjs.org/docs/app/guides/authentication |
| Local Convex organization pattern | ./convex-organization-pattern.md |
| Local Convex error handling | ./convex-error-handling.md |

---

## Quick Reference

```txt
Client auth base URL   -> NEXT_PUBLIC_SITE_URL
Next auth route        -> /api/auth/*
Convex HTTP target     -> NEXT_PUBLIC_CONVEX_SITE_URL
Better Auth base URL   -> Convex SITE_URL
Security boundary      -> requireIdentity() in Convex
Initial OAuth          -> Google only
Optional modules       -> app-auth.config.ts for auth, isolated config/env for SaaS modules
Codegen                -> npx kitcn codegen
Env sync               -> npx kitcn env push
First JWKS bootstrap   -> codegen -> convex dev --once -> kitcn env push -> restore static JWKS -> codegen
```
