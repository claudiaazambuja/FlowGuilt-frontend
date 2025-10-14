import * as React from "react";

import { cn } from "@/lib";

type Variant = "primary" | "secondary";

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    "bg-[#1DB954] text-black shadow-[0_0_20px_rgba(29,185,84,0.2)] hover:brightness-110 focus-visible:ring-[#1DB954]",
  secondary:
    "bg-[#232323] text-zinc-200 hover:brightness-110 focus-visible:ring-[#6C3BF4]",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", className, disabled, ...props },
  ref,
) {
  const variantClasses = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;

  return (
    <button
      ref={ref}
      data-variant={variant}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        disabled ? "cursor-not-allowed opacity-70" : undefined,
        variantClasses,
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
});
