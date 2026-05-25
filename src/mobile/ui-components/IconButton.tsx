import { ComponentProps } from "react";

export function IconButton({ className, ...props }: ComponentProps<"button">) {
  const base =
    "p-1.5 text-navy/50 hover:text-navy rounded-md hover:bg-surface focus-visible:ring-2 focus-visible:ring-crimson";
  return <button className={`${base} ${className ?? ""}`} {...props} />;
}
