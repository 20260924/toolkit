import type { ComponentProps } from "react";

import { cn } from "./cn.ts";

const VARIANTS = {
  primary: "border-transparent bg-primary text-on-primary hover:opacity-90",
  danger: "border-transparent bg-danger text-on-primary hover:opacity-90",
  outline: "border-line bg-surface text-ink hover:border-primary",
} as const;

type ButtonProps = ComponentProps<"button"> & { variant?: keyof typeof VARIANTS };

export function Button({ variant = "outline", type = "button", className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

// Plain text that acts as a button, for inline row actions.
export function TextButton({ type = "button", className, ...props }: ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={cn("underline-offset-2 hover:underline", className)}
      {...props}
    />
  );
}
