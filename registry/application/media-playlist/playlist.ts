/**
 * The playlist behind MediaPlaylist, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too. Every function that
 * writes a number takes the locale, so the same input gives the same text on
 * the server and in the browser.
 */

/** One track or video of the list. */
export interface PlaylistItem {
  /** A stable identity, an id from your own records. `currentId` and `onSelect` use it. */
  id: string;
  /** The title: "Halcyon Drift". A long title is cut with an ellipsis (after two lines in a video list and in a narrow one), and the whole title shows on hover and on focus. */
  title: string;
  /** The line under it: the artist, the show, the channel. */
  subtitle?: string;
  /** How long it runs, in seconds. */
  duration: number;
  /** A picture for it: an image address or a data URI. Without one the row draws a quiet tile with a note or a film icon. */
  artwork?: string;
}

/** The words the list says, for translation. A `{name}` mark in a sentence is filled in. */
export interface MediaPlaylistLabels {
  /** Names the list for a screen reader when there is no `title`. Default "Playlist". */
  playlist?: string;
  /** The count beside the title; `{count}`. Default "{count} tracks", or "{count} videos" for `kind="video"`. */
  count?: string;
  /** The same for a list of one. Default "{count} track", or "{count} video". */
  countOne?: string;
  /** The heading over the items that come after the current one. Default "Up next". */
  upNext?: string;
  /** Said, to a screen reader only, for the current item while it plays. Default "Now playing". */
  nowPlaying?: string;
  /** The same while it is paused. Default "Paused". */
  paused?: string;
  /** Shown instead of the list when there are no items. Default "Nothing in this playlist yet". */
  empty?: string;
}

/** The default words, which depend on whether the list holds tracks or videos. */
export function defaultLabels(kind: "audio" | "video"): Required<MediaPlaylistLabels> {
  return {
    playlist: "Playlist",
    count: kind === "video" ? "{count} videos" : "{count} tracks",
    countOne: kind === "video" ? "{count} video" : "{count} track",
    upNext: "Up next",
    nowPlaying: "Now playing",
    paused: "Paused",
    empty: "Nothing in this playlist yet",
  };
}

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** A length as it is written beside a track: "3:42", and "1:04:12" past the hour. Negative and not-a-number read as zero. */
export function clock(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/**
 * A length in words the locale writes itself, for a screen reader or a total:
 * "3 minutes, 42 seconds" in the long form, "48 min" in the short one. Under a
 * minute it counts seconds; a total of an hour or more drops the seconds.
 */
export function lengthWords(seconds: number, locale: string, style: "long" | "short" = "long", withSeconds = true): string {
  const unit = (value: number, name: "hour" | "minute" | "second") => new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: style }).format(value);
  const total = Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [...(h ? [unit(h, "hour")] : []), ...(m || (!h && !withSeconds) ? [unit(m, "minute")] : []), ...(withSeconds && !h && (s || !m) ? [unit(s, "second")] : [])];
  return new Intl.ListFormat(locale, { type: "unit", style }).format(parts.length ? parts : [unit(0, "second")]);
}
