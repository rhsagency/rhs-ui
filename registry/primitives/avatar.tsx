import type { ComponentProps } from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * A person or a workspace as a circle: the image when it loads, their
 * initials until then or when it fails, never a broken image. Give the image
 * an alt, or alt="" when the name is written next to it.
 */
export function Avatar({ className, size = "default", ...props }: ComponentProps<typeof AvatarPrimitive.Root> & { size?: "sm" | "default" | "lg" }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex shrink-0 overflow-hidden rounded-full bg-muted select-none",
        "data-[size=sm]:size-7 data-[size=default]:size-9 data-[size=lg]:size-12",
        className,
      )}
      {...props}
    />
  );
}

export function AvatarImage({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image data-slot="avatar-image" className={cn("aspect-square size-full object-cover", className)} {...props} />;
}

export function AvatarFallback({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground",
        "text-[0.8125rem] group-data-[size=sm]/avatar:text-[0.6875rem] group-data-[size=lg]/avatar:text-base",
        className,
      )}
      {...props}
    />
  );
}

/** Overlapping avatars with a ring in the page colour, so each edge stays visible and initials stay whole. */
export function AvatarGroup({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="avatar-group" className={cn("flex -space-x-1.5 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background", className)} {...props} />;
}

/** The "+3" at the end of a group, for the people you did not draw. */
export function AvatarGroupCount({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-group-count"
      className={cn("relative flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[0.8125rem] font-medium text-foreground ring-2 ring-background", className)}
      {...props}
    />
  );
}

/** "Ada Lovelace" -> "AL", "cher" -> "C". Two letters at most, from the first and the last word. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
