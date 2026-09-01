import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import { internalMutation } from './_generated/server';

const migrationResult = v.object({
  continueCursor: v.string(),
  isDone: v.boolean(),
  processed: v.number(),
});

export const backfillAccountIssuer = internalMutation({
  args: { paginationOpts: paginationOptsValidator },
  returns: migrationResult,
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query('account')
      .order('asc')
      .paginate(args.paginationOpts);

    let processed = 0;

    for (const account of page.page) {
      const issuer =
        account.providerId === 'credential'
          ? 'local:credential'
          : account.providerId === 'google'
            ? 'https://accounts.google.com'
            : null;

      if (!issuer) {
        throw new Error(`Map issuer for provider ${account.providerId}`);
      }

      const accountId =
        account.providerId === 'credential' ? account.userId : account.accountId;

      if (account.issuer !== undefined && account.issuer !== issuer) {
        throw new Error(`Issuer mismatch for account ${account._id}`);
      }

      const collision = await ctx.db
        .query('account')
        .withIndex('accountId', (query) => query.eq('accountId', accountId))
        .filter((query) => query.eq(query.field('issuer'), issuer))
        .unique();

      if (collision && collision._id !== account._id) {
        throw new Error(`Duplicate account identity ${issuer}:${accountId}`);
      }

      if (account.issuer !== issuer || account.accountId !== accountId) {
        await ctx.db.patch('account', account._id, { accountId, issuer });
        processed += 1;
      }
    }

    return {
      continueCursor: page.continueCursor,
      isDone: page.isDone,
      processed,
    };
  },
});

export const rollbackAccountIssuer = internalMutation({
  args: { paginationOpts: paginationOptsValidator },
  returns: migrationResult,
  handler: async (ctx, args) => {
    // Only run this after restoring the stage-one schema where `issuer` is
    // optional. The Better Auth 1.7 schema requires `issuer` on every account.
    const page = await ctx.db
      .query('account')
      .order('asc')
      .paginate(args.paginationOpts);

    let processed = 0;

    for (const account of page.page) {
      if (account.issuer !== undefined) {
        await ctx.db.patch('account', account._id, { issuer: undefined });
        processed += 1;
      }
    }

    return {
      continueCursor: page.continueCursor,
      isDone: page.isDone,
      processed,
    };
  },
});
