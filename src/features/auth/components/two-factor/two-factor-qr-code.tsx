"use client";

import QRCode from "react-qr-code";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TwoFactorQrCodeProps {
  totpUri: string | null;
  secret: string | null;
  isLoading?: boolean;
  className?: string;
}

export function TwoFactorQrCode({
  totpUri,
  secret,
  isLoading = false,
  className,
}: TwoFactorQrCodeProps) {
  const formattedSecret = secret
    ? secret.replace(/(.{4})/g, "$1 ").trim()
    : null;

  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center gap-4", className)}>
        <Skeleton className="size-48 rounded-lg" />
        <div className="w-full space-y-2">
          <Skeleton className="mx-auto h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="rounded-lg bg-white p-4">
        {totpUri ? (
          <QRCode
            value={totpUri}
            size={192}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        ) : (
          <div className="text-muted-foreground flex size-48 items-center justify-center text-sm">
            No QR code available
          </div>
        )}
      </div>

      {secret && (
        <div className="w-full space-y-2">
          <p className="text-muted-foreground text-center text-sm">
            Or enter this code manually:
          </p>
          <div className="bg-muted/50 flex items-center gap-2 rounded-md px-3 py-2 font-mono text-sm">
            <span className="flex-1 text-center tracking-wider">
              {formattedSecret}
            </span>
            <CopyButton value={secret} />
          </div>
        </div>
      )}
    </div>
  );
}
