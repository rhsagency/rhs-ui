import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

/** The minute hand traces a turn and returns; the hour hand stays legible. */
const motion: IconMotion = {
  steps: [
    {
      part: "minute",
      origin: "12px 12px",
      duration: 1200,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      keyframes: [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
    },
  ],
  pause: 1400,
};

export function IconClockAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path data-part="face" d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3" />
      <path data-part="minute" d="M12 12V7.5" />
      <path data-part="hour" d="M12 12l3 2" />
    </AnimatedGlyph>
  );
}
