import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function listThingsByOwner(
  ctx: QueryCtx,
  ownerTokenIdentifier: string,
) {
  return await ctx.db
    .query("things")
    .withIndex("by_ownerTokenIdentifier", (q) =>
      q.eq("ownerTokenIdentifier", ownerTokenIdentifier),
    )
    .take(20);
}

export async function insertThing(
  ctx: MutationCtx,
  args: {
    ownerTokenIdentifier: string;
    label: string;
    createdAt: number;
  },
) {
  return await ctx.db.insert("things", args);
}
