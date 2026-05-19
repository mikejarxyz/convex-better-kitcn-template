"use client"

import * as React from "react"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { CheckIcon, PencilIcon, SaveIcon } from "lucide-react"

import { FieldError } from "@/components/ui/field"
import { InputGroup, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type EditableInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  | "value"
  | "defaultValue"
  | "onChange"
  | "onBlur"
  | "onKeyDown"
  | "readOnly"
  | "disabled"
  | "type"
> & {
  value: string
  onSave: (nextValue: string) => Promise<void>
  validate?: (nextValue: string) => string | null
  onError?: (error: unknown) => void
  disabled?: boolean
  trimOnSave?: boolean
  label?: string
  variant?: "group" | "plain"
  wrapperClassName?: string
  buttonClassName?: string
  displayClassName?: string
}

export default function EditableInput({
  value,
  onSave,
  validate,
  onError,
  disabled = false,
  trimOnSave = true,
  label,
  variant = "group",
  wrapperClassName,
  buttonClassName,
  displayClassName,
  className,
  "aria-label": ariaLabelProp,
  "aria-describedby": ariaDescribedByProp,
  ...inputProps
}: EditableInputProps) {
  const [draftState, setDraftState] = useState(() => ({
    draft: value ?? "",
    value: value ?? "",
  }))
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const savingRef = useRef(false)
  const errorId = useId()

  const rawValue = value ?? ""
  const previousRawValue = draftState.value
  const previousNormalizedValue = trimOnSave ? previousRawValue.trim() : previousRawValue
  const previousNormalizedDraft = trimOnSave ? draftState.draft.trim() : draftState.draft
  const wasDirty = previousNormalizedDraft !== previousNormalizedValue
  let draft = draftState.draft

  if (rawValue !== previousRawValue) {
    draft = wasDirty ? draftState.draft : rawValue
    setDraftState({
      draft,
      value: rawValue,
    })
    if (!wasDirty && error) {
      setError(null)
    }
  }

  const normalizedValue = trimOnSave ? rawValue.trim() : rawValue
  const normalizedDraft = trimOnSave ? draft.trim() : draft
  const isDirty = normalizedDraft !== normalizedValue
  const isDisabled = disabled || isSaving
  const resolvedLabel = ariaLabelProp ?? label ?? "value"
  const setDraft = useCallback((nextDraft: string) => {
    setDraftState({
      draft: nextDraft,
      value: rawValue,
    })
  }, [rawValue])

  // Cleanup success timer when component unmounts
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [])

  useEffect(() => {
    if (variant === "plain" && isEditing) {
      focusInput()
    }
  }, [focusInput, isEditing, variant])

  const runSave = useCallback(async (restoreFocus?: boolean) => {
    if (isDisabled || savingRef.current || !isDirty) return

    const nextValue = normalizedDraft
    let validationError: string | null = null
    try {
      validationError = validate?.(nextValue) ?? null
    } catch (err) {
      validationError = err instanceof Error ? err.message : "Invalid value."
    }

    if (validationError) {
      setError(validationError)
      focusInput()
      return
    }

    setIsSaving(true)
    savingRef.current = true

    try {
      await onSave(nextValue)
      setError(null)
      setDraft(nextValue)

      // Show success indicator breifly
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
      setShowSuccess(true)
      successTimerRef.current = setTimeout(() => {
        setShowSuccess(false)
      }, 1300)

      if (restoreFocus && variant !== "plain") {
        focusInput()
      }
      if (variant === "plain") {
        setIsEditing(false)
      }
    } catch (err) {
      onError?.(err)
      setError(err instanceof Error ? err.message : "Failed to save value.")
      focusInput()
    } finally {
      setIsSaving(false)
      savingRef.current = false
    }
  }, [focusInput, isDirty, isDisabled, normalizedDraft, onError, onSave, setDraft, validate, variant])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value)
    if (error) {
      setError(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      if (variant === "plain" && !isDirty) {
        setIsEditing(false)
        return
      }
      void runSave(true)
    }

    if (e.key === "Escape" && variant === "plain") {
      e.preventDefault()
      e.stopPropagation()
      setDraft(value ?? "")
      setError(null)
      setIsEditing(false)
    }
  }

  const handleWrapperBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (isSaving) return

    const nextTarget = e.relatedTarget as HTMLElement | null
    if (nextTarget && e.currentTarget.contains(nextTarget)) {
      return
    }

    if (variant === "plain" && !isDirty) {
      setIsEditing(false)
      return
    }

    void runSave()
  }

  const inputAriaLabel = ariaLabelProp ?? label
  const describedBy = [ariaDescribedByProp, error ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined

  if (variant === "plain") {
    return (
      <div className={cn("relative min-w-0", wrapperClassName)}>
        {isEditing ? (
          <div
            data-disabled={isDisabled || undefined}
            aria-busy={isSaving || undefined}
            className="min-w-0"
            onBlur={handleWrapperBlur}
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              readOnly={isSaving}
              aria-label={inputAriaLabel}
              aria-describedby={describedBy}
              aria-invalid={!!error}
              className={cn(
                "block w-full min-w-0 border-0 bg-transparent px-0 py-0 text-inherit shadow-none outline-none selection:bg-primary/20 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
                className,
              )}
              {...inputProps}
            />
          </div>
        ) : (
          <button
            type="button"
            className={cn(
              "group flex max-w-full cursor-text items-center gap-2 rounded-sm text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/35",
              displayClassName,
            )}
            disabled={disabled}
            onClick={() => {
              setDraft(rawValue)
              setError(null)
              setIsEditing(true)
            }}
            aria-label={`Edit ${resolvedLabel}`}
          >
            <span className="min-w-0 truncate">{rawValue || inputProps.placeholder}</span>
            <PencilIcon
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100",
                buttonClassName,
              )}
            />
          </button>
        )}

        {error && (
          <div className="absolute bottom-0 right-0 max-w-full translate-y-full">
            <FieldError id={errorId} className="truncate">
              {error}
            </FieldError>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative flex flex-col gap-1 flex-1 min-w-0", wrapperClassName)}>
      <InputGroup
        data-disabled={isDisabled || undefined}
        aria-busy={isSaving || undefined}
        className="min-w-0"
        onBlur={handleWrapperBlur}
      >
        <InputGroupInput
          ref={inputRef}
          type="text"
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          readOnly={isSaving}
          aria-label={inputAriaLabel}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          className={className}
          {...inputProps}
        />

        <InputGroupButton
          size="icon-sm"
          className={cn("text-muted-foreground hover:text-foreground", buttonClassName)}
          disabled={isDisabled}
          onClick={() => {
            if (isDirty) {
              void runSave(true)
              return
            }
            focusInput()
          }}
          aria-label={isDirty ? `Save ${resolvedLabel}` : `Edit ${resolvedLabel}`}
        >
          {isSaving ? (
            <Spinner />
          ) : showSuccess ? (
            <CheckIcon className="text-success" />
          ) : isDirty ? (
            <SaveIcon />
          ) : (
            <PencilIcon />
          )}
        </InputGroupButton>
      </InputGroup>

      {error && (
        <div className="absolute bottom-0 right-0 translate-y-full max-w-full">
          <FieldError id={errorId} className="truncate">{error}</FieldError>
        </div>
      )}
    </div>
  )
}
