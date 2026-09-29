import { IconCalendar } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@rhs-ui/primitives/hover-card";

export default function Demo(): React.JSX.Element {
  return (
    <p className="text-sm">
      Reviewed by{" "}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a href="#ines" className="font-medium underline underline-offset-4">
            @ines
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="flex gap-4">
            <Avatar size="lg">
              <AvatarFallback>IM</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <p className="text-sm font-semibold">Ines Moreau</p>
              <p className="text-sm text-muted-foreground">Studio lead at Orbit. Ships design systems for a living.</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconCalendar size={14} /> Joined March 2024
              </p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>{" "}
      two hours ago.
    </p>
  );
}
