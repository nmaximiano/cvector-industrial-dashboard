import { useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getReadings } from "../api/client";
import type { Asset } from "../api/client";
import { usePolling } from "../hooks/usePolling";
import { getMetricLabel, getMetricColor } from "../config/metrics";

interface TimeSeriesChartProps {
  facilityId: number;
  assetId?: number;
  metricName: string;
  timeRange: number;
  assetName?: string;
  assets: Asset[];
  fillSpace?: boolean;
}

export default function TimeSeriesChart({ facilityId, assetId, metricName, timeRange, assetName, assets, fillSpace }: TimeSeriesChartProps) {
  const { data: readings, loading } = usePolling(
    useCallback(() => {
      const start = new Date(Date.now() - timeRange * 60 * 1000).toISOString();
      return getReadings({
        facility_id: facilityId,
        asset_id: assetId,
        metric_name: metricName,
        start_time: start,
        limit: 2000,
      });
    }, [facilityId, assetId, metricName, timeRange]),
    10000,
    [facilityId, assetId, metricName, timeRange]
  );

  const label = getMetricLabel(metricName);
  const color = getMetricColor(metricName);

  const wrapperStyle: React.CSSProperties = {
    borderTop: "1px solid #f0f0f0",
    background: "#fff",
    padding: "16px 16px 8px",
    display: "flex",
    flexDirection: "column",
    ...(fillSpace ? { flex: 1, minHeight: 300 } : { height: 340, flexShrink: 0 }),
  };

  if (loading || !readings || readings.length === 0) {
    return (
      <div style={wrapperStyle}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
          {assetName ? `${assetName} — ` : ""}{label}
        </div>
      </div>
    );
  }

  const assetIds = [...new Set(readings.map((r) => r.asset_id))];
  const assetNameMap = new Map(assets.map((a) => [a.id, a.name]));
  const timeMap = new Map<string, Record<string, number>>();

  for (const r of readings) {
    const timeKey = r.timestamp;
    if (!timeMap.has(timeKey)) timeMap.set(timeKey, {});
    timeMap.get(timeKey)![`asset_${r.asset_id}`] = r.value;
  }

  const chartData = [...timeMap.entries()]
    .map(([time, values]) => ({
      time: new Date(time).toLocaleTimeString(),
      ...values,
    }))
    .reverse();

  const unit = readings[0]?.unit || "";

  return (
    <div style={wrapperStyle}>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
        {assetName ? `${assetName} — ` : ""}{label} ({unit})
      </div>
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" label={{ value: "Time", position: "insideBottom", offset: -5, fontSize: 12, fill: "#666" }} />
            <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} label={{ value: `${label} (${unit})`, angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#666" }, fontSize: 12 }} />
            <Tooltip />
            {assetIds.map((id) => (
              <Line
                key={id}
                type="linear"
                dataKey={`asset_${id}`}
                stroke={color}
                dot={false}
                isAnimationActive={false}
                name={`${label} (${unit})`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
