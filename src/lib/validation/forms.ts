import { z } from "zod";

import { emailSchema, passwordSchema } from "@/features/auth/validation";

/** Channel subscribe dialog — non-empty trimmed input (server normalizes ID / URL / handle). */
export const channelSubscribeInputSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Enter a channel ID, @handle, or YouTube URL."));

/** Matches Convex `normalizeEndpointName` in `convex/endpoints.ts`. */
export const endpointNameSchema = z
  .string()
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, "Name must be at least 2 characters.")
      .max(80, "Name must be 80 characters or less."),
  );

/** Matches Convex `normalizeEndpointUrl` in `convex/endpoints.ts`. */
export const endpointWebhookUrlSchema = z
  .string()
  .trim()
  .min(1, "URL is required")
  .superRefine((val, ctx) => {
    let url: URL;
    try {
      url = new URL(val);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid HTTPS endpoint URL.",
      });
      return;
    }
    if (url.protocol !== "https:") {
      ctx.addIssue({
        code: "custom",
        message: "Endpoint URLs must use HTTPS.",
      });
    }
    if (url.username || url.password) {
      ctx.addIssue({
        code: "custom",
        message: "Endpoint URLs cannot include credentials.",
      });
    }
    if (url.toString().length > 2048) {
      ctx.addIssue({
        code: "custom",
        message: "Endpoint URL is too long.",
      });
    }
  });

export const endpointFormSchema = z.object({
  name: endpointNameSchema,
  url: endpointWebhookUrlSchema,
});

export type EndpointFormValidated = z.infer<typeof endpointFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: emailSchema,
});

export const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string().min(1, "Confirm password is required"),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  });

export const backupCodeFormSchema = z.object({
  backup: z.string().trim().min(1, "Enter a backup code."),
});
