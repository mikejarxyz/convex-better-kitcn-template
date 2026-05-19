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

Run the app and Convex dev server:

```bash
pnpm dev
pnpm exec convex dev
```

Verify before shipping template changes:

```bash
pnpm run lint
pnpm run build
```

## Configuration

Copy `.env.example` to `.env.local` and fill in the Convex and auth values. Convex deployment env values are documented in `docs/app-shell-foundation.md`.

Use `app-auth.config.ts` to control which auth features appear in the UI. When enabling or disabling deeper auth capabilities, keep the Better Auth server/client plugin setup in sync.
