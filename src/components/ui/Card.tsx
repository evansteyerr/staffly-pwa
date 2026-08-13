import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/20 ${className}`}
      {...props}
    />
  );
}

export function ChoiceCard({
  className = "",
  ...props
}: HTMLAttributes<HTMLButtonElement> & Record<string, unknown>) {
  return (
    <button
      className={`w-full rounded-2xl border border-border bg-surface-2 p-4 text-left transition-colors hover:border-accent-gold hover:bg-surface cursor-pointer ${className}`}
      {...(props as HTMLAttributes<HTMLButtonElement>)}
    />
  );
}
