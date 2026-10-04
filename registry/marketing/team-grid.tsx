import { cn } from "@/lib/utils";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** A square portrait; initials are drawn without one. */
  photo?: string;
  bio?: string;
  links?: readonly { label: string; href: string }[];
}

export interface TeamGridProps {
  eyebrow?: string;
  title: string;
  description?: string;
  members: readonly TeamMember[];
  className?: string;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
}

/**
 * The people behind the product: square portraits, name and role, an
 * optional line and links. Portraits keep one ratio so mixed photos still
 * line up.
 */
export function TeamGrid({ eyebrow, title, description, members, className }: TeamGridProps) {
  return (
    <section data-slot="team-grid" className={cn("py-16 sm:py-24", className)}>
      <header className="max-w-2xl">
        {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-5 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      </header>
      <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
        {members.map((member) => (
          <li key={member.id}>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-muted text-3xl font-medium text-muted-foreground">
              {member.photo ? <img src={member.photo} alt="" className="size-full object-cover" /> : initials(member.name)}
            </div>
            <h3 className="mt-4 text-base font-medium">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.role}</p>
            {member.bio ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{member.bio}</p> : null}
            {member.links?.length ? (
              <ul className="mt-3 flex gap-3 text-xs">
                {member.links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <a href={link.href} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{link.label}</a>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
