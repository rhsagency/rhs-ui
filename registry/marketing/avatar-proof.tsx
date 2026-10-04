import { IconStar } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface AvatarProofProps {
  /** Up to five faces or initials; more are summarised in the count. */
  people: readonly { name: string; image?: string }[];
  /** The claim: "Loved by 12,000 designers". */
  label: string;
  /** Optional average rating out of five. */
  rating?: number;
  className?: string;
}

const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

/**
 * The small social proof that sits under a hero's buttons: a stack of faces,
 * stars and one line. The faces are decoration (the line says it all), so a
 * screen reader hears the claim once, not five names.
 */
export function AvatarProof({ people, label, rating, className }: AvatarProofProps) {
  return (
    <div data-slot="avatar-proof" className={cn("flex items-center gap-3", className)}>
      <span aria-hidden="true" className="flex -space-x-2.5">
        {people.slice(0, 5).map((person) => (
          <span key={person.name} className="inline-flex size-9 items-center justify-center overflow-hidden rounded-full bg-muted text-[11px] font-medium ring-2 ring-background">
            {person.image ? <img src={person.image} alt="" className="size-full object-cover" /> : initials(person.name)}
          </span>
        ))}
      </span>
      <span className="flex flex-col gap-0.5">
        {rating !== undefined ? (
          <span className="flex items-center gap-0.5" aria-label={`Rated ${rating.toFixed(1)} out of 5`} role="img">
            {[1, 2, 3, 4, 5].map((star) => <IconStar key={star} aria-hidden="true" className={cn("size-3.5", star <= Math.round(rating) ? "fill-current text-foreground" : "text-border")} />)}
          </span>
        ) : null}
        <span className="text-sm text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}
