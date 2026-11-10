import { IconMail, IconMessage, IconMessageText } from "@rhs-ui/icons";
import { MessageTestimonials } from "@rhs-ui/marketing/message-testimonials";

type Hair = "short" | "long" | "bun" | "curly" | "bald";

interface Look {
  ground: string;
  skin: string;
  hair: string;
  shirt: string;
  style: Hair;
}

/** A portrait drawn for the demo: head and shoulders on a pale ground. In your page: a photograph of the person. */
function portrait({ ground, skin, hair, shirt, style }: Look): string {
  const cap = `<path d='M31.5 38C30 23 38 16.5 48 16.5S66 23 64.5 38C63 31.5 59.5 28 55 26.5C50 29 43 29 39 26.5C34.5 28 31 31.5 31.5 38Z' fill='${hair}'/>`;
  const behind = style === "long" ? `<path d='M30 40c-2-16 6-25 18-25s20 9 18 25v24c0 3-3 5-6 5H36c-3 0-6-2-6-5z' fill='${hair}'/>` : style === "bun" ? `<circle cx='48' cy='14' r='7.5' fill='${hair}'/>` : "";
  const above =
    style === "curly"
      ? `<g fill='${hair}'><circle cx='36' cy='28' r='8'/><circle cx='43' cy='21' r='8'/><circle cx='53' cy='21' r='8'/><circle cx='60' cy='28' r='8'/><circle cx='33' cy='37' r='5'/><circle cx='63' cy='37' r='5'/><circle cx='48' cy='19' r='8'/></g>`
      : style === "bald"
        ? ""
        : cap;
  const ears = style === "long" ? "" : `<circle cx='32.5' cy='41' r='3' fill='${skin}'/><circle cx='63.5' cy='41' r='3' fill='${skin}'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='${ground}'/>${behind}<path d='M10 96c1-19 15-29 38-29s37 10 38 29z' fill='${shirt}'/><rect x='41' y='52' width='14' height='20' rx='6' fill='${skin}'/><path d='M41 55h14v6c-4 3.5-10 3.5-14 0z' fill='#000' opacity='.12'/>${ears}<ellipse cx='48' cy='40' rx='15' ry='17.5' fill='${skin}'/>${above}</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const ANNA = portrait({ ground: "#e8ddd0", skin: "#e8c4a3", hair: "#7a4a2a", shirt: "#6b7a6a", style: "bun" });
const MEI = portrait({ ground: "#d9dde3", skin: "#f0d3b8", hair: "#1f1a17", shirt: "#c9c2b3", style: "long" });

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <MessageTestimonials
        title="Heard in the inbox"
        description="Messages from customers, as they arrived. We never asked for them."
        note="Shared with permission, lightly trimmed for length."
        threads={[
          {
            id: "anna",
            channel: "Direct message",
            date: "12 March",
            dateTime: "2026-03-12",
            icon: <IconMessageText />,
            messages: [
              { from: "Anna", avatar: ANNA, time: "09:41", text: "Just wanted to say the beans arrived on Monday and the whole house smells incredible." },
              { from: "Anna", avatar: ANNA, time: "09:42", text: "Third box in and my husband has stopped buying coffee at the station. That is the real review." },
              { from: "Halcyon", time: "09:52", own: true, text: "That is the best kind of review. Thank you, Anna. Enjoy the Ethiopia!" },
            ],
          },
          {
            id: "tobias",
            channel: "Email",
            date: "3 April",
            dateTime: "2026-04-03",
            icon: <IconMail />,
            messages: [
              { from: "Tobias", time: "18:07", text: "I was ready to cancel after the first box, honestly. Then your team replaced it without a single question." },
              { from: "Tobias", time: "18:09", text: "Two years later I am still a customer, and I have told three colleagues." },
            ],
          },
          {
            id: "mei",
            channel: "Text message",
            date: "28 April",
            dateTime: "2026-04-28",
            icon: <IconMessage />,
            messages: [
              { from: "Mei", avatar: MEI, time: "14:20", text: "The driver left it with my neighbours and they brought it round with a note saying it smelled amazing. 10 out of 10." },
            ],
          },
        ]}
      />
    </div>
  );
}
