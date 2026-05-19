"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/ui/form-field";
import { LoadingButton } from "@/components/ui/loading-button";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/convex/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "../validation";

interface ChangePasswordDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChangePasswordDialog({
  trigger,
  open: openProp,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [openState, setOpenState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = openProp ?? openState;

  const setOpen = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (openProp === undefined) setOpenState(nextOpen);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;

    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);

    try {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.password,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Failed to change password");
        return;
      }

      toast.success("Password changed successfully");
      handleOpenChange(false);
    } catch (error) {
      toast.error("Failed to change password", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <FormField
              id="currentPassword"
              label="Current password"
              error={errors.currentPassword?.message}
            >
              {({ controlProps }) => (
                <PasswordInput
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  {...controlProps}
                  {...register("currentPassword")}
                />
              )}
            </FormField>

            <FormField
              id="newPassword"
              label="New password"
              error={errors.password?.message}
            >
              {({ controlProps }) => (
                <PasswordInput
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  {...controlProps}
                  {...register("password")}
                />
              )}
            </FormField>

            <FormField
              id="confirmPassword"
              label="Confirm new password"
              error={errors.confirmPassword?.message}
            >
              {({ controlProps }) => (
                <PasswordInput
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  {...controlProps}
                  {...register("confirmPassword")}
                />
              )}
            </FormField>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <LoadingButton type="submit" isLoading={isSubmitting}>
              Change password
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
