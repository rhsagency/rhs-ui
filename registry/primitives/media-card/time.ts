/** The words of the card, for another language. `{time}` stands for a time in the text. */
export interface MediaCardLabels {
  /** The badge on a video. Default "Video". */
  video: string;
  /** The badge on audio. Default "Audio". Set it to "Podcast" or "Track" for what you show. */
  audio: string;
  /** The badge on an image. Default "Image". */
  image: string;
  /** Said after the title when it was started: "Resume at {time}". The time is the point it stopped, or a percent when the length is not known. */
  resume: string;
  /** Said after the title when it was seen to the end. Default "Finished". */
  finished: string;
  /** Said before the length, which is not read from the chip. Default "Length {time}". */
  length: string;
}

export const DEFAULT_MEDIA_LABELS: MediaCardLabels = {
  video: "Video",
  audio: "Audio",
  image: "Image",
  resume: "Resume at {time}",
  finished: "Finished",
  length: "Length {time}",
};

/** 252 becomes "4:12" and 3725 becomes "1:02:05": what a duration chip shows. */
export function formatDuration(seconds: number): string {
  const whole = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = String(whole % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

const unit = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

/** 252 becomes "4 minutes 12 seconds": how a screen reader should say a length. */
export function spokenDuration(seconds: number): string {
  const whole = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(unit(hours, "hour"));
  if (minutes > 0) parts.push(unit(minutes, "minute"));
  if (rest > 0 || parts.length === 0) parts.push(unit(rest, "second"));
  return parts.join(" ");
}

/** Put a time into a sentence: "Resume at {time}" becomes "Resume at 5:15". */
export function say(template: string, time: string): string {
  return template.replace("{time}", time);
}

/** Past this much of the way a video counts as seen to the end. */
export const FINISHED_AT = 0.97;
