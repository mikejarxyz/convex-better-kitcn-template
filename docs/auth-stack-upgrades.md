# Auth Stack Upgrade Runbook

KitCN owns the integration boundary between Convex and Better Auth in this
template. Upgrade `kitcn`, `better-auth`, and `@better-auth/passkey` as one
compatibility set, and check KitCN's Convex peer range before changing Convex.

## Routine upgrade checklist

1. Read every KitCN and Better Auth changelog entry between the installed and
   target versions. Treat auth schema changes as data migrations, not ordinary
   package bumps.
2. Check the target compatibility ranges before editing `package.json`:

   ```bash
   pnpm info kitcn@latest peerDependencies
   ```

3. Update the three auth packages together and keep
   `pnpm-workspace.yaml#minimumReleaseAgeExclude` aligned with the selected
   KitCN version when a newly published KitCN release must bypass the release
   age gate.
4. Preview KitCN's current raw-Convex auth scaffold before changing customized
   files:

   ```bash
   pnpm exec kitcn add auth --preset convex --yes --dry-run --diff
   ```

   Merge schema changes deliberately. Do not blindly overwrite
   `convex/authSchema.ts`; this template adds `avatarStorageId` to KitCN's
   generated auth schema.
5. Start the backend through KitCN:

   ```bash
   pnpm exec kitcn dev
   ```

   Do not use `convex dev` for the normal local loop. KitCN also runs codegen,
   migrations, aggregate backfills, and local auth/environment synchronization.
6. Verify the complete change:

   ```bash
   pnpm run check
   pnpm audit --audit-level low
   ```

   Manually exercise returning credential and OAuth sign-in, account unlinking,
   passkeys, and 2FA when those surfaces changed.
7. Deploy through KitCN so its post-deploy work is not skipped:

   ```bash
   pnpm exec kitcn deploy --prod
   ```

   `kitcn deploy` runs Convex deploy, pending KitCN migrations, and aggregate
   backfills. Confirm the selected deployment and its environment before using
   `--prod`.

## Current compatibility constraint

At the repository's current pins, KitCN `0.33.11` requires Better Auth `1.7.x`
and Convex `>=1.42 <1.47`. Keep Convex on `1.46.x` until the selected KitCN
release advertises support for Convex `1.47` or newer. Recheck the peer range;
do not rely on this paragraph after changing KitCN.

## KitCN 0.33.11 / Better Auth 1.7.10 upgrade

Upgrade KitCN, Better Auth, and the passkey package together. KitCN 0.33.11
fixes adapter arguments introduced by Better Auth 1.7.6, and its generated
auth module includes the `consumeOne` and `incrementOne` internal mutations.
Regenerate and deploy through KitCN before verifying the updated auth flows.

Better Auth 1.7.7 changes OAuth state encryption and verification identifier
prefixes. Upgrade servers sharing auth storage together, including OAuth Proxy
participants when used. OAuth sign-ins and account linking started before the
upgrade must be restarted; pre-upgrade magic links must be requested again.
Keep the existing account schema extensions and focus-refetch mitigation.

KitCN 0.33 changes ordering and cursor behavior for wide indexed filters and
indexed `select().flatMap()` relations. Recheck these queries when adding them;
the template currently has no app-owned queries using those patterns.

Release notes: [KitCN](https://github.com/udecode/kitcn/blob/main/packages/kitcn/CHANGELOG.md),
[Better Auth](https://github.com/better-auth/better-auth/blob/main/packages/better-auth/CHANGELOG.md).

### Verification on October 16, 2026

- `pnpm exec kitcn dev --bootstrap` regenerated the auth runtime and pushed
  successfully to the development deployment.
- `pnpm run check` passed all 11 bootstrap tests, lint, typechecking, and the
  Next.js 16.4.2 production build.
- Credential sign-up, session lookup, sign-out, incorrect-password rejection,
  and returning sign-in passed against development; the temporary test user,
  account, and sessions were removed afterward.
- Browser checks passed for signed-out sign-in/sign-up forms, repeated focus
  events on sign-in, and protected-route redirection. The focus-refetch
  mitigation remains enabled.
- Google OAuth, account unlinking, hardware passkeys, enrolled 2FA, cross-tab
  authenticated sessions, and token expiry still require interactive checks.
- `pnpm audit --prod --audit-level low` reported no known vulnerabilities.
  The full audit retains one high-severity development-only advisory in
  `eslint-config-next > @next/eslint-plugin-next > fast-glob > micromatch > braces`.
  No patched `braces` release is available; track
  [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

## Better Auth 1.7.3 account-schema restoration

Better Auth 1.7.3 restored the 1.6 account identity model after versions
1.7.0 through 1.7.2 temporarily required `account.issuer`. New account rows no
longer write `issuer` and are identified by `(providerId, accountId)` again.

This template keeps `issuer` optional so deployments that already ran the
temporary migration continue to validate, but removes the `issuer_accountId`
index. Deploy this compatible schema before or with Better Auth 1.7.3. Existing
issuer values can remain indefinitely; removing them is optional cleanup.

After the compatible schema is deployed, the historical values can be removed
in pages with `authMigrations:rollbackAccountIssuer`:

```bash
pnpm exec kitcn run authMigrations:rollbackAccountIssuer '{"paginationOpts":{"cursor":null,"numItems":100}}' --prod
pnpm exec kitcn run authMigrations:rollbackAccountIssuer '{"paginationOpts":{"cursor":"<continueCursor>","numItems":100}}' --prod
```

Omit `--prod` when rehearsing against the selected development deployment. Do
not run the old `backfillAccountIssuer` migration on Better Auth 1.7.3 or newer.

## Better Auth 1.7 focus-refetch regression

Better Auth 1.7 marks an anonymous session as pending again whenever it
refetches on window focus. KitCN propagates that pending state through its
global auth gate. Rapid focus or visibility changes can repeatedly supersede
the session request and leave sign-in, sign-up, and protected-route redirects
behind the branded auth loader even though `GET /api/auth/get-session` returns
`200` with a `null` session.

This template disables only Better Auth's focus-triggered session refresh in
`src/lib/convex/auth-client.ts`:

```ts
sessionOptions: {
  refetchOnWindowFocus: false,
},
```

Do not remove this mitigation during an auth-stack upgrade merely because the
session endpoint is healthy. First verify in a fresh signed-out browser that:

1. Sign-in and sign-up settle on their forms instead of the auth loader.
2. Repeatedly leaving and refocusing the tab does not re-enter the loader.
3. A protected route redirects to a usable sign-in form.
4. Returning sign-in, sign-out, cross-tab session changes, and token expiry
   still settle correctly.

Auth mutations, Better Auth's cross-tab session signal, the initial session
load, and Convex token validation remain enabled by this workaround. Remove it
only after the installed Better Auth and KitCN versions pass the focus test
above without it.

## Historical: Better Auth 1.6 to 1.7.0-1.7.2

This procedure is retained only for deployments pinned to Better Auth 1.7.0
through 1.7.2. Do not use it with 1.7.3 or newer; follow the account-schema
restoration section above instead.

### Deployment 1: expand and backfill

1. Inventory every account provider and stop authentication writes for the
   maintenance window.
2. Keep the old Better Auth/KitCN packages deployed. Temporarily make
   `account.issuer` optional and add the `accountId_issuer` lookup index.
3. Deploy that compatible schema.
4. Run every page of
   `authMigrations:backfillAccountIssuer` from
   `convex/authMigrations.ts`, passing each returned `continueCursor` into the
   next invocation until `isDone` is true. The checked-in resolver supports
   credential and Google accounts and deliberately throws for an unknown
   provider; add a trusted mapping before retrying if another provider exists.

   ```bash
   pnpm exec kitcn run authMigrations:backfillAccountIssuer '{"paginationOpts":{"cursor":null,"numItems":100}}' --prod
   pnpm exec kitcn run authMigrations:backfillAccountIssuer '{"paginationOpts":{"cursor":"<continueCursor>","numItems":100}}' --prod
   ```

   Omit `--prod` when rehearsing against the selected development deployment.
5. Verify that every account has an issuer, credential accounts use their user
   ID as `accountId`, and no `(issuer, accountId)` collision exists.

Credential identities use `issuer = "local:credential"`. Google identities use
`issuer = "https://accounts.google.com"`. Do not derive an OAuth identity from
email or another mutable profile field. Follow Better Auth's version-specific
upgrade guide for Microsoft or custom OAuth/OIDC subject mappings.

### Deployment 2: require the 1.7 shape

1. Upgrade KitCN, Better Auth, and the passkey package together, but no later
   than Better Auth 1.7.2 for this historical procedure.
2. Preview the KitCN auth scaffold, merge the required schema and indexes while
   preserving template extensions, and regenerate KitCN output.
3. Deploy through `pnpm exec kitcn deploy --prod`.
4. Verify returning sign-in and account-management flows before resuming auth
   writes.

### Rollback

Roll code and packages back first, then restore the deployment-1 schema where
`issuer` is optional. Only in that optional-schema state may
`authMigrations:rollbackAccountIssuer` remove issuer values. The rollback
cannot run under the Better Auth 1.7.0-1.7.2 schema because those versions
require `issuer`.

Preserve a backup and the account/provider inventory until the upgraded auth
flows have passed production verification.
