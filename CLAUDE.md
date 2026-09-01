<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Local Convex development with kitcn

Always start the local backend with `pnpm exec kitcn dev`, not
`npx convex dev`. KitCN owns the Convex loop plus project codegen, migrations,
aggregate backfills, and local auth/environment synchronization. Use raw Convex
commands only when KitCN does not wrap the operation or its documentation
explicitly requires one.

Before changing KitCN, Better Auth, their auth schema, or the Convex version,
follow `docs/auth-stack-upgrades.md`.
