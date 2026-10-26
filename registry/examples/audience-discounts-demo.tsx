import { IconGitBranch, IconGraduationCap, IconHeart, IconRocket } from "@rhs-ui/icons";
import { AudienceDiscounts } from "@rhs-ui/marketing/audience-discounts";

const startups = {
  id: "startups",
  audience: "Startups",
  discount: "50% off",
  duration: "for your first year",
  eligibility: ["Under $2M raised and less than five years old", "A company email address", "Not combined with another discount"],
  action: { label: "Apply for the startup discount", href: "#startups" },
  icon: <IconRocket />,
};
const students = {
  id: "students",
  audience: "Students",
  discount: "40% off",
  duration: "for as long as you study",
  eligibility: ["Enrolled at an accredited school or university", "A school email address or a current student card", "Renews each year with proof of study"],
  action: { label: "Apply for the student discount", href: "#students" },
  icon: <IconGraduationCap />,
};
const nonprofits = {
  id: "nonprofits",
  audience: "Nonprofits",
  discount: "30% off",
  duration: "every year, no end date",
  // The word joiner (U+2060) keeps "501(c)(3)" in one piece: a line may not break between its brackets.
  eligibility: ["A registered charity or 501(c)\u2060(3) organisation", "Up to 50 seats", "Not a department of a company"],
  action: { label: "Apply for the nonprofit discount", href: "#nonprofits" },
  icon: <IconHeart />,
};
const openSource = {
  id: "open-source",
  audience: "Open source",
  discount: "Free",
  duration: "for maintainers, as long as the project is active",
  eligibility: ["A public repository under an OSI-approved licence", "At least ten contributors or a hundred stars", "Commercial support is not sold with it"],
  action: { label: "Apply as a maintainer", href: "#open-source" },
  icon: <IconGitBranch />,
};

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Four groups on a pricing page: the saving is the biggest thing on each card, and the buttons name the group</p>
      <AudienceDiscounts
        title="Pay less while you are building something small"
        description="Halcyon should not be the reason a good project waits. If you fit one of these, you do not need to ask."
        programs={[startups, students, nonprofits, openSource]}
        note="We check with a student email, a charity number or a short letter from your school. Most answers arrive within two working days."
      />

      <div className="mt-20 border-t border-border pt-12">
        <p className="mb-8 text-xs text-muted-foreground">Three groups at the end of a billing screen, with no introduction</p>
        <AudienceDiscounts headingLevel={3} title="Do you qualify for a discount?" programs={[startups, students, nonprofits]} note="Applying does not change your current plan. Approved discounts start at your next invoice." />
      </div>
    </div>
  );
}
