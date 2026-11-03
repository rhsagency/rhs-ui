import type { IconProps } from "@rhs-ui/icons";
import { IconBike, IconBook, IconCalendar, IconCar, IconCoffee, IconDumbbell, IconHeadphones, IconHome, IconLaptop, IconMoon, IconPalmTree, IconPhone, IconPlane, IconTarget, IconThermometer, IconUtensils } from "@rhs-ui/icons";

/**
 * The icons a status can carry, by name. A name is what is stored and what a
 * preset says (`icon: "calendar"`), so a status never depends on a component
 * and can come from a server.
 */
export const STATUS_GLYPHS = {
  calendar: IconCalendar,
  target: IconTarget,
  "palm-tree": IconPalmTree,
  thermometer: IconThermometer,
  car: IconCar,
  coffee: IconCoffee,
  headphones: IconHeadphones,
  laptop: IconLaptop,
  home: IconHome,
  plane: IconPlane,
  phone: IconPhone,
  utensils: IconUtensils,
  moon: IconMoon,
  book: IconBook,
  bike: IconBike,
  dumbbell: IconDumbbell,
} as const satisfies Record<string, (props: IconProps) => React.JSX.Element>;

export type StatusGlyph = keyof typeof STATUS_GLYPHS;

export function isStatusGlyph(name: string | null | undefined): name is StatusGlyph {
  return name !== null && name !== undefined && Object.hasOwn(STATUS_GLYPHS, name);
}

/** The icon of a name, or nothing for a name the set does not have. */
export function StatusGlyphIcon({ name, ...props }: { name: string | null | undefined } & IconProps) {
  if (!isStatusGlyph(name)) return null;
  const Glyph = STATUS_GLYPHS[name];
  return <Glyph {...props} />;
}
