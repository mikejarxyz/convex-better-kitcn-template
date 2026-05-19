"use client";

import { Button } from "@/components/ui/button";
import { APP_DETAILS } from "@/lib/constants/app";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TwoFactorBackupCodesDisplayProps {
  codes: string[];
  onConfirmSaved?: () => void;
  onActionTaken?: () => void;
  showConfirmation?: boolean;
  className?: string;
}

export function TwoFactorBackupCodesDisplay({
  codes,
  onConfirmSaved,
  onActionTaken,
  showConfirmation = true,
  className,
}: TwoFactorBackupCodesDisplayProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const [codesSaved, setCodesSaved] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const allCodesText = codes.join("\n");

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(allCodesText);
      setHasCopied(true);
      setCodesSaved(true);
      onActionTaken?.();
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setHasCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error("Failed to copy codes:", error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob(
      [
        `${APP_DETAILS.NAME} Backup Codes\n`,
        `Generated: ${new Date().toLocaleDateString()}\n`,
        `\n`,
        `Keep these codes safe. Each code can only be used once.\n`,
        `\n`,
        ...codes.map((code, i) => `${i + 1}. ${code}\n`),
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${APP_DETAILS.NAME.toLowerCase().replaceAll(" ", "-")}-backup-codes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCodesSaved(true);
    onActionTaken?.();
  };

  const handleConfirm = () => {
    onConfirmSaved?.();
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid grid-cols-2 gap-2">
        {codes.map((code, index) => (
          <div
            key={index}
            className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-2 font-mono text-sm"
          >
            <span className="text-muted-foreground mr-2">{index + 1}.</span>
            <span className="flex-1">{code}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleCopyAll}
        >
          {hasCopied ? (
            <>
              <CheckIcon className="size-4" />
              Copied!
            </>
          ) : (
            <>
              <CopyIcon className="size-4" />
              Copy all codes
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleDownload}
        >
          <DownloadIcon className="size-4" />
          Download as file
        </Button>
      </div>

      {showConfirmation && (
        <div className="mt-2 border-t pt-4">
          <Button
            type="button"
            className="w-full"
            disabled={!codesSaved}
            onClick={handleConfirm}
          >
            {codesSaved
              ? "I've saved my backup codes"
              : "Copy or download codes first"}
          </Button>
        </div>
      )}
    </div>
  );
}
