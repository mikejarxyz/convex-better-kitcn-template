import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { UserIdentity } from "convex/server";
import { throwAppError } from "../lib/errors";
import { insertThing, listThingsByOwner } from "./repo";

export async function listMine(ctx: QueryCtx, identity: UserIdentity) {
  return await listThingsByOwner(ctx, identity.tokenIdentifier);
}

export async function createForOwner(
  ctx: MutationCtx,
  identity: UserIdentity,
  args: { label: string },
) {
  const label = args.label.trim();
  if (!label) throwAppError("INVALID", "Label is required");

  return await insertThing(ctx, {
    ownerTokenIdentifier: identity.tokenIdentifier,
    label,
    createdAt: Date.now(),
  });
}
