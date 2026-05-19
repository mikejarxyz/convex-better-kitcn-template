import { z } from "zod";

import type { PasswordRule } from "@/components/ui/password-requirements";
import { VALIDATION } from "@/lib/constants/app";
import { COMMON_PASSWORDS } from "@/lib/constants/common-passwords";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name must be 80 characters or less");

export const PASSWORD_RULES: PasswordRule[] = [
  {
    label: `At least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= VALIDATION.PASSWORD_MIN_LENGTH,
  },
  { label: "At least one number", test: (password) => /\d/.test(password) },
  {
    label: "At least one symbol",
    test: (password) => /[^a-zA-Z0-9]/.test(password),
  },
  {
    label: "Not a common password",
    test: (password) => !COMMON_PASSWORDS.has(password.toLowerCase()),
  },
];

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(
    VALIDATION.PASSWORD_MIN_LENGTH,
    `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
  )
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol")
  .refine(
    (password) => !COMMON_PASSWORDS.has(password.toLowerCase()),
    "Password is too common",
  );

export const confirmPasswordSchema = z
  .string()
  .min(1, "Confirm password is required");

export const signInPasswordSchema = z.string().min(1, "Password is required");

export const twoFactorCodeSchema = z
  .string()
  .length(6, "Code must be 6 digits")
  .regex(/^\d+$/, "Code must contain only numbers");

export const passkeyNameSchema = z
  .string()
  .max(50, "Name must be 50 characters or less")
  .transform((value) => value.trim());

export const renamePasskeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less"),
});

export const addPasskeySchema = z.object({
  name: passkeyNameSchema.optional(),
  authenticatorAttachment: z.enum(["platform", "cross-platform"]).optional(),
});

export const withPasswordConfirmation = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
) =>
  schema.refine(
    (data) => {
      const value = data as { password?: string; confirmPassword?: string };
      return value.password === value.confirmPassword;
    },
    {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    },
  );

export const userNameSchema = z.object({
  name: fullNameSchema,
});

export const changePasswordSchema = withPasswordConfirmation(
  z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  }),
);

export const twoFactorPasswordSchema = z.object({
  password: signInPasswordSchema,
});

export const twoFactorVerifySchema = z.object({
  code: twoFactorCodeSchema,
});

export const mfaVerificationSchema = z
  .object({
    code: z.string().optional(),
    backupCode: z.string().optional(),
  })
  .refine((data) => data.code || data.backupCode, {
    message: "Either code or backup code must be provided",
  })
  .refine(
    (data) => {
      if (data.code) return /^\d{6}$/.test(data.code);
      return true;
    },
    {
      message: "Code must be 6 digits",
      path: ["code"],
    },
  );

export const signInSchema = z.object({
  email: emailSchema,
  password: signInPasswordSchema,
});

export const signUpSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type UserNameFormData = z.infer<typeof userNameSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type TwoFactorPasswordFormData = z.infer<typeof twoFactorPasswordSchema>;
export type TwoFactorVerifyFormData = z.infer<typeof twoFactorVerifySchema>;
export type MfaFormData = z.infer<typeof mfaVerificationSchema>;
export type RenamePasskeyFormData = z.infer<typeof renamePasskeySchema>;
export type AddPasskeyFormData = z.infer<typeof addPasskeySchema>;
