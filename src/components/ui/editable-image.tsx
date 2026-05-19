"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

interface EditableImageProps {
  /** Current image URL, or null if no image */
  imageUrl: string | null;
  /** Alt text for the image */
  alt: string;
  /** Callback to upload a new image. Should return the new image URL. */
  onUpload: (file: File) => Promise<string | null>;
  /** Callback to delete the current image */
  onDelete: () => Promise<void>;
  /** Whether the user can edit the image */
  canEdit?: boolean;
  /** Placeholder text when no image is set */
  placeholder?: string;
  /** Size of the image container */
  size?: "sm" | "md" | "lg";
  /** Label for the upload button when no image exists */
  uploadLabel?: string;
  /** Label for the upload button when an image exists */
  replaceLabel?: string;
  /** Title for the delete confirmation dialog */
  deleteDialogTitle?: string;
  /** Description for the delete confirmation dialog */
  deleteDialogDescription?: string;
  /** Shape of the image container */
  shape?: "circle" | "square";
}

const sizeClasses = {
  sm: "size-12",
  md: "size-16",
  lg: "size-24",
};

const uploadIconClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

function getFallbackInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function EditableImage({
  imageUrl,
  alt,
  onUpload,
  onDelete,
  canEdit = true,
  placeholder = "Image",
  size = "md",
  shape = "circle",
  uploadLabel = "Upload",
  replaceLabel = "Replace",
  deleteDialogTitle = "Remove image?",
  deleteDialogDescription = "This action cannot be undone.",
}: EditableImageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(imageUrl);

  const shapeClasses = {
    circle: "rounded-full",
    square: size === "sm" ? "rounded-xl" : "rounded-3xl",
  };
  const canInteract = canEdit && !isUploading && !isDeleting;
  const fallbackInitials = getFallbackInitials(placeholder || alt);

  // Sync local state with prop changes
  if (imageUrl !== localImageUrl && !isUploading) {
    setLocalImageUrl(imageUrl);
  }

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    try {
      const newUrl = await onUpload(file);
      if (newUrl) {
        setLocalImageUrl(newUrl);
      }
    } catch (error) {
      toast.error("Failed to upload image", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setLocalImageUrl(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error("Failed to delete image", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="group relative">
          <button
            type="button"
            onClick={handlePickFile}
            disabled={!canInteract}
            aria-label={localImageUrl ? replaceLabel : uploadLabel}
            className={cn(
              "relative flex items-center justify-center overflow-hidden border bg-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/35 disabled:pointer-events-none",
              canEdit && "cursor-pointer hover:bg-muted/80",
              sizeClasses[size],
              shapeClasses[shape]
            )}
          >
            {localImageUrl ? (
              <Image
                src={localImageUrl}
                alt={alt}
                fill
                sizes="150px"
                className="object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                {fallbackInitials}
              </span>
            )}
            {canEdit && (
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-background/65 text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
                  isUploading && "opacity-100"
                )}
              >
                {isUploading ? (
                  <Spinner />
                ) : (
                  <UploadIcon className={uploadIconClasses[size]} />
                )}
              </span>
            )}
          </button>
          {localImageUrl && canEdit && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUploading || isDeleting}
              className="absolute -right-1 -top-1 flex size-4 cursor-pointer items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/90 focus:opacity-100 disabled:pointer-events-none disabled:opacity-50"
              aria-label="Remove image"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={!canInteract}
        />
      </div>

      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setShowDeleteConfirm(false);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteConfirm();
              }}
            >
              {isDeleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
