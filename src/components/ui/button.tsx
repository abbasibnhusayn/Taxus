import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "ai";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-700 text-white hover:bg-primary-900 disabled:bg-neutral-200",
  secondary: "border border-neutral-400 text-neutral-900 bg-white hover:bg-neutral-100",
  ghost: "text-primary-700 hover:bg-primary-100",
  destructive: "bg-status-danger text-white hover:opacity-90",
  ai: "bg-ai text-white hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
