/** One stop on the slider. */
export interface Step {
  /** What the slider reports when it rests here. */
  value: string;
  /** The name of the stop, written under its tick and read out as the value of the slider. */
  label: string;
  /** What this stop means, shown under the track while it is the chosen one: "Backups run every Sunday at 02:00". */
  description?: string;
}

/** The visible knob, in px. The track keeps it inside its ends, so a label under a tick has to know its size. */
export const THUMB = 20;

/** Where a stop sits on the track, 0 to 100. */
export const percentOf = (index: number, count: number): number => (count <= 1 ? 0 : (index / (count - 1)) * 100);

/** The `left` that puts something under the centre of the knob when it stands on a stop: the knob never leaves the track, so at the ends its centre is half a knob inside. */
export const stopLeft = (percent: number): string => `calc(${percent}% + ${((0.5 - percent / 100) * THUMB).toFixed(2)}px)`;

/** What a screen reader hears as the value: the name of the stop and where it is, not an index. */
export const spokenStep = (step: Step, index: number, count: number): string => `${step.label}, ${index + 1} of ${count}`;

/**
 * The classes that thin the labels out when the container is too narrow for all of them (about 3.75rem for each): every other one is hidden,
 * and so are the two beside the chosen one, which would otherwise run into its heavier words. An end label (`besideEnd`) is the exception for
 * five stops, the size of a phone card: it stands at the edge of the track with a clear gap beside the chosen label, so it goes a little later,
 * at 17.5rem instead of 18.75rem (measured: about 15px of air beside the chosen label for words such as Small and Default, still 4px for two
 * words of seven letters side by side, the widest the spacing is meant for). They are written out whole, one set for each size of slider,
 * because Tailwind only generates a class it can read in the source.
 */
export function thinClasses(count: number): { every: string; beside: string; besideEnd: string } {
  if (count <= 3) {
    const beside = "@max-[11.25rem]:[[data-active]+&]:hidden @max-[11.25rem]:[&:has(+[data-active])]:hidden";
    return { every: "@max-[11.25rem]:hidden", beside, besideEnd: beside };
  }
  if (count === 4) {
    const beside = "@max-[15rem]:[[data-active]+&]:hidden @max-[15rem]:[&:has(+[data-active])]:hidden";
    return { every: "@max-[15rem]:hidden", beside, besideEnd: beside };
  }
  if (count === 5) {
    return {
      every: "@max-[18.75rem]:hidden",
      beside: "@max-[18.75rem]:[[data-active]+&]:hidden @max-[18.75rem]:[&:has(+[data-active])]:hidden",
      besideEnd: "@max-[17.5rem]:[[data-active]+&]:hidden @max-[17.5rem]:[&:has(+[data-active])]:hidden",
    };
  }
  if (count === 6) {
    const beside = "@max-[22.5rem]:[[data-active]+&]:hidden @max-[22.5rem]:[&:has(+[data-active])]:hidden";
    return { every: "@max-[22.5rem]:hidden", beside, besideEnd: beside };
  }
  const beside = "@max-[26.25rem]:[[data-active]+&]:hidden @max-[26.25rem]:[&:has(+[data-active])]:hidden";
  return { every: "@max-[26.25rem]:hidden", beside, besideEnd: beside };
}
