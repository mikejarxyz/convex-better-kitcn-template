"use client";

import { CheckCircleIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

interface PasswordRequirementsProps {
  password: string;
  rules: PasswordRule[];
  className?: string;
}

export function PasswordRequirements({
  password,
  rules,
  className,
}: PasswordRequirementsProps) {
  const hasInput = password.length > 0;

  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {rules.map((rule) => {
        const met = hasInput && rule.test(password);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              met ? "text-success" : "text-muted-foreground",
            )}
          >
            {met ? (
              <CheckCircleIcon className="size-3.5 shrink-0" />
            ) : (
              <CircleIcon className="size-3.5 shrink-0" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
