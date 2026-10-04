import { ContactLinks } from "@rhs-ui/primitives/contact-links";

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid min-h-40 place-items-center gap-8 p-6">
      <ContactLinks phone="+31 6 1234 5678" email="hello@example.com" whatsapp="31612345678" address="Stationsweg 12, 3901 AB Veenendaal" mapsHref="#map" />
      <ContactLinks orientation="horizontal" phone="+31 6 1234 5678" email="hello@example.com" />
    </div>
  );
}
