import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const setUserAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject as Id<"user">;

    const url = await ctx.storage.getUrl(storageId);
    if (!url) {
      throw new Error("Uploaded file is not available.");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (user.avatarStorageId && user.avatarStorageId !== storageId) {
      await ctx.storage.delete(user.avatarStorageId);
    }

    await ctx.db.patch(userId, {
      image: url,
      avatarStorageId: storageId,
      updatedAt: Date.now(),
    });

    return { avatarUrl: url };
  },
});

export const deleteUserAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject as Id<"user">;

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (user.avatarStorageId) {
      await ctx.storage.delete(user.avatarStorageId);
    }

    await ctx.db.patch(userId, {
      image: undefined,
      avatarStorageId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true as const };
  },
});
