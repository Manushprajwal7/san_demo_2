import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-h-[120px] rounded-xl border border-input bg-white px-4 py-3 text-sm font-normal text-foreground placeholder:text-muted-foreground",
        "shadow-sm transition-all duration-200",
        "focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
