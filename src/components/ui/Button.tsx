import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent-red-bright hover:bg-accent-red text-white border border-accent-red-bright",
  secondary: "bg-surface-2 hover:bg-surface border border-border text-foreground",
  ghost: "bg-transparent hover:bg-surface-2 border border-border text-muted hover:text-foreground",
  danger: "bg-transparent hover:bg-surface-2 border border-accent-red text-accent-red-bright",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`w-full rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
