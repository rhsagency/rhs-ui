"use client";

import { useEffect, useRef, useState } from "react";

import { IconMessage, IconThumbsUp } from "@rhs-ui/icons";
import { AccessibleFeed } from "@rhs-ui/primitives/accessible-feed";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";

interface Post {
  id: number;
  author: string;
  role: string;
  when: string;
  text: string;
  picture?: "ridge" | "harbor" | "table";
  alt?: string;
  likes: number;
  replies: number;
}

const POSTS: readonly Post[] = [
  { id: 1, author: "Amara Osei", role: "Trail guide", when: "12 minutes ago", text: "Four days in the Ardennes with the Kestrel 30. The hip belt held up at 11 kg, and the side pockets finally take a one-litre bottle. Happy to answer questions.", likes: 48, replies: 12 },
  { id: 2, author: "Bram de Wit", role: "Member", when: "38 minutes ago", text: "Does the Halcyon stove work above 2,500 m? I am planning a week in the Alps in August and would rather ask before I carry it up.", likes: 17, replies: 9 },
  { id: 3, author: "Lena Hartmann", role: "Northwind support", when: "1 hour ago", text: "Merino liners are back in stock in sizes S to XL. Orders placed before 15:00 today ship the same day.", likes: 31, replies: 2 },
  { id: 4, author: "Tomasz Wrona", role: "Member", when: "2 hours ago", text: "This morning's ridge walk. The fog cleared at 07:40 and the whole valley opened up.", picture: "ridge", alt: "Two ridges under a pale sun", likes: 96, replies: 14 },
  { id: 5, author: "Priya Raman", role: "Gear tester", when: "3 hours ago", text: "Field notes on the Fernhill shell after three weeks of rain: the seams are dry, the pit zips are worth the extra 40 g, the hood is a little shallow.", likes: 64, replies: 21 },
  { id: 6, author: "Jonas Lindqvist", role: "Member", when: "4 hours ago", text: "First multi-day trip with a quilt instead of a bag. It packs smaller and slept colder than I expected below 4 °C.", likes: 22, replies: 18 },
  { id: 7, author: "Mara Okafor", role: "Northwind team", when: "5 hours ago", text: "Reminder: the community meetup is on Saturday 21 November in Utrecht. Doors at 10:00, coffee is on us. Bring a pack and we will weigh it.", likes: 120, replies: 33 },
  { id: 8, author: "Hana Kobayashi", role: "Member", when: "6 hours ago", text: "Evening light over the harbor at Texel. The ferry back was delayed and nobody minded.", picture: "harbor", alt: "A harbor wall and moored boats", likes: 74, replies: 6 },
  { id: 9, author: "Sven Eriksson", role: "Trail guide", when: "7 hours ago", text: "Three things I check before every group trip: spare laces, a paper map, and whether the person at the back is still smiling.", likes: 88, replies: 27 },
  { id: 10, author: "Noor Hassan", role: "Member", when: "8 hours ago", text: "Repaired a strap with a needle and waxed thread, thanks to the guide Lena shared last week. It took forty minutes and I feel unreasonably proud.", likes: 41, replies: 8 },
  { id: 11, author: "Amara Osei", role: "Trail guide", when: "9 hours ago", text: "The packing table for the Ardennes trip: everything laid out, weighed and written down. Base weight 6.8 kg.", picture: "table", alt: "Gear laid out on a table", likes: 52, replies: 15 },
  { id: 12, author: "Bram de Wit", role: "Member", when: "10 hours ago", text: "Update: the stove works fine at altitude with a windscreen and a lid. Thanks for the answers, Priya and Sven.", likes: 19, replies: 3 },
  { id: 13, author: "Lena Hartmann", role: "Northwind support", when: "11 hours ago", text: "Our returns window is now 60 days for everything bought before 1 December.", likes: 58, replies: 11 },
  { id: 14, author: "Tomasz Wrona", role: "Member", when: "12 hours ago", text: "Does anyone know a good place to dry boots in Chamonix? Hostel radiators do not cut it.", likes: 12, replies: 14 },
  { id: 15, author: "Priya Raman", role: "Gear tester", when: "13 hours ago", text: "Test results for three water filters: flow rate, weight and how they behave when the water is cold. Spreadsheet in the thread.", likes: 77, replies: 19 },
  { id: 16, author: "Jonas Lindqvist", role: "Member", when: "14 hours ago", text: "The shortest day is six weeks away. Headlamp batteries, everyone.", likes: 35, replies: 4 },
  { id: 17, author: "Mara Okafor", role: "Northwind team", when: "15 hours ago", text: "We are looking for two trail guides for the spring season in the Veluwe. Details are on the careers page.", likes: 64, replies: 9 },
  { id: 18, author: "Hana Kobayashi", role: "Member", when: "16 hours ago", text: "Oatmeal with dried apricots and a pinch of salt. Still the best breakfast at 1,800 m.", likes: 29, replies: 7 },
  { id: 19, author: "Sven Eriksson", role: "Trail guide", when: "17 hours ago", text: "Reading the weather in the Ardennes: when the wind turns west before noon, pack the shell.", likes: 51, replies: 12 },
  { id: 20, author: "Noor Hassan", role: "Member", when: "18 hours ago", text: "Lost a glove near the Roche à Bayard on Sunday: left hand, grey merino. If you find it, I owe you a coffee.", likes: 8, replies: 5 },
  { id: 21, author: "Amara Osei", role: "Trail guide", when: "19 hours ago", text: "Two years ago I could not carry 12 kg for a day. Last weekend: 22 km with 13. Small steps count.", likes: 140, replies: 38 },
  { id: 22, author: "Bram de Wit", role: "Member", when: "20 hours ago", text: "Beginner question: how tight should a hip belt be? Mine keeps slipping.", likes: 24, replies: 16 },
  { id: 23, author: "Priya Raman", role: "Gear tester", when: "21 hours ago", text: "Answering Bram: snug over the hip bones, not the waist, and tighten it before the shoulder straps.", likes: 66, replies: 6 },
  { id: 24, author: "Tomasz Wrona", role: "Member", when: "22 hours ago", text: "Sunrise at the Zugspitze. Cold fingers, worth it.", likes: 102, replies: 10 },
];

const PAGE = 6;

/** A picture drawn in the page: soft greys, no real photographs and no outside host. */
function picture(kind: NonNullable<Post["picture"]>): string {
  const shapes = {
    ridge: "<path d='M0 340L190 150L300 250L470 90L640 260L800 170V450H0Z' fill='#a29e94'/><path d='M0 400L220 270L380 340L560 230L800 330V450H0Z' fill='#6f6b63'/><circle cx='630' cy='100' r='34' fill='#f4f2ed'/>",
    harbor: "<rect y='290' width='800' height='160' fill='#8d9094'/><path d='M0 290H800' stroke='#f4f2ed' stroke-width='6'/><path d='M160 290L220 200H300L360 290Z' fill='#5f6368'/><path d='M520 290L560 220H640L690 290Z' fill='#4b4f54'/><rect x='250' y='120' width='6' height='80' fill='#5f6368'/>",
    table: "<rect y='250' width='800' height='200' fill='#8d877c'/><rect x='120' y='170' width='150' height='100' rx='14' fill='#4b4f54'/><rect x='320' y='200' width='110' height='70' rx='10' fill='#b9b4a8'/><circle cx='560' cy='230' r='42' fill='#6f6b63'/><rect x='640' y='190' width='60' height='80' rx='8' fill='#c9c5ba'/>",
  };
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><rect width='800' height='450' fill='#dcd9d2'/>${shapes[kind]}</svg>`);
}

function PostCard({ post }: { post: Post }): React.JSX.Element {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{initialsOf(post.author)}</AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
            {post.author}
            {post.role === "Member" ? null : <Badge variant="muted">{post.role}</Badge>}
          </p>
          <p className="text-xs text-muted-foreground">{post.when}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-pretty">{post.text}</p>
      {post.picture ? <img src={picture(post.picture)} alt={post.alt ?? ""} className="aspect-video w-full rounded-lg object-cover" /> : null}
      <div className="-mx-2 flex items-center gap-1 text-muted-foreground">
        <Button type="button" variant="ghost" size="sm" aria-label={`Like, ${post.likes} so far`} className="text-muted-foreground">
          <IconThumbsUp />
          <span className="tabular-nums">{post.likes}</span>
        </Button>
        <Button type="button" variant="ghost" size="sm" aria-label={`Replies, ${post.replies} so far`} className="text-muted-foreground">
          <IconMessage />
          <span className="tabular-nums">{post.replies}</span>
        </Button>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [count, setCount] = useState(PAGE);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** Pretends to ask a server for the next page; the answer comes after a moment and the next one can be made to fail. */
  function loadMore() {
    const fails = failNext;
    setLoading(true);
    setFailed(false);
    timer.current = window.setTimeout(() => {
      if (fails) {
        setFailNext(false);
        setFailed(true);
      } else {
        setCount((now) => Math.min(POSTS.length, now + PAGE));
      }
      setLoading(false);
    }, 900);
  }

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 px-4 py-10">
      <div className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Northwind community</h2>
          <p className="text-sm text-muted-foreground">Trip reports, gear questions and news from the team. Every post is an article that knows its place in the feed.</p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <Kbd>Page Down</Kbd>
            next post
          </li>
          <li className="flex items-center gap-2">
            <Kbd>Page Up</Kbd>
            previous post
          </li>
          <li className="flex items-center gap-2">
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>End</Kbd>
            </KbdGroup>
            leave the feed
          </li>
        </ul>
      </div>
      <AccessibleFeed
        label="Community posts"
        items={POSTS.slice(0, count)}
        labelFor={(post) => `${post.author}: ${post.text.split(/[.:?]/)[0]}`}
        renderItem={(post) => <PostCard post={post} />}
        hasMore={count < POSTS.length}
        loading={loading}
        error={failed ? "The community service did not answer." : false}
        onLoadMore={loadMore}
        status={{ noun: { one: "post", other: "posts" } }}
      />
      <div className="flex items-center gap-2.5">
        <Switch id="feed-fail" checked={failNext} onCheckedChange={setFailNext} />
        <Label htmlFor="feed-fail" className="font-normal text-muted-foreground">
          Make the next page fail
        </Label>
      </div>
    </div>
  );
}
