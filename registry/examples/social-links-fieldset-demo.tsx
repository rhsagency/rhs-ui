"use client";

import { useState, type ReactNode } from "react";

import { SocialLinksFieldset, type SocialLinks, type SocialNetwork } from "@rhs-ui/application/social-links-fieldset";

const NETWORKS: SocialNetwork[] = [
  {
    id: "github",
    label: "GitHub",
    prefix: "github.com/",
    pattern: /^[A-Za-z\d](?:[A-Za-z\d]|-(?=[A-Za-z\d])){0,38}$/,
    message: "Handles use letters, numbers and dashes, and no dash at the start or the end.",
    placeholder: "your-handle",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    prefix: "linkedin.com/in/",
    pattern: /^[A-Za-z\d-]{3,100}$/,
    message: "Use 3 to 100 letters, numbers and dashes.",
    placeholder: "your-name",
  },
  {
    id: "x",
    label: "X",
    prefix: "x.com/",
    pattern: /^[A-Za-z\d_]{1,15}$/,
    message: "Use up to 15 letters, numbers and underscores.",
    placeholder: "yourhandle",
  },
];

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The surface the fieldset sits on in a profile form. The fieldset itself has none. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6">{children}</div>;
}

export default function Demo(): React.JSX.Element {
  const [links, setLinks] = useState<SocialLinks>({ website: "https://kestrel.dev", github: "mara-jansen", linkedin: "", x: "" });

  return (
    <div className="grid w-full max-w-xl min-w-0 gap-12">
      <Example caption="Paste https://github.com/mara-jansen/kestrel-ui into GitHub and it becomes mara-jansen. A leading @ goes too. Type something wrong, such as -mara- in GitHub or javascript:alert(1) in Website, and leave the field: the message says what is wrong, and that field stays empty in the value below.">
        <Surface>
          <SocialLinksFieldset legend="Links on your profile" networks={NETWORKS} value={links} onValueChange={setLinks} />
        </Surface>
        <pre
          role="region"
          tabIndex={0}
          aria-label="The value that came back through onValueChange"
          className="relative overflow-x-auto rounded-lg border border-border bg-muted/40 p-3.5 font-mono text-xs leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          {JSON.stringify(links, null, 2)}
        </pre>
      </Example>

      <Example caption="A required network, and a problem your server found, passed in through errors. It stands in for the fieldset's own message for that field.">
        <Surface>
          <SocialLinksFieldset
            legend="Where people can find you"
            showWebsite={false}
            networks={[{ ...NETWORKS[1]!, required: true }, NETWORKS[2]!]}
            defaultValue={{ linkedin: "mara-jansen-1991", x: "" }}
            errors={{ linkedin: "We could not find a profile with that handle. Check it on LinkedIn and try again." }}
          />
        </Surface>
      </Example>
    </div>
  );
}
