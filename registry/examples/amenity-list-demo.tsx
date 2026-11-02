"use client";

import { useState } from "react";

import { AmenityList, type Amenity, type AmenityGroup } from "@rhs-ui/application/amenity-list";
import {
  IconBathtub,
  IconBed,
  IconBell,
  IconBike,
  IconBluetooth,
  IconCoffee,
  IconDroplet,
  IconFan,
  IconFirstAid,
  IconFlame,
  IconFridge,
  IconHanger,
  IconLaptop,
  IconOven,
  IconParking,
  IconRadiator,
  IconSafe,
  IconShower,
  IconSnowflake,
  IconStroller,
  IconThermometer,
  IconTree,
  IconTv,
  IconUtensils,
  IconWashingMachine,
  IconWifi,
  IconWind,
} from "@rhs-ui/icons";

const GROUPS: readonly AmenityGroup[] = [
  { id: "work", label: "Internet and work" },
  { id: "kitchen", label: "Kitchen" },
  { id: "bathroom", label: "Bathroom" },
  { id: "bedroom", label: "Bedroom and laundry" },
  { id: "climate", label: "Heating and cooling" },
  { id: "outdoor", label: "Outdoor" },
  { id: "safety", label: "Safety" },
];

const AMENITIES: readonly Amenity[] = [
  { id: "wifi", group: "work", label: "Wi-Fi", note: "Fibre, 500 Mbps", icon: <IconWifi /> },
  { id: "desk", group: "work", label: "Dedicated workspace", note: "A desk and an adjustable chair", icon: <IconLaptop /> },
  { id: "tv", group: "work", label: "Television", note: "55 inch, with streaming apps", icon: <IconTv /> },
  { id: "fridge", group: "kitchen", label: "Refrigerator", icon: <IconFridge /> },
  { id: "oven", group: "kitchen", label: "Oven and hob", icon: <IconOven /> },
  { id: "coffee", group: "kitchen", label: "Coffee machine", note: "Espresso, with capsules", icon: <IconCoffee /> },
  { id: "cooking", group: "kitchen", label: "Cooking basics", note: "Pots, pans, oil and salt", icon: <IconUtensils /> },
  { id: "dishwasher", group: "kitchen", label: "Dishwasher", available: false, icon: <IconDroplet /> },
  { id: "shower", group: "bathroom", label: "Rain shower", icon: <IconShower /> },
  { id: "bath", group: "bathroom", label: "Bathtub", icon: <IconBathtub /> },
  { id: "dryer", group: "bathroom", label: "Hair dryer", icon: <IconWind /> },
  { id: "washer", group: "bedroom", label: "Washing machine", note: "In the unit, free to use", icon: <IconWashingMachine /> },
  { id: "hangers", group: "bedroom", label: "Hangers and a wardrobe", icon: <IconHanger /> },
  { id: "linen", group: "bedroom", label: "Bed linen and towels", icon: <IconBed /> },
  { id: "heating", group: "climate", label: "Central heating", icon: <IconRadiator /> },
  { id: "ac", group: "climate", label: "Air conditioning", available: false, icon: <IconSnowflake /> },
  { id: "fan", group: "climate", label: "Ceiling fan", icon: <IconFan /> },
  { id: "garden", group: "outdoor", label: "Private garden", note: "Fenced, with a terrace", icon: <IconTree /> },
  { id: "bbq", group: "outdoor", label: "Barbecue", note: "Shared with the building", icon: <IconFlame /> },
  { id: "bikes", group: "outdoor", label: "Bike storage", icon: <IconBike /> },
  { id: "parking", group: "outdoor", label: "Parking on the street", note: "Permit provided", icon: <IconParking /> },
  { id: "smoke", group: "safety", label: "Smoke alarm", icon: <IconBell /> },
  { id: "aid", group: "safety", label: "First aid kit", icon: <IconFirstAid /> },
  { id: "safe", group: "safety", label: "Safe", available: false, icon: <IconSafe /> },
];

const CAR: readonly Amenity[] = [
  { id: "ac", label: "Climate control", icon: <IconSnowflake /> },
  { id: "bluetooth", label: "Bluetooth audio", icon: <IconBluetooth /> },
  { id: "bike", label: "Bike rack", note: "Fits two bikes", icon: <IconBike /> },
  { id: "seat", label: "Child seat", available: false, icon: <IconStroller /> },
  { id: "heated", label: "Heated seats", available: false, icon: <IconThermometer /> },
  { id: "aid", label: "First aid kit", icon: <IconFirstAid /> },
];

export default function Demo(): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="grid w-full max-w-3xl gap-10">
      <section aria-labelledby="amenities-heading">
        <h2 id="amenities-heading" className="mb-5 text-lg font-semibold tracking-[-0.02em]">
          What this place offers
        </h2>
        <AmenityList amenities={AMENITIES} groups={GROUPS} visibleCount={8} expanded={expanded} onExpandedChange={setExpanded} />
      </section>
      <section aria-labelledby="car-heading">
        <h2 id="car-heading" className="mb-1 text-lg font-semibold tracking-[-0.02em]">
          Included with the car
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">No groups and nothing hidden: six items need no toggle.</p>
        <AmenityList amenities={CAR} />
      </section>
    </div>
  );
}
