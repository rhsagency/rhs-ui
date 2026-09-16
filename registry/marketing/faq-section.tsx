import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@rhs-ui/primitives/accordion";

export function FaqSection({ title = "A few good questions.", description, questions }: { title?: string; description?: string; questions: readonly { id: string; question: string; answer: string }[] }): React.JSX.Element {
  return <section data-slot="faq-section" className="mx-auto max-w-3xl py-16"><header className="mb-10 text-center"><h2 className="text-4xl font-medium tracking-tight">{title}</h2>{description && <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">{description}</p>}</header><Accordion type="single" collapsible>{questions.map(item => <AccordionItem key={item.id} value={item.id}><AccordionTrigger className="py-6 text-left text-base">{item.question}</AccordionTrigger><AccordionContent className="max-w-2xl pb-6 text-sm leading-relaxed text-muted-foreground">{item.answer}</AccordionContent></AccordionItem>)}</Accordion></section>;
}
