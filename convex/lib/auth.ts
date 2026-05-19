import type { QueryCtx, MutationCtx } from "../_generated/server";
import { throwAppError } from "./errors";

export async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throwAppError("UNAUTHORIZED");
  return identity;
}
