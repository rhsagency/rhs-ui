/** The words of the control, for another language or your own voice. `{percent}` stands for the level as a whole number. */
export interface VolumeLabels {
  /** The name of the mute button while the sound is on. Default "Mute". */
  mute: string;
  /** The name of the mute button while it is off. Default "Unmute". */
  unmute: string;
  /** The name of the slider. Default "Volume". */
  volume: string;
  /** What a screen reader hears for the slider's value. Default "Volume {percent} percent". */
  level: string;
  /** The same while muted. Default "Muted". */
  muted: string;
  /** The name of the button that opens the slider in compact mode. Default "Adjust volume". */
  adjust: string;
}

export const DEFAULT_VOLUME_LABELS: VolumeLabels = {
  mute: "Mute",
  unmute: "Unmute",
  volume: "Volume",
  level: "Volume {percent} percent",
  muted: "Muted",
  adjust: "Adjust volume",
};

/** The level as a whole percent: 0.6 becomes 60. Anything outside 0 to 1 is held to it. */
export function percentOf(level: number): number {
  return Math.round(Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0)) * 100);
}

/** Which speaker to draw: silent (muted, or nothing left), low (under half) or high. */
export function speakerFor(level: number, muted: boolean): "off" | "low" | "high" {
  if (muted || percentOf(level) === 0) return "off";
  return percentOf(level) < 50 ? "low" : "high";
}

/** Put the percent into a sentence: "Volume {percent} percent" becomes "Volume 60 percent". */
export function say(template: string, percent: number): string {
  return template.replace("{percent}", String(percent));
}
