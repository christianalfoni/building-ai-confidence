import { ComponentProps } from "react";

export function Input({ className, ...props }: ComponentProps<"input">) {
  const base =
    "w-full border border-navy/20 rounded-md px-3 py-2 text-navy outline-none focus-visible:ring-2 focus-visible:ring-crimson";
  return <input className={`${base} ${className ?? ""}`} {...props} />;
}
