from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, distinct

from ..database import get_db
from ..models import SensorReading, Asset
from ..schemas import SensorReadingOut

router = APIRouter(prefix="/api/readings", tags=["readings"])


@router.get("", response_model=list[SensorReadingOut])
def list_readings(
    facility_id: int | None = Query(None),
    asset_id: int | None = Query(None),
    metric_name: str | None = Query(None),
    start_time: datetime | None = Query(None),
    end_time: datetime | None = Query(None),
    limit: int | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(SensorReading)

    if facility_id is not None:
        asset_ids = [
            a.id for a in db.query(Asset.id).filter(Asset.facility_id == facility_id).all()
        ]
        query = query.filter(SensorReading.asset_id.in_(asset_ids))

    if asset_id is not None:
        query = query.filter(SensorReading.asset_id == asset_id)

    if metric_name is not None:
        query = query.filter(SensorReading.metric_name == metric_name)

    if start_time is not None:
        query = query.filter(SensorReading.timestamp >= start_time)

    if end_time is not None:
        query = query.filter(SensorReading.timestamp <= end_time)

    query = query.order_by(desc(SensorReading.timestamp))
    if limit is not None:
        query = query.limit(limit)
    return query.all()


@router.get("/metrics/{asset_id}", response_model=list[str])
def get_asset_metrics(asset_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(distinct(SensorReading.metric_name))
        .filter(SensorReading.asset_id == asset_id)
        .all()
    )
    return [r[0] for r in rows]
