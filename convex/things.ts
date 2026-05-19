import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";
import {
  createForOwner,
  listMine as listMineModel,
} from "./things_impl/model";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await listMineModel(ctx, identity);
  },
});

export const create = mutation({
  args: {
    label: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    return await createForOwner(ctx, identity, args);
  },
});
