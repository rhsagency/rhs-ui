import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ProfileCardProps {
  name: string;
  role?: string;
  /** A square photo URL; initials are drawn without one. */
  photo?: string;
  /** A wide image behind the top of the card. */
  cover?: string;
  bio?: string;
  stats?: readonly { label: string; value: string }[];
  actions?: ReactNode;
  className?: string;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
}

/**
 * A person at a glance: cover, photo overlapping it, name and role, a short
 * bio, a few numbers and the actions you allow (follow, message, hire).
 */
export function ProfileCard({ name, role, photo, cover, bio, stats = [], actions, className }: ProfileCardProps) {
  return (
    <article data-slot="profile-card" className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="h-24 bg-muted">{cover ? <img src={cover} alt="" className="size-full object-cover" /> : null}</div>
      <div className="px-5 pb-5">
        <div className="-mt-10 flex items-end justify-between gap-3">
          <span className="flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-muted text-xl font-medium text-muted-foreground">
            {photo ? <img src={photo} alt="" className="size-full object-cover" /> : initials(name)}
          </span>
          {actions ? <div className="flex gap-2 pb-1">{actions}</div> : null}
        </div>
        <h3 className="mt-3 text-lg font-medium tracking-[-0.02em]">{name}</h3>
        {role ? <p className="text-sm text-muted-foreground">{role}</p> : null}
        {bio ? <p className="mt-3 text-sm leading-relaxed">{bio}</p> : null}
        {stats.length ? (
          <dl className="mt-4 flex gap-6 border-t border-border pt-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd className="text-base font-medium tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </article>
  );
}
