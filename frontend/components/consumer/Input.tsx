"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FieldState = "idle" | "focus" | "valid" | "error" | "checking";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  state?: FieldState;
  errorText?: string;
  rightSlot?: React.ReactNode;
  counter?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, state = "idle", errorText, rightSlot, counter, className, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const active = state === "idle" ? (focused ? "focus" : "idle") : state;
    const border =
      active === "error"
        ? "border-error"
        : active === "valid"
        ? "border-success"
        : active === "focus"
        ? "border-teal-deep ring-1 ring-teal-deep"
        : "border-line dark:border-white/20";
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-label-bold text-ink dark:text-off-white">{label}</label>
        )}
        <div
          className={cn(
            "flex h-12 items-center rounded-input border-2 bg-white dark:bg-surface-dark px-3.5 transition-colors",
            border
          )}
        >
          <input
            ref={ref}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            className={cn(
              "w-full bg-transparent text-body-md text-ink dark:text-white placeholder:text-mid-grey/50 dark:placeholder:text-white/35 focus:outline-none",
              className
            )}
            {...props}
          />
          <div className="ml-2 flex shrink-0 items-center gap-1.5">
            {state === "checking" && <span className="material-symbols-outlined text-[16px] animate-spin text-mid-grey">progress_activity</span>}
            {state === "valid" && <span className="material-symbols-outlined text-[16px] text-success">check</span>}
            {state === "error" && <span className="material-symbols-outlined text-[16px] text-error">error</span>}
            {rightSlot}
          </div>
        </div>
        {(errorText || counter) && (
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-caption text-error">{errorText}</span>
            <span
              className={cn(
                "text-caption",
                counter?.startsWith("20") ? "text-error" : "text-mid-grey"
              )}
            >
              {counter}
            </span>
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  counter?: string;
}
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, counter, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-label-bold text-ink dark:text-off-white">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-input border-2 border-line dark:border-white/20 bg-white dark:bg-surface-dark p-3.5 text-body-md text-ink dark:text-white placeholder:text-mid-grey/50 dark:placeholder:text-white/35 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20",
          className
        )}
        {...props}
      />
      {counter && (
        <div className="mt-1 text-right text-caption text-mid-grey">{counter}</div>
      )}
    </div>
  )
);
TextArea.displayName = "TextArea";
