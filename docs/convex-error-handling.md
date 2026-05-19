# Convex Error Handling

Throw **`ConvexError`** with structured `{ code, message, httpStatus }` so API routes and clients can branch on `code`, not string parsing.

- **`convex/lib/errors.ts`** — cross-cutting codes + `appError`, `throwAppError`, `throwConvexError`, `isAppError`.
- **`convex/<domain>_impl/errors.ts`** — domain codes only (`CATALOG_NAME_TAKEN`, …); same `AppError` shape. Do **not** add domain codes to `appErrors`.

```ts
import { throwAppError, throwConvexError, type AppError } from "../lib/errors";

throwAppError("FORBIDDEN");
throwConvexError(catalogError("NAME_TAKEN")); // domain catalog → AppError
```

## By layer

| Layer | Pattern |
| --- | --- |
| Convex | `throwAppError` for shared codes; `throwConvexError(catalogError(...))` for domain codes |
| UI | `catch`; show `error.data.message` when `isAppError(error)`, else `error.message` |
| Server actions | Bubble, or `{ success: false, error }` using `isAppError` when structure is needed |
| API routes | `isAppError` → `{ error: { code, message } }` with `httpStatus` from `error.data` |

## Rules

1. Define each message once in Convex (`lib` or `_impl/errors.ts`); UI does not duplicate copy.
2. Business rules throw from `_impl` / shared lib, not React or route handlers.
3. Prefer `throwAppError` / `ConvexError` over plain `Error` so `code` survives to HTTP and typed clients.
4. Add domain-only codes to `<domain>_impl/errors.ts`; keep billing/pack/rate-limit codes in `lib` when those features exist.

Related: [convex-organization-pattern.md](./convex-organization-pattern.md).
