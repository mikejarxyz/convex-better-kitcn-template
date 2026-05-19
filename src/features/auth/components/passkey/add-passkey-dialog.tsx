"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/ui/form-field";
import { LoadingButton } from "@/components/ui/loading-button";
import { authClient } from "@/lib/convex/auth-client";
import {
  addPasskeySchema,
  type AddPasskeyFormData,
} from "../../validation";

interface AddPasskeyDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddPasskeyDialog({
  trigger,
  open: openProp,
  onOpenChange,
  onSuccess,
}: AddPasskeyDialogProps) {
  const [openState, setOpenState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelCount, setCancelCount] = useState(0);

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
  } = useForm<AddPasskeyFormData>({
    resolver: zodResolver(addPasskeySchema),
    defaultValues: {
      name: "",
      authenticatorAttachment: undefined,
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (isSubmitting) setCancelCount((count) => count + 1);
      setIsSubmitting(false);
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  };

  const onSubmit = async (data: AddPasskeyFormData) => {
    const requestId = cancelCount + 1;
    setIsSubmitting(true);

    try {
      const result = await authClient.passkey.addPasskey({
        name: data.name || undefined,
        authenticatorAttachment: data.authenticatorAttachment,
      });

      if (requestId !== cancelCount + 1) return;

      if (result?.error) {
        toast.error(result.error.message ?? "Failed to add passkey");
        return;
      }

      toast.success("Passkey added successfully");
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (requestId !== cancelCount + 1) return;
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast.error("Passkey registration was cancelled");
      } else {
        toast.error("Failed to add passkey", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } finally {
      if (requestId === cancelCount + 1) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a passkey</DialogTitle>
          <DialogDescription>
            Passkeys are a more secure way to sign in to your account.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <FormField
              id="passkey-name"
              label="Name (optional)"
              description="Give your passkey a name to help identify it later"
              error={errors.name?.message}
            >
              {({ controlProps }) => (
                <Input
                  placeholder="Laptop"
                  disabled={isSubmitting}
                  {...controlProps}
                  {...register("name")}
                />
              )}
            </FormField>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <LoadingButton type="submit" isLoading={isSubmitting}>
              Add passkey
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
