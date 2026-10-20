import { ThreeStepsHero } from "@rhs-ui/marketing/three-steps-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <ThreeStepsHero
        title="Your tax return, filed without the paperwork chase."
        description="Send your documents once. A registered adviser checks every line, files the return and tells you what you get back."
        cta={{ label: "Start your return", href: "#start" }}
        steps={[
          { title: "Upload", description: "Photograph your payslips and statements, or connect your bank. No forms to fill in.", time: "2 minutes" },
          { title: "We check", description: "An adviser reviews every line, asks if something is missing and signs it off.", time: "Same day" },
          { title: "You receive it", description: "The return is filed with the tax office and your copy lands in your inbox.", time: "In 3 days" },
        ]}
        summary="From start to done: about 3 days"
      />
    </div>
  );
}
