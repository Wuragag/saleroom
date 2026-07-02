import * as React from "react";
import Image from "next/image";

import { cn, hashToIndex, initials } from "@/lib/utils";

const AVATAR_SIZES = {
  xs: "h-5 w-5 text-3xs",
  sm: "h-7 w-7 text-2xs",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
} as const;

// Number of categorical hues defined as --cat-1..N in globals.css.
const CAT_COUNT = 6;

export interface AvatarProps {
  /** Display name — drives both the initials and the deterministic color. */
  name: string;
  /** Optional image URL; when present it replaces the initials tile. */
  src?: string | null;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}

/**
 * User/visitor avatar. Colors come from the tokenized `--cat-*` palette (never
 * hardcode avatar hues in feature code). Decorative by default — pair it with a
 * visible name, or set a `title` on the wrapper via className consumers.
 */
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const idx = hashToIndex(name || "?", CAT_COUNT) + 1;
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center overflow-hidden shrink-0 font-semibold text-white",
        AVATAR_SIZES[size],
        className
      )}
      style={src ? undefined : { backgroundColor: `hsl(var(--cat-${idx}))` }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}
