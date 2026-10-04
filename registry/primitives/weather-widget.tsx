import { IconCloud, IconCloudLightning, IconCloudRain, IconCloudSnow, IconCloudSun, IconSun, IconWind } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export type WeatherKind = "clear" | "partly" | "cloudy" | "rain" | "storm" | "snow" | "wind";

export interface WeatherDay {
  /** "Mon", "Today". */
  day: string;
  kind: WeatherKind;
  high: number;
  low: number;
}

export interface WeatherWidgetProps {
  place: string;
  now: { temperature: number; kind: WeatherKind; feelsLike?: number; wind?: string };
  days: readonly WeatherDay[];
  /** "°C" or "°F"; the numbers are yours, already in that unit. */
  unit?: string;
  className?: string;
}

const ICON = { clear: IconSun, partly: IconCloudSun, cloudy: IconCloud, rain: IconCloudRain, storm: IconCloudLightning, snow: IconCloudSnow, wind: IconWind } as const;
const WORD = { clear: "Clear", partly: "Partly cloudy", cloudy: "Cloudy", rain: "Rain", storm: "Thunderstorms", snow: "Snow", wind: "Windy" } as const;

/**
 * Weather at a glance for an event page, a booking or a dashboard: now
 * large with the condition in words, then a short forecast row with icons,
 * highs and lows. Every icon has its word for screen readers; the data is
 * yours (an API call on your side), never fetched from here.
 */
export function WeatherWidget({ place, now, days, unit = "°C", className }: WeatherWidgetProps) {
  const Now = ICON[now.kind];
  return (
    <section data-slot="weather-widget" aria-label={`Weather in ${place}`} className={cn("relative rounded-3xl border border-border p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{place}</p>
          <p className="mt-1 text-5xl font-medium tracking-tight tabular-nums">{Math.round(now.temperature)}{unit}</p>
          <p className="mt-1 text-sm">{WORD[now.kind]}{now.feelsLike !== undefined ? <span className="text-muted-foreground">, feels like {Math.round(now.feelsLike)}{unit}</span> : null}</p>
          {now.wind ? <p className="text-xs text-muted-foreground">Wind {now.wind}</p> : null}
        </div>
        <Now aria-hidden="true" className="size-14 text-muted-foreground" />
      </div>
      <ol className="mt-5 grid grid-cols-5 gap-1 border-t border-border pt-4 text-center">
        {days.slice(0, 5).map((day) => {
          const Icon = ICON[day.kind];
          return (
            <li key={day.day} className="grid justify-items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">{day.day}</span>
              <Icon aria-hidden="true" className="size-5" />
              <span className="sr-only">{WORD[day.kind]}</span>
              <span className="tabular-nums"><span className="font-medium">{Math.round(day.high)}°</span> <span className="text-muted-foreground">{Math.round(day.low)}°</span></span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
