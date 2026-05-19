"use client";

import { FormField } from "@/components/ui/form-field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Controller, useFormContext } from "react-hook-form";
import { MfaFormData } from "../../validation";

interface TotpInputFieldProps {
  disabled?: boolean;
  onComplete?: () => void;
}

export function TotpInputField({ disabled, onComplete }: TotpInputFieldProps) {
  const { control } = useFormContext<MfaFormData>();

  return (
    <FormField
      id="totp-code"
      label="Verification Code"
      className="items-center [&>label]:justify-center"
    >
      {({ controlProps }) => (
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <div className="flex w-full items-center justify-center">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                {...field}
                {...controlProps}
                autoFocus
                disabled={disabled}
                autoComplete="one-time-code"
                onChange={(value) => {
                  field.onChange(value);
                  if (value.length === 6 && onComplete) {
                    onComplete();
                  }
                }}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}
        />
      )}
    </FormField>
  );
}
