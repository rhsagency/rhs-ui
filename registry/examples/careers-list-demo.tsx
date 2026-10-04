"use client";

import { CareersList } from "@rhs-ui/marketing/careers-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <CareersList
        description="We are a remote-first team across Europe. Every role is open to anyone within three hours of Amsterdam time."
        openings={[
          { id: "1", title: "Senior product designer", team: "Design", location: "Remote, EU", type: "Full-time", href: "#" },
          { id: "2", title: "Brand designer", team: "Design", location: "Amsterdam", type: "Contract", href: "#" },
          { id: "3", title: "Staff engineer, platform", team: "Engineering", location: "Remote, EU", type: "Full-time", href: "#" },
          { id: "4", title: "Front-end engineer", team: "Engineering", location: "Remote, EU", type: "Full-time", href: "#" },
          { id: "5", title: "Support lead", team: "Customer", location: "Amsterdam", type: "Full-time", href: "#" },
        ]}
      />
    </div>
  );
}
