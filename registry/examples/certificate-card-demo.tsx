"use client";

import type { ReactNode } from "react";

import { CertificateCard } from "@rhs-ui/application/certificate-card";

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Stands in for a request that builds the PDF: the button shows a spinner until it settles. */
const download = () => new Promise<void>((resolve) => setTimeout(resolve, 900));

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl items-start gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="Valid: copy the credential ID, download it, or verify it in a new tab.">
        <CertificateCard
          recipient="Priya Ramanathan"
          title="Advanced Accessibility Engineering"
          issuer="Northwind Academy"
          issuedAt="2026-01-12"
          expiresAt="2029-01-12"
          credentialId="NWA-ACC-2026-004817"
          verifyHref="https://verify.northwind.academy/c/NWA-ACC-2026-004817"
          onDownload={download}
          expired={false}
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
      </Case>

      <Case caption="Expired: the date is stated, and the frame and the seal go quiet.">
        <CertificateCard
          recipient="Daniel Okonkwo"
          title="Introduction to Cloud Networking"
          issuer="Northwind Academy"
          issuedAt="2024-03-04"
          expiresAt="2026-03-03"
          credentialId="NWA-NET-2024-001302"
          verifyHref="https://verify.northwind.academy/c/NWA-NET-2024-001302"
          onDownload={download}
          expired
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
      </Case>
    </div>
  );
}
