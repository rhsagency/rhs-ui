import { InterviewLayout } from "@rhs-ui/marketing/interview-layout";

/** A flat, faceless bust in a muted palette: a stand-in for a portrait photograph. */
function portrait(p: { bg: string; disc: string; skin: string; shade: string; hair: string; shirt: string }): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'>
    <rect width='640' height='640' fill='${p.bg}'/>
    <circle cx='320' cy='330' r='250' fill='${p.disc}'/>
    <path d='M222 338C214 238 266 206 320 206C374 206 426 238 418 338C404 292 372 268 320 268C268 268 236 292 222 338Z' fill='${p.hair}'/>
    <path d='M274 430H366V552C366 582 274 582 274 552Z' fill='${p.shade}'/>
    <path d='M52 640C52 606 158 548 320 538C482 548 588 606 588 640Z' fill='${p.shirt}'/>
    <ellipse cx='224' cy='334' rx='15' ry='26' fill='${p.skin}'/><ellipse cx='416' cy='334' rx='15' ry='26' fill='${p.skin}'/>
    <ellipse cx='320' cy='322' rx='96' ry='120' fill='${p.skin}'/>
    <path d='M320 202C382 202 416 262 416 322C416 404 372 442 320 442Z' fill='#000' opacity='.07'/>
    <g fill='${p.hair}'><circle cx='282' cy='326' r='5.5'/><circle cx='358' cy='326' r='5.5'/></g>
    <path d='M262 298Q282 288 302 298M338 298Q358 288 378 298' fill='none' stroke='${p.hair}' stroke-width='7' stroke-linecap='round'/>
    <path d='M224 330C228 254 278 228 320 228C366 228 414 254 418 330C384 296 336 286 292 294C262 300 240 312 224 330Z' fill='${p.hair}'/>
    <g fill='none' stroke='${p.hair}' stroke-width='6'><rect x='254' y='306' width='54' height='42' rx='15'/><rect x='332' y='306' width='54' height='42' rx='15'/><path d='M308 324H332'/></g>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg.replace(/\s+/g, " "));
}

const ines = portrait({ bg: "#d3d6d9", disc: "#c2c7cc", skin: "#c99a76", shade: "#b58660", hair: "#241f1d", shirt: "#4a4f57" });

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <InterviewLayout
        eyebrow="Founder story"
        title="Ines Duarte on building a repair shop that lasts"
        intro="Ines Duarte opened Kestrel Cycles in Ghent in 2016 with two work stands and a loan from her aunt. Ten years on it is the busiest repair shop in the city, and it has never bought an advert. We asked what she does differently."
        interviewer="Femke Bos"
        date={{ label: "14 October 2026", dateTime: "2026-10-14" }}
        readingTime="9 min read"
        guest={{
          name: "Ines Duarte",
          role: "Founder, Kestrel Cycles",
          portrait: ines,
          about: "Ines trained as a mechanical engineer before she swapped the lab for a workshop. Kestrel now repairs about 9,000 bikes a year with a team of eleven.",
          links: [
            { label: "Kestrel Cycles", href: "https://example.com/kestrel-cycles" },
            { label: "Her talk at Bike Summit", href: "https://example.com/bike-summit-talk" },
          ],
        }}
        exchanges={[
          {
            question: "You started with two work stands. What did the first year teach you?",
            answer: [
              "That people do not come back for the repair. They come back for being told the truth. In the first month a man brought in a bike worth 150 euros with a 220 euro problem. I told him to buy a new one. He bought it from a competitor, and then he sent me six friends.",
              "We still work that way. If a repair costs more than the bike is worth, we say so, and we say it before we pick up a spanner.",
            ],
            quote: "People do not come back for the repair. They come back for being told the truth.",
          },
          {
            question: "How do you price a job you cannot see inside?",
            answer:
              "We quote a range and put it in writing before we start. If the real cost lands inside the range, nothing more is said. If it will not, we call before we touch anything else. The rule is simple: nobody should ever be surprised by an invoice.",
          },
          {
            question: "You have never advertised. How do people find you?",
            answer: [
              "Mostly through the person who fixed their bike last time. We put a small card in every bag with the mechanic’s name on it, and about a third of our new customers hand one back to us.",
              "The other way is the pavement. Our workshop has a glass front and the stands face the street, so people see a bike being rebuilt while they wait for a tram. It does more than any billboard would.",
            ],
          },
          {
            question: "What is the hardest part of running a repair shop?",
            answer:
              "Saying no to speed. A customer wants the bike back tomorrow, and a rushed job is a job you do twice. We book a week ahead, and in busy months two. Some people leave. The ones who stay do not have to come back for the same fault.",
          },
          {
            question: "What would you tell someone about to open their own?",
            answer: [
              "Hire for patience first. You can teach anyone to true a wheel, and you cannot teach anyone to stay calm when a customer is upset.",
              "And keep one stand free for emergencies. The week we stopped doing that was the week we lost our best regulars.",
            ],
            quote: "Hire for patience first. You can teach anyone to true a wheel.",
          },
        ]}
      >
        <p className="border-t border-border pt-6 text-base leading-relaxed text-muted-foreground">Kestrel Cycles is open Tuesday to Saturday, 09:00 to 18:00, at Vlaanderenstraat 21 in Ghent.</p>
      </InterviewLayout>

      <div className="mt-24 border-t border-border pt-12">
        <p className="mb-10 text-xs text-muted-foreground">A shorter piece without a title or a portrait: the guest card keeps its place with initials</p>
        <InterviewLayout
          headingLevel={3}
          guest={{ name: "Priya Nair", role: "Occupational therapist" }}
          interviewer="Jasper Kuiper"
          readingTime="3 min read"
          intro="Three questions on setting up a home desk that does not hurt by Friday."
          exchanges={[
            {
              question: "Is a standing desk worth buying?",
              answer: "It is worth having the option. Nobody should stand all day either. Change position every half hour and you will feel the difference within a week.",
            },
            {
              question: "What is the one thing most people get wrong?",
              answer: "The screen height. Put the top of the monitor at eye level and move the keyboard close enough that your elbows stay by your sides. That fixes most neck pain without spending anything.",
            },
          ]}
        />
      </div>
    </div>
  );
}
