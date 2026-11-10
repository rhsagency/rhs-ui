import { IconScale, IconShieldCheck, IconWarning } from "@rhs-ui/icons";
import { FooterRegulatory } from "@rhs-ui/marketing/footer-regulatory";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          An insurer&apos;s footer: compact columns on top, then the registration list, the regulator statement, the risk and liability notices in normal text, and the complaint links. Click a registration value and it selects whole.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <FooterRegulatory
            brand={<span className="text-lg font-semibold tracking-tight">Halcyon Mutual</span>}
            tagline="Pensions and income protection, owned by the people who pay in."
            columns={[
              {
                title: "Products",
                links: [
                  { label: "Pension", href: "#pension" },
                  { label: "Income protection", href: "#income" },
                  { label: "Savings", href: "#savings" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About us", href: "#about" },
                  { label: "Annual report", href: "#report" },
                  { label: "Careers", href: "#careers" },
                ],
              },
              {
                title: "Help",
                links: [
                  { label: "Contact", href: "#contact" },
                  { label: "Claims", href: "#claims" },
                  { label: "Find an adviser", href: "#adviser" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Terms", href: "#terms" },
                  { label: "Privacy", href: "#privacy" },
                  { label: "Cookies", href: "#cookies" },
                ],
              },
            ]}
            registration={[
              { label: "Trade register", value: "61 42 08 77" },
              { label: "VAT ID", value: "NL855421907B01" },
              { label: "Licence", value: "Insurer, register number 12-0431" },
              { label: "Registered office", value: "Weena 505, 3013 AL Rotterdam, The Netherlands" },
            ]}
            statements={[
              {
                title: "Regulated by",
                icon: <IconShieldCheck />,
                body: (
                  <>
                    Halcyon Mutual N.V. holds a licence from the national financial supervisor to offer pension and income protection insurance. You can check it in the <a href="#register">supervisor&apos;s public register</a>.
                  </>
                ),
              },
              {
                title: "Risk warning",
                icon: <IconWarning />,
                body: "The value of a pension pot can go down as well as up, and you may get back less than you paid in. Past returns are not a guide to future returns. Income protection pays out only when the terms of the policy are met.",
              },
              {
                title: "Liability",
                icon: <IconScale />,
                body: "The pages on this site are general information, not personal advice. We take care to keep them correct, but we are not liable for decisions taken on them without advice that fits your situation.",
              },
            ]}
            links={[
              { label: "Complaints procedure", href: "#complaints" },
              { label: "Online dispute resolution", href: "https://example.com/dispute", external: true },
              { label: "Register entry 12-0431", href: "https://example.com/register/12-0431", external: true },
            ]}
            reviewed={{ label: "Wording last reviewed 4 March 2026", dateTime: "2026-03-04" }}
            legal="© 2026 Halcyon Mutual N.V."
          />
        </div>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          A school with less to print: no mark, no complaint links, one statement. The registration rows and the review date stay.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <FooterRegulatory
            navLabel="Footer, school"
            columns={[
              {
                title: "Courses",
                links: [
                  { label: "Evening classes", href: "#evening" },
                  { label: "Exam preparation", href: "#exams" },
                  { label: "Fees", href: "#fees" },
                ],
              },
              {
                title: "School",
                links: [
                  { label: "Teachers", href: "#teachers" },
                  { label: "Open days", href: "#open-days" },
                  { label: "Contact", href: "#contact" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "General terms", href: "#terms" },
                  { label: "Privacy", href: "#privacy" },
                ],
              },
            ]}
            registration={[
              { label: "Trade register", value: "73 20 51 16" },
              { label: "Accreditation", value: "Registered adult education provider, 2019-4417" },
            ]}
            statements={[
              {
                title: "Accredited provider",
                icon: <IconShieldCheck />,
                body: "Our evening courses are registered with the national register of adult education, so the fees are exempt from VAT. The register entry lists every course we may offer under that status.",
              },
            ]}
            reviewed={{ label: "Wording last reviewed 21 January 2026", dateTime: "2026-01-21" }}
            legal="© 2026 Kestrel Language School"
          />
        </div>
      </figure>
    </div>
  );
}
