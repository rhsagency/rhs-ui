import { AnnouncementPill } from "@rhs-ui/primitives/announcement-pill";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-4 p-6">
      <AnnouncementPill tag="New" text="Scroll sections are in RHS UI Pro" href="#pro" />
      <AnnouncementPill tag="v0.6" text="300 free components and 33 templates" href="#changelog" />
    </div>
  );
}
