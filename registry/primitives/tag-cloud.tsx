import { cn } from "@/lib/utils";

export interface CloudTag {
  label: string;
  /** How often it appears; drives the size. */
  count: number;
  href: string;
}

export interface TagCloudProps {
  tags: readonly CloudTag[];
  label?: string;
  /** Show the count after each tag. */
  showCounts?: boolean;
  className?: string;
}

/**
 * Topics weighted by use, for a blog or a knowledge base: four type sizes
 * on a log scale so one huge tag does not dwarf the rest, alphabetical so
 * people can scan, and each tag a link with its count in the accessible
 * name ("Pricing, 24 posts").
 */
export function TagCloud({ tags, label = "Topics", showCounts = false, className }: TagCloudProps) {
  const counts = tags.map((tag) => Math.log(tag.count + 1));
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const step = (count: number) => (max === min ? 1 : Math.round(((Math.log(count + 1) - min) / (max - min)) * 3));
  const SIZES = ["text-xs text-muted-foreground", "text-sm", "text-base font-medium", "text-xl font-medium tracking-tight"];
  return (
    <nav data-slot="tag-cloud" aria-label={label} className={className}>
      <ul className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        {[...tags].sort((a, b) => a.label.localeCompare(b.label)).map((tag) => (
          <li key={`${tag.href}-${tag.label}`}>
            <a href={tag.href} aria-label={`${tag.label}, ${tag.count} ${tag.count === 1 ? "post" : "posts"}`} className={cn("rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40", SIZES[step(tag.count)])}>
              {tag.label}
              {showCounts ? <sup className="ml-0.5 text-[10px] font-normal text-muted-foreground">{tag.count}</sup> : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
