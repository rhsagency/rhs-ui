"use client";

import { useState, type ReactNode } from "react";

import { ContactFieldset, type ContactValue } from "@rhs-ui/application/contact-fieldset";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The surface the fieldset sits on in a checkout. The fieldset itself has none. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6">{children}</div>;
}

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<ContactValue>({ firstName: "Mara", lastName: "Jansen", email: "mara@kestrel.dev", phone: "+31687654321", company: "Kestrel Studio" });

  return (
    <div className="grid w-full max-w-xl min-w-0 gap-12">
      <Example caption="Controlled. Paste +31 6 1234 5678 or +44 7911 123456 into the phone field: the country follows the code and the value stays in E.164. Add spaces and capitals to the email address and it comes back trimmed and in lower case. Each field is checked when you leave it, not while you type.">
        <Surface>
          <ContactFieldset value={value} onValueChange={setValue} showCompany legend="Who is this for?" />
        </Surface>
        <pre
          role="region"
          tabIndex={0}
          aria-label="The value that came back through onValueChange"
          className="relative overflow-x-auto rounded-lg border border-border bg-muted/40 p-3.5 font-mono text-xs leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          {JSON.stringify(value, null, 2)}
        </pre>
      </Example>

      <Example caption="A problem your server found, passed in through errors. It stands in for the fieldset's own message for that field.">
        <Surface>
          <ContactFieldset
            legend="Your details"
            defaultValue={{ firstName: "Theo", lastName: "Okonkwo", email: "theo@kestrel.dev", phone: "+31687654321" }}
            errors={{ email: "An account with this email address already exists. Sign in instead." }}
          />
        </Surface>
      </Example>

      <Example caption="Switched off as a whole with one prop, while the order is placed. The country code goes with it.">
        <Surface>
          <ContactFieldset disabled legend="Your details" defaultValue={{ firstName: "Ines", lastName: "Carvalho", email: "ines@halcyon.example", phone: "+34612345678" }} />
        </Surface>
      </Example>
    </div>
  );
}
