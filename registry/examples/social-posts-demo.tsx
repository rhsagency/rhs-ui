import { SocialPosts } from "@rhs-ui/marketing/social-posts";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <SocialPosts
        title="What people say when we are not in the room."
        posts={[
          { id: "1", author: "Sanne de Wit", handle: "@sannedewit", network: "LinkedIn", text: "Moved our whole studio over in an afternoon. The import just worked, which never happens.", date: "2026-09-12", dateLabel: "12 Sep 2026", href: "#post-1" },
          { id: "2", author: "Omar Haddad", handle: "@omarbuilds", network: "Instagram", text: "Monday summary instead of fifty pings.\nMy weekends are mine again.", date: "2026-09-08", dateLabel: "8 Sep 2026", href: "#post-2" },
          { id: "3", author: "Lieke Bos", handle: "@liekebos", network: "Threads", text: "Small thing, but the keyboard shortcuts are everywhere. I have not touched the mouse in a week.", date: "2026-09-02", dateLabel: "2 Sep 2026" },
          { id: "4", author: "Daan Visser", handle: "@daanv", network: "LinkedIn", text: "Support answered in six minutes, on a Sunday, with a fix. That is how you keep a customer.", date: "2026-08-29", dateLabel: "29 Aug 2026", href: "#post-4" },
          { id: "5", author: "Mira Jansen", handle: "@mirajansen", network: "Bluesky", text: "Our clients get a read-only link now. The 'where are we' emails stopped.", date: "2026-08-21", dateLabel: "21 Aug 2026" },
        ]}
      />
    </div>
  );
}
