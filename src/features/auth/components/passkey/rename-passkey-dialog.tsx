"use client";

import { useEffect, useState } from "react";
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
  renamePasskeySchema,
  type RenamePasskeyFormData,
} from "../../validation";

interface RenamePasskeyDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  passkeyId: string;
  currentName: string;
  onSuccess?: () => void;
}

export function RenamePasskeyDialog({
  trigger,
  open: openProp,
  onOpenChange,
  passkeyId,
  currentName,
  onSuccess,
}: RenamePasskeyDialogProps) {
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
  } = useForm<RenamePasskeyFormData>({
    resolver: zodResolver(renamePasskeySchema),
    defaultValues: {
      name: currentName,
    },
  });

  useEffect(() => {
    if (open) {
      reset({ name: currentName });
    }
  }, [open, currentName, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;

    setOpen(nextOpen);
    if (!nextOpen) {
      reset({ name: currentName });
    }
  };

  const onSubmit = async (data: RenamePasskeyFormData) => {
    setIsSubmitting(true);

    try {
      const result = await authClient.passkey.updatePasskey({
        id: passkeyId,
        name: data.name,
      });

      if (result?.error) {
        toast.error(result.error.message ?? "Failed to rename passkey");
        return;
      }

      toast.success("Passkey renamed successfully");
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to rename passkey", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename passkey</DialogTitle>
          <DialogDescription>
            Give your passkey a new name to help identify it.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <FormField
              id="passkey-rename"
              label="Name"
              error={errors.name?.message}
            >
              {({ controlProps }) => (
                <Input
                  placeholder="Laptop"
                  disabled={isSubmitting}
                  autoFocus
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <LoadingButton type="submit" isLoading={isSubmitting}>
              Rename
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
