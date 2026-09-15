import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** The ring draws itself, then the check. Made for `trigger="appear"` on a success state. */
const motion: IconMotion = {
  steps: [
    {
      part: "ring",
      duration: 560,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      keyframes: [{ strokeDashoffset: 1, opacity: 0 }, { offset: 0.02, opacity: 1 }, { strokeDashoffset: 0, opacity: 1 }],
    },
    {
      part: "check",
      duration: 320,
      delay: 380,
      keyframes: [{ strokeDashoffset: 1, opacity: 0 }, { offset: 0.04, opacity: 1 }, { strokeDashoffset: 0, opacity: 1 }],
    },
  ],
  pause: 1600,
};

export function IconCheckCircleAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="ring" pathLength={1} strokeDasharray="1" d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3" />
      <path data-part="check" pathLength={1} strokeDasharray="1" d="M8.5 12.5l2.5 2.5 5-5.5" />
    </AnimatedGlyph>
  );
}
