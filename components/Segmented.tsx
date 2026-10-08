"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { IconType } from "./icons";

export type SegmentItem<T extends string> = {
  key: T;
  label: string;
  Icon: IconType;
  count?: number;
};

/**
 * Pill segmented control with a thumb that glides between the active items.
 */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
}: {
  items: SegmentItem<T>[];
  value: T;
  onChange: (key: T) => void;
}) {
  const refs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);

  const layoutKey = items.map((i) => i.key).join("|");

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[value];
      if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, layoutKey]);

  return (
    <div className="relative flex items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5">
      {thumb && (
        <span
          aria-hidden
          className="celer-thumb absolute bottom-0.5 top-0.5 left-0 rounded-md bg-white shadow-sm ring-1 ring-zinc-900/5"
          style={{ width: thumb.w, transform: `translate3d(${thumb.x}px,0,0)` }}
        />
      )}
      {items.map(({ key, label, Icon, count }) => {
        const active = key === value;
        return (
          <button
            key={key}
            ref={(el) => {
              refs.current[key] = el;
            }}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={`relative z-10 inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors duration-300 ${
              active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Icon size={13} strokeWidth={active ? 2 : 1.6} />
            {label}
            {count !== undefined && count > 0 && (
              <span
                className={`ml-0.5 tabular-nums text-[11px] transition-colors duration-300 ${
                  active ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
