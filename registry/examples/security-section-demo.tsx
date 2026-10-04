import { IconDatabase, IconFingerprint, IconHistory, IconKey } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { SecuritySection } from "@rhs-ui/marketing/security-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SecuritySection
        title="Built for the security review."
        description="Your data stays in the EU, encrypted at rest and in transit, and we can show you the paperwork."
        standards={["ISO 27001", "SOC 2 Type II", "GDPR", "EU data residency"]}
        action={<Button variant="outline">Visit the trust centre</Button>}
        practices={[
          { icon: <IconKey />, title: "Single sign-on", description: "SAML and OIDC, with SCIM to add and remove people automatically." },
          { icon: <IconFingerprint />, title: "Two-step sign-in", description: "Enforce it for the whole workspace with one switch." },
          { icon: <IconHistory />, title: "Audit log", description: "Every sign-in, export and permission change, kept for a year." },
          { icon: <IconDatabase />, title: "Daily backups", description: "Encrypted, stored in a second EU region, restored in under an hour." },
        ]}
      />
    </div>
  );
}
