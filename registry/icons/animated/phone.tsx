import { AnimatedGlyph, type AnimatedIconProps, type IconMotion } from "@rhs-ui/icons/animated-icon";

const ring = [0, -13, 11, -8, 5, -2, 0].map((deg) => ({ transform: `rotate(${deg}deg)`, easing: "ease-in-out" }));

/** The handset rings: a shake that dies out. Use `trigger="loop"` for an incoming call. */
const motion: IconMotion = {
  steps: [{ part: "handset", origin: "12px 12px", duration: 820, easing: "linear", keyframes: ring }],
  pause: 1400,
};

export function IconPhoneAnimated(props: AnimatedIconProps) {
  return (
    <AnimatedGlyph motion={motion} {...props}>
      <path
        data-part="handset"
        d="M8.6 3.5H6A2.5 2.5 0 0 0 3.5 6c0 8 6.5 14.5 14.5 14.5a2.5 2.5 0 0 0 2.5-2.5v-2.6l-4.4-1.8-1.9 2.2a11 11 0 0 1-5.9-5.9l2.2-1.9z"
      />
    </AnimatedGlyph>
  );
}
