"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";

import { IconChevronLeft, IconFilter, IconMoreHorizontal, IconSend } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { ScreenFrame } from "@rhs-ui/primitives/screen-frame";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

/** How tall the keyboard is in the demo, in pixels: roughly a phone's. */
const KEYBOARD = 262;

interface Message {
  id: number;
  mine: boolean;
  text: string;
}

const MESSAGES: readonly Message[] = [
  { id: 1, mine: true, text: "Hi, my Kestrel 24L arrived with a loose zip on the front pocket." },
  { id: 2, mine: false, text: "Sorry about that, Maya. Could you send a photo of the zip?" },
  { id: 3, mine: true, text: "Sure, one moment." },
  { id: 4, mine: true, text: "Here it is. The slider comes off at the top." },
  { id: 5, mine: false, text: "Thanks, that is a known batch fault and it is on us. I can send a new pack today or refund the €129." },
  { id: 6, mine: true, text: "A new one please, I need it for the trip on the 14th." },
  { id: 7, mine: false, text: "Done. It ships tonight with a return label inside, and you will have a tracking link by 18:00." },
  { id: 8, mine: true, text: "Perfect, thank you." },
  { id: 9, mine: false, text: "Anything else I can sort out while I have you?" },
];

/** What the shop sells, in cents: every order is made of these, so a total is always the sum of its lines. */
const CATALOGUE = {
  daypack: { name: "Kestrel 24L daypack, slate", price: 12900 },
  weekender: { name: "Northwind weekender 45L", price: 18400 },
  tote: { name: "Halcyon roll-top tote, natural", price: 9600 },
  socks: { name: "Merino liner socks, 3 pack", price: 2700 },
  bottle: { name: "Insulated bottle, 0.75 L", price: 2200 },
  cap: { name: "Waxed-cotton cap, olive", price: 2300 },
  strap: { name: "Spare shoulder strap", price: 2450 },
  wrap: { name: "Gift wrap", price: 350 },
} as const;

type Product = keyof typeof CATALOGUE;
type OrderState = "Paid" | "Packed" | "Shipped" | "Refunded";

interface Order {
  id: string;
  name: string;
  state: OrderState;
  /** The time the order was placed on 3 November, as `09:14`. */
  at: string;
  city: string;
  items: readonly (readonly [Product, number])[];
  note?: string;
}

const ORDERS: readonly Order[] = [
  {
    id: "4821",
    name: "Maya Chen",
    state: "Packed",
    at: "08:40",
    city: "Utrecht, NL",
    items: [["daypack", 1], ["socks", 1], ["strap", 1], ["wrap", 1]],
    note: "Gift for a colleague. Leave the parcel with the neighbours at number 14 if nobody answers, and do not include a price slip. The customer asked for the strap to be packed on top so it is not creased.",
  },
  { id: "4820", name: "Jonas de Vries", state: "Packed", at: "08:22", city: "Ghent, BE", items: [["tote", 1]] },
  { id: "4819", name: "Priya Nair", state: "Paid", at: "08:05", city: "Leeds, UK", items: [["daypack", 1], ["tote", 1], ["cap", 1]], note: "Deliver before Friday: it is a leaving present." },
  { id: "4818", name: "Lukas Brandt", state: "Shipped", at: "07:52", city: "Hamburg, DE", items: [["socks", 2]] },
  { id: "4817", name: "Sofia Marino", state: "Refunded", at: "07:38", city: "Milan, IT", items: [["daypack", 1]], note: "Returned unused after a week. Refunded in full." },
  { id: "4816", name: "Tom Okafor", state: "Shipped", at: "07:21", city: "Dublin, IE", items: [["weekender", 1], ["daypack", 1]] },
  { id: "4815", name: "Elin Berg", state: "Shipped", at: "07:03", city: "Malmö, SE", items: [["socks", 1]] },
  { id: "4814", name: "Noor Haddad", state: "Packed", at: "06:42", city: "Rotterdam, NL", items: [["weekender", 1]] },
  { id: "4813", name: "Pieter Smit", state: "Shipped", at: "06:15", city: "Arnhem, NL", items: [["tote", 1]] },
  { id: "4812", name: "Ana Costa", state: "Shipped", at: "05:48", city: "Porto, PT", items: [["socks", 1], ["strap", 1], ["bottle", 1]] },
  { id: "4811", name: "Kai Yamamoto", state: "Shipped", at: "05:26", city: "Antwerp, BE", items: [["daypack", 1]] },
  { id: "4810", name: "Iris Vermeer", state: "Refunded", at: "05:12", city: "Utrecht, NL", items: [["bottle", 1], ["cap", 1]], note: "Wrong colour ordered. Refunded to the card." },
];

/** An amount in cents as euros. No locale involved: the shop prices in euros and writes them one way. */
const euro = (cents: number) => `€${(cents / 100).toFixed(2)}`;

/** The lines of an order, each with what the quantity makes of its price. */
const linesOf = (order: Order) => order.items.map(([product, quantity]) => ({ name: CATALOGUE[product].name, quantity, cents: CATALOGUE[product].price * quantity }));

/** What the customer pays: the sum of the lines, so the heading, the list and the items can never disagree. */
const totalOf = (order: Order) => linesOf(order).reduce((sum, line) => sum + line.cents, 0);

const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** The steps an order has been through, by where it stands now. It is 09:41 in this demo, and no step is later than that. */
function timelineOf(order: Order): readonly (readonly [string, string])[] {
  const [hours = 0, minutes = 0] = order.at.split(":").map(Number);
  const placed = hours * 60 + minutes;
  const at = (plus: number) => `3 Nov, ${clock(placed + plus)}`;
  const steps: [string, string][] = [
    [at(0), "Order placed and paid by card"],
    [at(6), `Address checked: ${order.city}`],
  ];
  if (order.state === "Refunded") return [...steps, [at(95), `Refund of ${euro(totalOf(order))} sent to the card`]];
  if (order.state === "Paid") return [...steps, ["Waiting", "Pick from the shelf"]];
  steps.push([at(25), "Picked from shelf B4"], [at(40), "Packed, label printed"]);
  if (order.state === "Packed") return [...steps, ["Waiting", "Handover to the carrier"]];
  return [...steps, [at(95), "Handed to the carrier"], [at(96), "Tracking link sent to the customer"]];
}

const KEYS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

/** One key. They share the width of their row, so a row always fits the screen it is drawn on. */
const KEY = "flex h-10 min-w-0 items-center justify-center rounded-md bg-background text-sm shadow-xs";

/** A rough drawing of the on-screen keyboard, so the demo can show what the composer does when one is up. */
function FakeKeyboard(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 grid content-start gap-2 border-t border-border bg-muted px-1 pt-2" style={{ height: KEYBOARD }}>
      {KEYS.map((row, index) => (
        <div key={row} className="flex gap-1">
          {/* The second row is inset by half a key, and the third has a modifier key at each end, as on a phone. */}
          {index === 1 ? <span className="flex-[0.5]" /> : null}
          {index === 2 ? <span className={cn(KEY, "flex-[1.5] bg-background/70")} /> : null}
          {[...row].map((key) => (
            <span key={key} className={cn(KEY, "flex-1")}>
              {key}
            </span>
          ))}
          {index === 1 ? <span className="flex-[0.5]" /> : null}
          {index === 2 ? <span className={cn(KEY, "flex-[1.5] bg-background/70")} /> : null}
        </div>
      ))}
      <div className="flex gap-1">
        <span className={cn(KEY, "flex-[2.5] bg-background/70 text-xs")}>123</span>
        <span className={cn(KEY, "flex-[5] text-xs text-muted-foreground")}>space</span>
        <span className={cn(KEY, "flex-[2.5] bg-background/70 text-xs")}>return</span>
      </div>
      <span className="absolute bottom-2 left-1/2 h-[5px] w-32 -translate-x-1/2 rounded-full bg-foreground/30" />
    </div>
  );
}

/** A phone: a thick rounded edge and a screen that clips whatever is inside it. */
function Phone({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="mx-auto w-[19.5rem] max-w-full shrink-0 rounded-[2.75rem] border-[7px] border-foreground/20 bg-background shadow-sm">
      <div className="relative h-[37rem] overflow-hidden rounded-[2.1rem]">{children}</div>
    </div>
  );
}

/** The part of the frame that scrolls: the body that holds the content. */
const scrollerOf = (content: HTMLElement | null) => content?.closest<HTMLElement>("[data-slot=screen-frame-body]") ?? null;

/**
 * Keeps a scrolling list at its newest end: when something is added to it, and for as long as the room it has changes size. The keyboard
 * takes that room over a few hundred milliseconds, so the body gets shorter in every frame of it, and scrolling once before it has
 * shrunk leaves the newest messages behind the composer. A reader who has scrolled up is left where they are.
 */
function useStickToBottom(content: RefObject<HTMLElement | null>, newest: number): void {
  const follow = useRef(true);
  // Where this code last put the list: the scroll event that follows is its own, not the reader moving.
  const placed = useRef<number | null>(null);

  useEffect(() => {
    const body = scrollerOf(content.current);
    if (!body) return;
    body.scrollTop = body.scrollHeight;
    follow.current = true;
    placed.current = body.scrollTop;
  }, [content, newest]);

  useEffect(() => {
    const body = scrollerOf(content.current);
    if (!body) return;
    const onScroll = () => {
      if (placed.current !== null && Math.abs(body.scrollTop - placed.current) < 1) return;
      placed.current = null;
      follow.current = body.scrollHeight - body.clientHeight - body.scrollTop < 8;
    };
    const observer = new ResizeObserver(() => {
      if (!follow.current) return;
      body.scrollTop = body.scrollHeight;
      placed.current = body.scrollTop;
    });
    observer.observe(body);
    body.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      body.removeEventListener("scroll", onScroll);
    };
  }, [content]);
}

function Chat({ keyboard }: { keyboard: boolean }): React.JSX.Element {
  const field = useId();
  const [messages, setMessages] = useState<readonly Message[]>(MESSAGES);
  const [draft, setDraft] = useState("");
  const conversation = useRef<HTMLDivElement>(null);
  useStickToBottom(conversation, messages.length);
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, { id: current.length + 1, mine: true, text }]);
    setDraft("");
  };
  return (
    <Phone>
      <ScreenFrame
        className="h-full"
        keyboardInset={keyboard ? KEYBOARD : undefined}
        header={
          <div className="flex items-center gap-3 px-3 pt-4 pb-3">
            <Button variant="ghost" size="icon-sm" aria-label="Back to messages">
              <IconChevronLeft />
            </Button>
            <Avatar size="default">
              <AvatarFallback>KS</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm leading-tight font-semibold tracking-[-0.01em]">Kestrel support</p>
              <p className="truncate text-xs text-muted-foreground">Marit is online</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="More options">
              <IconMoreHorizontal />
            </Button>
          </div>
        }
        footer={
          <form
            className="flex items-center gap-2 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <Label htmlFor={field} className="sr-only">
              Message
            </Label>
            <Input id={field} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message" autoComplete="off" className="h-10 rounded-full px-4" />
            <Button type="submit" size="icon" aria-label="Send" className="size-10 shrink-0 rounded-full" disabled={!draft.trim()}>
              <IconSend />
            </Button>
          </form>
        }
      >
        {/* A log, not the main landmark: this phone sits in a page that has one. New messages are announced politely. */}
        <div ref={conversation} role="log" aria-label="Conversation" className="grid min-h-full content-end gap-2 px-3 py-4">
          <p className="mb-1 text-center text-xs text-muted-foreground">Today, 09:41</p>
          {messages.map((message) => (
            <p
              key={message.id}
              className={cn(
                "max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-snug text-pretty",
                message.mine ? "justify-self-end rounded-br-md bg-primary text-primary-foreground" : "justify-self-start rounded-bl-md bg-muted",
              )}
            >
              {message.text}
            </p>
          ))}
        </div>
      </ScreenFrame>
      {keyboard ? <FakeKeyboard /> : null}
    </Phone>
  );
}

function Orders(): React.JSX.Element {
  const [selected, setSelected] = useState("4821");
  const order = ORDERS.find((item) => item.id === selected) ?? ORDERS[0]!;
  const lines = linesOf(order);
  return (
    <div className="@container overflow-hidden rounded-xl border border-border shadow-xs">
      <ScreenFrame
        className="h-[34rem]"
        scroll="none"
        // Side by side when there is room, one above the other when there is not: the list on top, the order below it.
        bodyClassName="flex-col @xl:flex-row"
        header={
          <div className="flex items-center gap-3 px-4 py-2.5">
            <p className="text-sm font-semibold tracking-[-0.01em]">Orders</p>
            <p className="text-xs text-muted-foreground">Northwind, November</p>
            <Button variant="outline" size="sm" className="ms-auto">
              <IconFilter /> Filter
            </Button>
          </div>
        }
        footer={
          <p className="flex items-center justify-between gap-3 px-4 py-2 text-xs text-muted-foreground">
            <span>{ORDERS.length} orders shown</span>
            <span className="tabular-nums">Synced 09:41</span>
          </p>
        }
      >
        <ScreenFrame.Pane as="nav" aria-label="Orders" className="flex-[0_0_42%] border-b border-border @xl:w-[17rem] @xl:flex-none @xl:border-e @xl:border-b-0">
          <ul className="grid p-2">
            {ORDERS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={item.id === selected ? "true" : undefined}
                  onClick={() => setSelected(item.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=true]:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      #{item.id} · {item.state}
                    </span>
                  </span>
                  <span className="text-sm tabular-nums">{euro(totalOf(item))}</span>
                </button>
              </li>
            ))}
          </ul>
        </ScreenFrame.Pane>
        {/* Keyed by the order, so each order opens at its top instead of halfway down the one before it. */}
        <ScreenFrame.Pane key={order.id} as="section" aria-label={`Order ${order.id}`} className="px-6 py-5">
          <p className="text-xs text-muted-foreground tabular-nums">Order #{order.id}</p>
          <h3 className="mt-0.5 text-lg font-semibold tracking-[-0.02em]">{order.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.state}, {euro(totalOf(order))} · {order.city}
          </p>
          <h4 className="mt-6 mb-2 text-xs font-medium text-muted-foreground">Items</h4>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {lines.map((line) => (
              <li key={line.name} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                <span className="min-w-0 flex-1">{line.name}</span>
                <span className="text-muted-foreground tabular-nums">× {line.quantity}</span>
                <span className="w-16 text-end tabular-nums">{euro(line.cents)}</span>
              </li>
            ))}
            <li className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium">
              <span className="min-w-0 flex-1">Total</span>
              <span className="w-16 text-end tabular-nums">{euro(totalOf(order))}</span>
            </li>
          </ul>
          <h4 className="mt-6 mb-2 text-xs font-medium text-muted-foreground">Timeline</h4>
          <ol className="grid gap-3 border-s border-border ps-4 text-sm">
            {timelineOf(order).map(([when, what]) => (
              <li key={when}>
                <p className="text-xs text-muted-foreground tabular-nums">{when}</p>
                <p>{what}</p>
              </li>
            ))}
          </ol>
          <h4 className="mt-6 mb-2 text-xs font-medium text-muted-foreground">Notes</h4>
          <p className="max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground">{order.note ?? "Nothing to add to this order."}</p>
        </ScreenFrame.Pane>
      </ScreenFrame>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [keyboard, setKeyboard] = useState(false);
  return (
    <div className="mx-auto grid w-full max-w-6xl items-start gap-x-12 gap-y-12 px-4 py-8 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)]">
      <section aria-labelledby="sf-phone" className="min-w-0">
        <h2 id="sf-phone" className="text-lg font-semibold tracking-[-0.02em]">
          A chat that stays put
        </h2>
        <p className="mt-0.5 mb-4 max-w-xs text-sm text-muted-foreground">The header and the composer hold still while the messages scroll. Raise the keyboard and the composer rides above it.</p>
        <div className="mb-5 flex items-center gap-2.5">
          <Switch id="sf-keyboard" checked={keyboard} onCheckedChange={setKeyboard} />
          <Label htmlFor="sf-keyboard" className="text-sm">
            Show the keyboard
          </Label>
        </div>
        <Chat keyboard={keyboard} />
      </section>

      <section aria-labelledby="sf-tool" className="min-w-0">
        <h2 id="sf-tool" className="text-lg font-semibold tracking-[-0.02em]">
          A tool with two panes
        </h2>
        <p className="mt-0.5 mb-4 max-w-md text-sm text-muted-foreground">The page never scrolls. The list and the order each scroll on their own, under a header and a footer that stay where they are.</p>
        <Orders />
      </section>
    </div>
  );
}
