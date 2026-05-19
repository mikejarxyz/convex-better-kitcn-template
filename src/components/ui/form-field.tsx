"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";

interface FormFieldRenderProps {
  controlProps: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  };
  labelProps: { htmlFor: string };
  messageProps: { id: string };
  invalid: boolean;
}

interface FormFieldProps {
  id: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
  className?: string;
  children: (props: FormFieldRenderProps) => React.ReactNode;
}

function FormField({
  id,
  label,
  description,
  error,
  required,
  orientation = "vertical",
  className,
  children,
}: FormFieldProps) {
  const messageId = `${id}-message`;
  const invalid = !!error;
  const hasMessage = !!(error || description);

  const controlProps: FormFieldRenderProps["controlProps"] = {
    id,
    "aria-invalid": invalid,
    "aria-describedby": hasMessage ? messageId : undefined,
  };

  const labelProps: FormFieldRenderProps["labelProps"] = {
    htmlFor: id,
  };

  const messageProps: FormFieldRenderProps["messageProps"] = {
    id: messageId,
  };

  const renderProps: FormFieldRenderProps = {
    controlProps,
    labelProps,
    messageProps,
    invalid,
  };

  return (
    <Field
      orientation={orientation}
      data-slot="form-field"
      data-invalid={invalid || undefined}
      className={cn("relative gap-0.5", className)}
    >
      {label && (
        <FieldLabel htmlFor={id} className={cn("gap-1 ml-1", invalid && "text-destructive")}>
          {label}
          {required && (
            <span className="text-destructive/75" aria-hidden="true">
              *
            </span>
          )}
        </FieldLabel>
      )}

      {children(renderProps)}

      <div id={messageId} className="h-4 max-w-full ml-1 overflow-hidden">
        {error ? (
          <FieldError className={typeof error === "string" ? "truncate" : undefined}>
            {error}
          </FieldError>
        ) : description ? (
          <FieldDescription className="truncate">{description}</FieldDescription>
        ) : null}
      </div>
    </Field>
  );
}

export { FormField };
export type { FormFieldProps, FormFieldRenderProps };
