import { Select, Segmented } from "antd";
import TimeSeriesChart from "./TimeSeriesChart";
import type { Asset } from "../api/client";
import { getMetricLabel } from "../config/metrics";

interface MetricPanelProps {
  facilityId: number;
  assetId?: number;
  assetName?: string;
  assets: Asset[];
  availableMetrics: string[];
  metric: string;
  onMetricChange: (metric: string) => void;
  timeRange: number;
  onTimeRangeChange: (minutes: number) => void;
}

const TIME_RANGES = [
  { value: 15, label: "15m" },
  { value: 60, label: "1h" },
  { value: 120, label: "2h" },
  { value: 240, label: "4h" },
  { value: 1440, label: "24h" },
];

export default function MetricPanel({
  facilityId,
  assetId,
  assetName,
  assets,
  availableMetrics,
  metric,
  onMetricChange,
  timeRange,
  onTimeRangeChange,
}: MetricPanelProps) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid #e8e8e8",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Select
          value={metric}
          onChange={onMetricChange}
          style={{ width: 200 }}
          size="small"
          options={availableMetrics.map((m) => ({
            value: m,
            label: getMetricLabel(m),
          }))}
        />
        <div style={{ marginLeft: "auto" }}>
          <Segmented
            value={timeRange}
            onChange={(val) => onTimeRangeChange(val as number)}
            options={TIME_RANGES}
            size="small"
          />
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TimeSeriesChart
          facilityId={facilityId}
          assetId={assetId}
          metricName={metric}
          timeRange={timeRange}
          assetName={assetName}
          assets={assets}
          fillSpace
        />
      </div>
    </div>
  );
}
