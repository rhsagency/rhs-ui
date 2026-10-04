import { LegalLayout } from "@rhs-ui/marketing/legal-layout";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <LegalLayout
        titleAs="h2"
        title="Privacy policy"
        updated="Last updated 1 March 2026"
        updatedDateTime="2026-03-01"
        summary={["We collect what we need to run your account, nothing more.", "We never sell your data or use it for ads.", "Your data is stored in the EU and you can export or delete it any time."]}
        sections={[
          { id: "legal-collect", title: "What we collect", body: ["Your name, email address and the content you put into your workspace.", "Basic usage data, such as which features are used, without tracking you across other sites."] },
          { id: "legal-use", title: "How we use it", body: ["To run the service, to keep it secure and to answer your questions.", "We email you about your account. Product news only if you opted in."] },
          { id: "legal-share", title: "Who we share it with", body: ["Only the processors that help us run the service, listed on our sub-processors page, under a data processing agreement."] },
          { id: "legal-rights", title: "Your rights", body: ["You can see, correct, export and delete your data from the settings, or by emailing us."] },
        ]}
      />
    </div>
  );
}
