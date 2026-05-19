"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import * as React from "react";
import { Button } from "./button";

type CopyButtonProps = React.ComponentProps<typeof Button> & {
  value: string;
};

export function CopyButton({
  value,
  variant = "ghost",
  size = "icon-xs",
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // Show the checkmark for 1.5 seconds
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button
      type="button"
      {...props}
      variant={variant}
      size={size}
      className={cn("text-muted-foreground", className)}
      onClick={handleCopy}
    >
      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
      <span className="relative size-3.5">
        <CopyIcon
          className={cn(
            "absolute inset-0 size-3.5 transition-all duration-200",
            copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
          )}
        />
        <CheckIcon
          className={cn(
            "absolute inset-0 size-3.5 text-success transition-all duration-200",
            copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
        />
      </span>
    </Button>
  );
}
