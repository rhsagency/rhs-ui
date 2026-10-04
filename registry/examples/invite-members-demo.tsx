"use client";

import { InviteMembers } from "@rhs-ui/application/invite-members";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl p-6">
      <InviteMembers
        seatsLeft={4}
        defaultRole="member"
        roles={[
          { id: "admin", label: "Admin", description: "Manage billing and people" },
          { id: "member", label: "Member", description: "Create and edit work" },
          { id: "guest", label: "Guest", description: "View and comment only" },
        ]}
        onInvite={() => new Promise((resolve) => setTimeout(resolve, 700))}
      />
    </div>
  );
}
