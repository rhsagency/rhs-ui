import { cn } from "@/lib/utils";

export interface UserChipProps {
  name: string;
  /** A second line: an email, a role, a handle. */
  detail?: string;
  photo?: string;
  /** Presence dot, with its word for screen readers. */
  status?: "online" | "away" | "busy" | "offline";
  size?: "sm" | "md";
  className?: string;
}

const STATUS = { online: "bg-[var(--color-success,oklch(0.62_0.15_150))]", away: "bg-[var(--color-warning,oklch(0.72_0.16_75))]", busy: "bg-destructive", offline: "bg-muted-foreground/50" } as const;

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
}

/**
 * A person inline: a small avatar, the name and an optional second line,
 * with presence when you have it. For assignees, authors, table cells and
 * mentions.
 */
export function UserChip({ name, detail, photo, status, size = "md", className }: UserChipProps) {
  const avatar = size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs";
  return (
    <span data-slot="user-chip" className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span className={cn("relative inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground", avatar)}>
        {photo ? <img src={photo} alt="" className="size-full rounded-full object-cover" /> : initials(name)}
        {status ? <span aria-hidden="true" className={cn("absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-background", STATUS[status])} /> : null}
      </span>
      <span className="min-w-0 leading-tight">
        <span className={cn("block truncate font-medium", size === "sm" ? "text-xs" : "text-sm")}>{name}{status ? <span className="sr-only">, {status}</span> : null}</span>
        {detail ? <span className="block truncate text-xs text-muted-foreground">{detail}</span> : null}
      </span>
    </span>
  );
}
