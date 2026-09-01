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

At the repository's current pins, KitCN `0.32.1` requires Better Auth `1.7.x`
and Convex `>=1.42 <1.45`. Keep Convex on `1.44.x` until the selected KitCN
release advertises support for Convex `1.45` or newer. Recheck the peer range;
do not rely on this paragraph after changing KitCN.

## Better Auth 1.6 to 1.7

This transition is already represented in the current source, but any deployed
environment that still contains Better Auth 1.6 account rows needs a two-schema
maintenance migration. Never deploy the required 1.7 schema over unmigrated
rows.

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

1. Upgrade KitCN, Better Auth, and the passkey package together.
2. Preview the KitCN auth scaffold, merge the required schema and indexes while
   preserving template extensions, and regenerate KitCN output.
3. Deploy through `pnpm exec kitcn deploy --prod`.
4. Verify returning sign-in and account-management flows before resuming auth
   writes.

### Rollback

Roll code and packages back first, then restore the deployment-1 schema where
`issuer` is optional. Only in that optional-schema state may
`authMigrations:rollbackAccountIssuer` remove issuer values. The rollback
cannot run under the Better Auth 1.7 schema because that schema requires
`issuer`.

Preserve a backup and the account/provider inventory until the upgraded auth
flows have passed production verification.
