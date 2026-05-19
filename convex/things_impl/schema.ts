import { defineTable } from "convex/server";
import { v } from "convex/values";

export const thingsTable = defineTable({
  ownerTokenIdentifier: v.string(),
  label: v.string(),
  createdAt: v.number(),
}).index("by_ownerTokenIdentifier", ["ownerTokenIdentifier"]);
