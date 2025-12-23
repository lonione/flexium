import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:opacity-90",
        secondary: "bg-muted text-foreground hover:bg-muted/80",
        outline: "border border-input bg-background hover:bg-muted/40",
        ghost: "hover:bg-muted/40",
        destructive: "bg-red-600 text-white hover:bg-red-700"
      },
      size: { default: "h-10 px-4 py-2", sm: "h-9 px-3", icon: "h-9 w-9" }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";

export { Button, buttonVariants };
