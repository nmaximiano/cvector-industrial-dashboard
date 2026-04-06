from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from ..database import get_db
from ..models import Facility, Asset, SensorReading
from ..schemas import DashboardSummary, MetricSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary/{facility_id}", response_model=DashboardSummary)
def get_dashboard_summary(facility_id: int, db: Session = Depends(get_db)):
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    asset_ids = [
        a.id for a in db.query(Asset.id).filter(Asset.facility_id == facility_id).all()
    ]

    if not asset_ids:
        return DashboardSummary(
            facility_id=facility.id,
            facility_name=facility.name,
            metrics=[],
            timestamp=datetime.utcnow(),
        )

    # Latest reading per asset+metric combo
    latest_subq = (
        db.query(
            SensorReading.asset_id,
            SensorReading.metric_name,
            func.max(SensorReading.timestamp).label("max_ts"),
        )
        .filter(SensorReading.asset_id.in_(asset_ids))
        .group_by(SensorReading.asset_id, SensorReading.metric_name)
        .subquery()
    )

    latest_readings = (
        db.query(SensorReading)
        .join(
            latest_subq,
            (SensorReading.asset_id == latest_subq.c.asset_id)
            & (SensorReading.metric_name == latest_subq.c.metric_name)
            & (SensorReading.timestamp == latest_subq.c.max_ts),
        )
        .all()
    )

    metric_agg: dict[str, dict] = {}
    for r in latest_readings:
        if r.metric_name not in metric_agg:
            metric_agg[r.metric_name] = {"total": 0.0, "unit": r.unit, "count": 0}
        metric_agg[r.metric_name]["total"] += r.value
        metric_agg[r.metric_name]["count"] += 1

    metrics = [
        MetricSummary(
            metric_name=name,
            total_value=round(data["total"], 2),
            unit=data["unit"],
            asset_count=data["count"],
        )
        for name, data in metric_agg.items()
    ]

    return DashboardSummary(
        facility_id=facility.id,
        facility_name=facility.name,
        metrics=metrics,
        timestamp=datetime.utcnow(),
    )
