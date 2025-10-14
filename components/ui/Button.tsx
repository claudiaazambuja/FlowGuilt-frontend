import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 transition";
  const styles =
    variant === "secondary"
      ? "bg-[#232323] hover:brightness-110 text-zinc-200 border-0 focus:ring-[#6C3BF4]"
      : "bg-[#1DB954] hover:brightness-110 text-black focus:ring-[#1DB954]";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
