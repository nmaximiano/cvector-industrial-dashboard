export const METRIC_CONFIG: Record<string, { label: string; color: string }> = {
  power_consumption: { label: "Power Consumption", color: "#fa8c16" },
  output_rate: { label: "Output Rate", color: "#f2726f" },
  temperature: { label: "Temperature", color: "#1890ff" },
  pressure: { label: "Pressure", color: "#722ed1" },
  irradiance: { label: "Irradiance", color: "#13c2c2" },
  vibration: { label: "Vibration", color: "#eb2f96" },
};

export function getMetricLabel(name: string): string {
  return METRIC_CONFIG[name]?.label || name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getMetricColor(name: string): string {
  return METRIC_CONFIG[name]?.color || "#595959";
}
