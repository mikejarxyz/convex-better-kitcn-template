"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { authClient } from "@/lib/convex/auth-client";

interface DeletePasskeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passkeyId: string;
  passkeyName: string;
  onSuccess?: () => void;
}

export function DeletePasskeyDialog({
  open,
  onOpenChange,
  passkeyId,
  passkeyName,
  onSuccess,
}: DeletePasskeyDialogProps) {
  const handleConfirm = async () => {
    try {
      const result = await authClient.passkey.deletePasskey({
        id: passkeyId,
      });

      if (result?.error) {
        toast.error(result.error.message ?? "Failed to delete passkey");
        throw new Error(result.error.message);
      }

      toast.success("Passkey deleted successfully");
      onSuccess?.();
    } catch (error) {
      if (!(error instanceof Error) || !error.message) {
        toast.error("Failed to delete passkey", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
      throw error;
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete passkey?"
      description={`"${passkeyName}" passkey will be deleted. This action cannot be undone.`}
      confirmLabel="Delete"
      destructive
      onConfirm={handleConfirm}
    />
  );
}
