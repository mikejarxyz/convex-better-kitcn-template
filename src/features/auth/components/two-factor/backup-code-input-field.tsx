"use client";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Controller, useFormContext } from "react-hook-form";
import { MfaFormData } from "../../validation";

export function BackupCodeInputField({ disabled }: { disabled?: boolean }) {
  const { control } = useFormContext<MfaFormData>();

  return (
    <FormField id="backup-code" label="Backup Code">
      {({ controlProps }) => (
        <Controller
          control={control}
          name="backupCode"
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              placeholder="Enter backup code"
              autoFocus
              disabled={disabled}
              {...controlProps}
            />
          )}
        />
      )}
    </FormField>
  );
}
