import * as React from "react";

import { cn } from "@/lib";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl border border-white/10 bg-[#111111]/80 shadow-[0_30px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
});

export const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  function CardContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("p-6 sm:p-8", className)}
        {...props}
      />
    );
  },
);
