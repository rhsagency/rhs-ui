import { LineChart, type LineChartProps } from "@rhs-ui/dashboard/line-chart";

/**
 * Volumes over time: the line chart with the area under each series filled
 * in a light shade, for totals that build up (revenue, sign-ups, traffic).
 * The same readout, and the same table for screen readers.
 */
export function AreaChart(props: Omit<LineChartProps, "area">) {
  return <LineChart {...props} area />;
}
