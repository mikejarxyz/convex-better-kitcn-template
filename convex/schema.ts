import { authSchema } from './authSchema';
import { defineSchema } from "convex/server";
import { thingsTable } from "./things_impl/schema";

export default defineSchema({
  ...authSchema,
  things: thingsTable,
});
