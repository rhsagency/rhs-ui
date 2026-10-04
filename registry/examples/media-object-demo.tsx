import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { MediaObject } from "@rhs-ui/primitives/media-object";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl space-y-6 p-8">
      <MediaObject media={<Avatar><AvatarFallback>SH</AvatarFallback></Avatar>} title="Sara Haddad" aside={<span className="text-xs text-muted-foreground">2 h ago</span>}>
        Moved the launch to Thursday so the new pricing page ships with it.
      </MediaObject>
      <MediaObject align="center" media={<span className="inline-flex size-10 items-center justify-center rounded-lg bg-muted text-xs font-semibold">PDF</span>} title="Q1 report.pdf" aside={<Button size="sm" variant="outline">Open</Button>}>
        2.4 MB, shared with the team
      </MediaObject>
    </div>
  );
}
