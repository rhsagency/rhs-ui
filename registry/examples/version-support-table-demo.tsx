import { VersionSupportTable } from "@rhs-ui/marketing/version-support-table";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-6 text-xs text-muted-foreground">On 20 October 2026: 4.9 is about to lose active support, and that is the date the table flags</p>
      <VersionSupportTable
        today="2026-10-20"
        caption="Supported versions of the Halcyon SDK"
        versions={[
          { name: "5.2", status: "current", released: "2026-06-02", activeUntil: "2027-06-02", securityUntil: "2028-06-02", notesHref: "#release-5-2" },
          { name: "4.9", released: "2025-04-15", activeUntil: "2026-10-31", securityUntil: "2027-10-31", notesHref: "#release-4-9" },
          { name: "3.14", released: "2023-09-12", activeUntil: "2025-09-12", securityUntil: "2026-12-31", notesHref: "#release-3-14" },
          { name: "2.8", released: "2021-11-02", activeUntil: "2023-11-02", securityUntil: "2025-11-02", notesHref: "#release-2-8" },
          { name: "1.12", released: "2019-03-19", activeUntil: "2021-03-19", securityUntil: "2022-03-19" },
        ]}
        note="Active support means bug fixes and new features. Security only means we patch vulnerabilities and nothing else. We support every major version for at least 24 months after its release, and we announce an end date six months ahead."
      />

      <div className="mt-20 border-t border-border pt-12">
        <p className="mb-6 text-xs text-muted-foreground">Dates written out for readers who do not think in ISO, one version still undecided</p>
        <VersionSupportTable
          today="2026-10-20"
          dateFormat="medium"
          locale="en-GB"
          caption="Kestrel API versions"
          labels={{ version: "API version" }}
          versions={[
            { name: "2026-09-01", status: "current", released: "2026-09-01" },
            { name: "2025-11-12", released: "2025-11-12", activeUntil: "2027-03-12", securityUntil: "2027-11-12", notesHref: "#api-2025-11-12" },
            { name: "2024-05-07", released: "2024-05-07", activeUntil: "2026-05-07", securityUntil: "2026-11-07", notesHref: "#api-2024-05-07" },
            { name: "2023-02-14", released: "2023-02-14", activeUntil: "2024-08-14", securityUntil: "2025-02-14" },
          ]}
          note={
            <>
              Pin the version in your requests with the <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem] text-foreground">Kestrel-Version</code> header. Requests without it use the current version.
            </>
          }
        />
      </div>
    </div>
  );
}
