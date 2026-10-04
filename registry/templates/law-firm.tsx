"use client";
import { IconBriefcase, IconBuilding, IconFileText, IconMail, IconPhone, IconPin, IconScale, IconUsers } from "@rhs-ui/icons";
import { ContactSection } from "@rhs-ui/marketing/contact-section";
import { FaqColumns } from "@rhs-ui/marketing/faq-columns";
import { FeatureGrid } from "@rhs-ui/marketing/feature-grid";
import { FooterSection } from "@rhs-ui/marketing/footer-section";
import { StatsGrid } from "@rhs-ui/marketing/stats-grid";
import { TeamGrid } from "@rhs-ui/marketing/team-grid";
import { TestimonialSpotlight } from "@rhs-ui/marketing/testimonial-spotlight";
import { Button } from "@rhs-ui/primitives/button";

export interface LawFirmProps {
  name?: string;
  onContact?: (message: { name: string; email: string; message: string }) => Promise<void> | void;
}

/**
 * A law firm's site on one page: a serif opening with the practice in one
 * sentence, practice areas, the numbers clients ask about, the partners,
 * a client's words, plain-language answers and an intake form.
 */
export function LawFirm({ name = "Linden & Vos", onContact = () => undefined }: LawFirmProps): React.JSX.Element {
  return (
    <div data-slot="law-firm" className="bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-sm">
          <a href="#top" className="font-serif text-xl tracking-tight">{name}</a>
          <nav aria-label="Main" className="hidden gap-7 text-muted-foreground md:flex"><a href="#practice">Practice areas</a><a href="#people">People</a><a href="#contact">Contact</a></nav>
          <a href="tel:+31201234567" className="hidden items-center gap-2 sm:inline-flex"><IconPhone size={16} /> 020 123 4567</a>
        </div>
      </header>
      <section id="top" className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Advocaten · Amsterdam since 1998</p>
        <h1 className="mt-6 max-w-4xl font-serif text-6xl leading-[1.02] tracking-[-0.03em] sm:text-7xl">Clear advice when the stakes are high.</h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">Corporate, employment and real estate law for companies and the people who run them. We answer within one working day.</p>
        <div className="mt-10 flex flex-wrap gap-3"><Button size="lg" asChild><a href="#contact">Book a first conversation</a></Button><Button size="lg" variant="outline" asChild><a href="#practice">Our practice</a></Button></div>
      </section>
      <section id="practice" className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-6">
          <FeatureGrid eyebrow="Practice areas" title="Where we can help" features={[{ id: "corp", icon: <IconBuilding />, title: "Corporate", description: "Mergers, shareholder agreements and governance." }, { id: "emp", icon: <IconUsers />, title: "Employment", description: "Contracts, dismissals and reorganisations, for both sides." }, { id: "re", icon: <IconPin />, title: "Real estate", description: "Leases, development and disputes over property." }, { id: "lit", icon: <IconScale />, title: "Litigation", description: "Before the courts and in arbitration, when talking stops working." }, { id: "contracts", icon: <IconFileText />, title: "Contracts", description: "Terms that hold up, written in plain Dutch and English." }, { id: "startups", icon: <IconBriefcase />, title: "Start-ups", description: "Fixed-price packages for founders and their first hires." }]} />
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-6">
        <StatsGrid stats={[{ value: "27", label: "Years of practice" }, { value: "14", label: "Lawyers" }, { value: "1 day", label: "To answer every enquiry" }, { value: "91%", label: "Cases settled without court" }]} />
        <div id="people"><TeamGrid eyebrow="Partners" title="The people you will work with" members={[{ id: "1", name: "Marijke Linden", role: "Partner, corporate" }, { id: "2", name: "Thomas Vos", role: "Partner, litigation" }, { id: "3", name: "Aisha Bakker", role: "Partner, employment" }, { id: "4", name: "Joris de Ruiter", role: "Partner, real estate" }]} /></div>
        <TestimonialSpotlight quote="They told us what would happen if we went to court, and what it would cost. Then they made sure we did not have to." name="CFO, logistics company" role="Client since 2019" />
        <FaqColumns eyebrow="Before you call" title="Plain answers" faqs={[{ question: "What does a first conversation cost?", answer: "Nothing. Thirty minutes to understand your question and tell you whether we are the right firm." }, { question: "How do you charge?", answer: "By the hour or at a fixed price, agreed in writing before we start." }, { question: "Do you work in English?", answer: "Yes. About half of our clients are international." }, { question: "Can you help individuals?", answer: "In employment matters, yes. Otherwise we focus on companies." }]} />
      </div>
      <section id="contact" className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-6">
          <ContactSection title="Tell us what is going on." description="Your message stays confidential. A lawyer answers within one working day." channels={[{ icon: <IconPhone />, label: "Phone", value: "020 123 4567", href: "tel:+31201234567" }, { icon: <IconMail />, label: "Email", value: "office@example.com", href: "mailto:office@example.com" }, { icon: <IconPin />, label: "Office", value: "Herengracht 400, Amsterdam" }]} onSubmit={onContact} note="Confidential. We never share your details." />
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-6"><FooterSection brand={<span className="font-serif text-lg">{name}</span>} tagline="Advocaten in Amsterdam." columns={[{ title: "Practice", links: [{ label: "Corporate", href: "#practice" }, { label: "Employment", href: "#practice" }] }, { title: "Firm", links: [{ label: "People", href: "#people" }, { label: "Contact", href: "#contact" }] }]} legal={`© 2026 ${name} Advocaten. Illustrative template.`} /></div>
    </div>
  );
}
