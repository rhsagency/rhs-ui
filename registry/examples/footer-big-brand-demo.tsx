import { FooterBigBrand } from "@rhs-ui/marketing/footer-big-brand";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <FooterBigBrand
        name="Fieldwork"
        links={[{ label: "Work", href: "#work" }, { label: "Studio", href: "#studio" }, { label: "Journal", href: "#journal" }, { label: "Careers", href: "#careers" }, { label: "Contact", href: "#contact" }]}
        aside={<a href="mailto:hello@example.com" className="hover:text-foreground">hello@example.com</a>}
        legal={<><span>© 2026 Fieldwork Studio</span><span>Katendrecht, Rotterdam</span></>}
      />
    </div>
  );
}
