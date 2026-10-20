import { CodeOfConduct } from "@rhs-ui/marketing/code-of-conduct";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <CodeOfConduct
        title="Code of conduct"
        promise="We want Kestrel to be a place where people of every background and experience can build, ask and disagree without being made to feel small. This code says what we expect from everyone in our spaces, and what happens when we fall short."
        expected={[
          { title: "Assume good intent", example: "Ask what someone meant before you answer what you heard." },
          { title: "Be patient with questions", example: "Link the docs kindly, and say which part is easy to miss." },
          { title: "Disagree about the work", example: "Argue with the design, not with the person who proposed it." },
          { title: "Credit people", example: "Name who did the work, in the changelog and in the room." },
          { title: "Step in when you see harm", example: "A short, private message to the person affected is enough to start." },
        ]}
        unacceptable={[
          { title: "Harassment", example: "Repeated unwanted messages, following someone, or sharing their private details." },
          { title: "Insults and slurs", example: "Personal attacks, jokes at someone's expense, or demeaning language about who they are." },
          { title: "Unwelcome attention", example: "Sexual language or images, or advances after someone has said no." },
          { title: "Sustained disruption", example: "Derailing threads, flooding channels or talking over speakers." },
          { title: "Retaliation", example: "Punishing someone for making a report or for taking part in a review." },
        ]}
        scope="This code applies in every Kestrel space: the repositories, the chat server, our events and any place where you speak for the project, online or in person."
        report={{
          contact: { label: "conduct@kestrel.example", href: "mailto:conduct@kestrel.example" },
          response: "Within 48 hours, weekends included. You get a reply from a person, not a ticket number.",
          confidentiality: "Only the two moderators who read your report will know it came from you, unless you ask us to share it.",
        }}
        consequences={[
          { title: "Warning", description: "A private message that names what happened and what we expect. It stays on record for a year." },
          { title: "Temporary ban", description: "For a set period, usually between a week and three months, with a way back. You can appeal in writing." },
          { title: "Permanent ban", description: "For serious or repeated harm. A second moderator must agree, and the person is told why." },
        ]}
        updated="2026-09-12"
        locale="en-GB"
      />
    </div>
  );
}
