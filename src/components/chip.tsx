import type { PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useRef } from "react";

export function Chip({
  selected,
  children,
  onClick,
  disabled,
  className,
}: {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const last = useRef(0);

  const fire = () => {
    if (disabled) return;
    const now = performance.now();
    if (now - last.current < 400) return;
    last.current = now;
    onClick();
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    origin.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const o = origin.current;
    origin.current = null;
    if (!o) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const dx = e.clientX - o.x;
    const dy = e.clientY - o.y;
    if (dx * dx + dy * dy > 144) return;
    fire();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        origin.current = null;
      }}
      onClick={(e) => {
        e.preventDefault();
        fire();
      }}
      className={cn(
        "relative inline-flex min-h-12 cursor-pointer items-center rounded-md border px-3.5 py-2.5 text-left text-sm font-medium transition-[background-color,border-color,color] duration-150 ease-out [touch-action:manipulation]",
        selected
          ? "border-primary bg-primary text-primary-fg"
          : "border-border bg-surface text-fg active:bg-surface-2",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}
