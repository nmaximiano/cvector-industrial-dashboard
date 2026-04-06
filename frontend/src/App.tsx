import { useState, useCallback, useEffect } from "react";
import { Layout, Typography } from "antd";
import Sidebar from "./components/Sidebar";
import SummaryCards from "./components/SummaryCards";
import MetricPanel from "./components/MetricPanel";
import {
  getFacilities,
  getAssets,
  getDashboardSummary,
  getAssetMetrics,
} from "./api/client";
import { usePolling } from "./hooks/usePolling";

const { Content } = Layout;

function loadStored<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

function usePersistedState<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => loadStored(key, fallback));
  const set = useCallback((v: T) => {
    setValue(v);
    localStorage.setItem(key, JSON.stringify(v));
  }, [key]);
  return [value, set];
}

export default function App() {
  const [facilityId, setFacilityId] = usePersistedState<number | undefined>("cv_facilityId", undefined);
  const [assetId, setAssetId] = usePersistedState<number | undefined>("cv_assetId", undefined);
  const [metricLeft, setMetricLeft] = useState("power_consumption");
  const [metricRight, setMetricRight] = useState("temperature");
  const [timeRangeLeft, setTimeRangeLeft] = useState(120);
  const [timeRangeRight, setTimeRangeRight] = useState(120);

  const { data: facilities } = usePolling(() => getFacilities(), 60000);
  const { data: allAssets } = usePolling(() => getAssets(), 60000);

  const facilityAssets = (allAssets || []).filter((a) => a.facility_id === facilityId);
  const selectedFacility = facilities?.find((f) => f.id === facilityId);
  const selectedAsset = facilityAssets.find((a) => a.id === assetId);

  useEffect(() => {
    if (!facilityId && facilities && facilities.length > 0) {
      setFacilityId(facilities[0].id);
    }
  }, [facilities]);

  useEffect(() => {
    if (facilityId && !assetId && facilityAssets.length > 0) {
      setAssetId(facilityAssets[0].id);
    }
  }, [facilityId, facilityAssets]);

  useEffect(() => {
    setTimeRangeLeft(120);
    setTimeRangeRight(120);
  }, [assetId]);

  const { data: availableMetrics } = usePolling(
    useCallback(() => {
      if (!assetId) return Promise.resolve(null);
      return getAssetMetrics(assetId);
    }, [assetId]),
    60000,
    [assetId]
  );

  useEffect(() => {
    if (availableMetrics && availableMetrics.length > 0) {
      setMetricLeft(availableMetrics[0]);
      if (availableMetrics.length > 1) setMetricRight(availableMetrics[1]);
    }
  }, [availableMetrics]);

  const { data: summary, loading: summaryLoading } = usePolling(
    useCallback(() => {
      if (!facilityId) return Promise.resolve(null);
      return getDashboardSummary(facilityId);
    }, [facilityId]),
    10000,
    [facilityId]
  );

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Layout.Header
        style={{
          height: 56,
          lineHeight: "56px",
          background: "#fff",
          borderBottom: "1px solid #e8e8e8",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <img src="/cvector-logo.svg" alt="CVector" style={{ height: 24 }} />
        <span style={{ margin: "0 14px", color: "#d9d9d9" }}>|</span>
        <Typography.Text style={{ color: "#8c8c8c", fontSize: 16 }}>
          Industrial Dashboard
        </Typography.Text>
      </Layout.Header>
      <Layout style={{ overflow: "hidden" }}>
        <Sidebar
          facilities={facilities || []}
          allAssets={allAssets || []}
          selectedFacility={facilityId}
          selectedAsset={assetId}
          onFacilityChange={setFacilityId}
          onAssetChange={setAssetId}
        />
        <Content style={{ padding: 24, flex: 1, overflow: "hidden", background: "#f5f5f5", display: "flex", flexDirection: "column" }}>
          {selectedFacility && (
            <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 6, marginBottom: 24, overflow: "hidden" }}>
              <SummaryCards
                facility={selectedFacility}
                assetName={selectedAsset?.name}
                assetCount={facilityAssets.length}
                summary={summary}
                loading={summaryLoading}
              />
            </div>
          )}
          <div style={{ flex: 1, display: "flex", gap: 24, minHeight: 0 }}>
            {selectedFacility && availableMetrics && availableMetrics.length > 0 && (
              <>
                <div style={{ flex: 1, border: "1px solid #e8e8e8", borderRadius: 6, background: "#fff", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <MetricPanel
                    facilityId={facilityId!}
                    assetId={assetId}
                    assetName={selectedAsset?.name}
                    assets={allAssets || []}
                    availableMetrics={availableMetrics}
                    metric={metricLeft}
                    onMetricChange={setMetricLeft}
                    timeRange={timeRangeLeft}
                    onTimeRangeChange={setTimeRangeLeft}
                  />
                </div>
                {availableMetrics.length > 1 && (
                  <div style={{ flex: 1, border: "1px solid #e8e8e8", borderRadius: 6, background: "#fff", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <MetricPanel
                      facilityId={facilityId!}
                      assetId={assetId}
                      assetName={selectedAsset?.name}
                      assets={allAssets || []}
                      availableMetrics={availableMetrics}
                      metric={metricRight}
                      onMetricChange={setMetricRight}
                      timeRange={timeRangeRight}
                      onTimeRangeChange={setTimeRangeRight}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
