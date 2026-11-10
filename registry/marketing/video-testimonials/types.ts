export interface TestimonialVideoCaptions {
  /** The address of the WebVTT file. */
  src: string;
  /** The language of the captions as a BCP 47 tag: "en". */
  lang: string;
  /** The name the player shows for the track: "English". Falls back to the `captions` label. */
  label?: string;
}

export interface TestimonialVideo {
  /** Identifies the video in the grid. */
  id: string;
  /** The customer's name. It is the name of the card and of the dialog. */
  name: string;
  /** Their job and company: "Head of operations, Northwind". */
  role: string;
  /** A 16:9 picture of them, with open ground in the middle where the play button sits. It is always visible; without one, or when it cannot load, the card shows their initials in a small tile in the corner. */
  poster: string;
  /** The video file. Not fetched until the card is pressed. Leave it out when you pass `renderPlayer`. */
  src?: string;
  /** The length as people write it: "2:14", or "1:02:30" for an hour. It is shown on the card and spoken in full in the button's name. */
  duration: string;
  /** A captions track for the player, switched on when the video opens. */
  captions?: TestimonialVideoCaptions;
}

export interface VideoTestimonialsLabels {
  /** The name of a card's button; `{name}` and `{duration}` (spoken: "2 minutes 14 seconds") are filled in. Default "Play {name}'s story, {duration}". */
  play: string;
  /** The name of the close button of the dialog. Default "Close video". */
  close: string;
  /** What the dialog says about itself to a screen reader. Default "A video with player controls. Press Escape to close it.". */
  hint: string;
  /** Shown over the player when the video cannot be loaded. Default "This video could not be loaded.". */
  failed: string;
  /** The name of a captions track that has no `label`. Default "Captions". */
  captions: string;
}
