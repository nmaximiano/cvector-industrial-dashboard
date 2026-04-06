from datetime import datetime
from pydantic import BaseModel


class SensorReadingOut(BaseModel):
    id: int
    asset_id: int
    metric_name: str
    value: float
    unit: str
    timestamp: datetime

    class Config:
        from_attributes = True


class AssetOut(BaseModel):
    id: int
    facility_id: int
    name: str
    type: str

    class Config:
        from_attributes = True


class AssetWithReadings(AssetOut):
    latest_readings: list[SensorReadingOut] = []


class FacilityOut(BaseModel):
    id: int
    name: str
    location: str
    type: str

    class Config:
        from_attributes = True


class FacilityWithAssets(FacilityOut):
    assets: list[AssetOut] = []


class MetricSummary(BaseModel):
    metric_name: str
    total_value: float
    unit: str
    asset_count: int


class DashboardSummary(BaseModel):
    facility_id: int
    facility_name: str
    metrics: list[MetricSummary]
    timestamp: datetime
