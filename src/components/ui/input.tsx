import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-sm border border-neutral-200 bg-white px-3 text-sm placeholder:text-neutral-400",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500",
        "disabled:bg-neutral-100 disabled:text-neutral-400",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-sm border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("mb-1 block text-sm font-medium text-neutral-700", className)} {...props} />
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-sm border border-neutral-200 bg-white px-3 text-sm",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
