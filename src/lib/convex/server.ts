import { convexBetterAuth } from "kitcn/auth/nextjs";

import { api } from "../../../convex/shared/api";

export const { createContext, createCaller, handler } = convexBetterAuth({
  api,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
