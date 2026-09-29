import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";

// Drawn portraits as data URIs, so the preview needs no image host.
const PORTRAIT_A =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#d9d6cf"/><circle cx="48" cy="38" r="17" fill="#3a3733"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="#3a3733"/></svg>');
const PORTRAIT_B =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#2c2f33"/><circle cx="48" cy="39" r="16" fill="#e9e7e2"/><path d="M16 96c4-20 17-31 32-31s28 11 32 31z" fill="#e9e7e2"/></svg>');

const TEAM = ["Ada Lovelace", "Grace Hopper", "Alan Turing", "Margaret Hamilton", "Tim Berners-Lee", "Katherine Johnson"];

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-end gap-4">
        <Avatar size="lg">
          <AvatarImage src={PORTRAIT_A} alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarImage src={PORTRAIT_B} alt="Grace Hopper" />
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <Avatar size="sm">
          <AvatarFallback>{initialsOf("Alan Turing")}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex items-center gap-3">
        <AvatarGroup>
          {TEAM.slice(0, 4).map((name) => (
            <Avatar key={name}>
              <AvatarFallback>{initialsOf(name)}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount>+{TEAM.length - 4}</AvatarGroupCount>
        </AvatarGroup>
        <span className="text-sm text-muted-foreground">{TEAM.length} people on this project</span>
      </div>
    </div>
  );
}
