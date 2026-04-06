import type { DashboardSummary, Facility } from "../api/client";
import { getMetricLabel } from "../config/metrics";

const METRIC_ORDER = ["power_consumption", "output_rate", "temperature", "pressure"];

interface SummaryCardsProps {
  facility: Facility | undefined;
  assetName?: string;
  assetCount: number;
  summary: DashboardSummary | null;
  loading: boolean;
}

export default function SummaryCards({ facility, assetName, assetCount, summary, loading }: SummaryCardsProps) {
  if (!facility) return null;

  const sortedMetrics = summary
    ? [...summary.metrics].sort((a, b) => METRIC_ORDER.indexOf(a.metric_name) - METRIC_ORDER.indexOf(b.metric_name))
    : [];

  return (
    <div>
      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontSize: 22, fontWeight: 600, color: "#262626" }}>
            {facility.name}
          </span>
          {assetName && (
            <>
              <span style={{ fontSize: 18, color: "#8c8c8c" }}>›</span>
              <span style={{ fontSize: 18, fontWeight: 500, color: "#595959" }}>
                {assetName}
              </span>
            </>
          )}
        </div>
        <div style={{ fontSize: 13, color: "#8c8c8c" }}>
          {facility.location} · {facility.type.replace(/_/g, " ")} · {assetCount} asset{assetCount !== 1 ? "s" : ""}
        </div>
      </div>

      <div style={{ display: "flex" }}>
        {(loading ? METRIC_ORDER : sortedMetrics.map((m) => m.metric_name)).map((name, i) => {
          const m = sortedMetrics.find((s) => s.metric_name === name);
          const isAvg = name === "temperature" || name === "pressure";
          const displayValue = m
            ? isAvg
              ? (m.total_value / m.asset_count).toFixed(1)
              : m.total_value.toLocaleString(undefined, { maximumFractionDigits: 1 })
            : null;

          return (
            <div
              key={name}
              style={{
                flex: 1,
                padding: "20px 24px",
                borderLeft: i > 0 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 600, color: "#262626", lineHeight: 1.2, visibility: displayValue ? "visible" : "hidden" }}>
                {displayValue || "0"}
                <span style={{ fontSize: 14, fontWeight: 400, color: "#8c8c8c", marginLeft: 6 }}>
                  {m?.unit || "—"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#8c8c8c", marginTop: 4, visibility: displayValue ? "visible" : "hidden" }}>
                {isAvg ? "Avg " : "Total "}{getMetricLabel(name)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
