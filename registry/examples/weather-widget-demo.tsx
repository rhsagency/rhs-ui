import { WeatherWidget } from "@rhs-ui/primitives/weather-widget";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-sm p-8">
      <WeatherWidget
        place="Utrecht"
        now={{ temperature: 14.3, kind: "partly", feelsLike: 12, wind: "18 km/h SW" }}
        days={[
          { day: "Today", kind: "partly", high: 15, low: 8 },
          { day: "Tue", kind: "rain", high: 12, low: 7 },
          { day: "Wed", kind: "cloudy", high: 13, low: 6 },
          { day: "Thu", kind: "clear", high: 17, low: 9 },
          { day: "Fri", kind: "wind", high: 14, low: 8 },
        ]}
      />
    </div>
  );
}
