"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { LoadingButton } from "@/components/ui/loading-button";
import { useState } from "react";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description?: string;

  confirmLabel?: string;
  cancelLabel?: string;

  destructive?: boolean;
  disabled?: boolean;

  onConfirm: () => Promise<boolean | void> | boolean | void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  disabled = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      const shouldClose = await onConfirm();
      if (shouldClose !== false) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Confirm dialog action failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isLoading) return;
    onOpenChange(nextOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={destructive ? "text-destructive" : undefined}>
            {title}
          </AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>

          {/* Using LoadingButton for consistent UI */}
          <LoadingButton
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={disabled || isLoading}
            isLoading={isLoading}
          >
            {confirmLabel}
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
