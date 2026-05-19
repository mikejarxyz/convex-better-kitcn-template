import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";
import { throwAppError } from "../lib/errors";

type AuthCtx = QueryCtx | MutationCtx | ActionCtx;

export async function requireIdentity(ctx: Pick<AuthCtx, "auth">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throwAppError("UNAUTHORIZED", "Not authenticated");
  return identity;
}
