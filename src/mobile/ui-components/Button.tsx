import { type ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const base = "rounded-md px-4 py-2 focus-visible:ring-2 focus-visible:ring-crimson";
  const variants = {
    primary: "bg-crimson text-white hover:bg-terracotta",
    secondary: "border border-navy text-navy hover:bg-surface",
  };

  return <button className={`${base} ${variants[variant]} ${className ?? ""}`} {...props} />;
}
