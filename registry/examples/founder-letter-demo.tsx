import { FounderLetter } from "@rhs-ui/marketing/founder-letter";

/** A flat, faceless bust in a muted palette: a stand-in for a portrait photograph. */
function portrait(p: { bg: string; disc: string; skin: string; shade: string; hair: string; shirt: string }): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'>
    <rect width='640' height='640' fill='${p.bg}'/>
    <circle cx='320' cy='330' r='250' fill='${p.disc}'/>
    <path d='M212 330C196 190 258 150 320 150C382 150 444 190 428 330L442 446C442 480 412 490 394 484L246 484C228 490 198 480 198 446Z' fill='${p.hair}'/>
    <path d='M274 430H366V552C366 582 274 582 274 552Z' fill='${p.shade}'/>
    <path d='M52 640C52 606 158 548 320 538C482 548 588 606 588 640Z' fill='${p.shirt}'/>
    <ellipse cx='224' cy='334' rx='15' ry='26' fill='${p.skin}'/><ellipse cx='416' cy='334' rx='15' ry='26' fill='${p.skin}'/>
    <ellipse cx='320' cy='322' rx='96' ry='120' fill='${p.skin}'/>
    <path d='M320 202C382 202 416 262 416 322C416 404 372 442 320 442Z' fill='#000' opacity='.07'/>
    <g fill='${p.hair}'><circle cx='282' cy='326' r='5.5'/><circle cx='358' cy='326' r='5.5'/></g>
    <path d='M262 298Q282 288 302 298M338 298Q358 288 378 298' fill='none' stroke='${p.hair}' stroke-width='7' stroke-linecap='round'/>
    <path d='M224 288C228 212 278 186 320 186C366 186 414 212 418 288C384 254 336 244 292 252C262 258 240 270 224 288Z' fill='${p.hair}'/>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg.replace(/\s+/g, " "));
}

const marit = portrait({ bg: "#d8d4cc", disc: "#c9c4ba", skin: "#e4c4a6", shade: "#d3ae8d", hair: "#3b2f29", shirt: "#2c2e33" });

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <FounderLetter
        date={{ label: "14 October 2026", dateTime: "2026-10-14" }}
        place="Utrecht"
        title="Why our prices change in January"
        salutation="Dear Polder customer,"
        signoff="With thanks for your patience, and for drinking our coffee,"
        signer={{ name: "Marit Bosch", role: "Founder and head roaster", portrait: marit }}
        postscript={
          <>
            The full breakdown, with the cost of every bag and what each farm receives, is on our <a href="#prices">prices page</a>. It is short and has no small print.
          </>
        }
      >
        <p>From 1 January, a 250 gram bag of our house roast goes from 8.50 euros to 9.20. I would rather you heard that from me than found it on a receipt, so here is what is behind it.</p>
        <p>
          Green coffee cost us <strong>31 percent more</strong> this year. We pay our farms before the harvest, at a price they set, and we will not push that price down to protect our margin. Freight and energy rose as well. We absorbed all of it for eighteen months, and we cannot keep doing that without cutting something you would notice.
        </p>
        <p>What we will not cut: the roast date on every bag, the farm named on the label, and the two people who answer your emails. What we cut first: a third of our own travel budget and the second delivery run on Fridays.</p>
        <p>Subscribers keep today&rsquo;s price until 1 April, and anyone who orders before 31 December pays the old price for up to six bags. If money is tight, write to me and we will find something that works. I read every message.</p>
      </FounderLetter>

      <div className="mx-auto mt-20 max-w-[38rem] border-t border-border pt-8 sm:mt-24 sm:pt-10">
        <p className="mb-8 text-xs text-muted-foreground">Without a portrait or a postscript the signature falls back to initials, and a short letter still holds together</p>
        <FounderLetter
          date={{ label: "2 November 2026", dateTime: "2026-11-02" }}
          place="Rotterdam"
          salutation="Dear member,"
          signoff="Sincerely,"
          signer={{ name: "Jasper Kuiper", role: "Owner, Halcyon Fitness" }}
        >
          <p>On Saturday our booking system was down for six hours, and about 140 of you could not reserve a place in Sunday&rsquo;s classes. That was our mistake, and I am sorry.</p>
          <p>Every member who was affected has two free classes on their account from today. You do not need to ask for them, and they do not expire this year.</p>
        </FounderLetter>
      </div>
    </div>
  );
}
