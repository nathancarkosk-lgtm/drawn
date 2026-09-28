import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** In-flow bar. Never sticky/fixed — iOS WebKit treats those layers as a full-screen tap sink. */
export function Dock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "no-print pointer-events-none relative z-20 shrink-0 border-t border-border bg-bg px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-2xl items-center gap-2">{children}</div>
    </div>
  );
}
