const API_BASE = "http://localhost:8000/api";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Facility {
  id: number;
  name: string;
  location: string;
  type: string;
}

export interface Asset {
  id: number;
  facility_id: number;
  name: string;
  type: string;
}

export interface SensorReading {
  id: number;
  asset_id: number;
  metric_name: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface MetricSummary {
  metric_name: string;
  total_value: number;
  unit: string;
  asset_count: number;
}

export interface DashboardSummary {
  facility_id: number;
  facility_name: string;
  metrics: MetricSummary[];
  timestamp: string;
}

export function getFacilities() {
  return fetchJson<Facility[]>("/facilities");
}

export function getAssets(facilityId?: number) {
  const params = facilityId ? `?facility_id=${facilityId}` : "";
  return fetchJson<Asset[]>(`/assets${params}`);
}

export function getReadings(params: {
  facility_id?: number;
  asset_id?: number;
  metric_name?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) query.set(k, String(v));
  });
  return fetchJson<SensorReading[]>(`/readings?${query}`);
}

export function getDashboardSummary(facilityId: number) {
  return fetchJson<DashboardSummary>(`/dashboard/summary/${facilityId}`);
}

export function getAssetMetrics(assetId: number) {
  return fetchJson<string[]>(`/readings/metrics/${assetId}`);
}
