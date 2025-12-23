import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-2xl px-2.5 py-1 text-xs font-semibold",
        variant === "secondary" ? "bg-muted text-foreground" : "bg-foreground text-background",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
