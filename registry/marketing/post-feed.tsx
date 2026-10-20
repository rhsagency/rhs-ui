import type { ComponentProps, ElementType, ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface FeedPostImage {
  src: string;
  /** What the picture shows. Use "" only when the title already says it. */
  alt: string;
}

export interface FeedPostAuthor {
  name: string;
  /** A portrait. The initials show until it loads, or when it is left out. */
  avatar?: string;
}

/** A topic chip: plain text, or a link to the topic's page. */
export type FeedPostTopic = string | { label: string; href: string };

export interface FeedPost {
  title: string;
  /** The post's page. The title is the link, stretched over the whole row. */
  href: string;
  /** The standfirst. Two lines show; the rest is clipped. */
  excerpt?: string;
  author: FeedPostAuthor;
  /** Formatted for the reader: "12 October 2026". */
  date: string;
  /** The ISO value for the time element: "2026-10-12". */
  dateTime: string;
  /** "8 min read". */
  readingTime?: string;
  topics?: readonly FeedPostTopic[];
  /** A square thumbnail. Rows without one keep the same measure and rhythm. */
  image?: FeedPostImage;
}

export interface PostFeedProps extends Omit<ComponentProps<"div">, "children"> {
  posts: readonly FeedPost[];
  /** The level of every post title: 2 (the default) under a page title, 3 under a section heading. */
  headingLevel?: 2 | 3 | 4;
  /** Closes the list: a LoadMore, a pager or a "View the archive" link. */
  loadMore?: ReactNode;
  /** Shown in place of the list when there are no posts, for example a no-results message. */
  empty?: ReactNode;
  /** Renders the title and topic links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Draws a thumbnail: plug in next/image or any optimiser. Defaults to a plain <img>. */
  renderImage?: (image: FeedPostImage, className: string) => ReactNode;
  /** The list's accessible name. */
  label?: string;
}

const TITLE = { 2: "h2", 3: "h3", 4: "h4" } as const;

function DefaultImage(image: FeedPostImage, className: string) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className={className} />;
}

/**
 * Posts as a reading feed, the way a publication streams them: who wrote it,
 * when and how long it takes, then the title, a two-line standfirst, topic
 * chips and a square thumbnail on the right (under the byline on a phone).
 * Where BlogList is date-led and text only, this one is author-led with
 * pictures, and a row without a picture keeps the same measure. The title
 * link is stretched over the row, so the whole post is one target while its
 * accessible name stays the title; its focus ring reaches 12px past the row on
 * each side, so do not clip the feed with overflow-hidden. Rules, not cards,
 * separate the rows; a `loadMore` slot closes the list.
 */
export function PostFeed({ posts, headingLevel = 2, loadMore, empty, linkAs: Link = "a", renderImage = DefaultImage, label = "Posts", className, ...props }: PostFeedProps) {
  const Title = TITLE[headingLevel];
  if (!posts.length) {
    return empty ? (
      <div data-slot="post-feed" className={className} {...props}>
        {empty}
      </div>
    ) : null;
  }
  return (
    <div data-slot="post-feed" className={className} {...props}>
      <ol role="list" aria-label={label} className="divide-y divide-border border-y border-border">
        {posts.map((post) => (
          <li key={`${post.href}-${post.title}`}>
            <article
              data-slot="post-feed-item"
              className="group relative grid py-7 sm:grid-cols-[minmax(0,1fr)_8.5rem] sm:grid-rows-[auto_auto_auto_1fr] sm:gap-x-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_10rem] lg:gap-x-10"
            >
              <div className="flex items-center gap-3 sm:col-start-1 sm:row-start-1 sm:gap-2.5">
                <Avatar size="sm" className="data-[size=sm]:size-8 sm:data-[size=sm]:size-6">
                  {post.author.avatar ? <AvatarImage src={post.author.avatar} alt="" /> : null}
                  <AvatarFallback>{initialsOf(post.author.name)}</AvatarFallback>
                </Avatar>
                <p className="flex min-w-0 flex-col text-sm leading-snug text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                  <span className="font-medium text-foreground">{post.author.name}</span>
                  <span aria-hidden="true" className="hidden sm:inline">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-x-2 whitespace-nowrap">
                    <time dateTime={post.dateTime}>{post.date}</time>
                    {post.readingTime ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{post.readingTime}</span>
                      </>
                    ) : null}
                  </span>
                </p>
              </div>
              {post.image ? (
                <div className="relative mt-5 aspect-[16/9] self-start overflow-hidden rounded-xl bg-muted after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-foreground/10 after:ring-inset sm:col-start-2 sm:row-span-4 sm:row-start-1 sm:mt-0 sm:aspect-square">
                  {renderImage(post.image, "size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100")}
                </div>
              ) : null}
              <Title className="mt-5 text-xl leading-snug font-semibold tracking-[-.025em] text-balance sm:col-start-1 sm:row-start-2 sm:mt-3 sm:text-[1.375rem]">
                <Link
                  href={post.href}
                  className="rounded-sm outline-none after:absolute after:-inset-x-3 after:inset-y-0 group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4 focus-visible:after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40"
                >
                  {post.title}
                </Link>
              </Title>
              {post.excerpt ? <p className="mt-2 line-clamp-2 text-base leading-relaxed text-muted-foreground sm:col-start-1 sm:row-start-3">{post.excerpt}</p> : null}
              {post.topics?.length ? (
                <ul role="list" className="mt-4 flex flex-wrap gap-1.5 sm:col-start-1 sm:row-start-4 sm:self-end">
                  {post.topics.map((topic) => {
                    const text = typeof topic === "string" ? topic : topic.label;
                    return (
                      <li key={text}>
                        {typeof topic === "string" ? (
                          <Badge variant="muted">{text}</Badge>
                        ) : (
                          <Badge asChild variant="muted" className="relative z-10 hover:bg-secondary hover:text-foreground">
                            <Link href={topic.href}>{text}</Link>
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </article>
          </li>
        ))}
      </ol>
      {loadMore ? <div data-slot="post-feed-footer">{loadMore}</div> : null}
    </div>
  );
}
