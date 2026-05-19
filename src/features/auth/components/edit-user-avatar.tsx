"use client";

import { useMutation } from "convex/react";
import { toast } from "sonner";

import { EditableImage } from "@/components/ui/editable-image";
import { authClient } from "@/lib/convex/auth-client";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export function EditUserAvatar() {
  const { data: session, refetch } = authClient.useSession();
  const user = session?.user;

  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const setAvatar = useMutation(api.users.setUserAvatar);
  const deleteAvatar = useMutation(api.users.deleteUserAvatar);

  const handleUpload = async (file: File) => {
    try {
      const uploadUrl = await generateUploadUrl({});
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) {
        throw new Error("Upload failed.");
      }
      const { storageId } = (await uploadRes.json()) as {
        storageId: Id<"_storage">;
      };
      const { avatarUrl } = await setAvatar({ storageId });
      void refetch();
      toast.success("Avatar updated");
      return avatarUrl;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update avatar.",
      );
      return null;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAvatar({});
      void refetch();
      toast.success("Avatar removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove avatar.",
      );
    }
  };

  return (
    <EditableImage
      imageUrl={user?.image ?? null}
      alt={`${user?.name ?? "User"} avatar`}
      onUpload={handleUpload}
      onDelete={handleDelete}
      placeholder={user?.name ?? "Avatar"}
      uploadLabel="Upload avatar"
      replaceLabel="Replace avatar"
      deleteDialogTitle="Remove your avatar?"
    />
  );
}
