# Convex `_impl` Organization Pattern

Folder layout for large Convex backends in this repo. Pair with [convex-error-handling.md](./convex-error-handling.md) and `convex/_generated/ai/guidelines.md`.

## Problem

Flat `convex/*.ts` files that mix validators, auth gates, business rules, and `ctx.db` access become hard to navigate past roughly ten domains. Nesting everything under `convex/<domain>/index.ts` reduces clutter but **changes the public API path** to `api.<domain>.index.*`, which we do not want for app clients.

## Decision

Split each business domain into two siblings:

- **`convex/<domain>.ts`** — public Convex entrypoints (`query`, `mutation`, `action`) with `v.*` args, auth gates, and thin handlers.
- **`convex/<domain>_impl/`** — plain TypeScript modules for schema, model, repo, errors, access, and helpers. The `_impl` suffix marks implementation detail, not the primary client API.

Add optional root surfaces when HTTP or API-key contracts differ from the app: `convex/<domain>Api.ts`, `convex/*ApiQueries.ts`.

## Why `_impl` beside the root entrypoint

Convex registers functions from **file path**. `catalog.ts` maps to `api.catalog.*`. Implementation lives in `catalog_impl/` without nesting the public module. `_impl` files may export `internalQuery` / `internalMutation` / `internalAction` (e.g. `internal.catalog_impl.getCatalogWithKey`) for actions, HTTP routes, and schedulers—they are not the main `useQuery` surface.

## Standard `_impl` files

| File | Role |
|------|------|
| `schema.ts` | Domain tables; spread into `convex/schema.ts` |
| `model.ts` | Business rules, orchestration, DTO mapping |
| `repo.ts` | Indexed `ctx.db` access |
| `errors.ts` | Domain catalog (`code`, `message`, `httpStatus`) — see [convex-error-handling.md](./convex-error-handling.md) |
| `access.ts`, `constants.ts`, `queries.ts` | Permissions, enums, read helpers as needed |

Delegation is one-way: **`<domain>.ts` → `_impl/model` → `_impl/repo` → DB**.

## Call surfaces (shared model)

```
UI (useQuery) ──────────► convex/<domain>.ts ──► <domain>_impl/model
Server (fetchAuth*) ────► convex/<domain>.ts ──► <domain>_impl/model
Next API route ─────────► convex/*Api.ts ──────► <domain>_impl (often internal.*)
```

Security and invariants belong in `_impl` (especially `model.ts` and `access.ts`), not in React or route handlers. Return serializable DTOs across every boundary.

## When to use

**Use** for org-scoped domains with real schema and workflows (catalog, CRM, quotes, tasks, billing, etc.).

**Skip or lighten** for thin infrastructure (`permissions.ts`, shared `lib/`), BetterAuth-owned tables, or one-off utilities. Auth/orgs may use `_impl` for helpers without a full model/repo split.

## Porting checklist

1. Add `convex/<domain>.ts` and `convex/<domain>_impl/`.
2. Move tables to `<domain>_impl/schema.ts`; spread into root `schema.ts`.
3. Move `ctx.db` calls to `repo.ts`; workflows to `model.ts`.
4. Keep entrypoints thin: validators, auth, delegate, return DTOs.
5. Add `*Api.ts` only when external HTTP shape differs from the app API.

## Related docs (this repo)

- [convex-error-handling.md](./convex-error-handling.md) — catalogs, throw/catch by layer
- [app-shell-foundation.md](./app-shell-foundation.md) — Next + KitCN auth, env, `requireIdentity`
- `convex/_generated/ai/guidelines.md` — validators, indexes, scheduler rules
